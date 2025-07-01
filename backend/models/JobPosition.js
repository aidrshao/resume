/**
 * 岗位管理模型
 * 处理用户意向岗位的数据库操作
 */

const db = require('../config/database');

class JobPosition {
  /**
   * 获取用户的所有岗位
   * @param {number} userId - 用户ID
   * @param {object} filters - 过滤条件
   * @param {object} pagination - 分页参数
   * @returns {Promise<object>} 岗位列表和总数
   */
  static async getJobsByUserId(userId, filters = {}, pagination = {}) {
    try {
      const { status, priority, search } = filters;
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      // 构建基础查询（不包含排序，用于计数）
      let baseQuery = db('job_positions').where('user_id', userId);

      // 状态过滤
      if (status) {
        baseQuery = baseQuery.where('status', status);
      }

      // 优先级过滤
      if (priority) {
        baseQuery = baseQuery.where('priority', priority);
      }

      // 搜索过滤
      if (search) {
        baseQuery = baseQuery.where(function() {
          this.where('title', 'ilike', `%${search}%`)
            .orWhere('company', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`);
        });
      }

      // 获取总数（使用基础查询，不包含排序）
      const [{ count: total }] = await baseQuery.clone().count('* as count');

      // 获取分页数据（添加排序和分页）
      const jobs = await baseQuery
        .clone()
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: {
          jobs,
          pagination: {
            page,
            limit,
            total: parseInt(total),
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('获取岗位列表失败:', error);
      return {
        success: false,
        message: '获取岗位列表失败'
      };
    }
  }

  /**
   * 根据ID获取岗位详情
   * @param {number} id - 岗位ID
   * @param {number} userId - 用户ID（用于权限验证）
   * @returns {Promise<object>} 岗位详情
   */
  static async getJobById(id, userId) {
    try {
      const job = await db('job_positions')
        .where({ id, user_id: userId })
        .first();

      if (!job) {
        return {
          success: false,
          message: '岗位不存在或无权限访问'
        };
      }

      return {
        success: true,
        data: job
      };
    } catch (error) {
      console.error('获取岗位详情失败:', error);
      return {
        success: false,
        message: '获取岗位详情失败'
      };
    }
  }

  /**
   * 创建新岗位
   * @param {object} jobData - 岗位数据
   * @returns {Promise<object>} 创建结果
   */
  static async createJob(jobData) {
    try {
      const {
        user_id,
        title,
        company,
        description,
        requirements,
        salary_range,
        location,
        job_type = 'full-time',
        source_type,
        source_file_path,
        original_content,
        status = 'active',
        priority = 1,
        application_deadline,
        notes
      } = jobData;

      // 数据验证
      if (!user_id || !title || !company || !source_type) {
        return {
          success: false,
          message: '缺少必填字段：用户ID、职位名称、公司名称、来源类型'
        };
      }

      const [insertResult] = await db('job_positions').insert({
        user_id,
        title,
        company,
        description,
        requirements,
        salary_range,
        location,
        job_type,
        source_type,
        source_file_path,
        original_content,
        status,
        priority,
        application_deadline,
        notes
      }).returning('id');

      // 处理PostgreSQL返回的id格式
      const newJobId = typeof insertResult === 'object' ? insertResult.id : insertResult;

      const createdJob = await db('job_positions')
        .where('id', newJobId)
        .first();

      return {
        success: true,
        data: createdJob,
        message: '岗位创建成功'
      };
    } catch (error) {
      console.error('创建岗位失败:', error);
      return {
        success: false,
        message: '创建岗位失败'
      };
    }
  }

  /**
   * 更新岗位信息
   * @param {number} id - 岗位ID
   * @param {number} userId - 用户ID
   * @param {object} updateData - 更新数据
   * @returns {Promise<object>} 更新结果
   */
  static async updateJob(id, userId, updateData) {
    try {
      // 验证岗位是否存在且属于当前用户
      const existingJob = await db('job_positions')
        .where({ id, user_id: userId })
        .first();

      if (!existingJob) {
        return {
          success: false,
          message: '岗位不存在或无权限修改'
        };
      }

      // 更新岗位信息
      await db('job_positions')
        .where({ id, user_id: userId })
        .update({
          ...updateData,
          updated_at: new Date()
        });

      // 获取更新后的岗位信息
      const updatedJob = await db('job_positions')
        .where('id', id)
        .first();

      return {
        success: true,
        data: updatedJob,
        message: '岗位更新成功'
      };
    } catch (error) {
      console.error('更新岗位失败:', error);
      return {
        success: false,
        message: '更新岗位失败'
      };
    }
  }

  /**
   * 删除岗位
   * @param {number} id - 岗位ID
   * @param {number} userId - 用户ID
   * @returns {Promise<object>} 删除结果
   */
  static async deleteJob(id, userId) {
    try {
      // 验证岗位是否存在且属于当前用户
      const existingJob = await db('job_positions')
        .where({ id, user_id: userId })
        .first();

      if (!existingJob) {
        return {
          success: false,
          message: '岗位不存在或无权限删除'
        };
      }

      // 删除岗位
      await db('job_positions')
        .where({ id, user_id: userId })
        .del();

      return {
        success: true,
        message: '岗位删除成功'
      };
    } catch (error) {
      console.error('删除岗位失败:', error);
      return {
        success: false,
        message: '删除岗位失败'
      };
    }
  }

  /**
   * 批量更新岗位状态
   * @param {Array} ids - 岗位ID数组
   * @param {number} userId - 用户ID
   * @param {string} status - 新状态
   * @returns {Promise<object>} 更新结果
   */
  static async batchUpdateStatus(ids, userId, status) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return {
          success: false,
          message: '请选择要更新的岗位'
        };
      }

      const updatedCount = await db('job_positions')
        .whereIn('id', ids)
        .where('user_id', userId)
        .update({
          status,
          updated_at: new Date()
        });

      return {
        success: true,
        data: { updatedCount },
        message: `成功更新 ${updatedCount} 个岗位状态`
      };
    } catch (error) {
      console.error('批量更新岗位状态失败:', error);
      return {
        success: false,
        message: '批量更新岗位状态失败'
      };
    }
  }

  /**
   * 获取岗位统计信息
   * @param {number} userId - 用户ID
   * @returns {Promise<object>} 统计数据
   */
  static async getJobStats(userId) {
    try {
      const stats = await db('job_positions')
        .where('user_id', userId)
        .select('status')
        .count('* as count')
        .groupBy('status');

      const totalJobs = await db('job_positions')
        .where('user_id', userId)
        .count('* as count')
        .first();

      const result = {
        total: parseInt(totalJobs.count),
        active: 0,
        applied: 0,
        archived: 0
      };

      stats.forEach(stat => {
        result[stat.status] = parseInt(stat.count);
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('获取岗位统计失败:', error);
      return {
        success: false,
        message: '获取岗位统计失败'
      };
    }
  }
}

module.exports = JobPosition; 