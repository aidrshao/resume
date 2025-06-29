#!/bin/bash
# =============================================================================
# AI俊才社简历系统 - SSL证书独立配置脚本
# =============================================================================
# 
# 🎯 专门用于配置SSL证书，在HTTP版本稳定后使用
# 🚀 使用: sudo bash setup-ssl-certificate.sh
# ⚠️  前提: 确保HTTP版本（http://cv.juncaishe.com）已正常运行
#
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
DOMAIN="cv.juncaishe.com"
EMAIL="admin@juncaishe.com"
PROJECT_DIR="/home/ubuntu/resume"
FRONTEND_PORT=3016
BACKEND_PORT=8000

echo -e "${GREEN}🔐 AI俊才社简历系统 - SSL证书配置${NC}"
echo "=================================================="

# 检查运行权限
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root权限运行此脚本${NC}"
    echo "正确用法: sudo $0"
    exit 1
fi

# 1. 检查前置条件
echo -e "\n${BLUE}[1/8]${NC} 检查前置条件..."

# 检查HTTP版本是否正常
if curl -s -I "http://$DOMAIN" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ HTTP版本运行正常${NC}"
else
    echo -e "${RED}❌ HTTP版本异常，请先修复HTTP访问${NC}"
    echo "建议运行: sudo bash deploy-standalone.sh --mode=fix"
    exit 1
fi

# 检查域名解析
if nslookup "$DOMAIN" | grep -q "Address:"; then
    echo -e "${GREEN}✅ 域名解析正常${NC}"
else
    echo -e "${RED}❌ 域名解析失败${NC}"
    exit 1
fi

# 2. 安装Certbot
echo -e "\n${BLUE}[2/8]${NC} 安装SSL证书工具..."
if ! command -v certbot &> /dev/null; then
    echo "安装Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
else
    echo -e "${GREEN}✅ Certbot已安装${NC}"
fi

# 3. 检查现有证书
echo -e "\n${BLUE}[3/8]${NC} 检查现有SSL证书..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${YELLOW}⚠️  发现现有证书${NC}"
    cert_info=$(openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -text -noout 2>/dev/null || echo "证书读取失败")
    if echo "$cert_info" | grep -q "Not After"; then
        expiry_date=$(echo "$cert_info" | grep "Not After" | cut -d: -f2- | xargs)
        echo "证书到期时间: $expiry_date"
        
        # 检查证书是否即将过期（30天内）
        if openssl x509 -checkend 2592000 -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null; then
            echo -e "${GREEN}✅ 证书有效期充足${NC}"
            echo "是否要强制更新证书？(y/N)"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                echo "跳过证书申请，直接配置Nginx..."
                SKIP_CERT=true
            fi
        else
            echo -e "${YELLOW}⚠️  证书即将过期，将自动续期${NC}"
        fi
    fi
else
    echo "未发现现有证书，将申请新证书"
fi

# 4. 备份当前Nginx配置
echo -e "\n${BLUE}[4/8]${NC} 备份当前Nginx配置..."
backup_dir="/root/nginx-ssl-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
cp -r /etc/nginx/sites-available "$backup_dir/" 2>/dev/null || true
cp -r /etc/nginx/sites-enabled "$backup_dir/" 2>/dev/null || true
echo "配置已备份到: $backup_dir"

# 5. 申请SSL证书
if [ "$SKIP_CERT" != "true" ]; then
    echo -e "\n${BLUE}[5/8]${NC} 申请SSL证书..."
    
    # 临时停止nginx
    systemctl stop nginx
    
    # 申请证书
    if certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        --force-renewal; then
        echo -e "${GREEN}✅ SSL证书申请成功${NC}"
    else
        echo -e "${RED}❌ SSL证书申请失败${NC}"
        systemctl start nginx
        exit 1
    fi
else
    echo -e "\n${BLUE}[5/8]${NC} 跳过证书申请，使用现有证书..."
fi

