#!/bin/bash
# =============================================================================
# AI俊才社简历系统 - 快速诊断脚本
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
PROJECT_DIR="/home/ubuntu/resume"
LOG_FILE="/var/log/resume-deploy.log"
DB_CONTAINER_NAME="resume-postgres"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

log_title() {
    echo ""
    echo -e "${GREEN}=== $1 ===${NC}"
}

# 检查系统基础信息
check_system() {
    log_title "系统基础信息"
    
    echo "系统信息:"
    uname -a
    echo ""
    
    echo "内存使用:"
    free -h
    echo ""
    
    echo "磁盘使用:"
    df -h
    echo ""
    
    echo "网络连接:"
    ping -c 3 google.com >/dev/null 2>&1 && log_success "网络正常" || log_warning "网络可能有问题"
}

# 检查必要软件
check_dependencies() {
    log_title "检查必要软件"
    
    local required_commands=("docker" "docker-compose" "node" "npm" "pm2" "nginx" "git")
    
    for cmd in "${required_commands[@]}"; do
        if command -v $cmd &> /dev/null; then
            local version=$(${cmd} --version 2>/dev/null | head -1 || echo "unknown")
            log_success "$cmd: $version"
        else
            log_error "$cmd: 未安装"
        fi
    done
}

# 检查项目状态
check_project() {
    log_title "检查项目状态"
    
    if [ -d "$PROJECT_DIR" ]; then
        log_success "项目目录存在: $PROJECT_DIR"
        cd "$PROJECT_DIR"
        
        if [ -d ".git" ]; then
            log_success "Git仓库正常"
            echo "当前分支: $(git branch --show-current)"
            echo "最后提交: $(git log --oneline -1)"
        else
            log_warning "不是Git仓库"
        fi
        
        if [ -f "backend/package.json" ]; then
            log_success "后端项目存在"
        else
            log_error "后端项目不存在"
        fi
        
        if [ -f "frontend/package.json" ]; then
            log_success "前端项目存在"
        else
            log_error "前端项目不存在"
        fi
        
        if [ -f "backend/.env" ]; then
            log_success "后端环境配置存在"
        else
            log_warning "后端环境配置不存在"
        fi
    else
        log_error "项目目录不存在: $PROJECT_DIR"
    fi
}

# 检查数据库状态
check_database() {
    log_title "检查数据库状态"
    
    if docker ps --format "table {{.Names}}" | grep -q "$DB_CONTAINER_NAME"; then
        log_success "数据库容器正在运行"
        
        # 检查数据库连接
        if docker exec $DB_CONTAINER_NAME psql -U resume_user -d resume_db -c "SELECT 1;" >/dev/null 2>&1; then
            log_success "数据库连接正常"
            
            # 检查表结构
            echo "核心表检查:"
            tables=("users" "resumes" "membership_tiers" "user_memberships")
            for table in "${tables[@]}"; do
                if docker exec $DB_CONTAINER_NAME psql -U resume_user -d resume_db -c "SELECT 1 FROM $table LIMIT 1;" >/dev/null 2>&1; then
                    local count=$(docker exec $DB_CONTAINER_NAME psql -U resume_user -d resume_db -tAc "SELECT COUNT(*) FROM $table;")
                    log_success "  $table: $count 条记录"
                else
                    log_error "  $table: 不存在或有问题"
                fi
            done
        else
            log_error "数据库连接失败"
        fi
    else
        log_error "数据库容器未运行"
        
        if docker ps -a --format "table {{.Names}}" | grep -q "$DB_CONTAINER_NAME"; then
            log_warning "数据库容器存在但未运行"
            echo "尝试启动数据库容器..."
            docker start $DB_CONTAINER_NAME
        else
            log_error "数据库容器不存在"
        fi
    fi
}

# 检查PM2服务
check_pm2() {
    log_title "检查PM2服务"
    
    if command -v pm2 &> /dev/null; then
        echo "PM2服务状态:"
        pm2 list
        echo ""
        
        # 检查具体服务
        if pm2 describe resume-backend >/dev/null 2>&1; then
            log_success "后端服务存在"
            local status=$(pm2 describe resume-backend | grep "status" | awk '{print $4}')
            if [ "$status" = "online" ]; then
                log_success "后端服务运行正常"
            else
                log_error "后端服务状态异常: $status"
            fi
        else
            log_error "后端服务不存在"
        fi
        
        if pm2 describe resume-frontend >/dev/null 2>&1; then
            log_success "前端服务存在"
            local status=$(pm2 describe resume-frontend | grep "status" | awk '{print $4}')
            if [ "$status" = "online" ]; then
                log_success "前端服务运行正常"
            else
                log_error "前端服务状态异常: $status"
            fi
        else
            log_error "前端服务不存在"
        fi
    else
        log_error "PM2未安装"
    fi
}

