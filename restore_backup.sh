#!/bin/bash
# =============================================================================
# AI俊才社简历系统 - 数据备份恢复脚本
# =============================================================================
# 
# 功能: 手动恢复数据库备份
# 用法: sudo ./restore_backup.sh [备份目录路径]
# 示例: sudo ./restore_backup.sh /root/backups/pre_deploy_backup_20250101_120000
#
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 数据库配置
DB_CONTAINER_NAME="resume-postgres"
DB_HOST="localhost"
DB_NAME="resume_db"
DB_USER="resume_user"
DB_PASSWORD="ResumePass123"

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
    echo -e "${WHITE}============================================${NC}"
    echo -e "${WHITE}$1${NC}"
    echo -e "${WHITE}============================================${NC}"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "数据库备份恢复脚本"
    echo ""
    echo "用法:"
    echo "  sudo $0 [备份目录路径]        # 从指定目录恢复备份"
    echo "  sudo $0 --list              # 列出可用的备份"
    echo "  sudo $0 --help              # 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  sudo $0 /root/backups/pre_deploy_backup_20250101_120000"
    echo "  sudo $0 --list"
    echo ""
}

# 列出可用备份
list_backups() {
    log_title "可用的数据备份"
    
    local backup_base_dir="/root/backups"
    
    if [ ! -d "$backup_base_dir" ]; then
        log_warning "备份目录不存在: $backup_base_dir"
        return 1
    fi
    
    local backups=($(find "$backup_base_dir" -name "pre_deploy_backup_*" -type d | sort -r))
    
    if [ ${#backups[@]} -eq 0 ]; then
        log_warning "未找到任何备份目录"
        return 1
    fi
    
    echo "找到 ${#backups[@]} 个备份:"
    echo ""
    
    for i in "${!backups[@]}"; do
        local backup_dir="${backups[$i]}"
        local backup_name=$(basename "$backup_dir")
        local backup_time=""
        
        if [ -f "$backup_dir/backup_info.txt" ]; then
            backup_time=$(grep "备份时间" "$backup_dir/backup_info.txt" 2>/dev/null | cut -d: -f2- || echo "未知")
        fi
        
        echo -e "${CYAN}[$((i+1))] $backup_name${NC}"
        echo "    路径: $backup_dir"
        echo "    时间: $backup_time"
        
        # 显示备份内容
        local tables=($(ls "$backup_dir"/*_data.sql 2>/dev/null | xargs -r basename -s _data.sql || true))
        if [ ${#tables[@]} -gt 0 ]; then
            echo "    包含表: ${tables[*]}"
        fi
        echo ""
    done
    
    echo "使用方法: sudo $0 [备份目录路径]"
}

# 验证数据库连接
test_database_connection() {
    if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 恢复数据库备份
restore_backup() {
    local backup_dir="$1"
    
    if [ -z "$backup_dir" ]; then
        log_error "请指定备份目录路径"
        show_help
        return 1
    fi
    
    if [ ! -d "$backup_dir" ]; then
        log_error "备份目录不存在: $backup_dir"
        return 1
    fi
    
    log_title "恢复数据库备份"
    log_info "备份目录: $backup_dir"
    
    # 检查数据库连接
    log_info "检查数据库连接..."
    if ! test_database_connection; then
        log_error "无法连接到数据库，请确保数据库容器正在运行"
        log_info "可以运行以下命令启动数据库:"
        log_info "  docker start $DB_CONTAINER_NAME"
        return 1
    fi
    
    log_success "数据库连接正常"
    
    # 显示备份信息
    if [ -f "$backup_dir/backup_info.txt" ]; then
        log_info "备份信息:"
        cat "$backup_dir/backup_info.txt" | sed 's/^/  /'
        echo ""
    fi
    
    # 确认操作
    echo -e "${YELLOW}警告: 此操作将覆盖当前数据库中的用户数据！${NC}"
    read -p "确认继续吗？(输入 'yes' 确认): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "操作已取消"
        return 0
    fi
    
    # 恢复关键表数据
    local critical_tables=("job_positions" "users" "resumes" "user_memberships")
    local restored_count=0
    local failed_count=0
    
    log_info "开始恢复数据..."
    
    for table in "${critical_tables[@]}"; do
        local backup_file="$backup_dir/${table}_data.sql"
        
        if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
            log_info "恢复表: $table"
            
            # 先清空表（避免主键冲突）
            if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "TRUNCATE TABLE $table RESTART IDENTITY CASCADE;" 2>/dev/null; then
                log_info "  ✓ 已清空表 $table"
            else
                log_warning "  ⚠ 无法清空表 $table，可能会有数据冲突"
            fi
            
            # 恢复数据
            if docker exec -i $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < "$backup_file" >/dev/null 2>&1; then
                log_success "  ✅ 表 $table 恢复成功"
                restored_count=$((restored_count + 1))
            else
                log_error "  ❌ 表 $table 恢复失败"
                failed_count=$((failed_count + 1))
            fi
        else
            log_warning "  跳过表 $table (备份文件不存在或为空)"
        fi
    done
    
    # 显示恢复结果
    echo ""
    log_title "恢复完成"
    log_info "恢复成功: $restored_count 个表"
    if [ $failed_count -gt 0 ]; then
        log_warning "恢复失败: $failed_count 个表"
    fi
    
    if [ $restored_count -gt 0 ]; then
        log_success "数据备份恢复成功！"
        log_info "建议重启应用服务以确保数据同步:"
        log_info "  pm2 restart resume-backend"
    else
        log_warning "未恢复任何数据"
    fi
}

# 主函数
main() {
    # 检查运行权限
    if [ "$EUID" -ne 0 ]; then
        echo "请使用root权限运行此脚本"
        echo "正确用法: sudo $0"
        exit 1
    fi
    
    # 解析参数
    case "${1:-}" in
        "--list")
            list_backups
            ;;
        "--help"|"-h"|"")
            show_help
            ;;
        *)
            restore_backup "$1"
            ;;
    esac
}

# 执行主函数
main "$@" 