/**
 * Express服务器主文件
 * 启动服务器，配置中间件和路由
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resumeRoutes');

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

// 健康检查端点（必须在所有路由之前，避免被认证中间件拦截）
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api', resumeRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('全局错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 