#!/bin/bash

# 紧急SPA路由修复脚本
# 解决404和认证问题

PROJECT_DIR="/home/ubuntu/resume"
DOMAIN="resume.juncaishe.com"

echo "🚨 开始紧急SPA路由修复..."
echo "项目目录: $PROJECT_DIR"
echo "域名: $DOMAIN"
echo "=========================================="

# 步骤1: 强制清理前端进程
echo "📋 步骤1: 强制清理前端进程"
pm2 delete resume-frontend 2>/dev/null || echo "resume-frontend进程不存在"
pm2 delete frontend 2>/dev/null || echo "frontend进程不存在"
killall -9 http-server 2>/dev/null || echo "无http-server进程"
killall -9 serve 2>/dev/null || echo "无serve进程"
echo "✅ 前端进程清理完成"

# 步骤2: 检查前端构建
echo "📋 步骤2: 检查前端构建"
cd "$PROJECT_DIR/frontend"
if [ ! -d "build" ]; then
    echo "⚠️ 前端构建不存在，开始构建..."
    npm run build
else
    echo "✅ 前端构建已存在"
fi

# 步骤3: 配置Nginx SPA路由
echo "📋 步骤3: 配置Nginx SPA路由"
cat > /etc/nginx/sites-available/resume << 'EOF'
server {
    listen 80;
    server_name resume.juncaishe.com;
    
    # 前端静态文件
    location / {
        root /home/ubuntu/resume/frontend/build;
        index index.html;
        # SPA路由支持 - 关键配置
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# 步骤4: 重启Nginx
echo "📋 步骤4: 重启Nginx"
nginx -t && systemctl reload nginx
echo "✅ Nginx配置已更新"

# 步骤5: 检查JWT配置
echo "📋 步骤5: 检查JWT配置"
cd "$PROJECT_DIR/backend"
if ! grep -q "JWT_SECRET" .env; then
    echo "⚠️ 生成新的JWT_SECRET..."
    echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
fi
echo "✅ JWT配置检查完成"

# 步骤6: 修复前端API URL配置
echo "📋 步骤6: 修复前端API URL配置"
cd "$PROJECT_DIR/frontend"

# 检查当前配置
echo "当前前端API配置:"
grep "REACT_APP_API_URL" .env 2>/dev/null || echo "无配置文件"

# 修复配置 - 生产环境应该使用相对路径
echo "REACT_APP_API_URL=/api" > .env
echo "✅ 前端API URL已修复为: /api"

# 重新构建前端（使用新的API配置）
echo "🔄 重新构建前端..."
npm run build
echo "✅ 前端重新构建完成"

# 步骤7: 重启后端服务
echo "📋 步骤7: 重启后端服务"
cd "$PROJECT_DIR/backend"
pm2 restart resume-backend
echo "✅ 后端服务已重启"

# 步骤8: 验证和测试
echo "📋 步骤8: 验证和测试"
echo "等待服务启动..."
sleep 3

# 检查进程状态
echo "PM2进程状态:"
pm2 status

# 检查Nginx状态
echo "Nginx状态:"
systemctl status nginx --no-pager -l

# 测试API连通性
echo "测试API连通性:"
curl -s -o /dev/null -w "API状态码: %{http_code}\n" "http://localhost:8000/api/auth/profile"

# 测试前端页面
echo "测试前端页面:"
curl -s -o /dev/null -w "前端状态码: %{http_code}\n" "http://localhost/"

echo "=========================================="
echo "🎉 紧急修复完成！"
echo ""
echo "关键修复内容:"
echo "1. ✅ 清理了所有前端PM2进程"
echo "2. ✅ 配置了Nginx SPA路由支持"
echo "3. ✅ 修复了前端API URL配置"
echo "4. ✅ 重新构建了前端"
echo "5. ✅ 重启了后端服务"
echo ""
echo "请测试以下URL:"
echo "- 主页: https://resume.juncaishe.com/"
echo "- 登录: https://resume.juncaishe.com/login"
echo "- API: https://resume.juncaishe.com/api/auth/profile"
echo ""
echo "如果还有问题，请检查浏览器控制台和PM2日志" 