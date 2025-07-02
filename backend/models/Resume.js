/**
 * 简历相关数据模型
 * 提供简历数据的CRUD操作
 */

const knex = require('../config/database');

class Resume {
  /**
   * 测试数据库连接
   * @returns {Promise<boolean>} 连接状态
   */
  static async testConnection() {
    try {
      await knex.raw('SELECT 1');
      return true;
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      throw error;
    }
  }

  /**
   * 创建新简历
   * @param {Object} resumeData - 简历数据
   * @returns {Promise<Object>} 创建的简历对象
   */
  static async create(resumeData) {
    const [resume] = await knex('resumes')
      .insert({
        ...resumeData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    return resume;
  }

  /**
   * 根据ID获取简历
   * @param {number} id - 简历ID
   * @returns {Promise<Object|null>} 简历对象
   */
  static async findById(id) {
    const resume = await knex('resumes')
      .leftJoin('resume_templates', 'resumes.template_id', 'resume_templates.id')
      .leftJoin('users', 'resumes.user_id', 'users.id')
      .select(
        'resumes.*',
        'resume_templates.name as template_name',
        'resume_templates.template_config',
        'users.email as user_email'
      )
      .where('resumes.id', id)
      .first();
    return resume;
  }

  /**
   * 根据ID和用户ID获取简历（验证用户权限）
   * @param {number} id - 简历ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 简历对象
   */
  static async findByIdAndUser(id, userId) {
    const resume = await knex('resumes')
      .leftJoin('resume_templates', 'resumes.template_id', 'resume_templates.id')
      .select(
        'resumes.*',
        'resume_templates.name as template_name',
        'resume_templates.template_config'
      )
      .where('resumes.id', id)
      .where('resumes.user_id', userId)
      .first();
    
    if (resume && resume.resume_data) {
      // 如果resume_data是字符串，解析为JSON
      if (typeof resume.resume_data === 'string') {
        try {
          resume.resume_data = JSON.parse(resume.resume_data);
        } catch (e) {
          console.warn('解析简历数据失败:', e);
        }
      }
    }
    
    return resume;
  }

  /**
   * 获取用户的所有简历
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 简历列表
   */
  static async findByUserId(userId) {
    try {
      const results = await knex('resumes')
        .where('user_id', userId)
        .orderBy('updated_at', 'desc');
      
      return results.map(resume => ({
        ...resume,
        content: typeof resume.resume_data === 'string' ? JSON.parse(resume.resume_data) : resume.resume_data
      }));
    } catch (error) {
      console.error('查询用户简历失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的简历列表（仅基本信息，用于列表页面）
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 简历列表（仅基本信息）
   */
  static async findListByUserId(userId) {
    const startTime = Date.now();
    try {
      console.log(`🗄️ [RESUME_MODEL] 开始查询用户简历列表，用户ID: ${userId}`);
      console.log(`🔍 [SQL_QUERY] 查询字段: id, user_id, template_id, title, generation_mode, target_company, target_position, status, created_at, updated_at, is_base, source`);
      
      const queryStartTime = Date.now();
      const results = await knex('resumes')
        .select([
          'id',
          'user_id', 
          'template_id',
          'title',
          'generation_mode',
          'target_company',
          'target_position',
          'status',
          'created_at',
          'updated_at',
          'is_base',
          'source'
        ])
        .where('user_id', userId)
        .orderBy('updated_at', 'desc');
      
      const queryDuration = Date.now() - queryStartTime;
      const totalDuration = Date.now() - startTime;
      
      console.log(`✅ [RESUME_MODEL] 查询完成，耗时: ${totalDuration}ms`);
      console.log(`📊 [SQL_PERFORMANCE] SQL执行时间: ${queryDuration}ms`);
      console.log(`📊 [QUERY_RESULT] 返回记录数: ${results.length}`);
      
      if (results.length > 0) {
        console.log(`📋 [SAMPLE_DATA] 第一条记录: ${JSON.stringify({
          id: results[0].id,
          title: results[0].title,
          status: results[0].status,
          created_at: results[0].created_at
        })}`);
      }
      
      return results;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error(`❌ [RESUME_MODEL] 查询用户简历列表失败，耗时: ${totalDuration}ms`, error);
      throw error;
    }
  }

  /**
   * 查找用户的基础简历
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 基础简历或null
   */
  static async findBaseResumeByUserId(userId) {
    try {
      const result = await knex('resumes')
        .where('user_id', userId)
        .where('is_base', true)
        .first();
      
      if (result) {
        return {
          ...result,
          content: typeof result.resume_data === 'string' ? JSON.parse(result.resume_data) : result.resume_data
        };
      }
      
      return null;
    } catch (error) {
      console.error('查询基础简历失败:', error);
      throw error;
    }
  }

  /**
   * 更新简历
   * @param {number} id - 简历ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的简历对象
   */
  static async update(id, updateData) {
    const [resume] = await knex('resumes')
      .where('id', id)
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning('*');
    return resume;
  }

  /**
   * 删除简历
   * @param {number} id - 简历ID
   * @returns {Promise<boolean>} 删除结果
   */
  static async delete(id) {
    const result = await knex('resumes')
      .where('id', id)
      .del();
    return result > 0;
  }

  /**
   * 更新简历状态
   * @param {number} id - 简历ID
   * @param {string} status - 新状态
   * @param {string} log - 日志信息
   * @returns {Promise<Object>} 更新后的简历对象
   */
  static async updateStatus(id, status, log = null) {
    const updateData = {
      status,
      updated_at: new Date()
    };
    
    if (log) {
      updateData.generation_log = log;
    }

    const [resume] = await knex('resumes')
      .where('id', id)
      .update(updateData)
      .returning('*');
    return resume;
  }
}

class UserProfile {
  /**
   * 创建或更新用户详细信息
   * @param {number} userId - 用户ID
   * @param {Object} profileData - 用户信息
   * @returns {Promise<Object>} 用户信息对象
   */
  static async upsert(userId, profileData) {
    const existing = await knex('user_profiles')
      .where('user_id', userId)
      .first();

    if (existing) {
      const [profile] = await knex('user_profiles')
        .where('user_id', userId)
        .update({
          ...profileData,
          updated_at: new Date()
        })
        .returning('*');
      return profile;
    } else {
      const [profile] = await knex('user_profiles')
        .insert({
          user_id: userId,
          ...profileData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      return profile;
    }
  }

  /**
   * 获取用户详细信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 用户信息对象
   */
  static async findByUserId(userId) {
    const profile = await knex('user_profiles')
      .where('user_id', userId)
      .first();
    return profile;
  }

  /**
   * 获取用户完整信息（包含教育、工作、项目经历）
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 完整用户信息
   */
  static async getCompleteProfile(userId) {
    const [profile, educations, workExperiences, projects] = await Promise.all([
      this.findByUserId(userId),
      knex('educations').where('user_id', userId).orderBy('sort_order'),
      knex('work_experiences').where('user_id', userId).orderBy('sort_order'),
      knex('projects').where('user_id', userId).orderBy('sort_order')
    ]);

    return {
      profile: profile || {},
      educations,
      workExperiences,
      projects
    };
  }
}

class ResumeTemplate {
  /**
   * 获取所有可用模板
   * @returns {Promise<Array>} 模板列表
   */
  static async findAll() {
    const templates = await knex('resume_templates')
      .where('is_active', true)
      .orderBy('sort_order');
    return templates;
  }

  /**
   * 根据ID获取模板
   * @param {number} id - 模板ID
   * @returns {Promise<Object|null>} 模板对象
   */
  static async findById(id) {
    const template = await knex('resume_templates')
      .where('id', id)
      .where('is_active', true)
      .first();
    return template;
  }

  /**
   * 创建新模板
   * @param {Object} templateData - 模板数据
   * @returns {Promise<Object>} 创建的模板对象
   */
  static async create(templateData) {
    const [template] = await knex('resume_templates')
      .insert({
        ...templateData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    return template;
  }
}

class ResumeUpload {
  /**
   * 创建上传记录
   * @param {Object} uploadData - 上传数据
   * @returns {Promise<Object>} 上传记录对象
   */
  static async create(uploadData) {
    const [upload] = await knex('resume_uploads')
      .insert({
        ...uploadData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    return upload;
  }

  /**
   * 更新解析状态
   * @param {number} id - 上传记录ID
   * @param {string} status - 解析状态
   * @param {Object} data - 解析数据
   * @returns {Promise<Object>} 更新后的记录
   */
  static async updateParseStatus(id, status, data = {}) {
    const updateData = {
      parse_status: status,
      updated_at: new Date(),
      ...data
    };

    const [upload] = await knex('resume_uploads')
      .where('id', id)
      .update(updateData)
      .returning('*');
    return upload;
  }

  /**
   * 获取用户的上传记录
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 上传记录列表
   */
  static async findByUserId(userId) {
    const uploads = await knex('resume_uploads')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
    return uploads;
  }
}

module.exports = {
  Resume,
  UserProfile,
  ResumeTemplate,
  ResumeUpload
}; 