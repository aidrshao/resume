/**
 * 用户会员状态模型
 * 管理用户会员状态的增删改查操作
 */

const knex = require('../config/database');

class UserMembership {
  /**
   * 获取用户会员列表
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.limit - 每页条数
   * @param {string} options.status - 状态过滤
   * @param {number} options.userId - 用户ID过滤
   * @returns {Promise<Object>} 会员列表和分页信息
   */
  static async findAll(options = {}) {
    const { page = 1, limit = 10, status, userId } = options;
    const offset = (page - 1) * limit;

    let query = knex('user_memberships')
      .leftJoin('users', 'user_memberships.user_id', 'users.id')
      .leftJoin('membership_tiers', 'user_memberships.membership_tier_id', 'membership_tiers.id')
      .select(
        'user_memberships.*',
        'users.email as user_email',
        'users.name as user_name',
        'membership_tiers.name as tier_name',
        'membership_tiers.original_price',
        'membership_tiers.reduction_price'
      );

    if (status) {
      query = query.where('user_memberships.status', status);
    }

    if (userId) {
      query = query.where('user_memberships.user_id', userId);
    }

    // 获取总数
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('user_memberships.id as count');
    const total = parseInt(count);

    // 获取数据
    const memberships = await query
      .orderBy('user_memberships.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: memberships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 根据用户ID获取当前有效会员
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 会员信息
   */
  static async getCurrentMembership(userId) {
    return await knex('user_memberships')
      .leftJoin('membership_tiers', 'user_memberships.membership_tier_id', 'membership_tiers.id')
      .select(
        'user_memberships.*',
        'membership_tiers.name as tier_name',
        'membership_tiers.ai_resume_quota',
        'membership_tiers.template_access_level',
        'membership_tiers.features'
      )
      .where('user_memberships.user_id', userId)
      .where('user_memberships.status', 'active')
      .where(function() {
        this.whereNull('user_memberships.end_date')
          .orWhere('user_memberships.end_date', '>', knex.fn.now());
      })
      .orderBy('user_memberships.created_at', 'desc')
      .first();
  }

  /**
   * 创建用户会员记录
   * @param {Object} membershipData - 会员数据
   * @returns {Promise<Object>} 创建的会员信息
   */
  static async create(membershipData) {
    const [membership] = await knex('user_memberships')
      .insert({
        user_id: membershipData.user_id,
        membership_tier_id: membershipData.membership_tier_id,
        status: membershipData.status || 'pending',
        start_date: membershipData.start_date,
        end_date: membershipData.end_date,
        remaining_ai_quota: membershipData.remaining_ai_quota || 0,
        quota_reset_date: membershipData.quota_reset_date,
        payment_status: membershipData.payment_status || 'pending',
        paid_amount: membershipData.paid_amount,
        payment_method: membershipData.payment_method,
        admin_notes: membershipData.admin_notes,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*');

    return membership;
  }

  /**
   * 更新用户会员状态
   * @param {number} id - 会员记录ID
   * @param {Object} membershipData - 更新数据
   * @returns {Promise<Object>} 更新后的会员信息
   */
  static async update(id, membershipData) {
    const updateData = {
      updated_at: knex.fn.now()
    };

    // 只更新提供的字段
    if (membershipData.status !== undefined) updateData.status = membershipData.status;
    if (membershipData.start_date !== undefined) updateData.start_date = membershipData.start_date;
    if (membershipData.end_date !== undefined) updateData.end_date = membershipData.end_date;
    if (membershipData.remaining_ai_quota !== undefined) updateData.remaining_ai_quota = membershipData.remaining_ai_quota;
    if (membershipData.quota_reset_date !== undefined) updateData.quota_reset_date = membershipData.quota_reset_date;
    if (membershipData.payment_status !== undefined) updateData.payment_status = membershipData.payment_status;
    if (membershipData.paid_amount !== undefined) updateData.paid_amount = membershipData.paid_amount;
    if (membershipData.payment_method !== undefined) updateData.payment_method = membershipData.payment_method;
    if (membershipData.admin_notes !== undefined) updateData.admin_notes = membershipData.admin_notes;

    const [membership] = await knex('user_memberships')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return membership;
  }

  /**
   * 激活用户会员
   * @param {number} userId - 用户ID
   * @param {number} membershipTierId - 套餐ID
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 会员信息
   */
  static async activateMembership(userId, membershipTierId, options = {}) {
    const trx = await knex.transaction();

    try {
      // 先停用用户的其他会员
      await trx('user_memberships')
        .where('user_id', userId)
        .where('status', 'active')
        .update({
          status: 'expired',
          updated_at: knex.fn.now()
        });

      // 获取套餐信息
      const tier = await trx('membership_tiers')
        .where('id', membershipTierId)
        .first();

      if (!tier) {
        throw new Error('套餐不存在');
      }

      // 计算结束时间
      let endDate = null;
      if (tier.duration_days > 0) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + tier.duration_days);
      }

      // 计算配额重置时间（下个月1号）
      const quotaResetDate = new Date();
      quotaResetDate.setMonth(quotaResetDate.getMonth() + 1);
      quotaResetDate.setDate(1);
      quotaResetDate.setHours(0, 0, 0, 0);

      // 创建新的会员记录
      const [membership] = await trx('user_memberships')
        .insert({
          user_id: userId,
          membership_tier_id: membershipTierId,
          status: 'active',
          start_date: new Date(),
          end_date: endDate,
          remaining_ai_quota: tier.ai_resume_quota,
          quota_reset_date: quotaResetDate,
          payment_status: options.payment_status || 'paid',
          paid_amount: options.paid_amount || tier.reduction_price || tier.original_price,
          payment_method: options.payment_method || 'manual',
          admin_notes: options.admin_notes,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        })
        .returning('*');

      await trx.commit();
      return membership;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * 使用AI配额
   * @param {number} userId - 用户ID
   * @param {number} amount - 使用数量
   * @returns {Promise<boolean>} 是否成功
   */
  static async useAIQuota(userId, amount = 1) {
    const membership = await this.getCurrentMembership(userId);
    
    if (!membership) {
      throw new Error('用户没有有效的会员资格');
    }

    if (membership.remaining_ai_quota < amount) {
      throw new Error('AI配额不足');
    }

    const [updated] = await knex('user_memberships')
      .where('id', membership.id)
      .update({
        remaining_ai_quota: membership.remaining_ai_quota - amount,
        updated_at: knex.fn.now()
      })
      .returning('*');

    return updated;
  }

  /**
   * 重置月度配额
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否成功
   */
  static async resetMonthlyQuota(userId) {
    const membership = await this.getCurrentMembership(userId);
    
    if (!membership) {
      return false;
    }

    // 获取套餐的配额
    const tier = await knex('membership_tiers')
      .where('id', membership.membership_tier_id)
      .first();

    if (!tier) {
      return false;
    }

    // 计算下个月的重置时间
    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    nextResetDate.setDate(1);
    nextResetDate.setHours(0, 0, 0, 0);

    await knex('user_memberships')
      .where('id', membership.id)
      .update({
        remaining_ai_quota: tier.ai_resume_quota,
        quota_reset_date: nextResetDate,
        updated_at: knex.fn.now()
      });

    return true;
  }

  /**
   * 检查过期会员并更新状态
   * @returns {Promise<number>} 更新的记录数
   */
  static async checkAndUpdateExpired() {
    const expiredCount = await knex('user_memberships')
      .where('status', 'active')
      .whereNotNull('end_date')
      .where('end_date', '<', knex.fn.now())
      .update({
        status: 'expired',
        updated_at: knex.fn.now()
      });

    return expiredCount;
  }

  /**
   * 获取用户会员统计信息
   * @returns {Promise<Object>} 统计信息
   */
  static async getStatistics() {
    const stats = await knex('user_memberships')
      .select(
        knex.raw('COUNT(*) as total'),
        knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as active', ['active']),
        knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as expired', ['expired']),
        knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as cancelled', ['cancelled']),
        knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending', ['pending'])
      )
      .first();

    // 获取最近7天的新增会员
    const recentStats = await knex('user_memberships')
      .where('created_at', '>=', knex.raw('NOW() - INTERVAL \'7 days\''))
      .count('* as recent_new')
      .first();

    return {
      ...stats,
      recent_new: parseInt(recentStats.recent_new)
    };
  }
}

module.exports = UserMembership; 