#!/bin/bash

# =============================================================================
# 数据库修复脚本 - 专门用于生产环境数据库问题修复
# =============================================================================

set -e

# 配置变量
DB_HOST="localhost"
DB_PORT=5433
DB_NAME="resume_db"
DB_USER="resume_user"
DB_PASSWORD="ResumePass123"
DB_CONTAINER_NAME="resume-postgres"
PROJECT_DIR="/home/ubuntu/resume"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 测试数据库连接
test_database_connection() {
    log_info "测试数据库连接..."
    
    # 检查数据库容器是否运行
    if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
        log_error "数据库容器未运行"
        return 1
    fi
    
    # 测试数据库连接
    local connection_test=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" 2>/dev/null | grep -c "1 row")
    
    if [ "$connection_test" = "1" ]; then
        log_success "数据库连接正常"
        return 0
    else
        log_error "数据库连接失败"
        return 1
    fi
}

# 验证关键表
verify_critical_tables() {
    log_info "验证数据库关键表..."
    
    local required_tables=("users" "resumes" "resume_templates" "email_verifications" "job_positions" "membership_tiers" "user_memberships")
    local missing_tables=()
    
    for table in "${required_tables[@]}"; do
        local exists=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" 2>/dev/null | tr -d ' \n')
        
        if [ "$exists" != "t" ]; then
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
        log_success "所有关键表都存在"
        return 0
    else
        log_warning "发现缺失的表: ${missing_tables[*]}"
        return 1
    fi
}

# 执行数据库迁移
run_database_migrations() {
    log_info "执行数据库迁移..."
    
    cd "$PROJECT_DIR/backend"
    
    # 检查迁移状态
    log_info "检查当前迁移状态..."
    npm run migrate:status
    
    # 执行迁移
    log_info "执行数据库迁移..."
    if npm run migrate; then
        log_success "数据库迁移执行成功"
        return 0
    else
        log_error "数据库迁移执行失败"
        return 1
    fi
}

