/**
 * JWT认证工具
 * 提供JWT生成和验证功能
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT密钥（与server.js保持一致）
const JWT_SECRET = process.env.JWT_SECRET || 'resume_app_jwt_secret_2024_very_secure_key_change_in_production';

/**
 * 生成JWT token
 * @param {Object} payload - 载荷数据
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * 验证JWT token
 * @param {string} token - JWT token
 * @returns {Object} 解码后的payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * JWT认证中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(403).json({
        success: false,
        message: '无效的认证令牌'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: '无效的认证令牌'
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken
}; 