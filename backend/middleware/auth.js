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
  console.log('🔐 [AUTH_MIDDLEWARE] ==> 开始Token验证');
  console.log('🔐 [AUTH_MIDDLEWARE] 请求ID:', req.requestId);
  console.log('🔐 [AUTH_MIDDLEWARE] 请求路径:', req.method, req.path);
  console.log('🔐 [AUTH_MIDDLEWARE] 完整URL:', req.originalUrl);
  console.log('🔐 [AUTH_MIDDLEWARE] 请求来源:', req.headers['user-agent'] || '未知');
  console.log('🔐 [AUTH_MIDDLEWARE] 请求IP:', req.ip || req.connection.remoteAddress);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  console.log('🔐 [AUTH_MIDDLEWARE] 认证头:', authHeader ? 'Bearer ***' : '无');
  console.log('🔐 [AUTH_MIDDLEWARE] Token长度:', token ? token.length : 0);
  console.log('🔐 [AUTH_MIDDLEWARE] Token前缀:', token ? token.substring(0, 20) + '...' : '无');

  if (!token) {
    console.error('❌ [AUTH_MIDDLEWARE] Token缺失');
    console.error('❌ [AUTH_MIDDLEWARE] 请求ID:', req.requestId);
    console.error('❌ [AUTH_MIDDLEWARE] 认证失败原因: 无Authorization头或格式不正确');
    
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失',
      error_code: 'TOKEN_MISSING',
      request_id: req.requestId,
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('🔐 [AUTH_MIDDLEWARE] 开始验证Token...');
    const decoded = authUtils.verifyToken(token);
    
    // 确保用户对象格式正确
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      ...decoded
    };
    
    console.log('✅ [AUTH_MIDDLEWARE] Token验证成功，用户ID:', req.user.id);
    console.log('✅ [AUTH_MIDDLEWARE] Token信息:', {
      userId: decoded.userId,
      exp: new Date(decoded.exp * 1000).toISOString(),
      iat: new Date(decoded.iat * 1000).toISOString()
    });
    
    next();
  } catch (error) {
    console.error('❌ [AUTH_MIDDLEWARE] ==> Token验证失败');
    console.error('❌ [AUTH_MIDDLEWARE] 请求ID:', req.requestId);
    console.error('❌ [AUTH_MIDDLEWARE] 错误类型:', error.name);
    console.error('❌ [AUTH_MIDDLEWARE] 错误消息:', error.message);
    console.error('❌ [AUTH_MIDDLEWARE] Token前缀:', token ? token.substring(0, 20) + '...' : '无');
    console.error('❌ [AUTH_MIDDLEWARE] 错误详情:', error);
    
    // 根据错误类型返回更具体的错误信息
    let errorMessage = '访问令牌无效';
    let errorCode = 'TOKEN_INVALID';
    
    if (error.name === 'TokenExpiredError') {
      errorMessage = '访问令牌已过期，请重新登录';
      errorCode = 'TOKEN_EXPIRED';
      console.error('❌ [AUTH_MIDDLEWARE] Token过期时间:', new Date(error.expiredAt).toISOString());
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = '访问令牌格式无效';
      errorCode = 'TOKEN_MALFORMED';
    }
    
    console.error('❌ [AUTH_MIDDLEWARE] 最终错误代码:', errorCode);
    console.error('❌ [AUTH_MIDDLEWARE] 最终错误消息:', errorMessage);
    
    return res.status(401).json({
      success: false,
      message: errorMessage,
      error_code: errorCode,
      request_id: req.requestId,
      timestamp: new Date().toISOString()
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
  verifyToken: authenticateToken, // 别名，保持兼容性
  optionalAuth
}; 