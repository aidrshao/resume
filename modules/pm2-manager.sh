#!/bin/bash
# =============================================================================
# PM2管理模块 - AI俊才社简历系统  
# =============================================================================

# PM2配置文件路径
PM2_CONFIG_FILE="/root/.pm2/dump.pm2"
PM2_CONFIG_BACKUP="/root/.pm2/dump.pm2.backup"

# 检查PM2是否安装
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2未安装"
        log_info "正在安装PM2..."
        npm install -g pm2
        log_success "PM2安装完成"
    fi
    log_success "PM2版本: $(pm2 --version)"
}

# 显示PM2状态
show_pm2_status() {
    log_info "📊 当前PM2进程状态:"
    pm2 list 2>/dev/null || log_warning "无法获取PM2状态"
}

# 获取resume进程信息
get_resume_processes() {
    local resume_ids=($(pm2 list 2>/dev/null | grep -E "resume-" | awk '{print $1}' | grep -E '^[0-9]+$' || true))
    local resume_names=($(pm2 list 2>/dev/null | grep -E "resume-" | awk '{print $2}' | grep -v "undefined" || true))
    echo "IDS:${resume_ids[*]}"
    echo "NAMES:${resume_names[*]}"
}

# 备份其他项目的PM2配置
backup_other_processes() {
    log_info "🛡️ 备份其他项目的PM2配置..."
    local other_processes=$(pm2 list 2>/dev/null | grep -v -E "(resume-|NAME|─)" | grep -E "online|stopped|error" | wc -l || echo "0")
    
    if [ "$other_processes" -gt 0 ]; then
        log_info "发现 $other_processes 个其他项目进程，创建备份"
        pm2 save 2>/dev/null || true
        cp "$PM2_CONFIG_FILE" "$PM2_CONFIG_BACKUP" 2>/dev/null || true
        log_success "已备份其他项目进程配置"
        return 0
    else
        log_info "没有发现其他项目进程"
        return 1
    fi
}

# 恢复其他项目进程
restore_other_processes() {
    local has_backup="$1"
    
    if [ "$has_backup" = "true" ] && [ -f "$PM2_CONFIG_BACKUP" ]; then
        log_info "🔄 恢复其他项目进程..."
        cp "$PM2_CONFIG_BACKUP" "$PM2_CONFIG_FILE" 2>/dev/null || true
        pm2 resurrect 2>/dev/null || true
        
        # 删除被错误恢复的resume进程
        local resume_processes=$(pm2 list 2>/dev/null | grep -E "resume-" | wc -l || echo "0")
        if [ "$resume_processes" -gt 0 ]; then
            log_warning "清理被错误恢复的resume进程"
            pm2 list 2>/dev/null | grep -E "resume-" | awk '{print $1}' | while read id; do
                pm2 delete "$id" 2>/dev/null || true
            done
        fi
        log_success "其他项目进程恢复完成"
    fi
}

# 智能端口清理
smart_port_cleanup() {
    local port=$1
    local port_name=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        local process_info=$(lsof -i :$port | tail -1)
        local pid=$(echo "$process_info" | awk '{print $2}')
        local pm2_process=$(pm2 list 2>/dev/null | grep "$pid" | grep -E "resume-" || echo "")
        
        if [ -n "$pm2_process" ]; then
            local pm2_name=$(echo "$pm2_process" | awk '{print $2}')
            log_warning "端口 $port 被resume进程占用: $pm2_name (PID: $pid)"
            pm2 delete "$pm2_name" 2>/dev/null || true
            sleep 2
        fi
        log_success "端口 $port 已清理"
    fi
}

