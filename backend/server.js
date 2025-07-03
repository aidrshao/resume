/**
 * Express服务器主文件
 * 启动服务器，配置中间件和路由
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resumeRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const resumeRenderRoutes = require('./routes/resumeRenderRoutes');
const templateRoutes = require('./routes/templateRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// 中间件配置
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3016',
    'http://localhost:3017',
    'http://cv.juncaishe.com',
    'https://cv.juncaishe.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  console.log('🌐 [SERVER] ==> 收到新请求');
  console.log('🌐 [SERVER] 请求ID:', requestId);
  console.log('🌐 [SERVER] 时间:', new Date().toISOString());
  console.log('🌐 [SERVER] 方法:', req.method);
  console.log('🌐 [SERVER] URL:', req.url);
  console.log('🌐 [SERVER] IP:', req.ip || req.connection.remoteAddress);
  console.log('🌐 [SERVER] User-Agent:', req.get('User-Agent'));
  console.log('🌐 [SERVER] Content-Type:', req.get('Content-Type'));
  console.log('🌐 [SERVER] Content-Length:', req.get('Content-Length'));
  console.log('🌐 [SERVER] Authorization:', req.get('Authorization') ? 'Bearer ***' : '无');
  
  // 保存请求ID到req对象
  req.requestId = requestId;
  
  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log('🌐 [SERVER] <== 请求完成');
    console.log('🌐 [SERVER] 请求ID:', requestId);
    console.log('🌐 [SERVER] 状态码:', res.statusCode);
    console.log('🌐 [SERVER] 耗时:', duration + 'ms');
    console.log('🌐 [SERVER] ----------------------------------------');
  });
  
  next();
});

// 静态文件服务
app.use(express.static(__dirname));

// 健康检查端点（必须在所有路由之前，避免被认证中间件拦截）
app.get('/health', (req, res) => {
  console.log('💓 [HEALTH] 健康检查请求');
  console.log('💓 [HEALTH] 请求ID:', req.requestId);
  console.log('💓 [HEALTH] 服务器状态: 正常');
  
  const healthResponse = {
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    server_port: process.env.PORT || 8000,
    node_env: process.env.NODE_ENV || 'development',
    request_id: req.requestId
  };
  
  console.log('💓 [HEALTH] 响应数据:', JSON.stringify(healthResponse, null, 2));
  
  res.json(healthResponse);
});

// Token生成端点（调试用）
app.post('/generate-token', (req, res) => {
  const jwt = require('jsonwebtoken');
  
  console.log('🔐 [TOKEN_GEN] Token生成请求');
  console.log('🔐 [TOKEN_GEN] 请求ID:', req.requestId);
  console.log('🔐 [TOKEN_GEN] 请求数据:', req.body);
  
  try {
    const { userId = 2, email = 'user@example.com' } = req.body;
    
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'resume_app_jwt_secret_2024_very_secure_key_change_in_production',
      { expiresIn: '7d' }
    );
    
    console.log('🔐 [TOKEN_GEN] Token生成成功');
    console.log('🔐 [TOKEN_GEN] 用户ID:', userId);
    console.log('🔐 [TOKEN_GEN] 邮箱:', email);
    console.log('🔐 [TOKEN_GEN] Token长度:', token.length);
    
    res.json({
      success: true,
      token: token,
      message: 'Token生成成功',
      expires_in: '7天',
      user: { userId, email },
      request_id: req.requestId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔐 [TOKEN_GEN] Token生成失败:', error.message);
    res.status(500).json({
      success: false,
      message: 'Token生成失败',
      error: error.message,
      request_id: req.requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// 健康检查路由（在所有其他路由之前）
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 路由配置
app.use('/api/logs', logRoutes);  // 日志路由（无需认证）
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);  // 管理员路由需要在通用路由之前
app.use('/api/memberships', membershipRoutes);  // 会员路由
app.use('/api/resume-render', resumeRenderRoutes);  // 简历渲染路由
app.use('/api/templates', templateRoutes);  // 模板管理路由
app.use('/api/jobs', jobRoutes);
app.use('/api', resumeRoutes);  // 简历路由，包含 /resumes 前缀

// 404处理
app.use('*', (req, res) => {
  console.log('❌ [404] 接口不存在');
  console.log('❌ [404] 请求ID:', req.requestId);
  console.log('❌ [404] 方法:', req.method);
  console.log('❌ [404] URL:', req.originalUrl);
  console.log('❌ [404] IP:', req.ip || req.connection.remoteAddress);
  
  res.status(404).json({
    success: false,
    message: '接口不存在',
    request_id: req.requestId,
    requested_url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('💥 [ERROR] ==> 全局错误处理器捕获错误');
  console.error('💥 [ERROR] 请求ID:', req.requestId);
  console.error('💥 [ERROR] 错误名称:', error.name);
  console.error('💥 [ERROR] 错误消息:', error.message);
  console.error('💥 [ERROR] 错误堆栈:', error.stack);
  console.error('💥 [ERROR] 请求URL:', req.originalUrl);
  console.error('💥 [ERROR] 请求方法:', req.method);
  
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error_code: 'INTERNAL_SERVER_ERROR',
    request_id: req.requestId,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 