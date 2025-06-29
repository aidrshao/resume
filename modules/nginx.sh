#!/bin/bash
# =============================================================================
# Nginx配置模块 - AI俊才社简历系统
# =============================================================================

# 检查nginx状态
check_nginx() {
    if ! command -v nginx &> /dev/null; then
        log_error "Nginx未安装"
        log_info "正在安装Nginx..."
        apt update && apt install -y nginx
    fi
    
    log_success "Nginx版本: $(nginx -v 2>&1 | cut -d' ' -f3)"
}

# 创建nginx配置
create_nginx_config() {
    log_info "📝 创建Nginx配置..."
    
    local config_file="/etc/nginx/sites-available/$DOMAIN"
    local link_file="/etc/nginx/sites-enabled/$DOMAIN"
    
    # 备份现有配置
    if [ -f "$config_file" ]; then
        cp "$config_file" "${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 创建配置文件
    cat > "$config_file" << EOF
# AI俊才社简历系统 - Nginx配置
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # HTTP重定向到HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL配置
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL安全设置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 根目录
    root $PROJECT_DIR/frontend/build;
    index index.html;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 文件上传
    location /uploads {
        alias /var/www/uploads;
        try_files \$uri =404;
    }
    
    # Let's Encrypt验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 前端路由
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/html;
    }
}
EOF
    
    # 创建软链接
    if [ ! -L "$link_file" ]; then
        ln -sf "$config_file" "$link_file"
    fi
    
    # 删除默认配置
    if [ -L "/etc/nginx/sites-enabled/default" ]; then
        rm -f "/etc/nginx/sites-enabled/default"
    fi
    
    log_success "Nginx配置创建完成"
}

# 测试nginx配置
test_nginx_config() {
    log_info "🔍 测试Nginx配置..."
    
    if nginx -t; then
        log_success "Nginx配置语法检查通过"
    else
        log_error "Nginx配置语法错误"
        return 1
    fi
}

# 重载nginx配置
reload_nginx() {
    log_info "🔄 重载Nginx配置..."
    
    if systemctl reload nginx; then
        log_success "Nginx配置重载成功"
    else
        log_error "Nginx配置重载失败"
        return 1
    fi
}

# 启动nginx服务
start_nginx() {
    log_info "🚀 启动Nginx服务..."
    
    # 启用服务
    systemctl enable nginx
    
    # 启动服务
    if systemctl start nginx; then
        log_success "Nginx服务启动成功"
    else
        log_error "Nginx服务启动失败"
        return 1
    fi
    
    # 检查状态
    if systemctl is-active nginx >/dev/null; then
        log_success "Nginx服务运行正常"
    else
        log_error "Nginx服务状态异常"
        return 1
    fi
}

# 创建必要目录
create_nginx_dirs() {
    log_info "📁 创建Nginx必要目录..."
    
    # 上传目录
    mkdir -p /var/www/uploads
    chmod 755 /var/www/uploads
    
    # Let's Encrypt目录
    mkdir -p /var/www/certbot
    chmod 755 /var/www/certbot
    
    # 错误页面目录
    mkdir -p /var/www/html
    
    # 创建简单的错误页面
    cat > /var/www/html/50x.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>服务暂时不可用</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #666; }
    </style>
</head>
<body>
    <h1>服务暂时不可用</h1>
    <p>我们正在修复问题，请稍后再试。</p>
</body>
</html>
EOF
    
    log_success "目录创建完成"
}

# 检查nginx健康状态
health_check_nginx() {
    log_info "🔍 Nginx健康检查..."
    
    # 检查进程
    if ! pgrep nginx >/dev/null; then
        log_error "Nginx进程未运行"
        return 1
    fi
    
    # 检查端口
    if ! netstat -tlnp | grep -q ":80.*nginx"; then
        log_error "Nginx未监听80端口"
        return 1
    fi
    
    # 检查配置
    if ! nginx -t >/dev/null 2>&1; then
        log_error "Nginx配置错误"
        return 1
    fi
    
    log_success "Nginx健康检查通过"
    return 0
}

# 显示nginx状态
show_nginx_status() {
    log_info "📊 Nginx状态信息:"
    
    # 服务状态
    local status=$(systemctl is-active nginx 2>/dev/null || echo "unknown")
    log_info "  服务状态: $status"
    
    # 配置文件
    log_info "  配置文件: /etc/nginx/sites-available/$DOMAIN"
    
    # 监听端口
    local ports=$(netstat -tlnp 2>/dev/null | grep nginx | awk '{print $4}' | cut -d: -f2 | sort -u | tr '\n' ' ' || echo "unknown")
    log_info "  监听端口: $ports"
    
    # 进程信息
    local processes=$(pgrep -c nginx 2>/dev/null || echo "0")
    log_info "  进程数量: $processes"
}

# 设置nginx
setup_nginx() {
    log_subtitle "配置Nginx服务"
    
    # 检查nginx
    check_nginx || return 1
    
    # 创建目录
    create_nginx_dirs || return 1
    
    # 创建配置
    create_nginx_config || return 1
    
    # 测试配置
    test_nginx_config || return 1
    
    # 启动服务
    start_nginx || return 1
    
    log_success "Nginx设置完成"
}

# 导出函数
export -f check_nginx create_nginx_config test_nginx_config
export -f reload_nginx start_nginx create_nginx_dirs
export -f health_check_nginx show_nginx_status setup_nginx 