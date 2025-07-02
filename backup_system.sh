#!/bin/bash

# =============================================================================
# AI俊才社简历系统 - 企业级数据备份系统
# =============================================================================

set -euo pipefail

# ==================== 配置参数 ====================

# 项目配置
readonly PROJECT_NAME="resume-system"
readonly PROJECT_DIR="/home/ubuntu/resume"
readonly BACKUP_BASE_DIR="/var/backups/resume-system"
readonly LOG_DIR="/var/log/resume-backup"

# 数据库配置
readonly DB_CONTAINER_NAME="resume-postgres"
readonly DB_HOST="localhost"
readonly DB_PORT="5433"
readonly DB_NAME="resume_db"
readonly DB_USER="resume_user"

# 备份配置
readonly BACKUP_RETENTION_DAYS=30
readonly WEEKLY_RETENTION_WEEKS=12
readonly MONTHLY_RETENTION_MONTHS=12
readonly YEARLY_RETENTION_YEARS=3

# 压缩和加密配置
readonly COMPRESSION_LEVEL=9
readonly ENCRYPTION_ENABLED=true
readonly GPG_RECIPIENT="backup@juncaishe.com"

# 远程备份配置（可选）
readonly REMOTE_BACKUP_ENABLED=false
readonly REMOTE_HOST=""
readonly REMOTE_USER=""
readonly REMOTE_PATH=""

# 通知配置
readonly NOTIFICATION_ENABLED=true
readonly NOTIFICATION_EMAIL="admin@juncaishe.com"
readonly WEBHOOK_URL=""

# ==================== 颜色和日志 ====================

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# 日志函数
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_file="$LOG_DIR/backup-$(date +%Y%m%d).log"
    
    # 确保日志目录存在
    mkdir -p "$LOG_DIR"
    
    # 写入日志文件
    echo "[$timestamp] [$level] $message" >> "$log_file"
    
    # 控制台输出
    case "$level" in
        "INFO")  echo -e "${BLUE}[INFO]${NC} $message" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
        "WARNING") echo -e "${YELLOW}[WARNING]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
        "DEBUG") echo -e "${PURPLE}[DEBUG]${NC} $message" ;;
        *) echo "[$level] $message" ;;
    esac
}

log_info() { log "INFO" "$1"; }
log_success() { log "SUCCESS" "$1"; }
log_warning() { log "WARNING" "$1"; }
log_error() { log "ERROR" "$1"; }
log_debug() { log "DEBUG" "$1"; }

# ==================== 工具函数 ====================

# 检查命令是否存在
check_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        log_error "命令 '$cmd' 未找到，请先安装"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    local required_space_gb="$1"
    local available_space_kb=$(df "$BACKUP_BASE_DIR" | awk 'NR==2 {print $4}')
    local available_space_gb=$((available_space_kb / 1024 / 1024))
    
    if [ "$available_space_gb" -lt "$required_space_gb" ]; then
        log_error "磁盘空间不足：需要 ${required_space_gb}GB，可用 ${available_space_gb}GB"
        return 1
    fi
    
    log_info "磁盘空间检查通过：可用 ${available_space_gb}GB"
}

# 获取文件大小（MB）
get_file_size_mb() {
    local file="$1"
    if [ -f "$file" ]; then
        local size_bytes=$(stat -c%s "$file")
        echo $((size_bytes / 1024 / 1024))
    else
        echo "0"
    fi
}

# 发送通知
send_notification() {
    local subject="$1"
    local message="$2"
    local status="$3"  # success, warning, error
    
    if [ "$NOTIFICATION_ENABLED" = "true" ]; then
        # 邮件通知
        if command -v mail >/dev/null 2>&1; then
            echo "$message" | mail -s "[$PROJECT_NAME] $subject" "$NOTIFICATION_EMAIL" 2>/dev/null || true
        fi
        
        # Webhook通知
        if [ -n "$WEBHOOK_URL" ] && command -v curl >/dev/null 2>&1; then
            curl -X POST "$WEBHOOK_URL" \
                -H "Content-Type: application/json" \
                -d "{\"subject\":\"$subject\",\"message\":\"$message\",\"status\":\"$status\"}" \
                >/dev/null 2>&1 || true
        fi
    fi
}

