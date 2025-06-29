#!/bin/bash
# =============================================================================
# SSL证书管理模块 - AI俊才社简历系统
# =============================================================================

# 检查certbot
check_certbot() {
    if ! command -v certbot &> /dev/null; then
        log_error "Certbot未安装"
        log_info "正在安装Certbot..."
        apt update && apt install -y certbot python3-certbot-nginx
    fi
    
    log_success "Certbot版本: $(certbot --version 2>&1 | head -1)"
}

# 检查证书状态
check_ssl_certificate() {
    local cert_path="/etc/letsencrypt/live/$DOMAIN"
    
    if [ ! -d "$cert_path" ]; then
        log_warning "SSL证书不存在: $cert_path"
        return 1
    fi
    
    if [ ! -f "$cert_path/fullchain.pem" ] || [ ! -f "$cert_path/privkey.pem" ]; then
        log_warning "SSL证书文件不完整"
        return 1
    fi
    
    # 检查证书有效期
    local expiry_date=$(openssl x509 -enddate -noout -in "$cert_path/fullchain.pem" 2>/dev/null | cut -d= -f2)
    if [ -n "$expiry_date" ]; then
        local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo 0)
        local current_timestamp=$(date +%s)
        local days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_left -gt 30 ]; then
            log_success "SSL证书有效，剩余 $days_left 天"
            return 0
        elif [ $days_left -gt 0 ]; then
            log_warning "SSL证书即将过期，剩余 $days_left 天"
            return 2  # 需要续期
        else
            log_error "SSL证书已过期"
            return 1
        fi
    else
        log_error "无法读取证书有效期"
        return 1
    fi
}

# 申请SSL证书
obtain_ssl_certificate() {
    log_info "🔐 申请SSL证书..."
    
    # 确保nginx正在运行并监听80端口
    if ! netstat -tlnp | grep -q ":80.*nginx"; then
        log_error "Nginx未监听80端口，无法申请证书"
        return 1
    fi
    
    # 确保域名解析正确
    log_debug "检查域名解析..."
    if ! nslookup "$DOMAIN" >/dev/null 2>&1; then
        log_warning "域名解析可能有问题，但继续尝试申请证书"
    fi
    
    # 申请证书
    log_info "申请证书: $DOMAIN"
    if certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d $DOMAIN -d www.$DOMAIN; then
        
        log_success "SSL证书申请成功"
        return 0
    else
        local exit_code=$?
        log_error "SSL证书申请失败 (退出码: $exit_code)"
        
        # 显示详细错误信息
        log_error "可能的原因："
        log_error "1. 域名未正确解析到服务器IP"
        log_error "2. 80端口被防火墙阻挡"
        log_error "3. Let's Encrypt速率限制"
        log_error "4. webroot目录权限问题"
        
        return 1
    fi
}

# 续期SSL证书
renew_ssl_certificate() {
    log_info "🔄 续期SSL证书..."
    
    if certbot renew --quiet; then
        log_success "SSL证书续期成功"
        
        # 重载nginx
        if systemctl reload nginx; then
            log_success "Nginx配置重载成功"
        else
            log_warning "Nginx配置重载失败"
        fi
        
        return 0
    else
        log_error "SSL证书续期失败"
        return 1
    fi
}

# 智能SSL配置
smart_ssl_config() {
    log_subtitle "智能SSL证书配置"
    
    # 检查certbot
    check_certbot || return 1
    
    # 检查现有证书
    local cert_status
    check_ssl_certificate
    cert_status=$?
    
    case $cert_status in
        0)
            log_success "SSL证书状态良好，无需操作"
            ;;
        2)
            log_info "SSL证书即将过期，执行续期..."
            renew_ssl_certificate || return 1
            ;;
        1)
            log_info "SSL证书不存在或已过期，申请新证书..."
            obtain_ssl_certificate || return 1
            ;;
        *)
            log_error "未知的证书状态: $cert_status"
            return 1
            ;;
    esac
    
    # 验证证书安装
    if verify_ssl_installation; then
        log_success "SSL证书配置完成并验证通过"
    else
        log_error "SSL证书验证失败"
        return 1
    fi
}

