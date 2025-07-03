/**
 * AI提示词模型
 * 管理系统的AI提示词模板和配置
 */

const knex = require('../config/database');

class AIPrompt {
  /**
   * 获取所有提示词
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 提示词列表
   */
  static async findAll(options = {}) {
    const { category, isActive, page = 1, limit = 50 } = options;
    
    let query = knex('ai_prompts')
      .select('*')
      .orderBy('category', 'asc')
      .orderBy('name', 'asc');
    
    if (category) {
      query = query.where('category', category);
    }
    
    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
    }
    
    if (limit && limit > 0) {
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);
    }
    
    return await query;
  }

  /**
   * 根据ID获取提示词
   * @param {number} id - 提示词ID
   * @returns {Promise<Object|null>} 提示词对象
   */
  static async findById(id) {
    const prompt = await knex('ai_prompts')
      .where('id', id)
      .first();
    
    if (prompt && prompt.model_config) {
      try {
        prompt.model_config = typeof prompt.model_config === 'string' 
          ? JSON.parse(prompt.model_config) 
          : prompt.model_config;
      } catch (e) {
        prompt.model_config = {};
      }
    }
    
    if (prompt && prompt.variables) {
      try {
        prompt.variables = typeof prompt.variables === 'string' 
          ? JSON.parse(prompt.variables) 
          : prompt.variables;
      } catch (e) {
        prompt.variables = {};
      }
    }
    
    return prompt;
  }

  /**
   * 根据key获取提示词
   * @param {string} key - 提示词唯一标识
   * @returns {Promise<Object|null>} 提示词对象
   */
  static async findByKey(key) {
    const prompt = await knex('ai_prompts')
      .where('key', key)
      .where('is_active', true)
      .first();
    
    if (prompt && prompt.model_config) {
      try {
        prompt.model_config = typeof prompt.model_config === 'string' 
          ? JSON.parse(prompt.model_config) 
          : prompt.model_config;
      } catch (e) {
        prompt.model_config = {};
      }
    }
    
    return prompt;
  }

  /**
   * 创建新提示词
   * @param {Object} data - 提示词数据
   * @returns {Promise<Object>} 创建的提示词对象
   */
  static async create(data) {
    const {
      name,
      key,
      prompt_template,
      description,
      category = 'general',
      model_type = 'gpt',
      model_config = {},
      variables = {},
      is_active = true
    } = data;

    // 检查key是否已存在
    const existing = await knex('ai_prompts').where('key', key).first();
    if (existing) {
      throw new Error(`提示词标识 "${key}" 已存在`);
    }

    const [id] = await knex('ai_prompts').insert({
      name,
      key,
      prompt_template,
      description,
      category,
      model_type,
      model_config: JSON.stringify(model_config),
      variables: JSON.stringify(variables),
      is_active
    });

    return await this.findById(id);
  }

  /**
   * 更新提示词
   * @param {number} id - 提示词ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新后的提示词对象
   */
  static async update(id, data) {
    const {
      name,
      key,
      prompt_template,
      description,
      category,
      model_type,
      model_config,
      variables,
      is_active
    } = data;

    // 如果更新key，检查是否与其他记录冲突
    if (key) {
      const existing = await knex('ai_prompts')
        .where('key', key)
        .where('id', '!=', id)
        .first();
      
      if (existing) {
        throw new Error(`提示词标识 "${key}" 已被其他记录使用`);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (key !== undefined) updateData.key = key;
    if (prompt_template !== undefined) updateData.prompt_template = prompt_template;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (model_type !== undefined) updateData.model_type = model_type;
    if (model_config !== undefined) updateData.model_config = JSON.stringify(model_config);
    if (variables !== undefined) updateData.variables = JSON.stringify(variables);
    if (is_active !== undefined) updateData.is_active = is_active;

    updateData.updated_at = new Date();

    await knex('ai_prompts')
      .where('id', id)
      .update(updateData);

    return await this.findById(id);
  }

  /**
   * 删除提示词
   * @param {number} id - 提示词ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const deleted = await knex('ai_prompts')
      .where('id', id)
      .del();

    return deleted > 0;
  }

  /**
   * 获取所有分类
   * @returns {Promise<Array>} 分类列表
   */
  static async getCategories() {
    const categories = await knex('ai_prompts')
      .distinct('category')
      .whereNotNull('category')
      .orderBy('category');

    return categories.map(item => item.category);
  }

  /**
   * 渲染提示词模板
   * @param {string} template - 提示词模板
   * @param {Object} variables - 变量值
   * @returns {string} 渲染后的提示词
   */
  static renderTemplate(template, variables = {}) {
    let rendered = template;
    
    // 替换变量 ${variableName}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      rendered = rendered.replace(regex, variables[key] || '');
    });
    
    return rendered;
  }

  /**
   * 根据key获取并渲染提示词
   * @param {string} key - 提示词唯一标识
   * @param {Object} variables - 变量值
   * @param {boolean} useEmergencyFallback - 是否启用紧急回退（生产环境推荐开启）
   * @returns {Promise<Object|null>} 渲染后的提示词信息
   */
  static async getRenderedPrompt(key, variables = {}, useEmergencyFallback = true) {
    console.log(`🔍 [AI_PROMPT] 获取提示词: ${key}`);
    console.log(`📝 [AI_PROMPT] 变量:`, Object.keys(variables));
    console.log(`🛡️ [AI_PROMPT] 紧急回退模式: ${useEmergencyFallback ? '开启' : '关闭'}`);
    
    try {
      const prompt = await this.findByKey(key);
      
      if (!prompt) {
        console.error(`❌ [AI_PROMPT] 提示词不存在: ${key}`);
        
        if (useEmergencyFallback) {
          console.warn(`🚨 [AI_PROMPT] 启用回退模式: ${key}`);
          return this.getFallbackPrompt(key, variables);
        }
        
        throw new Error(`提示词 "${key}" 不存在或未启用`);
      }

      console.log(`✅ [AI_PROMPT] 找到提示词: ${prompt.name}`);
      console.log(`📊 [AI_PROMPT] 模型类型: ${prompt.model_type}`);
      console.log(`📏 [AI_PROMPT] 模板长度: ${prompt.prompt_template.length} 字符`);

      // 渲染提示词模板
      const renderedTemplate = this.renderTemplate(prompt.prompt_template, variables);
      
      console.log(`✅ [AI_PROMPT] 提示词渲染完成`);
      console.log(`📏 [AI_PROMPT] 渲染后长度: ${renderedTemplate.length} 字符`);

      return {
        id: prompt.id,
        name: prompt.name,
        key: prompt.key,
        renderedTemplate,
        model_type: prompt.model_type,
        model_config: prompt.model_config || {},
        originalTemplate: prompt.prompt_template,
        variables: prompt.variables || {},
        isEmergencyFallback: false,
        fallbackType: null
      };
      
    } catch (error) {
      console.error(`❌ [AI_PROMPT] 获取提示词失败: ${error.message}`);
      
      if (useEmergencyFallback) {
        console.warn(`🚨 [AI_PROMPT] 获取失败，启用回退模式: ${key}`);
        return this.getFallbackPrompt(key, variables);
      }
      
      throw error;
    }
  }

  /**
   * 智能回退机制：依次尝试不同的回退策略
   * @param {string} key - 提示词标识
   * @param {Object} variables - 变量值
   * @returns {Object} 回退提示词
   */
  static async getFallbackPrompt(key, variables = {}) {
    console.log(`🔄 [FALLBACK] 开始智能回退流程: ${key}`);
    
    // 策略1: 查找最近的历史版本（禁用的提示词）
    try {
      const lastVersion = await knex('ai_prompts')
        .where('key', key)
        .where('is_active', false)
        .orderBy('updated_at', 'desc')
        .first();
        
      if (lastVersion) {
        console.log(`📂 [FALLBACK] 找到历史版本: ${lastVersion.name} (${lastVersion.updated_at})`);
        
        const renderedTemplate = this.renderTemplate(lastVersion.prompt_template, variables);
        
        return {
          id: `history_${lastVersion.id}`,
          name: `${lastVersion.name} (历史版本回退)`,
          key: lastVersion.key,
          renderedTemplate,
          model_type: lastVersion.model_type,
          model_config: lastVersion.model_config || {},
          originalTemplate: lastVersion.prompt_template,
          variables: lastVersion.variables || {},
          isEmergencyFallback: true,
          fallbackType: 'history_version',
          fallbackSource: `历史版本 (${new Date(lastVersion.updated_at).toLocaleString()})`
        };
      }
    } catch (error) {
      console.warn(`⚠️ [FALLBACK] 历史版本查找失败: ${error.message}`);
    }
    
    // 策略2: 使用系统内置的紧急模板
    console.log(`🆘 [FALLBACK] 使用系统内置模板: ${key}`);
    return this.getEmergencyFallback(key, variables);
  }

  /**
   * 获取紧急回退提示词（当数据库提示词不可用时）
   * @param {string} key - 提示词标识
   * @param {Object} variables - 变量值
   * @returns {Object} 紧急回退提示词
   */
  static getEmergencyFallback(key, variables = {}) {
    console.log(`🆘 [EMERGENCY_FALLBACK] 使用紧急回退提示词: ${key}`);
    
    const fallbacks = {
      resume_optimization: {
        name: '简历优化专家 (系统内置)',
        key: 'resume_optimization',
        template: `你是一位专业的简历优化专家。请根据以下信息优化简历：

目标公司: \${targetCompany}
目标岗位: \${targetPosition}  
岗位描述: \${jobDescription}
用户要求: \${userRequirements}

当前简历:
\${resumeData}

请提供优化后的简历，保持JSON格式。`,
        model_type: 'gpt',
        model_config: { temperature: 0.3, max_tokens: 6000, timeout: 150000 }
      },
      
      resume_suggestions: {
        name: '简历建议生成器 (系统内置)',
        key: 'resume_suggestions', 
        template: `请分析以下简历并提供改进建议：

\${resumeData}

请返回JSON格式的建议列表。`,
        model_type: 'deepseek',
        model_config: { temperature: 0.7, max_tokens: 4000, timeout: 120000 }
      },
      
      user_info_collector: {
        name: '用户信息收集助手 (系统内置)',
        key: 'user_info_collector',
        template: `你是专业的简历助手，请分析对话并收集用户信息：

已收集信息: \${collectedInfo}
对话历史: \${conversationHistory}  
用户消息: \${userMessage}

请返回JSON格式的收集结果。`,
        model_type: 'deepseek',
        model_config: { temperature: 0.6, max_tokens: 3000, timeout: 90000 }
      },
      
      resume_parsing: {
        name: '简历解析专家 (系统内置)',
        key: 'resume_parsing',
        template: `请解析以下简历文本，提取结构化信息：

\${resumeText}

请返回包含个人信息、工作经历、教育背景、技能等的JSON格式数据。`,
        model_type: 'deepseek', 
        model_config: { temperature: 0.3, max_tokens: 6000, timeout: 180000 }
      }
    };
    
    const fallback = fallbacks[key];
    if (!fallback) {
      console.error(`🚨 [EMERGENCY_FALLBACK] 未找到紧急回退模板: ${key}`);
      throw new Error(`系统提示词暂时不可用: ${key}`);
    }
    
    const renderedTemplate = this.renderTemplate(fallback.template, variables);
    
    console.log(`🆘 [EMERGENCY_FALLBACK] 紧急回退模板准备完成: ${fallback.name}`);
    console.log(`📏 [EMERGENCY_FALLBACK] 渲染后长度: ${renderedTemplate.length} 字符`);
    
    return {
      id: `emergency_${key}`,
      name: fallback.name,
      key: fallback.key,
      renderedTemplate,
      model_type: fallback.model_type,
      model_config: fallback.model_config,
      originalTemplate: fallback.template,
      variables: {},
      isEmergencyFallback: true,
      fallbackType: 'system_builtin',
      fallbackSource: '系统内置紧急模板'
    };
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>} 统计数据
   */
  static async getStats() {
    const [totalCount, activeCount, categoryStats] = await Promise.all([
      knex('ai_prompts').count('id as count').first(),
      knex('ai_prompts').where('is_active', true).count('id as count').first(),
      knex('ai_prompts')
        .select('category')
        .count('id as count')
        .groupBy('category')
        .orderBy('category')
    ]);

    return {
      total: totalCount.count,
      active: activeCount.count,
      inactive: totalCount.count - activeCount.count,
      categories: categoryStats
    };
  }
}

module.exports = AIPrompt; 