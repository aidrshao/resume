#!/bin/bash
# =============================================================================
# AI俊才社简历系统 - 模块化一键部署脚本 v5.0
# =============================================================================

set -e

# 脚本基本信息
SCRIPT_VERSION="5.0"
SCRIPT_NAME="AI俊才社简历系统 - 模块化部署脚本"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULES_DIR="$SCRIPT_DIR/modules"

# 加载配置模块
source "$MODULES_DIR/config.sh"
source "$MODULES_DIR/log.sh"

# 初始化系统
init_system() {
    init_config
    init_log
    log_title "$SCRIPT_NAME v$SCRIPT_VERSION"
    show_config
    
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root权限运行此脚本"
        exit 1
    fi
    
    log_success "系统初始化完成"
}

# 加载所有模块
load_modules() {
    log_info "📦 加载部署模块..."
    
    local modules=(
        "pm2-manager.sh"
        "database.sh" 
        "backend.sh"
        "frontend.sh"
        "nginx.sh"
        "ssl.sh"
        "health-check.sh"
    )
    
    for module in "${modules[@]}"; do
        source "$MODULES_DIR/$module"
        log_debug "已加载模块: $module"
    done
    
    log_success "所有模块加载完成"
}

# 检查系统依赖
check_dependencies() {
    log_subtitle "检查系统依赖"
    check_system_dependencies || exit 1
    check_pm2 || exit 1
    
    if ! systemctl is-active docker >/dev/null; then
        systemctl start docker
        systemctl enable docker
    fi
    
    log_success "依赖检查完成"
}

# 完整部署流程
full_deploy() {
    log_title "开始完整部署流程"
    
    local start_time=$(date +%s)
    
    # 执行部署步骤
    log_step 1 8 "检查系统依赖"
    check_dependencies
    
    log_step 2 8 "清理旧服务"
    cleanup_resume_processes
    
    log_step 3 8 "获取项目代码"
    clone_project
    
    log_step 4 8 "配置数据库"
    setup_database
    
    log_step 5 8 "配置后端"
    setup_backend
    
    log_step 6 8 "配置前端"
    setup_frontend
    
    log_step 7 8 "启动PM2服务"
    start_services
    
    log_step 8 8 "配置Web服务"
    setup_nginx
    
    # SSL配置
    log_info "🔐 配置SSL证书..."
    smart_ssl_config || log_warning "SSL证书配置失败"
    setup_ssl_auto_renewal || log_warning "SSL自动续期设置失败"
    
    # 最终检查
    log_info "🔍 执行最终健康检查..."
    if comprehensive_health_check; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_title "部署成功完成！"
        log_success "总耗时: ${duration}秒"
        log_success "访问地址: https://$DOMAIN"
        log_success "HTTP访问: http://$DOMAIN"
    else
        log_error "健康检查失败"
        exit 1
    fi
}

# 快速部署
quick_deploy() {
    log_title "快速部署模式"
    
    if quick_health_check; then
        log_success "系统运行正常，执行快速更新..."
        clone_project
        setup_frontend
        restart_services
        reload_nginx
        log_success "快速部署完成"
    else
        log_warning "系统状态异常，执行完整部署..."
        full_deploy
    fi
}

# 修复模式
fix_mode() {
    log_title "系统修复模式"
    
    cleanup_resume_processes
    
    if ! health_check_db; then
        setup_database
    fi
    
    start_services
    
    if ! health_check_nginx; then
        setup_nginx
    fi
    
    smart_ssl_config || log_warning "SSL修复失败"
    
    if quick_health_check; then
        log_success "系统修复完成"
    else
        log_error "系统修复失败"
        exit 1
    fi
}

# 显示帮助
show_help() {
    cat << EOF
$SCRIPT_NAME v$SCRIPT_VERSION

用法: $0 [选项]

选项:
  --mode=full     完整部署（默认）
  --mode=quick    快速部署
  --mode=fix      修复模式
  --mode=check    健康检查
  --debug         启用调试模式
  --help, -h      显示帮助

示例:
  $0                    # 完整部署
  $0 --mode=quick       # 快速部署
  $0 --mode=fix         # 修复系统
  $0 --mode=check       # 健康检查
EOF
}

# 错误处理
error_handler() {
    local exit_code=$?
    log_error "部署过程中发生错误 (退出码: $exit_code)"
    
    if [ "$DEPLOY_MODE" = "full" ]; then
        pm2 delete resume-backend 2>/dev/null || true
        pm2 delete resume-frontend 2>/dev/null || true
    fi
    
    exit $exit_code
}

# 主函数
main() {
    trap error_handler ERR
    
    # 解析参数
    DEPLOY_MODE="full"
    
    for arg in "$@"; do
        case $arg in
            --mode=*)
                DEPLOY_MODE="${arg#*=}"
                ;;
            --debug)
                set_log_level "debug"
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
        esac
    done
    
    # 初始化
    init_system
    load_modules
    
    # 执行操作
    case "$DEPLOY_MODE" in
        "full")
            full_deploy
            ;;
        "quick")
            quick_deploy
            ;;
        "fix")
            fix_mode
            ;;
        "check")
            comprehensive_health_check
            ;;
        *)
            log_error "未知部署模式: $DEPLOY_MODE"
            exit 1
            ;;
    esac
    
    log_success "🎉 操作完成！"
}

# 执行主函数
main "$@" 