#!/bin/bash

# =============================================================================
# AI俊才社简历系统 - 备份系统测试脚本
# =============================================================================

set -e

# 配置参数
readonly PROJECT_DIR="/home/ubuntu/resume"
readonly BACKUP_SCRIPT="./backup_system.sh"
readonly TEST_BACKUP_DIR="/tmp/backup_test"
readonly DB_CONTAINER_NAME="resume-postgres"
readonly DB_NAME="resume_db"
readonly DB_USER="resume_user"

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

log_info() { echo -e "${BLUE}[TEST]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 测试环境检查
test_environment() {
    log_info "测试环境检查..."
    
    # 检查备份脚本是否存在
    if [ ! -f "$BACKUP_SCRIPT" ]; then
        log_error "备份脚本不存在: $BACKUP_SCRIPT"
        return 1
    fi
    
    # 检查数据库容器
    if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
        log_error "数据库容器未运行: $DB_CONTAINER_NAME"
        return 1
    fi
    
    # 测试数据库连接
    if ! docker exec "$DB_CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        log_error "数据库连接失败"
        return 1
    fi
    
    log_success "环境检查通过"
}

# 测试备份功能
test_backup() {
    log_info "测试备份功能..."
    
    # 执行测试备份
    if sudo "$BACKUP_SCRIPT" backup daily; then
        log_success "备份执行成功"
    else
        log_error "备份执行失败"
        return 1
    fi
    
    # 检查备份文件是否生成
    local backup_dir="/var/backups/resume-system/daily"
    if [ -d "$backup_dir" ] && [ "$(ls -A "$backup_dir")" ]; then
        log_success "备份文件已生成"
        
        # 显示备份内容
        log_info "备份内容:"
        find "$backup_dir" -type f -name "*.sql" -o -name "*.dump" | head -5 | while read -r file; do
            local size=$(stat -c%s "$file" 2>/dev/null || echo "0")
            echo "  $(basename "$file"): $((size / 1024))KB"
        done
    else
        log_error "备份文件未生成"
        return 1
    fi
}

# 测试备份列表功能
test_list_backups() {
    log_info "测试备份列表功能..."
    
    if sudo "$BACKUP_SCRIPT" list; then
        log_success "备份列表显示成功"
    else
        log_error "备份列表显示失败"
        return 1
    fi
}

# 测试备份验证功能
test_verify_backup() {
    log_info "测试备份验证功能..."
    
    # 找到最新的备份目录
    local latest_backup=$(find /var/backups/resume-system/daily -maxdepth 1 -type d -name "20*" | sort -r | head -1)
    
    if [ -n "$latest_backup" ]; then
        if sudo "$BACKUP_SCRIPT" verify "$latest_backup"; then
            log_success "备份验证通过"
        else
            log_error "备份验证失败"
            return 1
        fi
    else
        log_warning "未找到备份目录，跳过验证测试"
    fi
}

# 创建测试数据
create_test_data() {
    log_info "创建测试数据..."
    
    # 在数据库中插入测试数据
    docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
    INSERT INTO users (email, password_hash, email_verified, created_at, updated_at)
    VALUES ('test_backup@example.com', 'test_hash', true, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    " 2>/dev/null || log_warning "测试数据插入失败"
    
    log_success "测试数据创建完成"
}

# 验证测试数据
verify_test_data() {
    log_info "验证测试数据..."
    
    local user_count=$(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT COUNT(*) FROM users WHERE email = 'test_backup@example.com';
    " 2>/dev/null | xargs)
    
    if [ "$user_count" = "1" ]; then
        log_success "测试数据验证通过"
        return 0
    else
        log_error "测试数据验证失败"
        return 1
    fi
}

# 清理测试数据
cleanup_test_data() {
    log_info "清理测试数据..."
    
    docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
    DELETE FROM users WHERE email = 'test_backup@example.com';
    " 2>/dev/null || log_warning "测试数据清理失败"
    
    log_success "测试数据清理完成"
}

# 测试恢复功能（模拟）
test_restore_simulation() {
    log_info "测试恢复功能（模拟）..."
    
    # 找到最新的SQL备份文件
    local latest_sql_backup=$(find /var/backups/resume-system/daily -name "*.sql" | sort -r | head -1)
    
    if [ -n "$latest_sql_backup" ] && [ -f "$latest_sql_backup" ]; then
        log_info "找到备份文件: $(basename "$latest_sql_backup")"
        
        # 检查备份文件内容
        if grep -q "CREATE TABLE" "$latest_sql_backup" 2>/dev/null; then
            log_success "备份文件包含数据库结构"
        else
            log_warning "备份文件可能不完整"
        fi
        
        if grep -q "INSERT INTO" "$latest_sql_backup" 2>/dev/null; then
            log_success "备份文件包含数据"
        else
            log_warning "备份文件可能不包含数据"
        fi
        
        log_success "恢复功能模拟测试通过"
    else
        log_error "未找到可用的备份文件"
        return 1
    fi
}

# 测试磁盘空间检查
test_disk_space() {
    log_info "测试磁盘空间检查..."
    
    local available_space_kb=$(df /var/backups | awk 'NR==2 {print $4}')
    local available_space_gb=$((available_space_kb / 1024 / 1024))
    
    log_info "可用磁盘空间: ${available_space_gb}GB"
    
    if [ "$available_space_gb" -ge 5 ]; then
        log_success "磁盘空间充足"
    else
        log_warning "磁盘空间可能不足，建议清理"
    fi
}

# 性能测试
test_performance() {
    log_info "执行性能测试..."
    
    local start_time=$(date +%s)
    
    # 执行一次快速备份测试
    if sudo "$BACKUP_SCRIPT" backup daily >/dev/null 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "备份性能测试完成，耗时: ${duration}秒"
        
        if [ "$duration" -lt 300 ]; then
            log_success "备份性能良好（< 5分钟）"
        else
            log_warning "备份耗时较长，建议优化"
        fi
    else
        log_error "性能测试失败"
        return 1
    fi
}

# 生成测试报告
generate_test_report() {
    log_info "生成测试报告..."
    
    local report_file="/tmp/backup_test_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "============================================"
        echo "AI俊才社简历系统 - 备份系统测试报告"
        echo "============================================"
        echo ""
        echo "测试时间: $(date)"
        echo "测试环境: $(uname -a)"
        echo ""
        echo "=== 系统状态 ==="
        echo "数据库容器: $(docker ps | grep "$DB_CONTAINER_NAME" | awk '{print $1}' || echo '未运行')"
        echo "备份目录: /var/backups/resume-system"
        echo "可用磁盘空间: $(df -h /var/backups | awk 'NR==2 {print $4}')"
        echo ""
        echo "=== 备份统计 ==="
        echo "日备份数量: $(find /var/backups/resume-system/daily -maxdepth 1 -type d -name "20*" 2>/dev/null | wc -l)"
        echo "周备份数量: $(find /var/backups/resume-system/weekly -maxdepth 1 -type d -name "20*" 2>/dev/null | wc -l)"
        echo "月备份数量: $(find /var/backups/resume-system/monthly -maxdepth 1 -type d -name "20*" 2>/dev/null | wc -l)"
        echo ""
        echo "=== 最新备份 ==="
        local latest_backup=$(find /var/backups/resume-system -name "*.sql" | sort -r | head -1)
        if [ -n "$latest_backup" ]; then
            echo "最新备份: $(basename "$latest_backup")"
            echo "备份大小: $(stat -c%s "$latest_backup" 2>/dev/null | awk '{print int($1/1024/1024)"MB"}' || echo '未知')"
            echo "备份时间: $(stat -c%y "$latest_backup" 2>/dev/null | cut -d' ' -f1-2 || echo '未知')"
        else
            echo "未找到备份文件"
        fi
        echo ""
        echo "=== 建议 ==="
        echo "1. 定期检查备份完整性"
        echo "2. 监控磁盘空间使用情况"
        echo "3. 测试恢复流程"
        echo "4. 考虑配置远程备份"
        echo ""
        echo "测试完成时间: $(date)"
    } > "$report_file"
    
    log_success "测试报告已生成: $report_file"
    
    # 显示报告内容
    cat "$report_file"
}

# 主测试流程
run_all_tests() {
    log_info "开始执行备份系统完整测试..."
    
    local test_results=()
    
    # 执行各项测试
    test_environment && test_results+=("环境检查: ✅") || test_results+=("环境检查: ❌")
    test_disk_space && test_results+=("磁盘空间: ✅") || test_results+=("磁盘空间: ❌")
    create_test_data && test_results+=("创建测试数据: ✅") || test_results+=("创建测试数据: ❌")
    test_backup && test_results+=("备份功能: ✅") || test_results+=("备份功能: ❌")
    test_list_backups && test_results+=("列表功能: ✅") || test_results+=("列表功能: ❌")
    test_verify_backup && test_results+=("验证功能: ✅") || test_results+=("验证功能: ❌")
    test_restore_simulation && test_results+=("恢复模拟: ✅") || test_results+=("恢复模拟: ❌")
    verify_test_data && test_results+=("数据验证: ✅") || test_results+=("数据验证: ❌")
    test_performance && test_results+=("性能测试: ✅") || test_results+=("性能测试: ❌")
    
    # 清理测试数据
    cleanup_test_data
    
    # 显示测试结果
    echo ""
    echo "============================================"
    echo "测试结果总结"
    echo "============================================"
    for result in "${test_results[@]}"; do
        echo "$result"
    done
    echo ""
    
    # 生成详细报告
    generate_test_report
    
    # 检查是否所有测试都通过
    local failed_tests=$(printf '%s\n' "${test_results[@]}" | grep -c "❌" || true)
    
    if [ "$failed_tests" -eq 0 ]; then
        log_success "所有测试通过！备份系统运行正常"
        return 0
    else
        log_warning "$failed_tests 项测试失败，请检查相关功能"
        return 1
    fi
}

# 快速测试
quick_test() {
    log_info "执行快速备份测试..."
    
    test_environment || return 1
    test_backup || return 1
    test_list_backups || return 1
    
    log_success "快速测试完成"
}

# 显示帮助信息
show_help() {
    cat << 'EOF'
备份系统测试脚本

用法: ./backup_test.sh <命令>

命令:
  full      执行完整测试（默认）
  quick     执行快速测试
  env       仅测试环境
  backup    仅测试备份功能
  list      仅测试列表功能
  verify    仅测试验证功能
  perf      仅测试性能
  report    生成测试报告
  help      显示此帮助信息

示例:
  ./backup_test.sh full     # 完整测试
  ./backup_test.sh quick    # 快速测试
  ./backup_test.sh backup   # 仅测试备份
EOF
}

# 主函数
main() {
    local command="${1:-full}"
    
    case "$command" in
        "full")
            run_all_tests
            ;;
        "quick")
            quick_test
            ;;
        "env")
            test_environment
            ;;
        "backup")
            test_backup
            ;;
        "list")
            test_list_backups
            ;;
        "verify")
            test_verify_backup
            ;;
        "perf")
            test_performance
            ;;
        "report")
            generate_test_report
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"