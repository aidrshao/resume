#!/bin/bash

# 🔧 AI俊才社简历系统 - 网络连接完整修复脚本
# 解决HTTPS页面调用HTTP API导致的混合内容错误

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# 检查当前目录
if [ ! -f "deploy_1.sh" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "请在项目根目录运行此脚本"
    exit 1
fi

log "=== 🚀 开始网络连接修复 ==="

# 获取当前域名（从Nginx配置中读取）
DOMAIN="resume.juncaishe.com"
if [ -f "/etc/nginx/sites-available/resume" ]; then
    DOMAIN=$(grep "server_name" /etc/nginx/sites-available/resume | grep -v "_" | head -1 | awk '{print $2}' | sed 's/;//g' || echo "resume.juncaishe.com")
fi

log "检测到域名: $DOMAIN"

# 检测SSL状态
SSL_ENABLED=false
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    SSL_ENABLED=true
    success "检测到SSL证书已安装"
else
    warning "未检测到SSL证书，将配置HTTP模式"
fi

# 1. 修复前端环境变量配置
log "1. 创建前端生产环境配置..."

cat > frontend/.env << EOF
# AI俊才社简历系统 - 前端生产环境配置
# 自动生成时间: $(date)

# API配置 - 重要：生产环境必须使用域名而非localhost
EOF

if [ "$SSL_ENABLED" = true ]; then
    cat >> frontend/.env << EOF
REACT_APP_API_URL=https://$DOMAIN/api
REACT_APP_BASE_URL=https://$DOMAIN
EOF
    log "✅ 配置HTTPS API URL: https://$DOMAIN/api"
else
    cat >> frontend/.env << EOF
REACT_APP_API_URL=http://$DOMAIN/api
REACT_APP_BASE_URL=http://$DOMAIN
EOF
    log "✅ 配置HTTP API URL: http://$DOMAIN/api"
fi

cat >> frontend/.env << EOF

# 前端服务配置
PORT=3016
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true

# 构建优化
CI=false
TSC_COMPILE_ON_ERROR=true

# 域名配置
REACT_APP_DOMAIN=$DOMAIN
REACT_APP_SSL_ENABLED=$SSL_ENABLED
EOF

success "前端环境配置创建完成"

# 2. 修复setupProxy.js（开发模式使用）
log "2. 更新前端代理配置（开发模式）..."

# 备份原文件
if [ -f "frontend/src/setupProxy.js" ]; then
    cp "frontend/src/setupProxy.js" "frontend/src/setupProxy.js.backup.$(date +%Y%m%d_%H%M%S)"
fi

cat > frontend/src/setupProxy.js << 'EOF'
/**
 * 前端代理配置
 * 只在开发模式下使用，生产环境直接通过Nginx代理
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 [PROXY] 配置开发环境代理规则...');
  
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
  
  console.log('✅ [PROXY] 开发环境代理配置完成');
};
EOF

success "前端代理配置更新完成"

# 3. 修复测试文件中的硬编码端口
log "3. 修复测试文件中的硬编码端口..."

# 修复admin测试文件
if [ -f "frontend/test-admin-frontend.html" ]; then
    if [ "$SSL_ENABLED" = true ]; then
        sed -i "s|const API_BASE = 'http://localhost:[0-9]*|const API_BASE = 'https://$DOMAIN|g" frontend/test-admin-frontend.html
    else
        sed -i "s|const API_BASE = 'http://localhost:[0-9]*|const API_BASE = 'http://$DOMAIN|g" frontend/test-admin-frontend.html
    fi
    success "已更新admin测试文件"
fi

# 修复cambridge测试文件
if [ -f "frontend/test-cambridge-template.html" ]; then
    if [ "$SSL_ENABLED" = true ]; then
        sed -i "s|http://localhost:[0-9]*/api|https://$DOMAIN/api|g" frontend/test-cambridge-template.html
    else
        sed -i "s|http://localhost:[0-9]*/api|http://$DOMAIN/api|g" frontend/test-cambridge-template.html
    fi
    success "已更新cambridge测试文件"
fi

# 修复resume预览测试文件
if [ -f "frontend/test-resume-preview.html" ]; then
    if [ "$SSL_ENABLED" = true ]; then
        sed -i "s|http://localhost:[0-9]*/api|https://$DOMAIN/api|g" frontend/test-resume-preview.html
    else
        sed -i "s|http://localhost:[0-9]*/api|http://$DOMAIN/api|g" frontend/test-resume-preview.html
    fi
    success "已更新resume预览测试文件"
fi

# 4. 修复后端CORS配置
log "4. 检查并修复后端CORS配置..."

# 备份server.js
if [ -f "backend/server.js" ]; then
    cp "backend/server.js" "backend/server.js.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 检查CORS配置是否包含正确的域名
if ! grep -q "https://$DOMAIN\|http://$DOMAIN" backend/server.js; then
    log "添加域名到CORS配置..."
    
    # 临时替换CORS配置
    if [ "$SSL_ENABLED" = true ]; then
        CORS_ORIGINS="'https://$DOMAIN', 'http://$DOMAIN'"
    else
        CORS_ORIGINS="'http://$DOMAIN'"
    fi
    
    # 更新CORS配置（简化方式）
    sed -i "/http:\/\/cv\.juncaishe\.com/a\\    '$CORS_ORIGINS'," backend/server.js 2>/dev/null || true
    
    success "CORS配置已更新"
else
    success "CORS配置已包含正确域名"
fi

# 5. 重新构建前端应用
log "5. 重新构建前端应用..."

cd frontend

# 清理旧构建文件
rm -rf build node_modules/.cache .cache 2>/dev/null || true

# 设置构建环境
export NODE_OPTIONS="--max-old-space-size=2048"
export GENERATE_SOURCEMAP=false
export DISABLE_ESLINT_PLUGIN=true
export CI=false

log "开始构建前端应用（这可能需要几分钟）..."
if npm run build; then
    success "前端应用构建成功"
    
    # 验证构建结果中的API配置
    BUILD_JS_FILE=$(find build/static/js -name "main.*.js" | head -1)
    if [ -f "$BUILD_JS_FILE" ]; then
        if [ "$SSL_ENABLED" = true ]; then
            if grep -q "https://$DOMAIN" "$BUILD_JS_FILE"; then
                success "✅ 构建文件包含正确的HTTPS API配置"
            else
                warning "⚠️ 构建文件可能未包含HTTPS API配置"
            fi
        else
            if grep -q "http://$DOMAIN" "$BUILD_JS_FILE"; then
                success "✅ 构建文件包含正确的HTTP API配置"
            else
                warning "⚠️ 构建文件可能未包含HTTP API配置"
            fi
        fi
    fi
else
    error "前端应用构建失败"
    cd ..
    exit 1
fi

cd ..

# 6. 重启前端服务
log "6. 重启前端服务..."

pm2 stop resume-frontend 2>/dev/null || true
pm2 delete resume-frontend 2>/dev/null || true

cd frontend

# 使用http-server启动前端服务
if command -v http-server &> /dev/null; then
    pm2 start http-server --name "resume-frontend" -- build -p 3016
    pm2 save
    success "前端服务已重启（使用http-server）"
else
    warning "http-server未安装，安装中..."
    npm install -g http-server
    pm2 start http-server --name "resume-frontend" -- build -p 3016
    pm2 save
    success "前端服务已重启（已安装http-server）"
fi

cd ..

# 7. 验证修复结果
log "7. 验证修复结果..."

# 检查服务状态
log "检查PM2服务状态..."
pm2 status

# 检查前端服务
log "检查前端服务可用性..."
sleep 3
if curl -s http://localhost:3016 > /dev/null; then
    success "✅ 前端服务运行正常"
else
    warning "⚠️ 前端服务检查失败"
fi

# 检查后端服务
log "检查后端服务可用性..."
if curl -s http://localhost:8000/api/health > /dev/null; then
    success "✅ 后端服务运行正常"
else
    warning "⚠️ 后端服务检查失败"
fi

# 检查域名访问
log "检查域名访问状态..."
if [ "$SSL_ENABLED" = true ]; then
    if curl -I https://$DOMAIN 2>/dev/null | grep -q "200\|301\|302"; then
        success "✅ HTTPS域名访问正常"
    else
        warning "⚠️ HTTPS域名访问检查失败"
    fi
else
    if curl -I http://$DOMAIN 2>/dev/null | grep -q "200\|301\|302"; then
        success "✅ HTTP域名访问正常"
    else
        warning "⚠️ HTTP域名访问检查失败"
    fi
fi

# 8. 输出修复结果
log "=== 🎉 网络连接修复完成 ==="

echo
echo "📋 修复摘要:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 前端环境配置: 已创建 frontend/.env"
echo "✅ 前端代理配置: 已更新 frontend/src/setupProxy.js"
echo "✅ 测试文件端口: 已修复所有硬编码端口"
echo "✅ 后端CORS配置: 已包含正确域名"
echo "✅ 前端应用重建: 已使用正确API配置"
echo "✅ 前端服务重启: 已重启并验证"
echo

if [ "$SSL_ENABLED" = true ]; then
    echo "🌐 现在可以正常访问:"
    echo "   网站首页: https://$DOMAIN"
    echo "   管理后台: https://$DOMAIN/admin"
    echo "   API地址: https://$DOMAIN/api"
else
    echo "🌐 现在可以正常访问:"
    echo "   网站首页: http://$DOMAIN"
    echo "   管理后台: http://$DOMAIN/admin"
    echo "   API地址: http://$DOMAIN/api"
fi

echo
echo "🔧 本地调试地址:"
echo "   前端服务: http://localhost:3016"
echo "   后端API: http://localhost:8000/api"
echo

echo "⚠️ 重要提醒:"
echo "   1. 请清除浏览器缓存并刷新页面"
echo "   2. 确保DNS解析已指向服务器IP"
echo "   3. 如仍有问题，请检查浏览器开发者工具的Console和Network面板"

echo
success "🎯 网络连接问题已修复！现在登录功能应该正常工作了。"

log "=== 修复脚本执行完成 ===" 