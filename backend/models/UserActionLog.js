/**
 * 用户操作日志模型
 * 记录管理员对用户的各种操作，提供审计功能
 */

const knex = require('../config/database');

class UserActionLog {

  /**
   * 记录用户操作日志
   * @param {Object} logData - 日志数据
   * @returns {Promise<Object>} 创建的日志记录
   */
  static async createLog(logData) {
    try {
      const {
        userId,
        adminUserId,
        actionType,
        actionDescription,
        oldValues = null,
        newValues = null,
        ipAddress = null,
        userAgent = null
      } = logData;

      const [log] = await knex('user_action_logs')
        .insert({
          user_id: userId,
          admin_user_id: adminUserId,
          action_type: actionType,
          action_description: actionDescription,
          old_values: oldValues ? JSON.stringify(oldValues) : null,
          new_values: newValues ? JSON.stringify(newValues) : null,
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        })
        .returning('*');

      return log;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户操作日志列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 日志列表和分页信息
   */
  static async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        userId = null, 
        adminUserId = null, 
        actionType = null,
        startDate = null,
        endDate = null 
      } = options;

      const offset = (page - 1) * limit;

      let query = knex('user_action_logs')
        .leftJoin('users as target_users', 'user_action_logs.user_id', 'target_users.id')
        .leftJoin('users as admin_users', 'user_action_logs.admin_user_id', 'admin_users.id')
        .select(
          'user_action_logs.*',
          'target_users.email as target_user_email',
          'target_users.name as target_user_name',
          'admin_users.email as admin_email',
          'admin_users.name as admin_name'
        );

      // 添加筛选条件
      if (userId) {
        query = query.where('user_action_logs.user_id', userId);
      }

      if (adminUserId) {
        query = query.where('user_action_logs.admin_user_id', adminUserId);
      }

      if (actionType) {
        query = query.where('user_action_logs.action_type', actionType);
      }

      if (startDate) {
        query = query.where('user_action_logs.created_at', '>=', startDate);
      }

      if (endDate) {
        query = query.where('user_action_logs.created_at', '<=', endDate);
      }

      // 获取总数
      const countQuery = query.clone();
      const [{ count }] = await countQuery.count('user_action_logs.id as count');
      const total = parseInt(count);

      // 获取数据
      const logs = await query
        .orderBy('user_action_logs.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // 解析JSON字段
      const formattedLogs = logs.map(log => ({
        ...log,
        old_values: log.old_values ? JSON.parse(log.old_values) : null,
        new_values: log.new_values ? JSON.parse(log.new_values) : null
      }));

      return {
        data: formattedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户的操作历史
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 用户操作历史
   */
  static async getUserActionHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 10, actionType = null } = options;

      return await this.findAll({
        page,
        limit,
        userId,
        actionType
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取管理员的操作历史
   * @param {number} adminUserId - 管理员用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 管理员操作历史
   */
  static async getAdminActionHistory(adminUserId, options = {}) {
    try {
      const { page = 1, limit = 10, actionType = null } = options;

      return await this.findAll({
        page,
        limit,
        adminUserId,
        actionType
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 记录用户状态变更日志
   * @param {number} userId - 用户ID
   * @param {number} adminUserId - 管理员ID
   * @param {string} oldStatus - 原状态
   * @param {string} newStatus - 新状态
   * @param {string} reason - 变更原因
   * @param {Object} request - 请求对象（获取IP和UA）
   * @returns {Promise<Object>} 日志记录
   */
  static async logStatusChange(userId, adminUserId, oldStatus, newStatus, reason = '', request = null) {
    try {
      return await this.createLog({
        userId,
        adminUserId,
        actionType: 'status_change',
        actionDescription: `用户状态从 ${oldStatus} 变更为 ${newStatus}${reason ? `，原因：${reason}` : ''}`,
        oldValues: { status: oldStatus },
        newValues: { status: newStatus, reason },
        ipAddress: request?.ip,
        userAgent: request?.get('User-Agent')
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 记录会员变更日志
   * @param {number} userId - 用户ID
   * @param {number} adminUserId - 管理员ID
   * @param {Object} oldMembership - 原会员信息
   * @param {Object} newMembership - 新会员信息
   * @param {Object} request - 请求对象
   * @returns {Promise<Object>} 日志记录
   */
  static async logMembershipChange(userId, adminUserId, oldMembership, newMembership, request = null) {
    try {
      const description = oldMembership 
        ? `会员从 ${oldMembership.tier_name || '无'} 变更为 ${newMembership.tier_name || '无'}`
        : `开通会员：${newMembership.tier_name}`;

      return await this.createLog({
        userId,
        adminUserId,
        actionType: 'membership_change',
        actionDescription: description,
        oldValues: oldMembership,
        newValues: newMembership,
        ipAddress: request?.ip,
        userAgent: request?.get('User-Agent')
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 记录数据更新日志
   * @param {number} userId - 用户ID
   * @param {number} adminUserId - 管理员ID
   * @param {string} dataType - 数据类型
   * @param {Object} oldData - 原数据
   * @param {Object} newData - 新数据
   * @param {Object} request - 请求对象
   * @returns {Promise<Object>} 日志记录
   */
  static async logDataUpdate(userId, adminUserId, dataType, oldData, newData, request = null) {
    try {
      return await this.createLog({
        userId,
        adminUserId,
        actionType: 'data_update',
        actionDescription: `更新用户${dataType}数据`,
        oldValues: oldData,
        newValues: newData,
        ipAddress: request?.ip,
        userAgent: request?.get('User-Agent')
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 记录登录尝试日志
   * @param {number} userId - 用户ID（可为空）
   * @param {string} email - 登录邮箱
   * @param {boolean} success - 是否成功
   * @param {string} failReason - 失败原因
   * @param {Object} request - 请求对象
   * @returns {Promise<Object>} 日志记录
   */
  static async logLoginAttempt(userId, email, success, failReason = '', request = null) {
    try {
      const description = success 
        ? `用户 ${email} 登录成功`
        : `用户 ${email} 登录失败${failReason ? `：${failReason}` : ''}`;

      return await this.createLog({
        userId,
        adminUserId: null,
        actionType: 'login_attempt',
        actionDescription: description,
        oldValues: null,
        newValues: { email, success, failReason },
        ipAddress: request?.ip,
        userAgent: request?.get('User-Agent')
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取操作统计
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 统计结果
   */
  static async getActionStatistics(options = {}) {
    try {
      const { 
        startDate = null, 
        endDate = null, 
        groupBy = 'action_type' 
      } = options;

      let query = knex('user_action_logs')
        .select(
          groupBy,
          knex.raw('COUNT(*) as action_count'),
          knex.raw('COUNT(DISTINCT user_id) as affected_users'),
          knex.raw('COUNT(DISTINCT admin_user_id) as acting_admins')
        )
        .groupBy(groupBy);

      if (startDate) {
        query = query.where('created_at', '>=', startDate);
      }

      if (endDate) {
        query = query.where('created_at', '<=', endDate);
      }

      const statistics = await query.orderBy('action_count', 'desc');

      return statistics;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 清理旧日志（保留指定天数的日志）
   * @param {number} retentionDays - 保留天数
   * @returns {Promise<number>} 删除的记录数
   */
  static async cleanOldLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await knex('user_action_logs')
        .where('created_at', '<', cutoffDate)
        .del();

      return deletedCount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据ID获取日志详情
   * @param {number} logId - 日志ID
   * @returns {Promise<Object|null>} 日志详情
   */
  static async findById(logId) {
    try {
      const log = await knex('user_action_logs')
        .leftJoin('users as target_users', 'user_action_logs.user_id', 'target_users.id')
        .leftJoin('users as admin_users', 'user_action_logs.admin_user_id', 'admin_users.id')
        .select(
          'user_action_logs.*',
          'target_users.email as target_user_email',
          'target_users.name as target_user_name',
          'admin_users.email as admin_email',
          'admin_users.name as admin_name'
        )
        .where('user_action_logs.id', logId)
        .first();

      if (log) {
        log.old_values = log.old_values ? JSON.parse(log.old_values) : null;
        log.new_values = log.new_values ? JSON.parse(log.new_values) : null;
      }

      return log;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserActionLog; 