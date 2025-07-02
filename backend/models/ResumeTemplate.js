/**
 * 简历模板数据模型
 * 处理简历模板的数据库操作
 */

const knex = require('../config/database');

class ResumeTemplate {
  /**
   * 获取所有启用的简历模板
   * @returns {Promise<Array>} 模板列表
   */
  static async findAllActive() {
    try {
      const templates = await knex('resume_templates')
        .select('*')
        .where('is_active', true)
        .orderBy('sort_order', 'asc');

      return templates.map(template => ({
        ...template,
        template_config: typeof template.template_config === 'string' 
          ? JSON.parse(template.template_config) 
          : template.template_config
      }));
    } catch (error) {
      console.error('❌ [ResumeTemplate] 获取启用模板失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取单个模板
   * @param {number} id - 模板ID
   * @returns {Promise<Object|null>} 模板对象或null
   */
  static async findById(id) {
    try {
      const template = await knex('resume_templates')
        .select('*')
        .where('id', id)
        .first();

      if (!template) {
        return null;
      }

      return {
        ...template,
        template_config: typeof template.template_config === 'string' 
          ? JSON.parse(template.template_config) 
          : template.template_config
      };
    } catch (error) {
      console.error('❌ [ResumeTemplate] 获取模板失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有模板（包括禁用的）
   * @returns {Promise<Array>} 模板列表
   */
  static async findAll() {
    try {
      const templates = await knex('resume_templates')
        .select('*')
        .orderBy('sort_order', 'asc');

      return templates.map(template => ({
        ...template,
        template_config: typeof template.template_config === 'string' 
          ? JSON.parse(template.template_config) 
          : template.template_config
      }));
    } catch (error) {
      console.error('❌ [ResumeTemplate] 获取所有模板失败:', error);
      throw error;
    }
  }

  /**
   * 创建新模板
   * @param {Object} templateData - 模板数据
   * @returns {Promise<Object>} 创建的模板对象
   */
  static async create(templateData) {
    try {
      const [id] = await knex('resume_templates').insert({
        ...templateData,
        template_config: typeof templateData.template_config === 'object' 
          ? JSON.stringify(templateData.template_config) 
          : templateData.template_config,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }).returning('id');

      return await this.findById(id);
    } catch (error) {
      console.error('❌ [ResumeTemplate] 创建模板失败:', error);
      throw error;
    }
  }

  /**
   * 更新模板
   * @param {number} id - 模板ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的模板对象
   */
  static async update(id, updateData) {
    try {
      const updateObj = {
        ...updateData,
        updated_at: knex.fn.now()
      };

      if (updateData.template_config) {
        updateObj.template_config = typeof updateData.template_config === 'object' 
          ? JSON.stringify(updateData.template_config) 
          : updateData.template_config;
      }

      await knex('resume_templates')
        .where('id', id)
        .update(updateObj);

      return await this.findById(id);
    } catch (error) {
      console.error('❌ [ResumeTemplate] 更新模板失败:', error);
      throw error;
    }
  }

  /**
   * 删除模板
   * @param {number} id - 模板ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    try {
      const result = await knex('resume_templates')
        .where('id', id)
        .del();

      return result > 0;
    } catch (error) {
      console.error('❌ [ResumeTemplate] 删除模板失败:', error);
      throw error;
    }
  }

  /**
   * 获取免费模板
   * @returns {Promise<Array>} 免费模板列表
   */
  static async findFreeTemplates() {
    try {
      const templates = await knex('resume_templates')
        .select('*')
        .where('is_active', true)
        .where('is_premium', false)
        .orderBy('sort_order', 'asc');

      return templates.map(template => ({
        ...template,
        template_config: typeof template.template_config === 'string' 
          ? JSON.parse(template.template_config) 
          : template.template_config
      }));
    } catch (error) {
      console.error('❌ [ResumeTemplate] 获取免费模板失败:', error);
      throw error;
    }
  }

  /**
   * 获取高级模板
   * @returns {Promise<Array>} 高级模板列表
   */
  static async findPremiumTemplates() {
    try {
      const templates = await knex('resume_templates')
        .select('*')
        .where('is_active', true)
        .where('is_premium', true)
        .orderBy('sort_order', 'asc');

      return templates.map(template => ({
        ...template,
        template_config: typeof template.template_config === 'string' 
          ? JSON.parse(template.template_config) 
          : template.template_config
      }));
    } catch (error) {
      console.error('❌ [ResumeTemplate] 获取高级模板失败:', error);
      throw error;
    }
  }

  /**
   * 切换模板状态
   * @param {number} id - 模板ID
   * @returns {Promise<Object|null>} 更新后的模板对象
   */
  static async toggleStatus(id) {
    try {
      const current = await this.findById(id);
      if (!current) {
        return null;
      }

      return await this.update(id, {
        is_active: !current.is_active
      });
    } catch (error) {
      console.error('❌ [ResumeTemplate] 切换模板状态失败:', error);
      throw error;
    }
  }

  /**
   * 更新排序
   * @param {Array} sortData - 排序数据数组 [{id, sort_order}, ...]
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async updateSortOrder(sortData) {
    try {
      const trx = await knex.transaction();
      
      try {
        for (const item of sortData) {
          await trx('resume_templates')
            .where('id', item.id)
            .update({
              sort_order: item.sort_order,
              updated_at: knex.fn.now()
            });
        }
        
        await trx.commit();
        return true;
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('❌ [ResumeTemplate] 更新排序失败:', error);
      throw error;
    }
  }
}

module.exports = ResumeTemplate; 