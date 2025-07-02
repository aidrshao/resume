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