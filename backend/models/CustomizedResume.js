/**
 * CustomizedResume 数据模型
 * 用于处理专属简历的数据库操作
 * 
 * 功能：
 * - 创建专属简历
 * - 查询专属简历
 * - 更新专属简历
 * - 删除专属简历
 */

const { db } = require('../config/database');
const { validateUnifiedSchema } = require('../schemas/schema');

class CustomizedResume {
  
  /**
   * 创建专属简历
   * @param {Object} data - 简历数据
   * @param {number} data.userId - 用户ID
   * @param {number} data.baseResumeId - 基础简历ID
   * @param {number} data.targetJobId - 目标岗位ID
   * @param {Object} data.optimizedData - 优化后的简历数据
   * @returns {Promise<Object>} 创建的简历记录
   */
  static async create(data) {
    try {
      console.log('💾 [CUSTOMIZED_RESUME] 开始创建专属简历...');
      console.log('📊 [CUSTOMIZED_RESUME] 参数检查:', {
        userId: data.userId,
        baseResumeId: data.baseResumeId,
        targetJobId: data.targetJobId,
        hasOptimizedData: !!data.optimizedData
      });
      
      // 参数验证
      if (!data.userId || !data.baseResumeId || !data.targetJobId || !data.optimizedData) {
        throw new Error('缺少必要参数：userId, baseResumeId, targetJobId, optimizedData');
      }
      
      // 验证优化后的数据格式
      const validation = validateUnifiedSchema(data.optimizedData);
      if (!validation.valid) {
        console.error('❌ [CUSTOMIZED_RESUME] 数据格式验证失败:', validation.error);
        throw new Error(`优化后的简历数据格式错误: ${validation.error}`);
      }
      
      console.log('✅ [CUSTOMIZED_RESUME] 数据格式验证通过');
      
      // 插入数据库
      const [result] = await db('customized_resumes')
        .insert({
          user_id: data.userId,
          base_resume_id: data.baseResumeId,
          target_job_id: data.targetJobId,
          optimized_data: JSON.stringify(data.optimizedData),
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      
      console.log('✅ [CUSTOMIZED_RESUME] 专属简历创建成功，ID:', result.id);
      
      // 返回包含解析后数据的对象
      return {
        ...result,
        optimizedData: typeof result.optimized_data === 'string' 
          ? JSON.parse(result.optimized_data) 
          : result.optimized_data
      };
      
    } catch (error) {
      console.error('❌ [CUSTOMIZED_RESUME] 创建失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 根据ID查询专属简历
   * @param {number} id - 简历ID
   * @param {number} userId - 用户ID（用于权限验证）
   * @returns {Promise<Object|null>} 简历对象
   */
  static async findById(id, userId) {
    try {
      console.log(`🔍 [CUSTOMIZED_RESUME] 查询专属简历，ID: ${id}, 用户ID: ${userId}`);
      
      const result = await db('customized_resumes')
        .leftJoin('resumes', 'customized_resumes.base_resume_id', 'resumes.id')
        .leftJoin('job_positions', 'customized_resumes.target_job_id', 'job_positions.id')
        .select(
          'customized_resumes.*',
          'resumes.title as base_resume_title',
          'job_positions.title as job_title',
          'job_positions.company as job_company'
        )
        .where('customized_resumes.id', id)
        .where('customized_resumes.user_id', userId)
        .first();
      
      if (!result) {
        console.log('❌ [CUSTOMIZED_RESUME] 专属简历未找到或无权限访问');
        return null;
      }
      
      console.log('✅ [CUSTOMIZED_RESUME] 专属简历查询成功');
      
      // 解析JSON数据
      return {
        ...result,
        optimizedData: typeof result.optimized_data === 'string' 
          ? JSON.parse(result.optimized_data) 
          : result.optimized_data
      };
      
    } catch (error) {
      console.error('❌ [CUSTOMIZED_RESUME] 查询失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 根据用户ID查询专属简历列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  static async findByUserId(userId, options = {}) {
    try {
      console.log(`📋 [CUSTOMIZED_RESUME] 查询用户专属简历列表，用户ID: ${userId}`);
      
      const { page = 1, limit = 20, baseResumeId, targetJobId } = options;
      const offset = (page - 1) * limit;
      
      let query = db('customized_resumes')
        .leftJoin('resumes', 'customized_resumes.base_resume_id', 'resumes.id')
        .leftJoin('job_positions', 'customized_resumes.target_job_id', 'job_positions.id')
        .select(
          'customized_resumes.id',
          'customized_resumes.user_id',
          'customized_resumes.base_resume_id',
          'customized_resumes.target_job_id',
          'customized_resumes.created_at',
          'customized_resumes.updated_at',
          'resumes.title as base_resume_title',
          'job_positions.title as job_title',
          'job_positions.company as job_company'
        )
        .where('customized_resumes.user_id', userId);
      
      // 添加过滤条件
      if (baseResumeId) {
        query = query.where('customized_resumes.base_resume_id', baseResumeId);
      }
      
      if (targetJobId) {
        query = query.where('customized_resumes.target_job_id', targetJobId);
      }
      
      // 获取总数
      const countQuery = query.clone().count('customized_resumes.id as count').first();
      const { count: total } = await countQuery;
      
      // 获取分页数据
      const data = await query
        .orderBy('customized_resumes.created_at', 'desc')
        .limit(limit)
        .offset(offset);
      
      console.log(`✅ [CUSTOMIZED_RESUME] 查询完成，总数: ${total}, 当前页: ${data.length}`);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total: parseInt(total),
          totalPages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      console.error('❌ [CUSTOMIZED_RESUME] 查询列表失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 根据用户ID、基础简历ID和目标岗位ID查询专属简历
   * @param {number} userId - 用户ID
   * @param {number} baseResumeId - 基础简历ID
   * @param {number} targetJobId - 目标岗位ID
   * @returns {Promise<Object|null>} 专属简历对象
   */
  static async findByUserJobCombination(userId, baseResumeId, targetJobId) {
    try {
      console.log(`🔍 [CUSTOMIZED_RESUME] 查询用户岗位组合专属简历，用户ID: ${userId}, 基础简历ID: ${baseResumeId}, 目标岗位ID: ${targetJobId}`);
      
      const result = await db('customized_resumes')
        .leftJoin('resumes', 'customized_resumes.base_resume_id', 'resumes.id')
        .leftJoin('job_positions', 'customized_resumes.target_job_id', 'job_positions.id')
        .select(
          'customized_resumes.*',
          'resumes.title as base_resume_title',
          'job_positions.title as job_title',
          'job_positions.company as job_company'
        )
        .where('customized_resumes.user_id', userId)
        .where('customized_resumes.base_resume_id', baseResumeId)
        .where('customized_resumes.target_job_id', targetJobId)
        .first();
      
      if (!result) {
        console.log('❌ [CUSTOMIZED_RESUME] 未找到匹配的专属简历');
        return null;
      }
      
      console.log('✅ [CUSTOMIZED_RESUME] 找到匹配的专属简历，ID:', result.id);
      
      // 解析JSON数据
      return {
        ...result,
        optimizedData: typeof result.optimized_data === 'string' 
          ? JSON.parse(result.optimized_data) 
          : result.optimized_data
      };
      
    } catch (error) {
      console.error('❌ [CUSTOMIZED_RESUME] 查询用户岗位组合失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 删除专属简历
   * @param {number} id - 简历ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id, userId) {
    try {
      console.log(`🗑️ [CUSTOMIZED_RESUME] 删除专属简历，ID: ${id}, 用户ID: ${userId}`);
      
      const deleted = await db('customized_resumes')
        .where('id', id)
        .where('user_id', userId)
        .del();
      
      const success = deleted > 0;
      
      if (success) {
        console.log('✅ [CUSTOMIZED_RESUME] 专属简历删除成功');
      } else {
        console.log('❌ [CUSTOMIZED_RESUME] 专属简历不存在或无权限删除');
      }
      
      return success;
      
    } catch (error) {
      console.error('❌ [CUSTOMIZED_RESUME] 删除失败:', error.message);
      throw error;
    }
  }
}

module.exports = CustomizedResume;
