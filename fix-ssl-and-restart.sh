#!/bin/bash
# 修复cv.juncaishe.com SSL证书和PM2冲突问题

set -e

echo "🚀 修复cv.juncaishe.com部署问题"
echo "================================="

# 日志函数
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1"
}

log_success() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1"
}

# 1. 彻底清理PM2进程
log "🧹 彻底清理PM2进程..."
pm2 kill
sleep 3
pm2 delete all 2>/dev/null || true
rm -f /root/.pm2/dump.pm2*
log_success "PM2进程已清理"

# 2. 重新启动服务（强制模式）
log "🚀 重新启动Resume服务..."
cd /home/ubuntu/resume/backend
pm2 start server.js \
  --name "resume-backend" \
  --env production \
  --max-memory-restart 1G \
  --watch false \
  --force

cd /home/ubuntu/resume/frontend
pm2 start serve \
  --name "resume-frontend" \
  -- -s build -l 3016 \
  --max-memory-restart 512M \
  --watch false \
  --force

# 3. 配置SSL证书
log "🔐 配置SSL证书..."

# 检查certbot是否安装
if ! command -v certbot &> /dev/null; then
  log "📦 安装certbot..."
  apt update
  apt install -y certbot python3-certbot-nginx
fi

# 为cv.juncaishe.com申请SSL证书
log "📋 申请SSL证书..."
certbot --nginx -d cv.juncaishe.com --non-interactive --agree-tos --email admin@juncaishe.com --redirect

# 4. 更新nginx配置，添加SSL
log "🌐 更新nginx配置..."
cat > /etc/nginx/sites-available/cv.juncaishe.com << 'NGINXEOF'
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name cv.juncaishe.com;
    
    # Let's Encrypt证书验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 其他请求重定向到HTTPS
    location / {
        return 301 https://cv.juncaishe.com$request_uri;
    }
}

# HTTPS主配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cv.juncaishe.com;
    
    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/cv.juncaishe.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cv.juncaishe.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 前端页面
    location / {
        proxy_pass http://127.0.0.1:3016;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 后端API
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
        
        # 文件上传大小限制
        client_max_body_size 50M;
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "Resume System OK\n";
        add_header Content-Type text/plain;
    }
    
    # 日志
    access_log /var/log/nginx/cv.juncaishe.com.access.log;
    error_log /var/log/nginx/cv.juncaishe.com.error.log;
}
NGINXEOF

# 5. 测试并重载nginx
log "🔍 测试nginx配置..."
if nginx -t; then
  log_success "nginx配置测试通过"
  systemctl reload nginx
  log_success "nginx已重载"
else
  log_error "nginx配置测试失败"
  nginx -t
  exit 1
fi

# 6. 保存PM2配置
pm2 save
pm2 startup systemd -u root --hp /root

# 7. 最终检查
log "🏥 最终健康检查..."
sleep 10

echo ""
echo "📊 服务状态："
pm2 list

echo ""
echo "🌐 测试访问："
echo "HTTP: curl -I http://cv.juncaishe.com/"
curl -I http://cv.juncaishe.com/ 2>/dev/null | head -3 || echo "HTTP访问失败"

echo ""
echo "HTTPS: curl -I https://cv.juncaishe.com/"
curl -I https://cv.juncaishe.com/ 2>/dev/null | head -3 || echo "HTTPS访问失败"

echo ""
echo "🎉 修复完成！"
echo "================================="
echo "✅ PM2进程已重启"
echo "✅ SSL证书已配置"
echo "✅ nginx已更新"
echo ""
echo "🌐 访问地址："
echo "  HTTPS: https://cv.juncaishe.com"
echo "  HTTP会自动重定向到HTTPS" 