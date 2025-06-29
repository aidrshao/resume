#!/bin/bash
# =============================================================================
# 健康检查模块 - AI俊才社简历系统
# =============================================================================

# 检查系统依赖
check_system_dependencies() {
    log_info "🔍 检查系统依赖..."
    
    local missing_deps=()
    local deps=("node" "npm" "docker" "nginx" "git" "curl" "lsof")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少系统依赖: ${missing_deps[*]}"
        return 1
    else
        log_success "系统依赖检查通过"
        return 0
    fi
}

# 检查端口状态
check_ports() {
    log_info "🔍 检查端口状态..."
    
    local ports=("$FRONTEND_PORT:前端" "$BACKEND_PORT:后端" "$DB_PORT:数据库" "80:HTTP" "443:HTTPS")
    local failed_ports=()
    
    for port_info in "${ports[@]}"; do
        local port=$(echo "$port_info" | cut -d: -f1)
        local name=$(echo "$port_info" | cut -d: -f2)
        
        if lsof -i ":$port" >/dev/null 2>&1; then
            local process=$(lsof -i ":$port" | tail -1 | awk '{print $1 " (PID: " $2 ")"}')
            log_success "端口 $port ($name): $process"
        else
            log_error "端口 $port ($name): 未监听"
            failed_ports+=("$port")
        fi
    done
    
    if [ ${#failed_ports[@]} -gt 0 ]; then
        log_error "端口检查失败: ${failed_ports[*]}"
        return 1
    else
        log_success "端口检查通过"
        return 0
    fi
}

# 检查服务状态
check_services() {
    log_info "🔍 检查服务状态..."
    
    local services=("nginx:Nginx" "docker:Docker")
    local failed_services=()
    
    for service_info in "${services[@]}"; do
        local service=$(echo "$service_info" | cut -d: -f1)
        local name=$(echo "$service_info" | cut -d: -f2)
        
        if systemctl is-active "$service" >/dev/null 2>&1; then
            log_success "服务 $name: 运行正常"
        else
            log_error "服务 $name: 状态异常"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        log_error "服务检查失败: ${failed_services[*]}"
        return 1
    else
        log_success "服务检查通过"
        return 0
    fi
}

# 检查Docker容器
check_docker_containers() {
    log_info "🔍 检查Docker容器..."
    
    if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
        log_error "数据库容器未运行: $DB_CONTAINER_NAME"
        return 1
    fi
    
    local container_status=$(docker ps --format "{{.Status}}" --filter "name=$DB_CONTAINER_NAME")
    log_success "数据库容器: $container_status"
    
    return 0
}

# 检查网络连接
check_network() {
    log_info "🔍 检查网络连接..."
    
    # 检查外网连接
    if curl -s --connect-timeout 5 "https://www.baidu.com" >/dev/null; then
        log_success "外网连接正常"
    else
        log_warning "外网连接异常"
    fi
    
    # 检查域名解析
    if nslookup "$DOMAIN" >/dev/null 2>&1; then
        log_success "域名解析正常: $DOMAIN"
    else
        log_warning "域名解析异常: $DOMAIN"
    fi
    
    # 检查本地服务连接
    if curl -s --connect-timeout 5 "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
        log_success "后端服务连接正常"
    else
        log_warning "后端服务连接异常"
    fi
    
    return 0
}

# 检查磁盘空间
check_disk_space() {
    log_info "🔍 检查磁盘空间..."
    
    local disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 80 ]; then
        log_success "磁盘使用率: ${disk_usage}%"
    elif [ "$disk_usage" -lt 90 ]; then
        log_warning "磁盘使用率较高: ${disk_usage}%"
    else
        log_error "磁盘使用率过高: ${disk_usage}%"
        return 1
    fi
    
    return 0
}

# 检查内存使用
check_memory() {
    log_info "🔍 检查内存使用..."
    
    local mem_info=$(free | grep '^Mem:')
    local total=$(echo "$mem_info" | awk '{print $2}')
    local used=$(echo "$mem_info" | awk '{print $3}')
    local usage=$(( used * 100 / total ))
    
    if [ "$usage" -lt 80 ]; then
        log_success "内存使用率: ${usage}%"
    elif [ "$usage" -lt 90 ]; then
        log_warning "内存使用率较高: ${usage}%"
    else
        log_error "内存使用率过高: ${usage}%"
        return 1
    fi
    
    return 0
}

# 检查SSL证书
check_ssl_health() {
    log_info "🔍 检查SSL证书..."
    
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        local expiry_date=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null | cut -d= -f2)
        
        if [ -n "$expiry_date" ]; then
            local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo 0)
            local current_timestamp=$(date +%s)
            local days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ $days_left -gt 30 ]; then
                log_success "SSL证书有效，剩余 $days_left 天"
            elif [ $days_left -gt 0 ]; then
                log_warning "SSL证书即将过期，剩余 $days_left 天"
            else
                log_error "SSL证书已过期"
                return 1
            fi
        else
            log_error "无法读取SSL证书有效期"
            return 1
        fi
    else
        log_warning "SSL证书未安装"
        return 1
    fi
    
    return 0
}

