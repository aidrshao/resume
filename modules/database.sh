#!/bin/bash
# =============================================================================
# 数据库管理模块 - AI俊才社简历系统
# =============================================================================

# 数据库连接测试
test_db_connection() {
    local max_attempts="${1:-60}"
    local attempt=1
    
    log_info "🔍 测试数据库连接 (最多 $max_attempts 次尝试)..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $DB_CONTAINER_NAME psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -c "SELECT version();" >/dev/null 2>&1; then
            log_success "数据库连接成功 (第 $attempt 次尝试)"
            return 0
        fi
        
        log_debug "连接尝试 $attempt/$max_attempts 失败，等待..."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    log_error "数据库连接失败，已尝试 $max_attempts 次"
    return 1
}

# 检查数据库密码认证
test_db_auth() {
    log_debug "测试数据库密码认证..."
    
    local auth_result=$(docker exec $DB_CONTAINER_NAME psql -h localhost -p 5432 -U $DB_USER -d $DB_NAME -c "SELECT current_database(), current_user;" 2>&1)
    
    if echo "$auth_result" | grep -q "password authentication failed"; then
        log_error "数据库密码认证失败"
        return 1
    elif echo "$auth_result" | grep -q "$DB_NAME.*$DB_USER"; then
        log_success "数据库密码认证成功"
        return 0
    else
        log_warning "数据库认证状态不明确: $auth_result"
        return 1
    fi
}

# 修复数据库认证问题
fix_db_auth() {
    log_warning "🔧 修复数据库认证问题..."
    
    # 重新创建用户和设置密码
    log_debug "重新设置数据库用户权限..."
    
    docker exec $DB_CONTAINER_NAME psql -U postgres -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
    docker exec $DB_CONTAINER_NAME psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || return 1
    docker exec $DB_CONTAINER_NAME psql -U postgres -c "ALTER USER $DB_USER CREATEDB;" || return 1
    docker exec $DB_CONTAINER_NAME psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || return 1
    
    log_success "数据库认证修复完成"
}

# 清理旧数据库容器
cleanup_db_container() {
    log_info "🧹 清理旧数据库容器..."
    
    # 停止容器
    if docker ps | grep -q "$DB_CONTAINER_NAME"; then
        log_debug "停止运行中的容器: $DB_CONTAINER_NAME"
        docker stop $DB_CONTAINER_NAME >/dev/null 2>&1 || true
    fi
    
    # 删除容器
    if docker ps -a | grep -q "$DB_CONTAINER_NAME"; then
        log_debug "删除容器: $DB_CONTAINER_NAME"
        docker rm $DB_CONTAINER_NAME >/dev/null 2>&1 || true
    fi
    
    log_success "旧容器清理完成"
}

# 启动数据库容器
start_db_container() {
    log_info "🐘 启动PostgreSQL数据库容器..."
    
    # 确保端口未被占用
    if lsof -i :$DB_PORT >/dev/null 2>&1; then
        local process_info=$(lsof -i :$DB_PORT | tail -1)
        log_warning "端口 $DB_PORT 被占用: $process_info"
        
        # 如果是旧的数据库容器，清理它
        local container_id=$(docker ps | grep "$DB_PORT->5432" | awk '{print $1}' | head -1)
        if [ -n "$container_id" ]; then
            log_info "清理占用端口的容器: $container_id"
            docker stop $container_id >/dev/null 2>&1 || true
            docker rm $container_id >/dev/null 2>&1 || true
        fi
    fi
    
    # 创建数据目录
    local data_dir="/var/lib/postgresql/data-resume"
    sudo mkdir -p "$data_dir"
    sudo chown -R 999:999 "$data_dir" 2>/dev/null || true
    
    # 启动新容器
    log_debug "创建PostgreSQL容器..."
    local container_id
    
    container_id=$(docker run -d \
        --name $DB_CONTAINER_NAME \
        -e POSTGRES_DB=$DB_NAME \
        -e POSTGRES_USER=$DB_USER \
        -e POSTGRES_PASSWORD=$DB_PASSWORD \
        -e POSTGRES_INITDB_ARGS="--auth-host=scram-sha-256" \
        -p $DB_PORT:5432 \
        -v "$data_dir:/var/lib/postgresql/data" \
        --restart unless-stopped \
        postgres:15-alpine)
    
    if [ $? -eq 0 ] && [ -n "$container_id" ]; then
        log_success "数据库容器创建成功: $container_id"
    else
        log_error "数据库容器创建失败"
        return 1
    fi
    
    # 等待容器启动
    log_info "⏳ 等待数据库启动..."
    sleep 10
    
    # 检查容器状态
    if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
        log_error "数据库容器启动失败"
        docker logs $DB_CONTAINER_NAME 2>/dev/null | tail -20
        return 1
    fi
    
    # 测试连接
    if test_db_connection 30; then
        log_success "数据库启动并连接成功"
    else
        log_error "数据库启动失败或无法连接"
        return 1
    fi
}

