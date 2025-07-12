/**
 * PlanService
 * -------------
 * 负责操作 plans 表相关业务逻辑。
 * 包含：
 *   - getAllPlans
 *   - getPlanById
 *   - createPlan
 *   - updatePlan
 *   - deletePlan
 * 所有方法均基于 knex，并遵循事务与 is_default 唯一性要求。
 */

const { db: knex } = require('../config/database');

class PlanService {
  constructor() {
    this.tableName = 'plans';
  }

  /**
   * 获取所有套餐
   * @param {Object} options 查询条件
   * @returns {Promise<Array>}
   */
  async getAllPlans(options = {}) {
    const {
      status,
      page = 1,
      limit = 20,
      orderBy = 'sort_order'
    } = options;

    let query = knex(this.tableName).select('*');
    if (status) query = query.where({ status });

    query = query.orderBy(orderBy, 'asc').orderBy('id', 'asc');

    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    return await query;
  }

  /**
   * 根据ID获取套餐
   * @param {number} id
   */
  async getPlanById(id) {
    return await knex(this.tableName).where({ id }).first();
  }

  /**
   * 创建套餐
   * @param {Object} data
   */
  async createPlan(data) {
    return await knex.transaction(async trx => {
      if (data.is_default) {
        // 清除现有默认套餐
        await trx(this.tableName).update({ is_default: false }).where({ is_default: true });
      }

      const [inserted] = await trx(this.tableName)
        .insert({
          name: data.name,
          price: data.price,
          duration_days: data.duration_days,
          features: data.features || {},
          status: data.status || 'active',
          is_default: !!data.is_default,
          sort_order: data.sort_order || 0,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        })
        .returning('*');

      return inserted;
    });
  }

  /**
   * 更新套餐
   * @param {number} id
   * @param {Object} data
   */
  async updatePlan(id, data) {
    return await knex.transaction(async trx => {
      if (data.is_default) {
        // 把其他套餐的默认标记取消
        await trx(this.tableName).update({ is_default: false }).where({ is_default: true }).andWhereNot({ id });
      }

      const updateData = {
        ...data,
        updated_at: knex.fn.now()
      };

      // features 字段直接使用对象，PostgreSQL JSONB 会自动序列化

      await trx(this.tableName).where({ id }).update(updateData);

      return await trx(this.tableName).where({ id }).first();
    });
  }

  /**
   * 删除套餐
   * @param {number} id
   */
  async deletePlan(id) {
    return await knex(this.tableName).where({ id }).del();
  }

  /**
   * 获取用户的当前套餐和所有配额信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>}
   */
  async getUserPlanAndQuotas(userId) {
    console.log(`[SERVICE_DEBUG] PlanService: Fetching plan and quotas for user ${userId}`);

    // 1. 获取用户当前的会员信息
    const userMembership = await knex('user_memberships')
      .where({ user_id: userId })
      .andWhere('expires_at', '>', knex.fn.now())
      .orderBy('expires_at', 'desc')
      .first();

    let planName = '免费版';
    let planId = null;
    let subscriptionExpiresAt = null;

    if (userMembership) {
      const plan = await knex('plans').where({ id: userMembership.plan_id }).first();
      if (plan) {
        planName = plan.name;
        planId = plan.id;
        subscriptionExpiresAt = userMembership.expires_at;
      }
    }

    // 2. 获取用户的所有配额（包括订阅和永久）
    const userQuotas = await knex('user_quotas')
      .where({ user_id: userId })
      .select('quota_type', 'quota_limit', 'quota_used', 'source');

    // 3. 组合数据
    const quotas = {
      subscription: {},
      permanent: {}
    };

    userQuotas.forEach(q => {
      const remaining = q.quota_limit - q.quota_used;
      if (q.source === 'subscription') {
        quotas.subscription[q.quota_type] = remaining > 0 ? remaining : 0;
      } else if (q.source === 'permanent_pack') {
        quotas.permanent[q.quota_type] = (quotas.permanent[q.quota_type] || 0) + remaining;
      }
    });

    return {
      planName,
      planId,
      subscriptionExpiresAt,
      quotas,
    };
  }
}

module.exports = new PlanService(); 