# 彻底清理resume进程（核心修复）
cleanup_resume_processes() {
    log_subtitle "强化版PM2进程清理"
    
    show_pm2_status
    
    # 备份其他项目
    local has_other_backup=false
    if backup_other_processes; then
        has_other_backup=true
    fi
    
    # 获取resume进程
    local process_info=$(get_resume_processes)
    local resume_ids=($(echo "$process_info" | grep "IDS:" | cut -d: -f2))
    local resume_names=($(echo "$process_info" | grep "NAMES:" | cut -d: -f2))
    
    if [ ${#resume_ids[@]} -eq 0 ] && [ ${#resume_names[@]} -eq 0 ]; then
        log_success "没有resume进程需要清理"
        return 0
    fi
    
    log_info "检测到 ${#resume_ids[@]} 个resume进程，开始清理..."
    
    # 第一步：按名称删除
    for name in "${resume_names[@]}"; do
        if [ -n "$name" ] && [[ "$name" =~ ^resume- ]]; then
            log_debug "删除进程: $name"
            pm2 delete "$name" 2>/dev/null || true
        fi
    done
    sleep 3
    
    # 第二步：按ID删除残留
    local updated_info=$(get_resume_processes)
    local remaining_ids=($(echo "$updated_info" | grep "IDS:" | cut -d: -f2))
    
    for id in "${remaining_ids[@]}"; do
        if [ -n "$id" ] && [[ "$id" =~ ^[0-9]+$ ]]; then
            log_debug "删除进程ID: $id"
            pm2 delete "$id" 2>/dev/null || true
        fi
    done
    sleep 3
    
    # 第三步：终极清理（如果仍有残留）
    local final_info=$(get_resume_processes)
    local final_ids=($(echo "$final_info" | grep "IDS:" | cut -d: -f2))
    
    if [ ${#final_ids[@]} -gt 0 ]; then
        log_warning "使用终极清理方法..."
        
        # 清理PM2配置文件中的resume条目
        if [ -f "$PM2_CONFIG_FILE" ]; then
            grep -v "resume" "$PM2_CONFIG_FILE" > "${PM2_CONFIG_FILE}.tmp" 2>/dev/null || echo "[]" > "${PM2_CONFIG_FILE}.tmp"
            mv "${PM2_CONFIG_FILE}.tmp" "$PM2_CONFIG_FILE" 2>/dev/null || true
        fi
        
        # 重启PM2守护进程（修复关键点）
        pm2 kill 2>/dev/null || true
        sleep 5
        
        # 仅恢复其他项目，不自动resurrect
        if [ "$has_other_backup" = "true" ] && [ -f "$PM2_CONFIG_BACKUP" ]; then
            # 手动启动其他项目，避免resume被恢复
            log_info "手动恢复其他项目进程..."
            cp "$PM2_CONFIG_BACKUP" "${PM2_CONFIG_FILE}.full" 2>/dev/null || true
            
            # 过滤掉resume相关进程
            if [ -f "${PM2_CONFIG_FILE}.full" ]; then
                grep -v "resume" "${PM2_CONFIG_FILE}.full" > "$PM2_CONFIG_FILE" 2>/dev/null || echo "[]" > "$PM2_CONFIG_FILE"
                pm2 resurrect 2>/dev/null || true
            fi
        fi
        
        log_success "终极清理完成"
    else
        log_success "常规清理完成"
        restore_other_processes "$has_other_backup"
    fi
    
    # 清理端口
    smart_port_cleanup "$BACKEND_PORT" "backend"
    smart_port_cleanup "$FRONTEND_PORT" "frontend"
    
    # 验证结果
    show_pm2_status
    local final_check=$(get_resume_processes)
    local final_count=($(echo "$final_check" | grep "IDS:" | cut -d: -f2))
    
    if [ ${#final_count[@]} -eq 0 ]; then
        log_success "✅ resume进程清理完成"
    else
        log_error "❌ 仍有 ${#final_count[@]} 个resume进程"
        return 1
    fi
}

# 启动后端服务
start_backend() {
    log_info "🚀 启动后端服务..."
    cd "$PROJECT_DIR/backend"
    
    pm2 start server.js \
        --name "resume-backend" \
        --cwd "$PROJECT_DIR/backend" \
        --env production \
        --max-memory-restart 1G \
        --watch false \
        --force \
        --error "$LOG_DIR/resume-backend-error.log" \
        --output "$LOG_DIR/resume-backend.log"
    
    sleep 3
    log_success "后端服务启动完成"
}

# 启动前端服务
start_frontend() {
    log_info "🚀 启动前端服务..."
    cd "$PROJECT_DIR/frontend"
    
    pm2 start serve \
        --name "resume-frontend" \
        -- -s build -l $FRONTEND_PORT \
        --max-memory-restart 512M \
        --watch false \
        --force \
        --error "$LOG_DIR/resume-frontend-error.log" \
        --output "$LOG_DIR/resume-frontend.log"
    
    sleep 3
    log_success "前端服务启动完成"
}

# 启动所有服务
start_services() {
    log_subtitle "启动PM2服务"
    
    if [ ! -d "$PROJECT_DIR/backend" ]; then
        log_error "后端目录不存在"
        return 1
    fi
    
    if [ ! -d "$PROJECT_DIR/frontend/build" ]; then
        log_error "前端构建目录不存在"
        return 1
    fi
    
    start_backend
    start_frontend
    
    # 仅保存resume相关配置
    pm2 save
    
    sleep 5
    show_pm2_status
    
    # 验证
    local resume_count=$(pm2 list 2>/dev/null | grep -E "resume-" | grep "online" | wc -l || echo "0")
    if [ "$resume_count" -eq 2 ]; then
        log_success "✅ 服务启动验证通过：2个进程"
    else
        log_warning "⚠️ 服务启动异常：$resume_count 个进程"
    fi
}

# 健康检查
health_check_pm2() {
    local backend_status=$(pm2 describe resume-backend 2>/dev/null | grep -o "online" || echo "offline")
    local frontend_status=$(pm2 describe resume-frontend 2>/dev/null | grep -o "online" || echo "offline")
    
    if [ "$backend_status" = "online" ] && [ "$frontend_status" = "online" ]; then
        log_success "PM2健康检查通过"
        return 0
    else
        log_error "PM2健康检查失败"
        return 1
    fi
}

# 导出函数
export -f check_pm2 show_pm2_status cleanup_resume_processes
export -f start_services health_check_pm2 