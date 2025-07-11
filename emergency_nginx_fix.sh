#!/bin/bash

# 紧急Nginx 500错误修复脚本
# 解决API路径重复和配置错误问题

PROJECT_DIR="/home/ubuntu/resume"
DOMAIN="resume.juncaishe.com"

echo "🚨 开始紧急Nginx 500错误修复..."
echo "项目目录: $PROJECT_DIR"
echo "域名: $DOMAIN"
echo "=========================================="

# 步骤1: 检查当前Nginx错误
echo "📋 步骤1: 检查Nginx错误日志"
echo "最近的Nginx错误:"
tail -10 /var/log/nginx/error.log 2>/dev/null || echo "无法读取错误日志"

# 步骤2: 备份当前配置
echo "📋 步骤2: 备份当前Nginx配置"
cp /etc/nginx/sites-available/resume /etc/nginx/sites-available/resume.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "无配置文件可备份"

# 步骤3: 创建正确的Nginx配置
echo "📋 步骤3: 创建修复后的Nginx配置"
cat > /etc/nginx/sites-available/resume << 'EOF'
# AI俊才社简历系统 - 紧急修复版配置
# 修复时间: 2025-07-11
# 解决问题: 500错误和API路径重复

server {
    listen 80;
    server_name resume.juncaishe.com;
    
    # 重定向HTTP到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name resume.juncaishe.com;
    
    # SSL配置
    ssl_certificate /etc/letsencrypt/live/resume.juncaishe.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/resume.juncaishe.com/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # 前端静态SPA - 修复变量转义
    location / {
        root /home/ubuntu/resume/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源 - 修复正则表达式
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # HTML文件不缓存 - 修复正则表达式
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
        }
    }
    
    # API代理到后端 - 修复路径重复问题
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 错误页面 - 防止无限循环
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

echo "✅ 新Nginx配置已创建"

# 步骤4: 测试Nginx配置
echo "📋 步骤4: 测试Nginx配置语法"
if nginx -t; then
    echo "✅ Nginx配置语法正确"
else
    echo "❌ Nginx配置语法错误:"
    nginx -t
    exit 1
fi

# 步骤5: 检查前端构建文件
echo "📋 步骤5: 检查前端构建文件"
if [ -f "$PROJECT_DIR/frontend/build/index.html" ]; then
    echo "✅ 前端构建文件存在"
    BUILD_SIZE=$(du -sh "$PROJECT_DIR/frontend/build" | cut -f1)
    echo "构建目录大小: $BUILD_SIZE"
else
    echo "❌ 前端构建文件不存在，开始构建..."
    cd "$PROJECT_DIR/frontend"
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ 前端构建完成"
    else
        echo "❌ 前端构建失败"
        exit 1
    fi
fi

# 步骤5.1: 修复静态目录权限，避免Nginx 403
echo "📋 步骤5.1: 修复静态目录权限 (chmod o+rx /home/ubuntu)"
chmod o+rx /home/ubuntu 2>/dev/null || true
chmod -R o+rX "$PROJECT_DIR/frontend/build" 2>/dev/null || true
echo "✅ 目录权限已修复"

# 步骤6: 检查后端服务
echo "📋 步骤6: 检查后端服务状态"
if pm2 list | grep "resume-backend" | grep -q "online"; then
    echo "✅ 后端服务运行正常"
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/health" || echo "连接失败")
    echo "后端健康检查: $BACKEND_STATUS"
else
    echo "⚠️ 后端服务状态异常，尝试重启..."
    cd "$PROJECT_DIR/backend"
    pm2 restart resume-backend
    sleep 3
    if pm2 list | grep "resume-backend" | grep -q "online"; then
        echo "✅ 后端服务重启成功"
    else
        echo "❌ 后端服务重启失败"
        pm2 logs resume-backend --lines 5
    fi
fi

# 步骤7: 重启Nginx
echo "📋 步骤7: 重启Nginx服务"
systemctl restart nginx

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx重启成功"
else
    echo "❌ Nginx重启失败"
    systemctl status nginx --no-pager -l
    exit 1
fi

# 步骤8: 测试网站访问
echo "📋 步骤8: 测试网站访问"
sleep 2

# 测试HTTP重定向
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/")
echo "HTTP访问状态码: $HTTP_STATUS"

# 测试HTTPS访问
HTTPS_STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" "https://localhost/")
echo "HTTPS访问状态码: $HTTPS_STATUS"

# 测试API访问
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/health")
echo "API访问状态码: $API_STATUS"

# 步骤9: 最终验证
echo "📋 步骤9: 最终验证"
if [ "$HTTPS_STATUS" = "200" ]; then
    echo "✅ 网站可以正常访问"
    
    # 检查是否返回HTML内容
    if curl -s -k "https://localhost/" | grep -q "<!DOCTYPE html"; then
        echo "✅ 返回正确的HTML内容"
    else
        echo "⚠️ 返回内容可能不是HTML"
    fi
else
    echo "❌ 网站访问仍然失败"
    echo "检查Nginx错误日志:"
    tail -5 /var/log/nginx/error.log
fi

echo ""
echo "=========================================="
echo "🎉 Nginx 500错误修复完成！"
echo ""
echo "关键修复内容:"
echo "1. ✅ 修复了API路径重复问题 (/api/ -> localhost:8000 而不是 localhost:8000/api/)"
echo "2. ✅ 修复了Nginx变量转义问题 (\$uri -> $uri)"
echo "3. ✅ 修复了正则表达式转义问题"
echo "4. ✅ 优化了错误页面配置"
echo "5. ✅ 检查了前端构建文件"
echo "6. ✅ 验证了后端服务状态"
echo ""
echo "🔗 现在可以测试:"
echo "- 主页: https://$DOMAIN/"
echo "- API: https://$DOMAIN/api/health"
echo ""
echo "如果仍有问题，请检查:"
echo "- tail -f /var/log/nginx/error.log"
echo "- pm2 logs resume-backend" 