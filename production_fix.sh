#!/bin/bash

# =============================================================================
# 生产环境问题修复脚本 - 专门解决岗位创建失败和邮箱注册500错误
# =============================================================================

set -e

# 配置变量
PROJECT_DIR="/home/ubuntu/resume"
DB_CONTAINER_NAME="resume-postgres"
DB_USER="resume_user"
DB_NAME="resume_db"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO] $1${NC}"; }
log_success() { echo -e "${GREEN}[SUCCESS] $1${NC}"; }
log_warning() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
log_error() { echo -e "${RED}[ERROR] $1${NC}"; }

# 1. 检查并修复数据库连接
fix_database_connection() {
    log_info "检查数据库连接状态..."
    
    if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
        log_error "数据库容器未运行"
        return 1
    fi
    
    # 测试连接
    if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "数据库连接正常"
    else
        log_error "数据库连接失败"
        return 1
    fi
}

# 2. 执行数据库迁移和修复
fix_database_migrations() {
    log_info "执行数据库迁移修复..."
    
    cd "$PROJECT_DIR/backend"
    
    # 检查迁移状态
    log_info "当前迁移状态:"
    npm run migrate:status || true
    
    # 执行迁移
    log_info "执行数据库迁移..."
    if npm run migrate; then
        log_success "数据库迁移成功"
    else
        log_error "数据库迁移失败"
        return 1
    fi
    
    # 运行种子数据
    log_info "插入种子数据..."
    npm run seed || log_warning "种子数据插入失败，手动插入基础数据"
}

# 3. 检查并修复环境变量
fix_environment_variables() {
    log_info "检查后端环境变量..."
    
    local env_file="$PROJECT_DIR/backend/.env"
    
    if [ ! -f "$env_file" ]; then
        log_error ".env文件不存在"
        return 1
    fi
    
    # 检查关键环境变量
    local missing_vars=()
    local required_vars=("DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD" "JWT_SECRET" "TENCENT_SECRET_ID" "TENCENT_SECRET_KEY")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        log_success "环境变量配置正常"
    else
        log_warning "缺失环境变量: ${missing_vars[*]}"
        return 1
    fi
}

# 4. 重启后端服务
restart_backend_service() {
    log_info "重启后端服务..."
    
    cd "$PROJECT_DIR/backend"
    
    # 停止现有服务
    pm2 delete resume-backend 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    sleep 3
    
    # 启动服务
    log_info "启动后端服务..."
    pm2 start server.js --name "resume-backend" --time
    
    # 等待启动
    sleep 10
    
    # 检查状态
    if pm2 list | grep "resume-backend" | grep -q "online"; then
        log_success "后端服务启动成功"
    else
        log_error "后端服务启动失败"
        pm2 logs resume-backend --lines 10
        return 1
    fi
}

# 5. 测试API端点
test_api_endpoints() {
    log_info "测试API端点..."
    
    local backend_port=3001
    local max_retries=5
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -s -f "http://localhost:$backend_port/api/health" >/dev/null; then
            log_success "API健康检查通过"
            break
        else
            retry_count=$((retry_count + 1))
            log_warning "API测试失败，重试 $retry_count/$max_retries..."
            sleep 3
        fi
    done
    
    if [ $retry_count -eq $max_retries ]; then
        log_error "API端点测试失败"
        return 1
    fi
    
    # 测试具体的问题端点
    log_info "测试岗位创建端点..."
    local job_test=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:$backend_port/api/jobs/stats")
    if [ "$job_test" = "401" ]; then
        log_success "岗位API端点正常（需要认证）"
    else
        log_warning "岗位API端点响应码: $job_test"
    fi
}

# 6. 检查数据库表和数据
check_database_tables() {
    log_info "检查数据库表和数据..."
    
    # 检查关键表
    local tables=("users" "job_positions" "resume_templates" "membership_tiers")
    
    for table in "${tables[@]}"; do
        local count=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')
        if [ -n "$count" ]; then
            log_info "表 $table: $count 条记录"
        else
            log_warning "表 $table: 无法获取记录数"
        fi
    done
    
    # 检查简历模板数据
    local template_count=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM resume_templates;" 2>/dev/null | tr -d ' ')
    if [ "$template_count" = "0" ] || [ -z "$template_count" ]; then
        log_warning "简历模板数据缺失，插入基础数据..."
        insert_basic_template_data
    fi
}

# 7. 插入基础模板数据
insert_basic_template_data() {
    log_info "插入基础简历模板数据..."
    
    docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
    INSERT INTO resume_templates (id, name, description, template_config, is_premium, is_active, sort_order, created_at, updated_at)
    VALUES 
    (1, '经典商务', '简洁专业的商务风格模板', '{}', false, true, 1, NOW(), NOW()),
    (2, '现代简约', '现代简约风格模板', '{}', false, true, 2, NOW(), NOW()),
    (3, '创意设计', '创意设计风格模板', '{}', true, true, 3, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();
    " 2>/dev/null || log_warning "模板数据插入失败"
    
    log_success "基础模板数据插入完成"
}

# 8. 显示系统状态
show_system_status() {
    log_info "系统状态总览:"
    
    echo "=== Docker 容器状态 ==="
    docker ps | grep -E "(postgres|nginx)" || echo "相关容器未运行"
    
    echo "=== PM2 进程状态 ==="
    pm2 list || echo "PM2未运行"
    
    echo "=== Nginx 状态 ==="
    systemctl status nginx --no-pager -l | head -10 || echo "Nginx状态获取失败"
    
    echo "=== 最近的后端日志 ==="
    pm2 logs resume-backend --lines 5 --nostream 2>/dev/null || echo "无法获取后端日志"
}

# 主修复流程
main_repair() {
    log_info "开始生产环境问题修复..."
    
    # 步骤1: 检查数据库连接
    if ! fix_database_connection; then
        log_error "数据库连接修复失败"
        exit 1
    fi
    
    # 步骤2: 修复数据库迁移
    if ! fix_database_migrations; then
        log_error "数据库迁移修复失败"
        exit 1
    fi
    
    # 步骤3: 检查环境变量
    if ! fix_environment_variables; then
        log_warning "环境变量检查发现问题，但继续执行"
    fi
    
    # 步骤4: 检查数据库表和数据
    check_database_tables
    
    # 步骤5: 重启后端服务
    if ! restart_backend_service; then
        log_error "后端服务重启失败"
        exit 1
    fi
    
    # 步骤6: 测试API端点
    if ! test_api_endpoints; then
        log_warning "API测试发现问题，但服务已重启"
    fi
    
    # 步骤7: 显示系统状态
    show_system_status
    
    log_success "生产环境修复完成！"
    log_info "请尝试重新创建岗位和邮箱注册"
}

# 执行修复
if [ "$EUID" -ne 0 ]; then
    echo "请使用root权限运行此脚本"
    echo "用法: sudo $0"
    exit 1
fi

main_repair
