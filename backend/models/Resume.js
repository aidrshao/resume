/**
 * 简历相关数据模型
 * 提供简历数据的CRUD操作
 * 支持统一数据范式 (v2.1)
 */

const knex = require('../config/database');
const { convertToUnifiedSchema, validateUnifiedSchema, EMPTY_UNIFIED_RESUME } = require('../schemas/schema');

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
    // 确保数据符合统一格式
    let unifiedData = resumeData.unified_data;
    
    // 如果没有提供unified_data，但有旧格式数据，则转换
    if (!unifiedData && (resumeData.resume_data || resumeData.content)) {
      unifiedData = convertToUnifiedSchema(resumeData.resume_data || resumeData.content);
    }
    
    // 如果仍然没有数据，使用默认空模板
    if (!unifiedData) {
      unifiedData = EMPTY_UNIFIED_RESUME;
    }

    // 验证数据格式
    const validation = validateUnifiedSchema(unifiedData);
    if (!validation.valid) {
      throw new Error(`简历数据格式错误: ${validation.error}`);
    }

    const [resume] = await knex('resumes')
      .insert({
        ...resumeData,
        unified_data: JSON.stringify(unifiedData),
        schema_version: '2.1',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    // 返回时包含解析后的数据
    return this.enrichResumeData(resume);
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
    
    return resume ? this.enrichResumeData(resume) : null;
  }

  /**
   * 根据ID和用户ID获取简历（验证用户权限）
   * @param {number} id - 简历ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 简历对象
   */
  static async findByIdAndUser(id, userId) {
    console.log(`🔍 [RESUME_MODEL] 查询简历 ID: ${id}, 用户ID: ${userId}`);
    
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
    
    if (!resume) {
      console.log(`❌ [RESUME_MODEL] 简历未找到或无权限访问`);
      return null;
    }

    console.log(`✅ [RESUME_MODEL] 简历找到，开始数据处理`);
    return this.enrichResumeData(resume);
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
      
      return results.map(resume => this.enrichResumeData(resume));
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
      console.log(`🔍 [SQL_QUERY] 查询字段: id, user_id, template_id, title, generation_mode, target_company, target_position, status, created_at, updated_at, is_base, source, schema_version`);
      
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
          'source',
          'schema_version'
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
          schema_version: results[0].schema_version,
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
      
      return result ? this.enrichResumeData(result) : null;
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
    // 如果更新数据包含unified_data，验证格式
    if (updateData.unified_data) {
      let unifiedData = updateData.unified_data;
      
      // 如果是字符串，解析为对象
      if (typeof unifiedData === 'string') {
        try {
          unifiedData = JSON.parse(unifiedData);
        } catch (error) {
          throw new Error('简历数据格式错误：无效的JSON');
        }
      }

      // 验证数据格式
      const validation = validateUnifiedSchema(unifiedData);
      if (!validation.valid) {
        throw new Error(`简历数据格式错误: ${validation.error}`);
      }

      updateData.unified_data = JSON.stringify(unifiedData);
      updateData.schema_version = '2.1';
    }

    const [resume] = await knex('resumes')
      .where('id', id)
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning('*');
    
    return resume ? this.enrichResumeData(resume) : null;
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
    
    return resume ? this.enrichResumeData(resume) : null;
  }

  /**
   * 丰富简历数据，处理数据格式和向后兼容性
   * @param {Object} resume - 原始简历对象
   * @returns {Object} 处理后的简历对象
   */
  static enrichResumeData(resume) {
    if (!resume) return null;

    console.log(`🔄 [RESUME_MODEL] 处理简历数据 ID: ${resume.id}`);
    console.log(`📊 [RESUME_MODEL] Schema版本: ${resume.schema_version || '未知'}`);
    console.log(`📊 [RESUME_MODEL] 字段检查: unified_data=${!!resume.unified_data}`);

    let unifiedData = null;
    let content = null;

    // 优先使用unified_data（新格式）
    if (resume.unified_data) {
      try {
        unifiedData = typeof resume.unified_data === 'string' 
          ? JSON.parse(resume.unified_data) 
          : resume.unified_data;
        
        console.log(`✅ [RESUME_MODEL] 使用unified_data格式`);
        console.log(`🔍 [RESUME_DATA] 用户姓名: ${unifiedData.profile?.name || '未知'}`);
      } catch (error) {
        console.error(`❌ [RESUME_MODEL] 解析unified_data失败:`, error);
        unifiedData = EMPTY_UNIFIED_RESUME;
      }
    }
    // 如果没有unified_data，尝试转换旧格式
    else if (resume.resume_data || resume.content) {
      console.log(`🔄 [RESUME_MODEL] 转换旧格式数据`);
      
      const oldData = resume.resume_data || resume.content;
      unifiedData = convertToUnifiedSchema(oldData);
      
      console.log(`✅ [RESUME_MODEL] 旧格式转换完成`);
      console.log(`🔍 [CONVERTED_DATA] 用户姓名: ${unifiedData.profile?.name || '未知'}`);
    }
    // 都没有则使用默认空模板
    else {
      console.log(`⚠️ [RESUME_MODEL] 无数据，使用默认模板`);
      unifiedData = EMPTY_UNIFIED_RESUME;
    }

    // 生成向后兼容的content字段
    content = unifiedData;

    const result = {
      ...resume,
      unified_data: unifiedData,
      content: content,
      // 保持向后兼容
      resume_data: unifiedData
    };

    console.log(`✅ [RESUME_MODEL] 数据处理完成 ID: ${resume.id}`);
    return result;
  }

  /**
   * 迁移旧数据到统一格式
   * @param {number} id - 简历ID
   * @returns {Promise<boolean>} 迁移结果
   */
  static async migrateToUnifiedSchema(id) {
    try {
      const resume = await knex('resumes').where('id', id).first();
      if (!resume) {
        throw new Error('简历不存在');
      }

      // 如果已经是新格式，跳过
      if (resume.unified_data && resume.schema_version === '2.1') {
        return true;
      }

      // 获取旧数据
      const oldData = resume.resume_data || resume.content;
      
      // 转换为统一格式
      const unifiedData = convertToUnifiedSchema(oldData);
      
      // 验证数据
      const validation = validateUnifiedSchema(unifiedData);
      if (!validation.valid) {
        throw new Error(`数据验证失败: ${validation.error}`);
      }

      // 更新数据库
      await knex('resumes')
        .where('id', id)
        .update({
          unified_data: JSON.stringify(unifiedData),
          schema_version: '2.1',
          updated_at: new Date()
        });

      console.log(`✅ [MIGRATION] 简历 ${id} 迁移完成`);
      return true;
    } catch (error) {
      console.error(`❌ [MIGRATION] 简历 ${id} 迁移失败:`, error);
      throw error;
    }
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