# ==================== 备份功能 ====================

# 创建备份目录结构
create_backup_structure() {
    local backup_date="$1"
    local backup_type="$2"  # daily, weekly, monthly, yearly
    
    local backup_dir="$BACKUP_BASE_DIR/$backup_type/$backup_date"
    mkdir -p "$backup_dir"/{database,files,config,logs}
    
    echo "$backup_dir"
}

# 数据库备份
backup_database() {
    local backup_dir="$1"
    local backup_date="$2"
    
    log_info "开始数据库备份..."
    
    # 检查数据库连接
    if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
        log_error "数据库容器 '$DB_CONTAINER_NAME' 未运行"
        return 1
    fi
    
    # 测试数据库连接
    if ! docker exec "$DB_CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        log_error "数据库连接失败"
        return 1
    fi
    
    local db_backup_file="$backup_dir/database/${DB_NAME}_${backup_date}.sql"
    local db_schema_file="$backup_dir/database/${DB_NAME}_schema_${backup_date}.sql"
    local db_data_file="$backup_dir/database/${DB_NAME}_data_${backup_date}.sql"
    
    # 完整备份
    log_info "创建完整数据库备份..."
    if docker exec "$DB_CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=custom \
        --compress="$COMPRESSION_LEVEL" \
        --file="/tmp/backup.dump" 2>/dev/null; then
        
        docker cp "$DB_CONTAINER_NAME:/tmp/backup.dump" "$db_backup_file.dump"
        docker exec "$DB_CONTAINER_NAME" rm -f "/tmp/backup.dump"
        log_success "完整数据库备份完成"
    else
        log_error "完整数据库备份失败"
        return 1
    fi
    
    # 纯SQL备份（便于查看和恢复）
    log_info "创建SQL格式备份..."
    if docker exec "$DB_CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-password \
        --format=plain \
        --inserts \
        --file="/tmp/backup.sql" 2>/dev/null; then
        
        docker cp "$DB_CONTAINER_NAME:/tmp/backup.sql" "$db_backup_file"
        docker exec "$DB_CONTAINER_NAME" rm -f "/tmp/backup.sql"
        log_success "SQL格式备份完成"
    else
        log_warning "SQL格式备份失败"
    fi
    
    # 仅结构备份
    log_info "创建数据库结构备份..."
    docker exec "$DB_CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --schema-only \
        --no-password \
        --file="/tmp/schema.sql" 2>/dev/null || true
    docker cp "$DB_CONTAINER_NAME:/tmp/schema.sql" "$db_schema_file" 2>/dev/null || true
    docker exec "$DB_CONTAINER_NAME" rm -f "/tmp/schema.sql" 2>/dev/null || true
    
    # 仅数据备份
    log_info "创建数据备份..."
    docker exec "$DB_CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --data-only \
        --inserts \
        --no-password \
        --file="/tmp/data.sql" 2>/dev/null || true
    docker cp "$DB_CONTAINER_NAME:/tmp/data.sql" "$db_data_file" 2>/dev/null || true
    docker exec "$DB_CONTAINER_NAME" rm -f "/tmp/data.sql" 2>/dev/null || true
    
    # 备份数据库元信息
    local db_info_file="$backup_dir/database/database_info.txt"
    {
        echo "备份时间: $(date)"
        echo "数据库名: $DB_NAME"
        echo "数据库用户: $DB_USER"
        echo "数据库版本: $(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" 2>/dev/null | head -1 | xargs)"
        echo "表数量: $(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)"
        echo "数据库大小: $(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | xargs)"
    } > "$db_info_file"
    
    log_success "数据库备份完成"
}