# 插入基础数据
insert_basic_data() {
    log_info "插入基础数据..."
    
    # 插入简历模板数据
    log_info "插入简历模板数据..."
    docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
    INSERT INTO resume_templates (id, name, description, template_config, is_premium, is_active, sort_order, created_at, updated_at)
    VALUES 
    (1, '经典商务', '简洁专业的商务风格模板，适合大多数行业', '{\"layout\":\"single-column\",\"colors\":{\"primary\":\"#2563eb\",\"secondary\":\"#64748b\",\"text\":\"#1e293b\"},\"fonts\":{\"heading\":\"Inter\",\"body\":\"Inter\"},\"sections\":[\"header\",\"summary\",\"experience\",\"education\",\"skills\"]}', false, true, 1, NOW(), NOW()),
    (2, '现代简约', '现代简约风格，突出重点信息', '{\"layout\":\"two-column\",\"colors\":{\"primary\":\"#059669\",\"secondary\":\"#6b7280\",\"text\":\"#111827\"},\"fonts\":{\"heading\":\"Inter\",\"body\":\"Inter\"},\"sections\":[\"header\",\"summary\",\"experience\",\"education\",\"skills\"]}', false, true, 2, NOW(), NOW()),
    (3, '创意设计', '创意设计风格，适合设计类职位', '{\"layout\":\"creative\",\"colors\":{\"primary\":\"#7c3aed\",\"secondary\":\"#9ca3af\",\"text\":\"#1f2937\"},\"fonts\":{\"heading\":\"Inter\",\"body\":\"Inter\"},\"sections\":[\"header\",\"summary\",\"experience\",\"education\",\"skills\"]}', true, true, 3, NOW(), NOW()),
    (4, '时尚创意', '时尚创意风格模板，适合创意类职位', '{\"layout\":\"modern\",\"colors\":{\"primary\":\"#ec4899\",\"secondary\":\"#64748b\",\"text\":\"#1e293b\"},\"fonts\":{\"heading\":\"Inter\",\"body\":\"Inter\"},\"sections\":[\"header\",\"summary\",\"experience\",\"education\",\"skills\"]}', true, true, 4, NOW(), NOW()),
    (5, '简约大气', '简约大气风格模板，适合管理类职位', '{\"layout\":\"elegant\",\"colors\":{\"primary\":\"#0f172a\",\"secondary\":\"#64748b\",\"text\":\"#1e293b\"},\"fonts\":{\"heading\":\"Inter\",\"body\":\"Inter\"},\"sections\":[\"header\",\"summary\",\"experience\",\"education\",\"skills\"]}', true, true, 5, NOW(), NOW()),
    (6, '专业侧边栏', '专业侧边栏风格模板，适合技术类职位', '{\"layout\":\"sidebar\",\"colors\":{\"primary\":\"#2c3e50\",\"secondary\":\"#f9c922\",\"text\":\"#1e293b\"},\"fonts\":{\"heading\":\"Inter\",\"body\":\"Inter\"},\"sections\":[\"header\",\"summary\",\"experience\",\"education\",\"skills\"]}', true, true, 6, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW();
    " 2>/dev/null || log_warning "简历模板数据插入可能失败"
    
    # 插入会员套餐数据
    log_info "插入会员套餐数据..."
    docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
    INSERT INTO membership_tiers (id, name, description, original_price, duration_days, ai_resume_quota, template_access_level, is_active, sort_order, created_at, updated_at)
    VALUES 
    (1, '免费版', '基础功能，适合个人用户', 0.00, 0, 3, 'basic', true, 1, NOW(), NOW()),
    (2, '专业版', '专业功能，适合求职者', 29.90, 30, 20, 'advanced', true, 2, NOW(), NOW()),
    (3, '高级版', '全功能版本，适合频繁求职', 99.90, 365, 100, 'all', true, 3, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW();
    " 2>/dev/null || log_warning "会员套餐数据插入可能失败"
    
    log_success "基础数据插入完成"
}

# 检查基础数据
check_basic_data() {
    log_info "检查基础数据..."
    
    # 检查简历模板数据
    local template_count=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM resume_templates;" 2>/dev/null | tr -d ' ')
    log_info "简历模板数量: $template_count"
    
    # 检查会员套餐数据
    local tier_count=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM membership_tiers;" 2>/dev/null | tr -d ' ')
    log_info "会员套餐数量: $tier_count"
    
    # 检查用户数据
    local user_count=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    log_info "用户数量: $user_count"
    
    if [ "$template_count" = "0" ] || [ "$tier_count" = "0" ]; then
        log_warning "基础数据缺失，需要插入"
        return 1
    else
        log_success "基础数据正常"
        return 0
    fi
}

# 完整的数据库修复流程
full_database_repair() {
    log_info "开始完整数据库修复流程..."
    
    # 1. 测试数据库连接
    if ! test_database_connection; then
        log_error "数据库连接失败，无法进行修复"
        exit 1
    fi
    
    # 2. 验证关键表
    if ! verify_critical_tables; then
        log_info "关键表缺失，执行迁移..."
        if ! run_database_migrations; then
            log_error "数据库迁移失败"
            exit 1
        fi
    fi
    
    # 3. 检查基础数据
    if ! check_basic_data; then
        log_info "基础数据缺失，插入基础数据..."
        insert_basic_data
    fi
    
    # 4. 最终验证
    log_info "最终验证..."
    if verify_critical_tables && check_basic_data; then
        log_success "数据库修复完成，所有检查通过"
    else
        log_error "数据库修复后仍有问题"
        exit 1
    fi
}

# 主函数
main() {
    case "${1:-full}" in
        "test")
            test_database_connection
            ;;
        "migrate")
            run_database_migrations
            ;;
        "data")
            insert_basic_data
            ;;
        "check")
            verify_critical_tables && check_basic_data
            ;;
        "full")
            full_database_repair
            ;;
        *)
            echo "用法: $0 [test|migrate|data|check|full]"
            echo "  test    - 测试数据库连接"
            echo "  migrate - 执行数据库迁移"
            echo "  data    - 插入基础数据"
            echo "  check   - 检查数据库状态"
            echo "  full    - 完整修复流程（默认）"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
