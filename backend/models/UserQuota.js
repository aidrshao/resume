/**
 * 用户配额管理模型
 * 提供用户配额的增删改查和使用管理功能
 */

const knex = require('../config/database');

class UserQuota {
  
  /**
   * 获取用户的所有配额信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 配额列表
   */
  static async getUserQuotas(userId) {
    try {
      return await knex('user_quotas')
        .where('user_id', userId)
        .where('is_active', true)
        .orderBy('quota_type');
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户特定类型的配额
   * @param {number} userId - 用户ID
   * @param {string} quotaType - 配额类型
   * @returns {Promise<Object|null>} 配额信息
   */
  static async getUserQuota(userId, quotaType) {
    try {
      return await knex('user_quotas')
        .where('user_id', userId)
        .where('quota_type', quotaType)
        .where('is_active', true)
        .first();
    } catch (error) {
      throw error;
    }
  }

  /**
   * 检查用户配额是否足够
   * @param {number} userId - 用户ID
   * @param {string} quotaType - 配额类型
   * @param {number} requiredAmount - 需要的配额数量
   * @returns {Promise<Object>} 检查结果
   */
  static async checkQuota(userId, quotaType, requiredAmount = 1) {
    try {
      const quota = await this.getUserQuota(userId, quotaType);
      
      if (!quota) {
        return {
          available: false,
          message: '配额不存在',
          remaining: 0,
          limit: 0
        };
      }

      const remaining = quota.quota_limit - quota.quota_used;
      const available = remaining >= requiredAmount;

      return {
        available,
        message: available ? '配额充足' : '配额不足',
        remaining,
        limit: quota.quota_limit,
        used: quota.quota_used,
        resetDate: quota.reset_date
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 使用配额
   * @param {number} userId - 用户ID
   * @param {string} quotaType - 配额类型
   * @param {number} amount - 使用数量
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 使用结果
   */
  static async useQuota(userId, quotaType, amount = 1, options = {}) {
    const trx = await knex.transaction();

    try {
      // 获取当前配额
      const quota = await trx('user_quotas')
        .where('user_id', userId)
        .where('quota_type', quotaType)
        .where('is_active', true)
        .forUpdate()
        .first();

      if (!quota) {
        await trx.rollback();
        return {
          success: false,
          message: '配额不存在'
        };
      }

      const remaining = quota.quota_limit - quota.quota_used;
      
      if (remaining < amount) {
        await trx.rollback();
        return {
          success: false,
          message: '配额不足',
          remaining,
          required: amount
        };
      }

      // 更新配额使用量
      await trx('user_quotas')
        .where('id', quota.id)
        .update({
          quota_used: quota.quota_used + amount,
          updated_at: knex.fn.now()
        });

      // 记录使用日志
      await trx('quota_usage_logs').insert({
        user_id: userId,
        quota_type: quotaType,
        amount_used: amount,
        remaining_quota: remaining - amount,
        action_type: options.actionType || 'usage',
        related_resource_type: options.resourceType,
        related_resource_id: options.resourceId,
        notes: options.notes,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });

      await trx.commit();

      return {
        success: true,
        message: '配额使用成功',
        used: amount,
        remaining: remaining - amount,
        total: quota.quota_limit
      };

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * 重置用户配额
   * @param {number} userId - 用户ID
   * @param {string} quotaType - 配额类型（可选，不传则重置所有）
   * @param {number} adminUserId - 操作管理员ID
   * @returns {Promise<Object>} 重置结果
   */
  static async resetQuota(userId, quotaType = null, adminUserId = null) {
    const trx = await knex.transaction();

    try {
      let query = trx('user_quotas')
        .where('user_id', userId)
        .where('is_active', true);

      if (quotaType) {
        query = query.where('quota_type', quotaType);
      }

      const quotas = await query.select('*');

      const resetResults = [];

      for (const quota of quotas) {
        const oldUsed = quota.quota_used;
        
        // 计算下次重置时间
        let nextResetDate = new Date();
        switch (quota.reset_cycle) {
          case 'daily':
            nextResetDate.setDate(nextResetDate.getDate() + 1);
            break;
          case 'weekly':
            nextResetDate.setDate(nextResetDate.getDate() + 7);
            break;
          case 'monthly':
            nextResetDate.setMonth(nextResetDate.getMonth() + 1);
            nextResetDate.setDate(1);
            break;
          case 'yearly':
            nextResetDate.setFullYear(nextResetDate.getFullYear() + 1);
            nextResetDate.setMonth(0, 1);
            break;
          default:
            nextResetDate = null;
        }

        // 重置配额
        await trx('user_quotas')
          .where('id', quota.id)
          .update({
            quota_used: 0,
            reset_date: nextResetDate,
            last_reset_at: knex.fn.now(),
            updated_at: knex.fn.now()
          });

        // 记录重置日志
        await trx('quota_usage_logs').insert({
          user_id: userId,
          quota_type: quota.quota_type,
          amount_used: -oldUsed, // 负数表示重置
          remaining_quota: quota.quota_limit,
          action_type: 'reset',
          notes: `配额重置，原使用量: ${oldUsed}`,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });

        // 记录操作日志
        if (adminUserId) {
          await trx('user_action_logs').insert({
            user_id: userId,
            admin_user_id: adminUserId,
            action_type: 'quota_reset',
            action_description: `重置${quota.quota_type}配额`,
            old_values: { quota_used: oldUsed },
            new_values: { quota_used: 0 },
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          });
        }

        resetResults.push({
          quotaType: quota.quota_type,
          oldUsed,
          newUsed: 0,
          limit: quota.quota_limit,
          nextResetDate
        });
      }

      await trx.commit();

      return {
        success: true,
        message: `成功重置${resetResults.length}个配额`,
        results: resetResults
      };

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * 更新用户配额限制
   * @param {number} userId - 用户ID
   * @param {string} quotaType - 配额类型
   * @param {number} newLimit - 新的配额限制
   * @param {number} adminUserId - 操作管理员ID
   * @returns {Promise<Object>} 更新结果
   */
  static async updateQuotaLimit(userId, quotaType, newLimit, adminUserId = null) {
    const trx = await knex.transaction();

    try {
      const quota = await trx('user_quotas')
        .where('user_id', userId)
        .where('quota_type', quotaType)
        .where('is_active', true)
        .first();

      if (!quota) {
        await trx.rollback();
        return {
          success: false,
          message: '配额不存在'
        };
      }

      const oldLimit = quota.quota_limit;

      await trx('user_quotas')
        .where('id', quota.id)
        .update({
          quota_limit: newLimit,
          updated_at: knex.fn.now()
        });

      // 记录操作日志
      if (adminUserId) {
        await trx('user_action_logs').insert({
          user_id: userId,
          admin_user_id: adminUserId,
          action_type: 'quota_reset',
          action_description: `更新${quotaType}配额限制`,
          old_values: { quota_limit: oldLimit },
          new_values: { quota_limit: newLimit },
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
      }

      await trx.commit();

      return {
        success: true,
        message: '配额限制更新成功',
        quotaType,
        oldLimit,
        newLimit,
        currentUsed: quota.quota_used
      };

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * 创建用户默认配额
   * @param {number} userId - 用户ID
   * @param {Array} quotaConfigs - 配额配置
   * @returns {Promise<Array>} 创建的配额列表
   */
  static async createDefaultQuotas(userId, quotaConfigs = null) {
    try {
      const defaultConfigs = quotaConfigs || [
        {
          quota_type: 'monthly_ai_resume',
          quota_limit: 5,
          reset_cycle: 'monthly'
        },
        {
          quota_type: 'monthly_ai_chat',
          quota_limit: 50,
          reset_cycle: 'monthly'
        },
        {
          quota_type: 'monthly_job_search',
          quota_limit: 100,
          reset_cycle: 'monthly'
        }
      ];

      const quotas = [];

      for (const config of defaultConfigs) {
        // 计算首次重置时间
        let resetDate = new Date();
        switch (config.reset_cycle) {
          case 'monthly':
            resetDate = new Date(resetDate.getFullYear(), resetDate.getMonth() + 1, 1);
            break;
          case 'weekly':
            resetDate.setDate(resetDate.getDate() + 7);
            break;
          case 'daily':
            resetDate.setDate(resetDate.getDate() + 1);
            break;
          default:
            resetDate = null;
        }

        const [quota] = await knex('user_quotas')
          .insert({
            user_id: userId,
            quota_type: config.quota_type,
            quota_limit: config.quota_limit,
            quota_used: 0,
            reset_date: resetDate,
            reset_cycle: config.reset_cycle,
            is_active: true,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          })
          .returning('*');

        quotas.push(quota);
      }

      return quotas;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取配额使用统计
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 统计结果
   */
  static async getQuotaStatistics(options = {}) {
    try {
      const { userId, quotaType, startDate, endDate } = options;

      let query = knex('quota_usage_logs')
        .select(
          'quota_type',
          knex.raw('SUM(amount_used) as total_used'),
          knex.raw('COUNT(*) as usage_count'),
          knex.raw('AVG(amount_used) as avg_used')
        )
        .groupBy('quota_type');

      if (userId) {
        query = query.where('user_id', userId);
      }

      if (quotaType) {
        query = query.where('quota_type', quotaType);
      }

      if (startDate) {
        query = query.where('created_at', '>=', startDate);
      }

      if (endDate) {
        query = query.where('created_at', '<=', endDate);
      }

      const statistics = await query;

      return statistics;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 检查并自动重置过期配额
   * @returns {Promise<Object>} 重置结果
   */
  static async checkAndResetExpiredQuotas() {
    try {
      // 查找需要重置的配额
      const expiredQuotas = await knex('user_quotas')
        .where('is_active', true)
        .where('reset_date', '<=', knex.fn.now())
        .whereNotNull('reset_date');

      const resetResults = [];

      for (const quota of expiredQuotas) {
        const result = await this.resetQuota(quota.user_id, quota.quota_type);
        resetResults.push({
          userId: quota.user_id,
          quotaType: quota.quota_type,
          result
        });
      }

      return {
        success: true,
        message: `检查并重置了${resetResults.length}个过期配额`,
        results: resetResults
      };

    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserQuota; 