# 运行数据库迁移
run_db_migration() {
    log_info "🔄 运行数据库迁移..."
    
    cd "$PROJECT_DIR/backend"
    
    # 检查环境配置
    if [ ! -f ".env" ]; then
        log_error "后端环境配置文件不存在"
        return 1
    fi
    
    # 验证数据库连接
    log_debug "迁移前验证数据库连接..."
    if ! test_db_connection 10; then
        log_error "数据库连接失败，无法进行迁移"
        return 1
    fi
    
    # 测试认证
    if ! test_db_auth; then
        log_warning "数据库认证失败，尝试修复..."
        if ! fix_db_auth; then
            log_error "数据库认证修复失败"
            return 1
        fi
        
        # 重新测试
        if ! test_db_auth; then
            log_error "数据库认证仍然失败"
            return 1
        fi
    fi
    
    # 执行迁移
    log_debug "执行knex迁移..."
    local migration_result
    
    # 首先回滚到最新状态
    log_debug "回滚数据库到最新状态..."
    npm run migrate:rollback 2>/dev/null || true
    
    # 执行最新迁移
    log_debug "执行最新迁移..."
    if migration_result=$(npm run migrate:latest 2>&1); then
        log_success "数据库迁移完成"
        log_debug "迁移输出: $migration_result"
    else
        log_error "数据库迁移失败"
        log_error "迁移输出: $migration_result"
        
        # 如果是认证问题，尝试修复
        if echo "$migration_result" | grep -q "password authentication failed"; then
            log_warning "检测到认证问题，尝试修复后重新迁移..."
            fix_db_auth
            
            # 重新尝试迁移
            if migration_result=$(npm run migrate:latest 2>&1); then
                log_success "修复后数据库迁移完成"
            else
                log_error "修复后迁移仍然失败: $migration_result"
                return 1
            fi
        else
            return 1
        fi
    fi
    
    # 验证迁移结果
    log_debug "验证迁移结果..."
    local table_count=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    
    if [ "$table_count" -gt 0 ]; then
        log_success "迁移验证通过，共创建 $table_count 个表"
    else
        log_warning "迁移验证异常，表数量: $table_count"
    fi
}

# 创建数据库备份
backup_database() {
    local backup_name="${1:-resume_backup_$(date +%Y%m%d_%H%M%S)}"
    local backup_file="$BACKUP_DIR/${backup_name}.sql"
    
    log_info "📦 创建数据库备份: $backup_name"
    
    mkdir -p "$BACKUP_DIR"
    
    if docker exec $DB_CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > "$backup_file"; then
        log_success "数据库备份完成: $backup_file"
        
        # 压缩备份文件
        gzip "$backup_file"
        log_success "备份文件已压缩: ${backup_file}.gz"
    else
        log_error "数据库备份失败"
        return 1
    fi
}

# 恢复数据库备份
restore_database() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi
    
    log_info "🔄 恢复数据库备份: $backup_file"
    
    # 如果是压缩文件，先解压
    if [[ "$backup_file" == *.gz ]]; then
        local uncompressed_file="${backup_file%.gz}"
        gunzip -c "$backup_file" > "$uncompressed_file"
        backup_file="$uncompressed_file"
    fi
    
    # 删除现有数据
    docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >/dev/null 2>&1
    
    # 恢复数据
    if docker exec -i $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < "$backup_file"; then
        log_success "数据库恢复完成"
    else
        log_error "数据库恢复失败"
        return 1
    fi
}

# 数据库健康检查
health_check_db() {
    log_info "🔍 数据库健康检查..."
    
    # 检查容器状态
    if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
        log_error "数据库容器未运行"
        return 1
    fi
    
    # 检查连接
    if ! test_db_connection 5; then
        log_error "数据库连接失败"
        return 1
    fi
    
    # 检查认证
    if ! test_db_auth; then
        log_error "数据库认证失败"
        return 1
    fi
    
    # 检查表结构
    local table_count=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$table_count" -gt 0 ]; then
        log_success "数据库健康检查通过 (表数量: $table_count)"
        return 0
    else
        log_error "数据库健康检查失败，无有效表结构"
        return 1
    fi
}

# 显示数据库信息
show_db_info() {
    log_info "📊 数据库信息:"
    log_info "  容器名: $DB_CONTAINER_NAME"
    log_info "  端口: $DB_PORT"
    log_info "  数据库: $DB_NAME"
    log_info "  用户: $DB_USER"
    
    if docker ps | grep -q "$DB_CONTAINER_NAME"; then
        local container_status=$(docker ps --format "table {{.Status}}" | grep -A1 "STATUS" | tail -1)
        log_info "  状态: $container_status"
        
        # 显示表信息
        local table_info=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "\dt" 2>/dev/null || echo "无法获取表信息")
        log_info "  表信息:"
        echo "$table_info" | while IFS= read -r line; do
            log_info "    $line"
        done
    else
        log_warning "  状态: 容器未运行"
    fi
}

# 完整数据库设置
setup_database() {
    log_subtitle "配置PostgreSQL数据库"
    
    # 清理旧容器
    cleanup_db_container
    
    # 启动新容器
    start_db_container || return 1
    
    # 运行迁移
    run_db_migration || return 1
    
    # 健康检查
    health_check_db || return 1
    
    log_success "数据库设置完成"
}

# 导出函数
export -f test_db_connection test_db_auth fix_db_auth
export -f cleanup_db_container start_db_container run_db_migration
export -f backup_database restore_database health_check_db
export -f show_db_info setup_database 