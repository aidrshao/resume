/**
 * JWT认证中间件
 * 验证用户身份和权限
 */

const jwt = require('jsonwebtoken');
const authUtils = require('../utils/auth');

/**
 * 验证JWT Token的中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失'
    });
  }

  try {
    const decoded = authUtils.verifyToken(token);
    // 确保用户对象格式正确
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      ...decoded
    };
    console.log('🔑 [AUTH] Token验证成功，用户ID:', req.user.id);
    next();
  } catch (error) {
    console.error('❌ [AUTH] Token验证失败:', error);
    return res.status(403).json({
      success: false,
      message: '访问令牌无效'
    });
  }
};

/**
 * 可选的JWT验证中间件
 * 如果有token则验证，没有token也继续执行
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = authUtils.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      console.error('可选Token验证失败:', error);
      // 不返回错误，继续执行
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
}; 