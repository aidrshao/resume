/**
 * JWT认证工具
 * 提供JWT生成和验证功能
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 生成JWT token
 * @param {Object} payload - 载荷数据
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
  authenticateToken
}; 