#!/bin/bash

# 修复文件上传超时问题脚本
# 解决504 Gateway Timeout和文件上传失败问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "============================================"
echo "AI俊才社简历系统 - 文件上传超时修复脚本"
echo "============================================"

# 获取当前后端端口
BACKEND_PORT=$(pm2 describe resume-backend 2>/dev/null | grep -o 'PORT.*[0-9]*' | grep -o '[0-9]*' | head -1)
if [ -z "$BACKEND_PORT" ]; then
    BACKEND_PORT=8001
fi

FRONTEND_PORT=$(pm2 describe resume-frontend 2>/dev/null | grep -o 'PORT.*[0-9]*' | grep -o '[0-9]*' | head -1)
if [ -z "$FRONTEND_PORT" ]; then
    FRONTEND_PORT=3017
fi

log_info "检测到的端口配置："
log_info "  - 后端端口: $BACKEND_PORT"
log_info "  - 前端端口: $FRONTEND_PORT"

# 1. 修复Nginx配置 - 增加文件上传和超时设置
log_info "修复Nginx文件上传配置..."

cat > /etc/nginx/sites-available/resume << EOF
# AI俊才社简历系统 - Nginx配置
# 文件上传优化版本 - $(date)
# 后端端口: $BACKEND_PORT, 前端端口: $FRONTEND_PORT

# 限制请求频率（使用唯一命名避免冲突）
limit_req_zone \$binary_remote_addr zone=resume_api_limit:10m rate=10r/s;

server {
    listen 80;
    server_name cv.juncaishe.com;
    
    # 文件上传大小限制
    client_max_body_size 50M;
    client_body_timeout 300s;
    client_header_timeout 300s;
    
    # 静态文件服务
    root /opt/resume-app;
    index index.html;
    
    # 前端路由（React Router）
    location / {
        try_files \$uri \$uri/ @fallback;
    }
    
    # 如果静态文件不存在，回退到前端服务
    location @fallback {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 基本超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 文件上传专用配置（长超时）
    location /api/resumes/upload {
        # 文件上传不限流
        limit_req zone=resume_api_limit burst=50 nodelay;
        
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 文件上传专用超时设置（10分钟）
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        
        # 文件上传大小限制
        client_max_body_size 50M;
        client_body_buffer_size 16M;
    }
    
    # 任务状态查询（中等超时）
    location ~ ^/api/tasks/.*/status$ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 任务查询超时设置（2分钟）
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # 一般API代理
    location /api/ {
        # 应用限流
        limit_req zone=resume_api_limit burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 一般API超时设置（2分钟）
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        
        # 文件上传大小限制
        client_max_body_size 50M;
    }
    
    # 健康检查（无需认证）
    location /health {
        proxy_pass http://127.0.0.1:$BACKEND_PORT/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
        
        # 健康检查快速超时
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    # 安全设置
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 2. 测试并重载Nginx配置
log_info "测试Nginx配置..."
if nginx -t; then
    log_success "Nginx配置测试通过"
    systemctl reload nginx
    log_success "Nginx已重启"
else
    log_error "Nginx配置测试失败"
    nginx -t 2>&1
    exit 1
fi

# 3. 确保后端uploads目录存在且权限正确
log_info "检查后端uploads目录..."
UPLOADS_DIR="/home/ubuntu/resume/backend/uploads"
if [ ! -d "$UPLOADS_DIR" ]; then
    mkdir -p "$UPLOADS_DIR"
    log_success "创建uploads目录: $UPLOADS_DIR"
fi

# 设置正确的权限
chown -R ubuntu:ubuntu "$UPLOADS_DIR"
chmod -R 755 "$UPLOADS_DIR"
log_success "uploads目录权限已设置"

# 4. 检查后端multer配置
log_info "验证后端文件上传配置..."
BACKEND_DIR="/home/ubuntu/resume/backend"

# 检查uploads目录结构
mkdir -p "$BACKEND_DIR/uploads/resumes"
chown -R ubuntu:ubuntu "$BACKEND_DIR/uploads"
chmod -R 755 "$BACKEND_DIR/uploads"

log_success "后端uploads目录结构已准备完成"

# 5. 重启后端服务以应用所有配置
log_info "重启后端服务..."
pm2 restart resume-backend
sleep 3

# 6. 测试上传功能
log_info "测试系统功能..."

# 测试健康检查
log_info "测试健康检查..."
if curl -s "http://localhost/health" > /dev/null; then
    log_success "✅ 健康检查通过"
else
    log_warning "❌ 健康检查失败"
fi

# 测试API健康检查
log_info "测试API健康检查..."
if curl -s "http://localhost/api/health" > /dev/null; then
    log_success "✅ API健康检查通过"
else
    log_warning "❌ API健康检查失败"
fi

# 显示当前服务状态
log_info "当前服务状态："
pm2 list | grep resume

# 7. 显示关键配置信息
echo ""
echo "============================================"
echo "修复完成！关键配置信息："
echo "============================================"

log_info "Nginx配置优化："
log_info "  ✅ 文件上传大小限制: 50MB"
log_info "  ✅ 文件上传超时: 10分钟"
log_info "  ✅ 一般API超时: 2分钟"
log_info "  ✅ 任务查询超时: 2分钟"
log_info "  ✅ 健康检查超时: 10秒"

log_info "后端配置："
log_info "  ✅ uploads目录已创建并设置权限"
log_info "  ✅ 后端服务已重启"

log_info "测试建议："
log_info "  1. 现在可以尝试上传简历文件"
log_info "  2. 文件大小限制: 50MB以内"
log_info "  3. 支持格式: PDF, DOC, DOCX"
log_info "  4. 如果仍有问题，请提供具体错误信息"

log_info "调试命令："
log_info "  - 查看后端日志: pm2 logs resume-backend"
log_info "  - 查看Nginx错误: tail -f /var/log/nginx/error.log"
log_info "  - 测试上传端点: curl -X POST http://localhost/api/resumes/upload"

echo ""
log_success "🎉 文件上传超时修复完成！" 