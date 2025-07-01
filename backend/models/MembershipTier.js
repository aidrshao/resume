/**
 * 会员套餐模型
 * 管理会员套餐的增删改查操作
 */

const knex = require('../config/database');

class MembershipTier {
  /**
   * 获取所有会员套餐
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.limit - 每页条数
   * @param {boolean} options.activeOnly - 是否只返回启用的套餐
   * @returns {Promise<Object>} 套餐列表和分页信息
   */
  static async findAll(options = {}) {
    const { page = 1, limit = 10, activeOnly = false } = options;
    const offset = (page - 1) * limit;

    let query = knex('membership_tiers');
    
    if (activeOnly) {
      query = query.where('is_active', true);
    }

    // 获取总数
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count);

    // 获取数据
    const tiers = await query
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: tiers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 根据ID获取会员套餐
   * @param {number} id - 套餐ID
   * @returns {Promise<Object|null>} 套餐信息
   */
  static async findById(id) {
    return await knex('membership_tiers')
      .where('id', id)
      .first();
  }

  /**
   * 创建新的会员套餐
   * @param {Object} tierData - 套餐数据
   * @returns {Promise<Object>} 创建的套餐信息
   */
  static async create(tierData) {
    const [tier] = await knex('membership_tiers')
      .insert({
        name: tierData.name,
        description: tierData.description,
        original_price: tierData.original_price,
        reduction_price: tierData.reduction_price,
        duration_days: tierData.duration_days,
        ai_resume_quota: tierData.ai_resume_quota,
        template_access_level: tierData.template_access_level,
        is_active: tierData.is_active !== undefined ? tierData.is_active : true,
        sort_order: tierData.sort_order || 0,
        features: tierData.features ? JSON.stringify(tierData.features) : null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*');

    return tier;
  }

  /**
   * 更新会员套餐
   * @param {number} id - 套餐ID
   * @param {Object} tierData - 更新数据
   * @returns {Promise<Object>} 更新后的套餐信息
   */
  static async update(id, tierData) {
    const updateData = {
      updated_at: knex.fn.now()
    };

    // 只更新提供的字段
    if (tierData.name !== undefined) updateData.name = tierData.name;
    if (tierData.description !== undefined) updateData.description = tierData.description;
    if (tierData.original_price !== undefined) updateData.original_price = tierData.original_price;
    if (tierData.reduction_price !== undefined) updateData.reduction_price = tierData.reduction_price;
    if (tierData.duration_days !== undefined) updateData.duration_days = tierData.duration_days;
    if (tierData.ai_resume_quota !== undefined) updateData.ai_resume_quota = tierData.ai_resume_quota;
    if (tierData.template_access_level !== undefined) updateData.template_access_level = tierData.template_access_level;
    if (tierData.is_active !== undefined) updateData.is_active = tierData.is_active;
    if (tierData.sort_order !== undefined) updateData.sort_order = tierData.sort_order;
    if (tierData.features !== undefined) updateData.features = JSON.stringify(tierData.features);

    const [tier] = await knex('membership_tiers')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return tier;
  }

  /**
   * 删除会员套餐
   * @param {number} id - 套餐ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    // 检查是否有用户正在使用此套餐
    const usageCount = await knex('user_memberships')
      .where('membership_tier_id', id)
      .whereIn('status', ['active', 'pending'])
      .count('* as count')
      .first();

    if (parseInt(usageCount.count) > 0) {
      throw new Error('无法删除正在使用中的会员套餐');
    }

    const deleted = await knex('membership_tiers')
      .where('id', id)
      .del();

    return deleted > 0;
  }

  /**
   * 切换套餐启用状态
   * @param {number} id - 套餐ID
   * @returns {Promise<Object>} 更新后的套餐信息
   */
  static async toggleActive(id) {
    const tier = await this.findById(id);
    if (!tier) {
      throw new Error('套餐不存在');
    }

    return await this.update(id, { is_active: !tier.is_active });
  }

  /**
   * 获取有效的会员套餐（按排序）
   * @returns {Promise<Array>} 套餐列表
   */
  static async getActiveTiers() {
    return await knex('membership_tiers')
      .where('is_active', true)
      .orderBy('sort_order', 'asc')
      .orderBy('original_price', 'asc');
  }

  /**
   * 批量更新排序
   * @param {Array} sortData - 排序数据 [{id, sort_order}]
   * @returns {Promise<boolean>} 是否成功
   */
  static async updateSortOrder(sortData) {
    const trx = await knex.transaction();
    
    try {
      for (const item of sortData) {
        await trx('membership_tiers')
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
  }
}

module.exports = MembershipTier; 