# 6. 更新前端环境变量为HTTPS
echo -e "\n${BLUE}[6/8]${NC} 更新前端配置为HTTPS..."
cd "$PROJECT_DIR/frontend"

# 更新环境配置
cat > .env.production << EOF
# 生产环境配置 (HTTPS模式)
REACT_APP_API_URL=https://$DOMAIN/api
REACT_APP_BACKEND_URL=https://$DOMAIN/api
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0

# 功能开关
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PWA=true

# 外部服务
REACT_APP_DOMAIN=$DOMAIN
EOF

# 重新构建前端
echo "重新构建前端（HTTPS模式）..."
if [ -d "build" ]; then
    rm -rf build
fi

export NODE_ENV=production
export CI=false

if npm run build; then
    echo -e "${GREEN}✅ 前端构建完成${NC}"
else
    echo -e "${RED}❌ 前端构建失败${NC}"
    systemctl start nginx
    exit 1
fi

# 7. 配置HTTPS版本的Nginx
echo -e "\n${BLUE}[7/8]${NC} 配置HTTPS版本的Nginx..."

cat > /etc/nginx/sites-available/cv.juncaishe.com.conf << EOF
# AI俊才社简历系统 - HTTPS配置
server {
    listen 80;
    server_name $DOMAIN;

    # Let's Encrypt验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files \$uri =404;
    }

    # 其他请求重定向到HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # 日志
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log /var/log/nginx/$DOMAIN.error.log;

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API 接口代理到后端
    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # API超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }

    # 前端静态资源和路由
    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用新配置
ln -sf /etc/nginx/sites-available/cv.juncaishe.com.conf /etc/nginx/sites-enabled/

# 测试配置
if nginx -t; then
    systemctl start nginx
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx HTTPS配置完成${NC}"
else
    echo -e "${RED}❌ Nginx配置错误，恢复备份${NC}"
    cp -r "$backup_dir/sites-available/"* /etc/nginx/sites-available/ 2>/dev/null || true
    cp -r "$backup_dir/sites-enabled/"* /etc/nginx/sites-enabled/ 2>/dev/null || true
    systemctl start nginx
    exit 1
fi

# 重启前端服务
echo "重启前端服务（HTTPS模式）..."
pm2 stop resume-frontend 2>/dev/null || true
pm2 delete resume-frontend 2>/dev/null || true
pm2 serve "$PROJECT_DIR/frontend/build" $FRONTEND_PORT --name "resume-frontend" --spa
pm2 save

# 8. 配置证书自动续期
echo -e "\n${BLUE}[8/8]${NC} 配置证书自动续期..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
echo -e "${GREEN}✅ 证书自动续期已配置${NC}"

# 最终测试
echo -e "\n${GREEN}🎯 SSL配置完成！${NC}"
echo "=================================================="

echo -e "\n${YELLOW}📝 测试结果:${NC}"

# 测试HTTP重定向
echo "测试HTTP到HTTPS重定向..."
http_response=$(curl -s -I "http://$DOMAIN" | head -3)
if echo "$http_response" | grep -q "301"; then
    echo -e "${GREEN}✅ HTTP重定向正常${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP重定向异常${NC}"
    echo "$http_response"
fi

# 测试HTTPS访问
echo "测试HTTPS访问..."
sleep 3
if curl -s -I "https://$DOMAIN" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ HTTPS访问正常${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS访问异常${NC}"
    curl -s -I "https://$DOMAIN" | head -3
fi

echo -e "\n${GREEN}🎉 SSL证书配置成功！${NC}"
echo -e "${BLUE}📋 访问信息:${NC}"
echo "   - HTTPS访问: https://$DOMAIN"
echo "   - HTTP会自动跳转到HTTPS"
echo "   - API接口: https://$DOMAIN/api"
echo ""
echo -e "${YELLOW}📄 配置备份: $backup_dir${NC}"
echo -e "${YELLOW}🔄 证书自动续期: 每天12:00检查${NC}"
echo ""
echo -e "${GREEN}✨ 现在可以通过HTTPS安全访问简历系统了！${NC}" 