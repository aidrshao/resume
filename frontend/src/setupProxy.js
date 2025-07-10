/**
 * 前端代理配置
 * 只代理API请求到后端，保持前端路由正常工作
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 [PROXY] 配置前端代理规则...');
  
  // 只代理 /api 路径到后端
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      logLevel: 'info',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 [PROXY] 代理请求:', req.method, req.path, '-> http://localhost:8000');
      },
      onError: (err, req, res) => {
        console.error('❌ [PROXY] 代理错误:', err.message);
        console.error('❌ [PROXY] 请求路径:', req.method, req.path);
        console.error('❌ [PROXY] 请确保后端服务运行在 http://localhost:8000');
      }
    })
  );
  
  console.log('✅ [PROXY] 代理配置完成 - 只有 /api/* 请求会被代理到后端');
}; 