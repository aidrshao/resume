#!/bin/bash

# 修复用户序列问题的脚本
# 解决因手动插入ID导致的主键冲突问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 数据库配置
DB_CONTAINER_NAME="resume-postgres"
DB_USER="postgres"
DB_NAME="resume_db"

echo "============================================"
echo "修复用户序列问题"
echo "============================================"

# 检查数据库容器是否运行
log_info "检查数据库容器状态..."
if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
    log_error "数据库容器 $DB_CONTAINER_NAME 未运行"
    exit 1
fi

log_success "数据库容器运行正常"

# 查看当前用户表状态
log_info "查看当前用户表状态..."
echo "当前用户列表："
docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
SELECT id, email, email_verified, created_at 
FROM users 
ORDER BY id;
"

# 查看当前序列值
log_info "查看当前序列值..."
current_seq=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT last_value FROM users_id_seq;" | tr -d ' ')
log_info "当前序列值: $current_seq"

# 查看最大ID
max_id=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COALESCE(MAX(id), 0) FROM users;" | tr -d ' ')
log_info "当前最大ID: $max_id"

# 如果序列值小于等于最大ID，需要重置序列
if [ "$current_seq" -le "$max_id" ]; then
    log_warning "序列值 ($current_seq) 小于等于最大ID ($max_id)，需要重置序列"
    
    # 计算新的序列值
    new_seq_value=$((max_id + 1))
    log_info "将序列重置为: $new_seq_value"
    
    # 重置序列
    docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
    SELECT setval('users_id_seq', $new_seq_value, false);
    "
    
    # 验证序列重置
    updated_seq=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT last_value FROM users_id_seq;" | tr -d ' ')
    log_success "序列已重置为: $updated_seq"
else
    log_success "序列值正常，无需重置"
fi

# 测试插入新用户
log_info "测试插入新用户..."
test_email="test_$(date +%s)@example.com"

docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
INSERT INTO users (email, password_hash, email_verified, created_at, updated_at) 
VALUES (
    '$test_email', 
    '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    true, 
    NOW(), 
    NOW()
);
"

if [ $? -eq 0 ]; then
    log_success "测试用户插入成功"
    
    # 获取插入的用户ID
    test_user_id=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT id FROM users WHERE email = '$test_email';" | tr -d ' ')
    log_info "测试用户ID: $test_user_id"
    
    # 删除测试用户
    docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "DELETE FROM users WHERE email = '$test_email';"
    log_info "测试用户已删除"
else
    log_error "测试用户插入失败"
    exit 1
fi

# 显示修复后的状态
log_info "修复后的状态："
echo "用户列表："
docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
SELECT id, email, email_verified, created_at 
FROM users 
ORDER BY id;
"

final_seq=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT last_value FROM users_id_seq;" | tr -d ' ')
log_success "最终序列值: $final_seq"

echo "============================================"
log_success "用户序列修复完成！"
echo "============================================"

log_info "现在可以正常注册新用户了"
