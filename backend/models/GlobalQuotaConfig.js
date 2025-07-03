/**
 * 全局配额配置模型
 * 管理系统级别的配额配置，替代硬编码的配额分配
 */

const knex = require('../config/database');

class GlobalQuotaConfig {
  
  /**
   * 获取所有配额配置
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 配额配置列表
   */
  static async getAllConfigs(options = {}) {
    try {
      const { category, isActive = true } = options;
      
      let query = knex('global_quota_configs');
      
      if (category) {
        query = query.where('category', category);
      }
      
      if (isActive !== null) {
        query = query.where('is_active', isActive);
      }
      
      return await query.orderBy('sort_order', 'asc');
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据配置键获取配额配置
   * @param {string} configKey - 配置键名
   * @returns {Promise<Object|null>} 配额配置
   */
  static async getByKey(configKey) {
    try {
      return await knex('global_quota_configs')
        .where('config_key', configKey)
        .where('is_active', true)
        .first();
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据配额类型获取配额配置
   * @param {string} quotaType - 配额类型
   * @param {string} category - 配置分类（可选）
   * @returns {Promise<Array>} 配额配置列表
   */
  static async getByQuotaType(quotaType, category = null) {
    try {
      let query = knex('global_quota_configs')
        .where('quota_type', quotaType)
        .where('is_active', true);
      
      if (category) {
        query = query.where('category', category);
      }
      
      return await query.orderBy('sort_order', 'asc');
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取新用户注册的默认配额配置
   * @returns {Promise<Array>} 新用户配额配置列表
   */
  static async getNewUserQuotaConfigs() {
    try {
      return await knex('global_quota_configs')
        .where('category', 'user_registration')
        .where('is_active', true)
        .orderBy('sort_order', 'asc');
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取会员级别的配额配置
   * @param {string} membershipLevel - 会员级别 (free_tier, premium_tier)
   * @returns {Promise<Array>} 会员配额配置列表
   */
  static async getMembershipQuotaConfigs(membershipLevel = 'free_tier') {
    try {
      const category = membershipLevel === 'premium_tier' ? 'premium_membership' : 'user_registration';
      
      return await knex('global_quota_configs')
        .where('category', category)
        .where('is_active', true)
        .orderBy('sort_order', 'asc');
    } catch (error) {
      throw error;
    }
  }

  /**
   * 创建配额配置
   * @param {Object} configData - 配额配置数据
   * @returns {Promise<Object>} 创建的配额配置
   */
  static async create(configData) {
    try {
      const [config] = await knex('global_quota_configs')
        .insert({
          config_key: configData.config_key,
          config_name: configData.config_name,
          description: configData.description,
          quota_type: configData.quota_type,
          default_quota: configData.default_quota,
          reset_cycle: configData.reset_cycle || 'monthly',
          category: configData.category || 'user_registration',
          is_active: configData.is_active !== undefined ? configData.is_active : true,
          sort_order: configData.sort_order || 0,
          extra_config: configData.extra_config ? JSON.stringify(configData.extra_config) : null,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        })
        .returning('*');

      return config;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新配额配置
   * @param {number} id - 配额配置ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的配额配置
   */
  static async update(id, updateData) {
    try {
      const updateFields = {
        updated_at: knex.fn.now()
      };

      // 只更新提供的字段
      const allowedFields = [
        'config_name', 'description', 'default_quota', 'reset_cycle',
        'category', 'is_active', 'sort_order', 'extra_config'
      ];

      allowedFields.forEach(field => {
        if (updateData.hasOwnProperty(field)) {
          if (field === 'extra_config' && updateData[field]) {
            updateFields[field] = JSON.stringify(updateData[field]);
          } else {
            updateFields[field] = updateData[field];
          }
        }
      });

      const [config] = await knex('global_quota_configs')
        .where('id', id)
        .update(updateFields)
        .returning('*');

      return config;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 删除配额配置
   * @param {number} id - 配额配置ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    try {
      const deletedCount = await knex('global_quota_configs')
        .where('id', id)
        .del();

      return deletedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据ID获取配额配置
   * @param {number} id - 配额配置ID
   * @returns {Promise<Object|null>} 配额配置
   */
  static async findById(id) {
    try {
      return await knex('global_quota_configs')
        .where('id', id)
        .first();
    } catch (error) {
      throw error;
    }
  }

  /**
   * 切换配额配置的启用状态
   * @param {number} id - 配额配置ID
   * @param {boolean} isActive - 是否启用
   * @returns {Promise<Object>} 更新后的配额配置
   */
  static async toggleActive(id, isActive) {
    try {
      const [config] = await knex('global_quota_configs')
        .where('id', id)
        .update({
          is_active: isActive,
          updated_at: knex.fn.now()
        })
        .returning('*');

      return config;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取配置统计信息
   * @returns {Promise<Object>} 统计信息
   */
  static async getStatistics() {
    try {
      const totalConfigs = await knex('global_quota_configs').count('* as count').first();
      const activeConfigs = await knex('global_quota_configs').where('is_active', true).count('* as count').first();
      const inactiveConfigs = await knex('global_quota_configs').where('is_active', false).count('* as count').first();
      const categories = await knex('global_quota_configs').distinct('category').select('category');

      return {
        total: parseInt(totalConfigs.count),
        active: parseInt(activeConfigs.count),
        inactive: parseInt(inactiveConfigs.count),
        categories: categories.length
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 批量更新配额配置
   * @param {Array} configUpdates - 配额配置更新列表
   * @returns {Promise<Array>} 更新结果
   */
  static async batchUpdate(configUpdates) {
    const trx = await knex.transaction();
    
    try {
      const results = [];
      
      for (const update of configUpdates) {
        const { id, ...updateData } = update;
        
        const [config] = await trx('global_quota_configs')
          .where('id', id)
          .update({
            ...updateData,
            updated_at: knex.fn.now()
          })
          .returning('*');
          
        results.push(config);
      }
      
      await trx.commit();
      return results;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * 格式化配额配置用于前端显示
   * @param {Object} config - 配额配置
   * @returns {Object} 格式化后的配额配置
   */
  static formatForDisplay(config) {
    return {
      ...config,
      extra_config: typeof config.extra_config === 'string' 
        ? JSON.parse(config.extra_config) 
        : config.extra_config,
      reset_cycle_display: this.getResetCycleDisplayName(config.reset_cycle),
      formatted_quota: `${config.default_quota} 次/${this.getResetCycleDisplayName(config.reset_cycle)}`
    };
  }

  /**
   * 获取重置周期的显示名称
   * @param {string} resetCycle - 重置周期
   * @returns {string} 显示名称
   */
  static getResetCycleDisplayName(resetCycle) {
    const displayNames = {
      'daily': '天',
      'weekly': '周',
      'monthly': '月',
      'yearly': '年',
      'never': '永久'
    };
    
    return displayNames[resetCycle] || resetCycle;
  }
}

module.exports = GlobalQuotaConfig; 