# 检查文件权限
check_file_permissions() {
    log_info "🔍 检查文件权限..."
    
    local paths=("$PROJECT_DIR" "/var/www/uploads" "/var/www/certbot")
    local failed_paths=()
    
    for path in "${paths[@]}"; do
        if [ -d "$path" ]; then
            if [ -r "$path" ] && [ -w "$path" ]; then
                log_success "目录权限正常: $path"
            else
                log_error "目录权限异常: $path"
                failed_paths+=("$path")
            fi
        else
            log_warning "目录不存在: $path"
        fi
    done
    
    if [ ${#failed_paths[@]} -gt 0 ]; then
        log_error "文件权限检查失败: ${failed_paths[*]}"
        return 1
    else
        log_success "文件权限检查通过"
        return 0
    fi
}

# 测试API端点
test_api_endpoints() {
    log_info "🔍 测试API端点..."
    
    # 测试后端健康检查
    if curl -s --connect-timeout 10 "http://localhost:$BACKEND_PORT/health" | grep -q "ok\|healthy\|success"; then
        log_success "后端健康检查端点正常"
    else
        log_warning "后端健康检查端点异常"
    fi
    
    # 测试前端访问
    if curl -s --connect-timeout 10 "http://localhost:$FRONTEND_PORT" | grep -q "<!DOCTYPE html>"; then
        log_success "前端页面访问正常"
    else
        log_warning "前端页面访问异常"
    fi
    
    # 测试HTTPS访问（如果SSL已配置）
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        if curl -s --connect-timeout 10 "https://$DOMAIN" >/dev/null 2>&1; then
            log_success "HTTPS访问正常"
        else
            log_warning "HTTPS访问异常"
        fi
    fi
    
    return 0
}

# 完整健康检查
comprehensive_health_check() {
    log_title "系统健康检查"
    
    local checks=(
        "check_system_dependencies:系统依赖"
        "check_services:系统服务"
        "check_docker_containers:Docker容器"
        "check_ports:端口状态"
        "health_check_db:数据库"
        "health_check_pm2:PM2进程"
        "health_check_nginx:Nginx"
        "check_ssl_health:SSL证书"
        "check_disk_space:磁盘空间"
        "check_memory:内存使用"
        "check_file_permissions:文件权限"
        "test_api_endpoints:API端点"
        "check_network:网络连接"
    )
    
    local total=${#checks[@]}
    local passed=0
    local failed=0
    local warnings=0
    
    for i in "${!checks[@]}"; do
        local check_info="${checks[$i]}"
        local check_func=$(echo "$check_info" | cut -d: -f1)
        local check_name=$(echo "$check_info" | cut -d: -f2)
        
        log_step $((i + 1)) $total "$check_name"
        
        if "$check_func"; then
            passed=$((passed + 1))
        else
            local exit_code=$?
            if [ $exit_code -eq 2 ]; then
                warnings=$((warnings + 1))
            else
                failed=$((failed + 1))
            fi
        fi
        
        echo ""
    done
    
    # 显示总结
    log_separator "="
    log_info "健康检查总结:"
    log_info "  总检查项: $total"
    log_success "  通过: $passed"
    if [ $warnings -gt 0 ]; then
        log_warning "  警告: $warnings"
    fi
    if [ $failed -gt 0 ]; then
        log_error "  失败: $failed"
    fi
    
    if [ $failed -eq 0 ]; then
        log_success "🎉 系统整体健康状况良好"
        return 0
    else
        log_error "❌ 系统存在问题需要修复"
        return 1
    fi
}

# 快速健康检查
quick_health_check() {
    log_info "🚀 快速健康检查..."
    
    local critical_checks=(
        "health_check_pm2"
        "health_check_db"
        "health_check_nginx"
        "check_ports"
    )
    
    local failed=0
    
    for check in "${critical_checks[@]}"; do
        if ! "$check" >/dev/null 2>&1; then
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -eq 0 ]; then
        log_success "✅ 快速检查通过，系统运行正常"
        return 0
    else
        log_error "❌ 快速检查失败，发现 $failed 个问题"
        return 1
    fi
}

# 导出函数
export -f check_system_dependencies check_ports check_services
export -f check_docker_containers check_network check_disk_space
export -f check_memory check_ssl_health check_file_permissions
export -f test_api_endpoints comprehensive_health_check quick_health_check 