# 检查Nginx状态
check_nginx() {
    log_title "检查Nginx状态"
    
    if systemctl is-active --quiet nginx; then
        log_success "Nginx服务正在运行"
        
        # 检查配置文件
        if nginx -t >/dev/null 2>&1; then
            log_success "Nginx配置正确"
        else
            log_error "Nginx配置有问题"
            nginx -t
        fi
        
        # 检查站点配置
        if [ -f "/etc/nginx/sites-available/resume" ]; then
            log_success "项目Nginx配置存在"
        else
            log_error "项目Nginx配置不存在"
        fi
        
        if [ -L "/etc/nginx/sites-enabled/resume" ]; then
            log_success "项目Nginx配置已启用"
        else
            log_error "项目Nginx配置未启用"
        fi
    else
        log_error "Nginx服务未运行"
    fi
}

# 检查端口占用
check_ports() {
    log_title "检查端口占用"
    
    local common_ports=(80 443 8000 3016 5433)
    
    for port in "${common_ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local process=$(lsof -Pi :$port -sTCP:LISTEN -t | xargs ps -p | tail -1 | awk '{print $4}')
            log_warning "端口 $port 被占用: $process"
        else
            log_success "端口 $port 可用"
        fi
    done
}

# 测试API接口
test_api() {
    log_title "测试API接口"
    
    local backend_ports=(8000 8001 8002)
    local frontend_ports=(3016 3017 3018)
    
    for port in "${backend_ports[@]}"; do
        if curl -s "http://localhost:$port/api/health" >/dev/null 2>&1; then
            log_success "后端API正常 (端口: $port)"
            break
        else
            log_warning "后端API无响应 (端口: $port)"
        fi
    done
    
    for port in "${frontend_ports[@]}"; do
        if curl -s "http://localhost:$port" >/dev/null 2>&1; then
            log_success "前端服务正常 (端口: $port)"
            break
        else
            log_warning "前端服务无响应 (端口: $port)"
        fi
    done
}

# 检查日志文件
check_logs() {
    log_title "检查日志文件"
    
    if [ -f "$LOG_FILE" ]; then
        log_success "部署日志存在: $LOG_FILE"
        echo "最近10条日志:"
        tail -10 "$LOG_FILE"
    else
        log_warning "部署日志不存在"
    fi
    
    echo ""
    echo "PM2日志:"
    pm2 logs --lines 5 2>/dev/null || log_warning "无法获取PM2日志"
    
    echo ""
    echo "Nginx错误日志:"
    if [ -f "/var/log/nginx/error.log" ]; then
        tail -5 /var/log/nginx/error.log
    else
        log_warning "Nginx错误日志不存在"
    fi
}

# 提供修复建议
provide_suggestions() {
    log_title "修复建议"
    
    echo "根据诊断结果，建议执行以下操作："
    echo ""
    echo "1. 如果数据库有问题："
    echo "   cd $PROJECT_DIR/backend && node scripts/fix-database-issues.js"
    echo ""
    echo "2. 如果服务未启动："
    echo "   pm2 restart all"
    echo ""
    echo "3. 如果配置有问题："
    echo "   sudo bash deploy_standalone.sh"
    echo ""
    echo "4. 如果需要完全重新部署："
    echo "   pm2 delete all && docker stop $DB_CONTAINER_NAME && docker rm $DB_CONTAINER_NAME"
    echo "   sudo bash deploy_standalone.sh"
    echo ""
    echo "5. 查看详细日志："
    echo "   tail -f $LOG_FILE"
    echo "   pm2 logs"
}

# 主函数
main() {
    echo -e "${GREEN}AI俊才社简历系统 - 快速诊断脚本${NC}"
    echo "=========================================="
    echo ""
    
    check_system
    check_dependencies
    check_project
    check_database
    check_pm2
    check_nginx
    check_ports
    test_api
    check_logs
    provide_suggestions
    
    echo ""
    echo -e "${GREEN}诊断完成！${NC}"
    echo "如果问题仍然存在，请查看 $LOG_FILE 获取详细信息"
}

# 显示帮助信息
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "AI俊才社简历系统 - 快速诊断脚本"
    echo ""
    echo "使用方法:"
    echo "  sudo bash troubleshoot.sh              # 完整诊断"
    echo "  sudo bash troubleshoot.sh --help       # 显示帮助"
    echo ""
    echo "这个脚本会检查："
    echo "  - 系统基础信息"
    echo "  - 必要软件依赖"
    echo "  - 项目文件状态"
    echo "  - 数据库连接"
    echo "  - PM2服务状态"
    echo "  - Nginx配置"
    echo "  - 端口占用情况"
    echo "  - API接口响应"
    echo "  - 日志文件内容"
    echo ""
    echo "并提供相应的修复建议"
    exit 0
fi

# 检查root权限
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    exit 1
fi

# 运行主函数
main "$@" 