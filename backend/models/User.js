/**
 * 用户模型
 * 提供用户数据库操作方法
 */

const db = require('../utils/database');

class User {
  /**
   * 根据邮箱查找用户
   * @param {string} email - 用户邮箱
   * @returns {Promise<Object|null>} 用户信息或null
   */
  static async findByEmail(email) {
    try {
      const user = await db('users').where('email', email).first();
      return user || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据ID查找用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object|null>} 用户信息或null
   */
  static async findById(id) {
    try {
      const user = await db('users').where('id', id).first();
      return user || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.email - 用户邮箱
   * @param {string} userData.password_hash - 密码哈希
   * @returns {Promise<Object>} 创建的用户信息
   */
  static async create(userData) {
    try {
      const [user] = await db('users')
        .insert({
          email: userData.email,
          password_hash: userData.password_hash,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning(['id', 'email', 'created_at', 'updated_at']);
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的用户信息
   */
  static async updateById(id, updateData) {
    try {
      const [user] = await db('users')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .returning(['id', 'email', 'created_at', 'updated_at']);
      
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User; 