# 文件系统备份
backup_files() {
    local backup_dir="$1"
    local backup_date="$2"
    
    log_info "开始文件系统备份..."
    
    # 后端代码和配置
    if [ -d "$PROJECT_DIR/backend" ]; then
        log_info "备份后端代码..."
        tar -czf "$backup_dir/files/backend_${backup_date}.tar.gz" \
            -C "$PROJECT_DIR" \
            --exclude="node_modules" \
            --exclude="*.log" \
            --exclude=".git" \
            backend/ 2>/dev/null || log_warning "后端代码备份失败"
    fi
    
    # 前端代码
    if [ -d "$PROJECT_DIR/frontend" ]; then
        log_info "备份前端代码..."
        tar -czf "$backup_dir/files/frontend_${backup_date}.tar.gz" \
            -C "$PROJECT_DIR" \
            --exclude="node_modules" \
            --exclude="build" \
            --exclude=".git" \
            frontend/ 2>/dev/null || log_warning "前端代码备份失败"
    fi
    
    # 上传文件
    if [ -d "$PROJECT_DIR/uploads" ]; then
        log_info "备份上传文件..."
        tar -czf "$backup_dir/files/uploads_${backup_date}.tar.gz" \
            -C "$PROJECT_DIR" \
            uploads/ 2>/dev/null || log_warning "上传文件备份失败"
    fi
    
    # 配置文件
    log_info "备份配置文件..."
    mkdir -p "$backup_dir/config"
    
    # 环境配置（排除敏感信息）
    if [ -f "$PROJECT_DIR/backend/.env" ]; then
        grep -v "PASSWORD\|SECRET\|KEY" "$PROJECT_DIR/backend/.env" > "$backup_dir/config/env_template.txt" 2>/dev/null || true
    fi
    
    # Nginx配置
    if [ -f "/etc/nginx/sites-available/resume" ]; then
        cp "/etc/nginx/sites-available/resume" "$backup_dir/config/nginx.conf" 2>/dev/null || true
    fi
    
    # PM2配置
    pm2 save --force 2>/dev/null || true
    if [ -f "/root/.pm2/dump.pm2" ]; then
        cp "/root/.pm2/dump.pm2" "$backup_dir/config/pm2_processes.json" 2>/dev/null || true
    fi
    
    # Docker配置
    if [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
        cp "$PROJECT_DIR/docker-compose.yml" "$backup_dir/config/" 2>/dev/null || true
    fi
    
    log_success "文件系统备份完成"
}

# 系统信息备份
backup_system_info() {
    local backup_dir="$1"
    local backup_date="$2"
    
    log_info "备份系统信息..."
    
    local system_info_file="$backup_dir/logs/system_info_${backup_date}.txt"
    
    {
        echo "=== 系统信息备份 - $(date) ==="
        echo ""
        echo "=== 系统基本信息 ==="
        uname -a
        cat /etc/os-release
        echo ""
        echo "=== 系统资源 ==="
        free -h
        df -h
        echo ""
        echo "=== 网络配置 ==="
        ip addr show
        echo ""
        echo "=== 已安装软件包 ==="
        dpkg -l | grep -E "(postgres|nginx|node|npm|docker)" || true
        echo ""
        echo "=== Docker 容器 ==="
        docker ps -a || true
        echo ""
        echo "=== PM2 进程 ==="
        pm2 list || true
        echo ""
        echo "=== 端口监听 ==="
        netstat -tlnp || ss -tlnp || true
        echo ""
        echo "=== 服务状态 ==="
        systemctl status nginx --no-pager || true
        systemctl status docker --no-pager || true
    } > "$system_info_file" 2>/dev/null
    
    log_success "系统信息备份完成"
}

# 压缩和加密备份
compress_and_encrypt() {
    local backup_dir="$1"
    local backup_date="$2"
    local backup_type="$3"
    
    log_info "压缩和加密备份文件..."
    
    local archive_name="${PROJECT_NAME}_${backup_type}_${backup_date}"
    local archive_path="$backup_dir/../${archive_name}.tar.gz"
    
    # 创建压缩包
    tar -czf "$archive_path" -C "$backup_dir" . 2>/dev/null
    
    if [ "$ENCRYPTION_ENABLED" = "true" ] && command -v gpg >/dev/null 2>&1; then
        log_info "加密备份文件..."
        gpg --trust-model always --encrypt --recipient "$GPG_RECIPIENT" \
            --output "${archive_path}.gpg" "$archive_path" 2>/dev/null || log_warning "备份加密失败"
        
        if [ -f "${archive_path}.gpg" ]; then
            rm -f "$archive_path"
            log_success "备份已加密: ${archive_path}.gpg"
        fi
    else
        log_success "备份已压缩: $archive_path"
    fi
}

# ==================== 恢复功能 ====================

# 列出可用备份
list_backups() {
    log_info "可用备份列表:"
    
    for backup_type in daily weekly monthly yearly; do
        local type_dir="$BACKUP_BASE_DIR/$backup_type"
        if [ -d "$type_dir" ]; then
            echo ""
            echo "=== $backup_type 备份 ==="
            find "$type_dir" -maxdepth 1 -type d -name "20*" | sort -r | head -10 | while read -r backup_dir; do
                local backup_date=$(basename "$backup_dir")
                local db_file="$backup_dir/database/${DB_NAME}_${backup_date}.sql"
                local size="未知"
                if [ -f "$db_file" ]; then
                    size="$(get_file_size_mb "$db_file")MB"
                fi
                echo "  $backup_date (数据库: $size)"
            done
        fi
    done
}

# 恢复数据库
restore_database() {
    local backup_path="$1"
    local force_restore="${2:-false}"
    
    if [ ! -f "$backup_path" ]; then
        log_error "备份文件不存在: $backup_path"
        return 1
    fi
    
    if [ "$force_restore" != "true" ]; then
        log_warning "数据库恢复将覆盖现有数据！"
        read -p "确认继续？(yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "恢复操作已取消"
            return 0
        fi
    fi
    
    log_info "开始恢复数据库: $backup_path"
    
    # 检查数据库连接
    if ! docker exec "$DB_CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        log_error "数据库连接失败"
        return 1
    fi
    
    # 创建恢复前备份
    local pre_restore_backup="$BACKUP_BASE_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
    log_info "创建恢复前备份: $pre_restore_backup"
    docker exec "$DB_CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --file="/tmp/pre_restore.sql" 2>/dev/null || true
    docker cp "$DB_CONTAINER_NAME:/tmp/pre_restore.sql" "$pre_restore_backup" 2>/dev/null || true
    
    # 执行恢复
    if [[ "$backup_path" == *.dump ]]; then
        # 自定义格式恢复
        log_info "使用pg_restore恢复自定义格式备份..."
        docker cp "$backup_path" "$DB_CONTAINER_NAME:/tmp/restore.dump"
        docker exec "$DB_CONTAINER_NAME" pg_restore \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --clean \
            --if-exists \
            --verbose \
            "/tmp/restore.dump" 2>/dev/null || log_error "数据库恢复失败"
        docker exec "$DB_CONTAINER_NAME" rm -f "/tmp/restore.dump"
    else
        # SQL格式恢复
        log_info "使用psql恢复SQL格式备份..."
        docker cp "$backup_path" "$DB_CONTAINER_NAME:/tmp/restore.sql"
        docker exec "$DB_CONTAINER_NAME" psql \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -f "/tmp/restore.sql" 2>/dev/null || log_error "数据库恢复失败"
        docker exec "$DB_CONTAINER_NAME" rm -f "/tmp/restore.sql"
    fi
    
    log_success "数据库恢复完成"
}

# ==================== 清理功能 ====================

# 清理过期备份
cleanup_old_backups() {
    log_info "清理过期备份..."
    
    # 清理日备份
    find "$BACKUP_BASE_DIR/daily" -type d -name "20*" -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
    
    # 清理周备份
    find "$BACKUP_BASE_DIR/weekly" -type d -name "20*" -mtime +$((WEEKLY_RETENTION_WEEKS * 7)) -exec rm -rf {} \; 2>/dev/null || true
    
    # 清理月备份
    find "$BACKUP_BASE_DIR/monthly" -type d -name "20*" -mtime +$((MONTHLY_RETENTION_MONTHS * 30)) -exec rm -rf {} \; 2>/dev/null || true
    
    # 清理年备份
    find "$BACKUP_BASE_DIR/yearly" -type d -name "20*" -mtime +$((YEARLY_RETENTION_YEARS * 365)) -exec rm -rf {} \; 2>/dev/null || true
    
    # 清理压缩包
    find "$BACKUP_BASE_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    find "$BACKUP_BASE_DIR" -name "*.tar.gz.gpg" -mtime +7 -delete 2>/dev/null || true
    
    log_success "过期备份清理完成"
}

# ==================== 远程备份 ====================

# 同步到远程服务器
sync_to_remote() {
    local backup_dir="$1"
    
    if [ "$REMOTE_BACKUP_ENABLED" != "true" ] || [ -z "$REMOTE_HOST" ]; then
        return 0
    fi
    
    log_info "同步备份到远程服务器..."
    
    if command -v rsync >/dev/null 2>&1; then
        rsync -avz --delete \
            "$backup_dir/" \
            "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/" \
            2>/dev/null || log_warning "远程同步失败"
        log_success "远程同步完成"
    else
        log_warning "rsync未安装，跳过远程同步"
    fi
}

# ==================== 主要功能 ====================

# 执行备份
perform_backup() {
    local backup_type="${1:-daily}"
    local backup_date=$(date +%Y%m%d_%H%M%S)
    
    log_info "开始执行 $backup_type 备份: $backup_date"
    
    # 检查系统要求
    check_command "docker" || return 1
    check_command "tar" || return 1
    check_disk_space 5 || return 1
    
    # 创建备份目录
    local backup_dir=$(create_backup_structure "$backup_date" "$backup_type")
    
    # 执行各项备份
    local backup_success=true
    
    backup_database "$backup_dir" "$backup_date" || backup_success=false
    backup_files "$backup_dir" "$backup_date" || backup_success=false
    backup_system_info "$backup_dir" "$backup_date" || backup_success=false
    
    if [ "$backup_success" = "true" ]; then
        # 压缩和加密
        compress_and_encrypt "$backup_dir" "$backup_date" "$backup_type"
        
        # 远程同步
        sync_to_remote "$backup_dir"
        
        # 清理过期备份
        cleanup_old_backups
        
        # 发送成功通知
        local backup_size=$(du -sh "$backup_dir" | cut -f1)
        send_notification "备份成功" "备份类型: $backup_type\n备份时间: $backup_date\n备份大小: $backup_size" "success"
        
        log_success "备份完成: $backup_dir"
    else
        send_notification "备份失败" "备份类型: $backup_type\n备份时间: $backup_date\n请检查日志" "error"
        log_error "备份过程中出现错误"
        return 1
    fi
}

# 验证备份完整性
verify_backup() {
    local backup_path="$1"
    
    if [ ! -d "$backup_path" ]; then
        log_error "备份目录不存在: $backup_path"
        return 1
    fi
    
    log_info "验证备份完整性: $backup_path"
    
    # 检查数据库备份
    local db_backup=$(find "$backup_path/database" -name "*.sql" -o -name "*.dump" | head -1)
    if [ -n "$db_backup" ] && [ -f "$db_backup" ]; then
        log_success "数据库备份文件存在: $(basename "$db_backup")"
    else
        log_error "数据库备份文件缺失"
        return 1
    fi
    
    # 检查文件备份
    if [ -d "$backup_path/files" ] && [ "$(ls -A "$backup_path/files")" ]; then
        log_success "文件备份存在"
    else
        log_warning "文件备份缺失或为空"
    fi
    
    # 检查配置备份
    if [ -d "$backup_path/config" ] && [ "$(ls -A "$backup_path/config")" ]; then
        log_success "配置备份存在"
    else
        log_warning "配置备份缺失或为空"
    fi
    
    log_success "备份完整性验证通过"
}

# 初始化备份系统
init_backup_system() {
    log_info "初始化备份系统..."
    
    # 创建目录结构
    mkdir -p "$BACKUP_BASE_DIR"/{daily,weekly,monthly,yearly}
    mkdir -p "$LOG_DIR"
    
    # 设置权限
    chmod 750 "$BACKUP_BASE_DIR"
    chmod 750 "$LOG_DIR"
    
    # 创建cron任务
    local cron_file="/etc/cron.d/resume-backup"
    cat > "$cron_file" << 'EOF'
# AI俊才社简历系统自动备份
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# 每日备份 (凌晨2点)
0 2 * * * root /var/backups/resume-system/backup_system.sh backup daily

# 每周备份 (周日凌晨3点)
0 3 * * 0 root /var/backups/resume-system/backup_system.sh backup weekly

# 每月备份 (每月1号凌晨4点)
0 4 1 * * root /var/backups/resume-system/backup_system.sh backup monthly

# 每年备份 (每年1月1日凌晨5点)
0 5 1 1 * root /var/backups/resume-system/backup_system.sh backup yearly

# 每日清理 (凌晨1点)
0 1 * * * root /var/backups/resume-system/backup_system.sh cleanup
EOF
    
    chmod 644 "$cron_file"
    
    # 复制脚本到备份目录
    cp "$0" "$BACKUP_BASE_DIR/backup_system.sh"
    chmod +x "$BACKUP_BASE_DIR/backup_system.sh"
    
    # 重启cron服务
    systemctl restart cron 2>/dev/null || service cron restart 2>/dev/null || true
    
    log_success "备份系统初始化完成"
    log_info "备份目录: $BACKUP_BASE_DIR"
    log_info "日志目录: $LOG_DIR"
    log_info "自动备份计划已设置"
}

# 显示帮助信息
show_help() {
    cat << 'EOF'
AI俊才社简历系统 - 企业级数据备份系统

用法: ./backup_system.sh <命令> [选项]

命令:
  backup <type>     执行备份 (daily|weekly|monthly|yearly)
  restore <path>    从备份恢复数据库
  list             列出可用备份
  verify <path>    验证备份完整性
  cleanup          清理过期备份
  init             初始化备份系统
  help             显示此帮助信息

示例:
  ./backup_system.sh backup daily          # 执行日备份
  ./backup_system.sh backup weekly         # 执行周备份
  ./backup_system.sh restore /path/to/backup.sql  # 恢复数据库
  ./backup_system.sh list                  # 列出所有备份
  ./backup_system.sh verify /path/to/backup/  # 验证备份
  ./backup_system.sh cleanup               # 清理过期备份
  ./backup_system.sh init                  # 初始化系统

配置:
  备份保留策略:
    - 日备份: 保留 30 天
    - 周备份: 保留 12 周
    - 月备份: 保留 12 个月
    - 年备份: 保留 3 年

  备份位置: /var/backups/resume-system/
  日志位置: /var/log/resume-backup/

注意:
  - 请确保以root权限运行
  - 首次使用请运行 'init' 命令
  - 数据库恢复会覆盖现有数据
EOF
}

# ==================== 主函数 ====================

main() {
    # 检查root权限
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root权限运行此脚本"
        echo "用法: sudo $0 <command>"
        exit 1
    fi
    
    local command="${1:-help}"
    
    case "$command" in
        "backup")
            local backup_type="${2:-daily}"
            perform_backup "$backup_type"
            ;;
        "restore")
            local backup_path="$2"
            if [ -z "$backup_path" ]; then
                log_error "请指定备份文件路径"
                exit 1
            fi
            restore_database "$backup_path"
            ;;
        "list")
            list_backups
            ;;
        "verify")
            local backup_path="$2"
            if [ -z "$backup_path" ]; then
                log_error "请指定备份目录路径"
                exit 1
            fi
            verify_backup "$backup_path"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "init")
            init_backup_system
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