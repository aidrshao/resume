/**
 * 认证路由
 * 定义用户注册、登录、用户信息相关API路由
 */

const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../utils/auth');

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 获取用户信息 (需要认证)
router.get('/profile', authenticateToken, getProfile);

module.exports = router; 