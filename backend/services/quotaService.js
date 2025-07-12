/**
 * QuotaService
 * ------------
 * 负责 user_quotas 表的读写，以及配额结算逻辑。
 *
 * 规则：
 *   1. assignDefaultPlanToUser(userId, trx)
 *   2. assignPlanToUser(userId, planId)
 *   3. addTopUpPackToUser(userId, packDetails)
 *   4. checkAndDecrementQuota(userId, featureName)
 */

const { db: knex } = require('../config/database');
const PlanService = require('./planService');

class QuotaService {
  constructor() {
    this.tableName = 'user_quotas';
  }

  /**
   * 获取或创建用户配额记录 (不包含任何扣减)
   * @private
   */
  async _ensureUserQuotaRecord(userId, trx = knex) {
    let record = await trx(this.tableName).where({ user_id: userId }).first();
    if (!record) {
      // 创建空白记录
      const [created] = await trx(this.tableName)
        .insert({ user_id: userId, updated_at: knex.fn.now() })
        .returning('*');
      record = created;
    }
    return record;
  }

  /**
   * 为新用户分配默认套餐 (在注册/首次登录后调用)
   * @param {number} userId
   * @param {Object} [externalTrx]
   */
  async assignDefaultPlanToUser(userId, externalTrx) {
    const trx = externalTrx || (await knex.transaction());
    try {
      const defaultPlan = await trx('plans').where({ is_default: true }).first();
      if (!defaultPlan) {
        throw new Error('系统未配置默认套餐');
      }

      let userQuota = await trx(this.tableName).where({ user_id: userId }).first();
      if (userQuota) {
        // 已存在记录则更新 plan_id
        await trx(this.tableName).where({ user_id: userId }).update({ plan_id: defaultPlan.id, updated_at: knex.fn.now() });
      } else {
        // 创建新记录
        const { subscription_quota, permanent_quota, subscription_expires_at } = this._deriveQuotaFromPlan(defaultPlan);
        await trx(this.tableName).insert({
          user_id: userId,
          plan_id: defaultPlan.id,
          subscription_quota,
          permanent_quota,
          subscription_expires_at,
          updated_at: knex.fn.now()
        });
      }

      if (!externalTrx) await trx.commit();
    } catch (err) {
      if (!externalTrx) await trx.rollback();
      throw err;
    }
  }

  /**
   * 将指定套餐分配给用户
   */
  async assignPlanToUser(userId, planId) {
    return await knex.transaction(async trx => {
      const plan = await PlanService.getPlanById(planId);
      if (!plan) throw new Error('套餐不存在');

      const quotaData = this._deriveQuotaFromPlan(plan);

      await this._ensureUserQuotaRecord(userId, trx);

      await trx(this.tableName).where({ user_id: userId }).update({
        plan_id: plan.id,
        subscription_quota: quotaData.subscription_quota,
        subscription_expires_at: quotaData.subscription_expires_at,
        updated_at: knex.fn.now()
      });
    });
  }

  /**
   * 为用户叠加永久加油包
   * @param {number} userId
   * @param {{permanent_quota:number}} packDetails
   */
  async addTopUpPackToUser(userId, packDetails) {
    const { permanent_quota } = packDetails;
    if (!permanent_quota || permanent_quota <= 0) throw new Error('permanent_quota must be positive');

    await knex(this.tableName)
      .where({ user_id: userId })
      .increment('permanent_quota', permanent_quota)
      .update({ updated_at: knex.fn.now() });
  }

  /**
   * 检查并扣减配额
   * 优先扣 subscription_quota，其次 permanent_quota
   * @param {number} userId
   * @param {string} featureName 目前仅支持 resume_optimizations，可扩展
   */
  async checkAndDecrementQuota(userId, featureName = 'resume_optimizations') {
    return await knex.transaction(async trx => {
      const quota = await trx(this.tableName).where({ user_id: userId }).first();
      if (!quota) throw new Error('用户配额记录不存在');

      // 先判断订阅配额是否有效
      const now = new Date();
      let updatedFields = {};

      if (quota.subscription_quota > 0 && quota.subscription_expires_at && quota.subscription_expires_at > now) {
        updatedFields.subscription_quota = quota.subscription_quota - 1;
      } else if (quota.permanent_quota > 0) {
        updatedFields.permanent_quota = quota.permanent_quota - 1;
      } else {
        throw new Error('配额不足');
      }

      updatedFields.updated_at = knex.fn.now();

      await trx(this.tableName).where({ user_id: userId }).update(updatedFields);
    });
  }

  /**
   * 获取当前用户的套餐与配额详情
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>}
   */
  async getUserPlanDetails(userId) {
    const record = await knex('user_quotas')
      .leftJoin('plans', 'user_quotas.plan_id', 'plans.id')
      .where('user_quotas.user_id', userId)
      .select(
        'plans.name as planName',
        'plans.id as planId',
        'user_quotas.subscription_quota',
        'user_quotas.permanent_quota',
        'user_quotas.subscription_expires_at'
      )
      .first();

    if (!record) {
      console.warn(`[QUOTA_SERVICE] User ${userId} has no quota record, assigning default plan now.`);
      await this.assignDefaultPlanToUser(userId);
      // 重新查询
      return this.getUserPlanDetails(userId);
    }
    
    // 转换数据结构以匹配前端期望
    const transformed = {
      planName: record.planName || '免费用户',
      planId: record.planId,
      quotas: {
        subscription: {
          resume_optimizations: record.subscription_quota || 0,
        },
        permanent: {
          resume_optimizations: record.permanent_quota || 0,
        },
      },
      subscriptionExpiresAt: record.subscription_expires_at,
    };

    return transformed;
  }

  /**
   * 根据套餐 features 派生配额
   * @param {Object} plan
   * @returns {Object}
   */
  _deriveQuotaFromPlan(plan) {
    let subscription_quota = 0;
    let permanent_quota = 0;
    let subscription_expires_at = null;

    try {
      const feats = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features || {};
      const resumeQuota = feats.resume_optimizations || 0;
      if (feats.type === 'permanent') {
        permanent_quota = resumeQuota;
      } else {
        subscription_quota = resumeQuota;
        // 计算过期时间
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + (plan.duration_days || 30));
        subscription_expires_at = expireDate;
      }
    } catch (err) {
      console.error('⚠️ 无法解析套餐features:', err.message);
    }

    return { subscription_quota, permanent_quota, subscription_expires_at };
  }
}

module.exports = new QuotaService(); 