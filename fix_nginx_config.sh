#!/bin/bash

# 修复nginx配置问题的临时脚本
# 清理limit_req zone相关的错误配置

# 创建正确的nginx配置
cat > /etc/nginx/sites-available/resume << 'EOF'
# AI俊才社简历系统 - 修复版配置
server {
    listen 80;
    server_name cv.junvaishe.com;
    
    # 访问日志
    access_log /var/log/nginx/resume_access.log;
    error_log /var/log/nginx/resume_error.log;
    
    # 文件上传配置
    client_max_body_size 50M;
    
    # 超时设置
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    
    # Let's Encrypt验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # 前端应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API接口
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        access_log off;
    }
}
EOF

# 启用配置
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/resume
ln -sf /etc/nginx/sites-available/resume /etc/nginx/sites-enabled/resume

# 测试配置
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx配置修复成功"
    systemctl restart nginx
    echo "✅ Nginx重启成功"
else
    echo "❌ Nginx配置仍有问题"
fi 