# 验证SSL安装
verify_ssl_installation() {
    log_info "🔍 验证SSL证书安装..."
    
    # 检查证书文件
    local cert_path="/etc/letsencrypt/live/$DOMAIN"
    if [ ! -f "$cert_path/fullchain.pem" ] || [ ! -f "$cert_path/privkey.pem" ]; then
        log_error "证书文件不存在"
        return 1
    fi
    
    # 检查证书权限
    if [ ! -r "$cert_path/fullchain.pem" ] || [ ! -r "$cert_path/privkey.pem" ]; then
        log_error "证书文件权限不正确"
        return 1
    fi
    
    # 检查nginx配置中的SSL设置
    if ! nginx -t 2>&1 | grep -q "test is successful"; then
        log_error "Nginx配置中SSL设置有误"
        return 1
    fi
    
    # 测试HTTPS访问
    if command -v curl &> /dev/null; then
        log_debug "测试HTTPS连接..."
        if curl -sS --connect-timeout 10 "https://$DOMAIN" >/dev/null 2>&1; then
            log_success "HTTPS访问测试通过"
        else
            log_warning "HTTPS访问测试失败，可能需要等待DNS传播"
        fi
    fi
    
    log_success "SSL验证完成"
    return 0
}

# 设置SSL自动续期
setup_ssl_auto_renewal() {
    log_info "🔄 设置SSL证书自动续期..."
    
    # 检查是否已有续期任务
    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        log_info "SSL自动续期任务已存在"
        return 0
    fi
    
    # 添加续期任务
    local cron_job="0 12 * * * /usr/bin/certbot renew --quiet && /usr/bin/systemctl reload nginx"
    
    if (crontab -l 2>/dev/null; echo "$cron_job") | crontab -; then
        log_success "SSL自动续期任务设置完成"
        log_info "续期任务: 每天12:00检查并续期证书"
    else
        log_error "SSL自动续期任务设置失败"
        return 1
    fi
}

# 测试续期
test_ssl_renewal() {
    log_info "🧪 测试SSL证书续期..."
    
    if certbot renew --dry-run; then
        log_success "SSL证书续期测试通过"
    else
        log_error "SSL证书续期测试失败"
        return 1
    fi
}

# 显示SSL信息
show_ssl_info() {
    log_info "📊 SSL证书信息:"
    
    local cert_path="/etc/letsencrypt/live/$DOMAIN"
    
    if [ -d "$cert_path" ]; then
        log_info "  证书路径: $cert_path"
        
        # 证书详细信息
        if [ -f "$cert_path/fullchain.pem" ]; then
            local subject=$(openssl x509 -subject -noout -in "$cert_path/fullchain.pem" 2>/dev/null | cut -d= -f2-)
            local issuer=$(openssl x509 -issuer -noout -in "$cert_path/fullchain.pem" 2>/dev/null | cut -d= -f2-)
            local start_date=$(openssl x509 -startdate -noout -in "$cert_path/fullchain.pem" 2>/dev/null | cut -d= -f2)
            local end_date=$(openssl x509 -enddate -noout -in "$cert_path/fullchain.pem" 2>/dev/null | cut -d= -f2)
            
            log_info "  主体: $subject"
            log_info "  颁发者: $issuer"
            log_info "  生效时间: $start_date"
            log_info "  过期时间: $end_date"
            
            # 计算剩余天数
            if [ -n "$end_date" ]; then
                local expiry_timestamp=$(date -d "$end_date" +%s 2>/dev/null || echo 0)
                local current_timestamp=$(date +%s)
                local days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                log_info "  剩余天数: $days_left 天"
            fi
        fi
        
        # 自动续期状态
        if crontab -l 2>/dev/null | grep -q "certbot renew"; then
            log_info "  自动续期: 已启用"
        else
            log_info "  自动续期: 未启用"
        fi
    else
        log_warning "  状态: 证书未安装"
    fi
}

# 强制重新申请证书
force_ssl_renewal() {
    log_info "🔄 强制重新申请SSL证书..."
    
    # 删除现有证书
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        log_warning "删除现有证书..."
        certbot delete --cert-name "$DOMAIN" --non-interactive
    fi
    
    # 申请新证书
    obtain_ssl_certificate
}

# 导出函数
export -f check_certbot check_ssl_certificate obtain_ssl_certificate
export -f renew_ssl_certificate smart_ssl_config verify_ssl_installation
export -f setup_ssl_auto_renewal test_ssl_renewal show_ssl_info
export -f force_ssl_renewal 