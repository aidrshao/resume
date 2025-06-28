/**
 * 邮箱验证模型
 * 提供验证码相关的数据库操作方法
 */

const db = require('../utils/database');

class EmailVerification {
  /**
   * 创建验证码记录
   * @param {Object} data - 验证码数据
   * @param {string} data.email - 邮箱地址
   * @param {string} data.code - 验证码
   * @param {string} data.type - 验证码类型 ('register', 'login', 'reset_password')
   * @param {Date} data.expires_at - 过期时间
   * @returns {Promise<Object>} 创建的验证码记录
   */
  static async create(data) {
    try {
      const [verification] = await db('email_verifications')
        .insert({
          email: data.email,
          code: data.code,
          type: data.type,
          expires_at: data.expires_at,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning(['id', 'email', 'code', 'type', 'expires_at', 'created_at']);
      
      return verification;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 验证验证码
   * @param {string} email - 邮箱地址
   * @param {string} code - 验证码
   * @param {string} type - 验证码类型
   * @returns {Promise<Object|null>} 验证码记录或null
   */
  static async verify(email, code, type) {
    try {
      const verification = await db('email_verifications')
        .where('email', email)
        .where('code', code)
        .where('type', type)
        .where('is_used', false)
        .where('expires_at', '>', new Date())
        .first();
      
      return verification || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 标记验证码为已使用
   * @param {number} id - 验证码记录ID
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async markAsUsed(id) {
    try {
      const affectedRows = await db('email_verifications')
        .where('id', id)
        .update({
          is_used: true,
          updated_at: new Date()
        });
      
      return affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 清理过期的验证码记录
   * @returns {Promise<number>} 清理的记录数
   */
  static async cleanExpired() {
    try {
      const deletedCount = await db('email_verifications')
        .where('expires_at', '<', new Date())
        .del();
      
      return deletedCount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取邮箱最近的验证码记录（用于防止频繁发送）
   * @param {string} email - 邮箱地址
   * @param {string} type - 验证码类型
   * @param {number} minutes - 时间范围（分钟）
   * @returns {Promise<Object|null>} 最近的验证码记录或null
   */
  static async getRecentCode(email, type, minutes = 1) {
    try {
      const recentTime = new Date(Date.now() - minutes * 60 * 1000);
      
      const verification = await db('email_verifications')
        .where('email', email)
        .where('type', type)
        .where('created_at', '>', recentTime)
        .orderBy('created_at', 'desc')
        .first();
      
      return verification || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 删除邮箱的旧验证码（发送新验证码前清理）
   * @param {string} email - 邮箱地址
   * @param {string} type - 验证码类型
   * @returns {Promise<number>} 删除的记录数
   */
  static async deleteOldCodes(email, type) {
    try {
      const deletedCount = await db('email_verifications')
        .where('email', email)
        .where('type', type)
        .where('is_used', false)
        .del();
      
      return deletedCount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = EmailVerification; 