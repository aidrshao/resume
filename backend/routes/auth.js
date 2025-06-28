/**
 * 认证路由
 * 定义用户注册、登录、邮箱验证相关API路由
 */

const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  loginWithCode,
  resetPassword,
  sendVerificationCode,
  verifyEmailCode,
  getProfile,
  testEmailService
} = require('../controllers/authController');
const { authenticateToken } = require('../utils/auth');

// ========== 验证码相关API ==========

// 发送验证码
router.post('/send-code', sendVerificationCode);

// 验证邮箱验证码
router.post('/verify-code', verifyEmailCode);

// ========== 注册登录相关API ==========

// 用户注册（需要邮箱验证码）
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 邮箱验证码登录
router.post('/login-with-code', loginWithCode);

// ========== 密码重置API ==========

// 重置密码
router.post('/reset-password', resetPassword);

// ========== 用户信息API ==========

// 获取用户信息 (需要认证)
router.get('/profile', authenticateToken, getProfile);

// ========== 测试API ==========

// 测试邮件服务（开发环境使用）
if (process.env.NODE_ENV === 'development') {
  router.post('/test-email', testEmailService);
}

module.exports = router; 