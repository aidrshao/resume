/**
 * TopUpPackService
 * ------------------
 * 负责 "加油包" (top_up_packs) 表的 CRUD 操作
 */

const { db: knex } = require('../config/database');

class TopUpPackService {
  constructor() {
    this.tableName = 'top_up_packs';
  }

  /**
   * 获取所有加油包
   */
  async getAll(options = {}) {
    const { status, page = 1, limit = 20, orderBy = 'sort_order' } = options;
    let query = knex(this.tableName).select('*');
    if (status) query = query.where({ status });
    query = query.orderBy(orderBy, 'asc').orderBy('id', 'asc');
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);
    return await query;
  }

  /**
   * 根据ID获取加油包
   */
  async getById(id) {
    return await knex(this.tableName).where({ id }).first();
  }

  /**
   * 创建加油包
   */
  async create(data) {
    const [inserted] = await knex(this.tableName)
      .insert({
        ...data,
        features: data.features || {},
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning('*');
    return inserted;
  }

  /**
   * 更新加油包
   */
  async update(id, data) {
    await knex(this.tableName).where({ id }).update({
      ...data,
      updated_at: knex.fn.now(),
    });
    return await this.getById(id);
  }

  /**
   * 删除加油包
   */
  async delete(id) {
    return await knex(this.tableName).where({ id }).del();
  }
}

module.exports = new TopUpPackService(); 