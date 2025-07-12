/**
 * JWT认证中间件
 * 验证用户身份和权限
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'resume_app_jwt_secret_2024_very_secure_key_change_in_production';

/**
 * JWT认证中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - next中间件
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '认证失败：未提供令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 增加用户状态检查，确保用户是'active'
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ success: false, message: '认证失败：用户状态异常或已停用', error_code: 'USER_INACTIVE' });
    }

    // 统一用户ID字段，确保兼容性
    req.user = {
      ...decoded,
      id: decoded.userId,  // 为了兼容使用req.user.id的控制器
      userId: decoded.userId  // 为了兼容使用req.user.userId的控制器
    };
    
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: '认证失败：令牌无效或已过期', error_code: 'TOKEN_INVALID' });
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
      const decoded = jwt.verify(token, JWT_SECRET);
      // 统一用户ID字段，确保兼容性
      req.user = {
        ...decoded,
        id: decoded.userId,
        userId: decoded.userId
      };
    } catch (error) {
      console.error('可选Token验证失败:', error);
      // 不返回错误，继续执行
    }
  }

  next();
};

const verifyToken = authenticateToken;
module.exports = { authenticateToken, verifyToken, optionalAuth }; 