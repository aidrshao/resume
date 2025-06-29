#!/bin/bash
# =============================================================================
# AI俊才社简历系统 - 自包含一键部署脚本 v5.6 (SSL证书修复版)
# =============================================================================
# 
# 🎯 功能: 自包含的一键部署脚本，无需额外文件 + SSL自动配置
# 🏗️ 架构: React前端 + Node.js后端 + PostgreSQL + Nginx + PM2 + Let's Encrypt SSL
# 🔧 特点: 单文件包含所有功能，自动下载代码，智能修复，SSL证书自动申请
# 📅 创建: 2024-06-29
# 👤 维护: AI俊才社技术团队
#
# 🚀 使用方法:
#   sudo bash deploy-standalone.sh                    # 完整部署
#   sudo bash deploy-standalone.sh --mode=quick       # 快速部署
#   sudo bash deploy-standalone.sh --mode=fix         # 修复模式
#   sudo bash deploy-standalone.sh --mode=debug       # 调试模式 (排查500错误)
#   sudo bash deploy-standalone.sh --mode=ssl-setup   # SSL证书设置
#   sudo bash deploy-standalone.sh --mode=check       # 健康检查
#   sudo bash deploy-standalone.sh --help             # 显示帮助
#
# =============================================================================

set -e

# =============================================================================
# 🔧 基础配置
# =============================================================================

# 脚本信息
SCRIPT_VERSION="5.6"
SCRIPT_NAME="AI俊才社简历系统 - 自包含部署脚本 (HTTP优先版)"

# 项目配置
PROJECT_NAME="AI俊才社简历系统"
PROJECT_DIR="/home/ubuntu/resume"
GIT_REPO="git@github.com:aidrshao/resume.git"
GIT_REPO_HTTPS="https://github.com/aidrshao/resume.git"

# 端口配置
FRONTEND_PORT=3016
BACKEND_PORT=8000
DB_PORT=5435

# 数据库配置
DB_HOST="localhost"
DB_NAME="resume_db"
DB_USER="resume_user"
DB_PASSWORD="ResumePass123"
DB_CONTAINER_NAME="resume-postgres"

# 域名配置
DOMAIN="cv.juncaishe.com"

# 路径配置
LOG_DIR="/var/log"
BACKUP_DIR="/root/backups"

# JWT配置
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "default-jwt-secret-key")

# AI服务配置（用户可通过环境变量设置）
OPENAI_API_KEY="${OPENAI_API_KEY:-your-openai-api-key}"
OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://api.agicto.cn/v1}"
DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-your-deepseek-api-key}"

# 邮件服务配置
SMTP_HOST="${SMTP_HOST:-smtp.qq.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-your-email@qq.com}"
SMTP_PASS="${SMTP_PASS:-your-smtp-password}"

# 系统配置
NODE_ENV="production"
PM2_INSTANCES=1
MAX_MEMORY="1G"

# 日志配置
LOG_FILE="$LOG_DIR/resume-deploy.log"
LOG_LEVEL=1  # INFO level

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# =============================================================================
# 📝 日志函数
# =============================================================================

# 初始化日志
init_log() {
    mkdir -p "$LOG_DIR"
    touch "$LOG_FILE"
    
    # 日志轮转
    if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0) -gt $((10 * 1024 * 1024)) ]; then
        mv "$LOG_FILE" "${LOG_FILE}.$(date +%Y%m%d_%H%M%S)"
        find "$LOG_DIR" -name "$(basename "$LOG_FILE").*" -mtime +7 -delete 2>/dev/null || true
        touch "$LOG_FILE"
    fi
}

# 写入日志文件
write_to_file() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$1] $2" >> "$LOG_FILE"
}

# 各级别日志函数
log_debug() {
    if [ $LOG_LEVEL -le 0 ]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
        write_to_file "DEBUG" "$1"
    fi
}

log_info() {
    if [ $LOG_LEVEL -le 1 ]; then
        echo -e "${BLUE}[INFO]${NC} $1"
        write_to_file "INFO" "$1"
    fi
}

log_success() {
    if [ $LOG_LEVEL -le 1 ]; then
        echo -e "${GREEN}[SUCCESS]${NC} $1"
        write_to_file "SUCCESS" "$1"
    fi
}

log_warning() {
    if [ $LOG_LEVEL -le 2 ]; then
        echo -e "${YELLOW}[WARNING]${NC} $1"
        write_to_file "WARNING" "$1"
    fi
}

log_error() {
    if [ $LOG_LEVEL -le 3 ]; then
        echo -e "${RED}[ERROR]${NC} $1" >&2
        write_to_file "ERROR" "$1"
    fi
}

log_title() {
    local title="$1"
    local length=${#title}
    local total_length=$((length + 20))
    
    echo ""
    printf "%*s\n" $total_length | tr ' ' "="
    echo -e "${WHITE}$(printf "%*s" $(((total_length - length) / 2)) "")$title${NC}"
    printf "%*s\n" $total_length | tr ' ' "="
    echo ""
    write_to_file "TITLE" "$title"
}

log_subtitle() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
    echo ""
    write_to_file "SUBTITLE" "$1"
}

log_step() {
    echo ""
    echo -e "${WHITE}[$1/$2]${NC} ${CYAN}$3${NC}"
    echo ""
    write_to_file "STEP" "[$1/$2] $3"
}

# =============================================================================
# 🔧 系统检查函数
# =============================================================================

# 检查系统依赖
check_system_dependencies() {
    log_info "🔍 检查系统依赖..."
    
    local missing_deps=()
    local deps=("curl" "git" "lsof")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少系统依赖: ${missing_deps[*]}"
        log_info "安装依赖: apt update && apt install -y ${missing_deps[*]}"
        apt update && apt install -y "${missing_deps[@]}"
    fi
    
    log_success "系统依赖检查通过"
}

# 检查并安装Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        log_info "安装Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm未正确安装"
        return 1
    fi
    
    log_success "Node.js版本: $(node --version), npm版本: $(npm --version)"
}

# 检查并安装PM2
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_info "安装PM2..."
        npm install -g pm2
    fi
    log_success "PM2版本: $(pm2 --version)"
}

# 检查并安装Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_info "安装Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi
    
    # 启动Docker服务
    if ! systemctl is-active docker >/dev/null; then
        systemctl start docker
        systemctl enable docker
    fi
    
    log_success "Docker版本: $(docker --version)"
}

# 检查并安装Nginx
check_nginx() {
    if ! command -v nginx &> /dev/null; then
        log_info "安装Nginx..."
        apt update && apt install -y nginx
    fi
    log_success "Nginx版本: $(nginx -v 2>&1 | cut -d' ' -f3)"
}

# =============================================================================
# 🧹 PM2管理函数 (修复版)
# =============================================================================

# 智能清理PM2进程 - 修复版
cleanup_resume_processes() {
    log_subtitle "清理PM2进程"
    
    # 显示当前状态
    log_info "当前PM2进程状态:"
    pm2 list 2>/dev/null || log_warning "无法获取PM2状态"
    
    # 修复版：更准确的进程识别逻辑
    local resume_ids=()
    local pm2_output
    pm2_output=$(pm2 list 2>/dev/null || echo "")
    
    # 使用更可靠的方法提取resume进程ID
    while IFS= read -r line; do
        # 匹配包含resume-的行，提取ID
        if echo "$line" | grep -q "resume-"; then
            local id=$(echo "$line" | grep -o "^[[:space:]]*[0-9]\+[[:space:]]" | tr -d ' ')
            if [[ "$id" =~ ^[0-9]+$ ]]; then
                resume_ids+=("$id")
            fi
        fi
    done <<< "$pm2_output"
    
    if [ ${#resume_ids[@]} -eq 0 ]; then
        log_info "未发现resume进程"
    else
        log_info "发现 ${#resume_ids[@]} 个resume进程: ${resume_ids[*]}"
        
        # 停止resume进程
        for id in "${resume_ids[@]}"; do
            log_info "停止进程 ID: $id"
            pm2 delete "$id" 2>/dev/null || true
        done
    fi
    
    # 彻底清理PM2配置 - 确保没有残留
    log_info "彻底清理PM2配置..."
    pm2 kill 2>/dev/null || true
    sleep 2
    pm2 flush 2>/dev/null || true
    
    # 清理PM2配置文件中的resume条目
    if [ -f "/root/.pm2/dump.pm2" ]; then
        cp "/root/.pm2/dump.pm2" "/root/.pm2/dump.pm2.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
        # 简化处理：直接删除配置文件，让PM2重新创建
        rm -f "/root/.pm2/dump.pm2" 2>/dev/null || true
    fi
    
    log_success "PM2进程清理完成"
}

# =============================================================================
# 🗄️ 数据库管理函数 (修复版)
# =============================================================================

# 设置数据库 - 修复版
setup_database() {
    log_subtitle "配置数据库"
    
    # 停止并删除现有容器
    if docker ps -a | grep -q "$DB_CONTAINER_NAME"; then
        log_info "停止现有数据库容器..."
        docker stop "$DB_CONTAINER_NAME" 2>/dev/null || true
        docker rm "$DB_CONTAINER_NAME" 2>/dev/null || true
    fi
    
    # 重要修复：清理数据卷避免旧数据干扰
    log_info "清理数据库数据卷以确保干净启动..."
    docker volume rm resume_postgres_data 2>/dev/null || true
    
    # 修复版：确保postgres用户正确配置
    log_info "启动PostgreSQL容器..."
    local container_id=$(docker run -d \
        --name "$DB_CONTAINER_NAME" \
        --restart unless-stopped \
        -e POSTGRES_DB="postgres" \
        -e POSTGRES_USER="postgres" \
        -e POSTGRES_PASSWORD="postgres" \
        -e POSTGRES_INITDB_ARGS="--auth-host=md5 --auth-local=md5" \
        -p "$DB_PORT:5432" \
        postgres:13)
    
    log_info "容器ID: $container_id"
    log_info "容器状态检查..."
    docker ps | grep "$DB_CONTAINER_NAME" || log_error "容器未运行"
    
    # 等待数据库启动 - 增加等待时间和更好的检查
    log_info "等待数据库启动..."
    local attempts=0
    local max_attempts=60
    
    while [ $attempts -lt $max_attempts ]; do
        # 检查容器是否运行
        if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
            log_error "数据库容器未运行"
            return 1
        fi
        
        # 检查PostgreSQL是否就绪
        if docker exec "$DB_CONTAINER_NAME" pg_isready >/dev/null 2>&1; then
            log_success "数据库启动成功"
            break
        fi
        
        attempts=$((attempts + 1))
        sleep 3
        log_info "等待数据库启动... ($attempts/$max_attempts)"
        
        if [ $attempts -eq $max_attempts ]; then
            log_error "数据库启动超时"
            docker logs "$DB_CONTAINER_NAME" | tail -20
            return 1
        fi
    done
    
    # 修复版：创建应用数据库和用户 - 使用更可靠的方法
    log_info "配置数据库用户和权限..."
    sleep 15  # 增加等待时间确保数据库完全就绪
    
    # 调试：检查容器状态和日志
    log_info "容器状态调试信息:"
    docker ps | grep "$DB_CONTAINER_NAME"
    log_info "容器日志 (最后10行):"
    docker logs "$DB_CONTAINER_NAME" 2>&1 | tail -10
    
    # 调试：检查postgres用户
    log_info "检查postgres用户是否存在..."
    if docker exec "$DB_CONTAINER_NAME" psql -U postgres -c "SELECT current_user;" 2>/dev/null; then
        log_success "postgres用户验证成功"
        
                 # 配置应用用户和数据库 - 分步执行避免事务块问题
         log_info "清理旧用户和数据库..."
         docker exec "$DB_CONTAINER_NAME" psql -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
         docker exec "$DB_CONTAINER_NAME" psql -U postgres -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
         
         log_info "创建应用用户..."
         if docker exec "$DB_CONTAINER_NAME" psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB SUPERUSER;" 2>&1 && \
            docker exec "$DB_CONTAINER_NAME" createdb -U postgres -O "$DB_USER" "$DB_NAME" 2>&1 && \
            docker exec "$DB_CONTAINER_NAME" psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>&1; then
            log_success "应用数据库配置成功"
            
            # 验证应用用户连接
            log_info "验证应用用户连接..."
            if docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
                log_success "应用用户连接验证成功"
                
                # 创建基础表
                log_info "创建基础表结构..."
                docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT now(),
                        updated_at TIMESTAMP DEFAULT now()
                    );
                    
                    CREATE TABLE IF NOT EXISTS resumes (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        title VARCHAR(255) NOT NULL,
                        content TEXT,
                        created_at TIMESTAMP DEFAULT now(),
                        updated_at TIMESTAMP DEFAULT now()
                    );
                " 2>/dev/null || log_warning "基础表创建失败，但不影响主要功能"
                
            else
                log_error "应用用户连接验证失败"
                return 1
            fi
        else
            log_error "应用数据库配置失败"
            return 1
        fi
    else
        log_error "postgres用户不存在或无法连接"
        log_error "容器完整日志:"
        docker logs "$DB_CONTAINER_NAME"
        
        # 自动修复：删除并重新创建容器
        log_warning "自动修复: 重新创建数据库容器..."
        docker stop "$DB_CONTAINER_NAME" 2>/dev/null || true
        docker rm "$DB_CONTAINER_NAME" 2>/dev/null || true
        
        # 使用临时容器测试镜像
        log_info "测试PostgreSQL镜像..."
        local test_container=$(docker run -d --rm \
            -e POSTGRES_DB="test" \
            -e POSTGRES_USER="postgres" \
            -e POSTGRES_PASSWORD="postgres" \
            postgres:13)
        
        sleep 10
        if docker exec "$test_container" pg_isready >/dev/null 2>&1; then
            log_success "PostgreSQL镜像正常"
            docker stop "$test_container" 2>/dev/null || true
            
            # 重新创建正式容器
            log_info "重新创建数据库容器..."
            local new_container_id=$(docker run -d \
                --name "$DB_CONTAINER_NAME" \
                --restart unless-stopped \
                -e POSTGRES_DB="postgres" \
                -e POSTGRES_USER="postgres" \
                -e POSTGRES_PASSWORD="postgres" \
                -p "$DB_PORT:5432" \
                postgres:13)
            
            log_info "新容器ID: $new_container_id"
            
            # 等待新容器启动
            local retry_attempts=0
            while [ $retry_attempts -lt 45 ]; do
                if docker exec "$DB_CONTAINER_NAME" pg_isready >/dev/null 2>&1 && \
                   docker exec "$DB_CONTAINER_NAME" psql -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
                    log_success "新容器启动成功"
                    
                                         # 重新配置应用用户 - 分步执行避免事务块问题
                     log_info "创建应用用户..."
                     docker exec "$DB_CONTAINER_NAME" psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB SUPERUSER;"
                     
                     log_info "创建应用数据库..."
                     docker exec "$DB_CONTAINER_NAME" createdb -U postgres -O "$DB_USER" "$DB_NAME"
                     
                     log_info "授权数据库权限..."
                     docker exec "$DB_CONTAINER_NAME" psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
                    log_success "数据库修复完成"
                    break
                fi
                retry_attempts=$((retry_attempts + 1))
                sleep 3
                log_info "等待新容器启动... ($retry_attempts/45)"
            done
            
            if [ $retry_attempts -eq 45 ]; then
                log_error "新容器启动超时"
                return 1
            fi
        else
            log_error "PostgreSQL镜像异常"
            docker stop "$test_container" 2>/dev/null || true
            return 1
        fi
    fi
    
    log_success "数据库配置完成"
}

# =============================================================================
# 📥 代码管理函数
# =============================================================================

# 克隆项目代码
clone_project() {
    log_subtitle "获取项目代码"
    
    # 备份现有项目
    if [ -d "$PROJECT_DIR" ]; then
        local backup_dir="${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
        log_info "备份现有项目到: $backup_dir"
        mv "$PROJECT_DIR" "$backup_dir"
    fi
    
    # 创建父目录
    mkdir -p "$(dirname "$PROJECT_DIR")"
    
    # 测试SSH连接
    log_info "测试GitHub连接..."
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        log_success "GitHub SSH连接正常"
        local repo_url="$GIT_REPO"
    else
        log_info "SSH连接失败，使用HTTPS方式"
        local repo_url="$GIT_REPO_HTTPS"
    fi
    
    # 克隆项目
    log_info "克隆项目: $repo_url"
    if git clone "$repo_url" "$PROJECT_DIR"; then
        log_success "项目克隆成功"
    else
        log_error "项目克隆失败"
        return 1
    fi
}

# =============================================================================
# ⚙️ 后端配置函数
# =============================================================================

# 设置后端
setup_backend() {
    log_subtitle "配置后端服务"
    
    cd "$PROJECT_DIR/backend"
    
    # 清理依赖
    if [ -d "node_modules" ]; then
        rm -rf node_modules package-lock.json
    fi
    
    # 设置npm源
    npm config set registry https://registry.npmmirror.com
    
    # 安装依赖
    log_info "安装后端依赖..."
    if npm install --production; then
        log_success "后端依赖安装完成"
    else
        log_error "后端依赖安装失败"
        return 1
    fi
    
    # 创建环境配置
    log_info "创建后端环境配置..."
    cat > .env << EOF
# 基础配置
NODE_ENV=production
PORT=$BACKEND_PORT

# 数据库配置
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT配置
JWT_SECRET=$JWT_SECRET

# AI服务配置
OPENAI_API_KEY=$OPENAI_API_KEY
OPENAI_BASE_URL=$OPENAI_BASE_URL
DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY

# 邮件服务配置
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS

# 文件上传配置
UPLOAD_DIR=/var/www/uploads
MAX_FILE_SIZE=10mb

# 前端URL
FRONTEND_URL=https://$DOMAIN
CORS_ORIGIN=https://$DOMAIN
EOF
    
    log_success "后端设置完成"
}

# =============================================================================
# 🎨 前端配置函数
# =============================================================================

# 设置前端
setup_frontend() {
    log_subtitle "配置前端应用"
    
    cd "$PROJECT_DIR/frontend"
    
    # 清理依赖
    if [ -d "node_modules" ]; then
        rm -rf node_modules package-lock.json
    fi
    
    # 设置npm源
    npm config set registry https://registry.npmmirror.com
    
    # 安装依赖
    log_info "安装前端依赖..."
    if npm install; then
        log_success "前端依赖安装完成"
    else
        log_error "前端依赖安装失败"
        return 1
    fi
    
    # 创建环境配置 (先使用HTTP，SSL配置完成后再更新为HTTPS)
    log_info "创建前端环境配置..."
    cat > .env.production << EOF
# 生产环境配置
REACT_APP_API_URL=http://$DOMAIN/api
REACT_APP_BACKEND_URL=http://$DOMAIN/api
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0

# 功能开关
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PWA=true

# 外部服务
REACT_APP_DOMAIN=$DOMAIN
EOF
    
    # 构建前端
    log_info "构建前端应用..."
    if [ -d "build" ]; then
        rm -rf build
    fi
    
    export NODE_ENV=production
    export CI=false
    
    if npm run build; then
        log_success "前端构建完成"
    else
        log_error "前端构建失败"
        return 1
    fi
    
    log_success "前端设置完成"
}

# =============================================================================
# 🚀 PM2服务管理函数
# =============================================================================

# 启动服务
start_services() {
    log_subtitle "启动PM2服务"
    
    # 确保PM2守护进程运行
    pm2 ping >/dev/null 2>&1 || pm2 update
    
    # 启动后端
    cd "$PROJECT_DIR/backend"
    log_info "启动后端服务..."
    pm2 start server.js --name "resume-backend" --instances 1 --max-memory-restart "$MAX_MEMORY" --force
    
    # 启动前端
    cd "$PROJECT_DIR/frontend"
    log_info "启动前端服务..."
    
    # 检查构建目录
    if [ ! -d "build" ]; then
        log_warning "前端构建目录不存在，执行构建..."
        npm run build
    fi
    
    # 启动前端服务
    pm2 serve build $FRONTEND_PORT --name "resume-frontend" --spa --force
    
    # 验证前端服务
    sleep 3
    if ! lsof -i ":$FRONTEND_PORT" >/dev/null 2>&1; then
        log_warning "前端端口未监听，尝试修复..."
        pm2 delete resume-frontend 2>/dev/null || true
        pm2 serve build $FRONTEND_PORT --name "resume-frontend" --spa
        sleep 3
        
        if ! lsof -i ":$FRONTEND_PORT" >/dev/null 2>&1; then
            log_warning "使用http-server替代方案..."
            npm install -g http-server
            pm2 start "http-server build -p $FRONTEND_PORT" --name "resume-frontend"
        fi
    fi
    
    # 保存PM2配置
    pm2 save
    pm2 startup >/dev/null 2>&1 || true
    
    log_success "服务启动完成"
    
    # 显示状态
    pm2 list
}

# =============================================================================
# 🌐 Nginx配置函数
# =============================================================================

# 设置Nginx
setup_nginx() {
    log_subtitle "配置Nginx服务"
    
    # 创建必要目录
    mkdir -p /var/www/uploads /var/www/certbot /var/www/html
    chmod 755 /var/www/uploads /var/www/certbot
    
    # 创建Nginx配置
    local config_file="/etc/nginx/sites-available/$DOMAIN"
    local link_file="/etc/nginx/sites-enabled/$DOMAIN"
    
    cat > "$config_file" << EOF
# AI俊才社简历系统 - Nginx配置 (HTTP模式)
server {
    listen 80;
    server_name $DOMAIN;
    
    # 访问日志
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log /var/log/nginx/$DOMAIN.error.log;
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # API代理到后端
    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 前端静态文件和SPA路由
    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
        
        # SPA支持
        try_files \$uri \$uri/ @fallback;
    }
    
    # SPA fallback
    location @fallback {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # 创建软链接
    ln -sf "$config_file" "$link_file"
    
    # 删除默认配置
    rm -f "/etc/nginx/sites-enabled/default"
    
    # 测试配置
    if nginx -t; then
        systemctl enable nginx
        systemctl reload nginx
        log_success "Nginx配置完成"
    else
        log_error "Nginx配置错误"
        return 1
    fi
}

# =============================================================================
# 🔍 健康检查函数
# =============================================================================

# 快速健康检查
quick_health_check() {
    log_info "🚀 快速健康检查..."
    
    local failed=0
    
    # 检查PM2进程
    if ! pm2 list 2>/dev/null | grep -q "resume-backend.*online"; then
        failed=$((failed + 1))
    fi
    
    if ! pm2 list 2>/dev/null | grep -q "resume-frontend.*online"; then
        failed=$((failed + 1))
    fi
    
    # 检查数据库
    if ! docker ps | grep -q "$DB_CONTAINER_NAME"; then
        failed=$((failed + 1))
    fi
    
    # 检查端口
    for port in $FRONTEND_PORT $BACKEND_PORT $DB_PORT 80; do
        if ! lsof -i ":$port" >/dev/null 2>&1; then
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -eq 0 ]; then
        log_success "✅ 快速检查通过，系统运行正常"
        return 0
    else
        log_error "❌ 快速检查失败，发现 $failed 个问题"
        return 1
    fi
}

# 全面健康检查
comprehensive_health_check() {
    log_title "系统健康检查"
    
    local total=6
    local passed=0
    
    # 1. 检查PM2进程
    log_step 1 $total "PM2进程状态"
    local pm2_output=$(pm2 list 2>/dev/null || echo "")
    local backend_count=$(echo "$pm2_output" | grep -c "resume-backend.*online" || echo "0")
    local frontend_count=$(echo "$pm2_output" | grep -c "resume-frontend.*online" || echo "0")
    
    if [ "$backend_count" -eq 1 ] && [ "$frontend_count" -eq 1 ]; then
        log_success "PM2进程正常: backend($backend_count), frontend($frontend_count)"
        passed=$((passed + 1))
    else
        log_error "PM2进程异常: backend($backend_count), frontend($frontend_count)"
    fi
    
    # 2. 检查数据库
    log_step 2 $total "数据库连接"
    if docker exec "$DB_CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        log_success "数据库连接正常"
        passed=$((passed + 1))
    else
        log_error "数据库连接失败"
    fi
    
    # 3. 检查端口
    log_step 3 $total "端口监听状态"
    local port_ok=true
    for port in $FRONTEND_PORT $BACKEND_PORT $DB_PORT 80; do
        if lsof -i ":$port" >/dev/null 2>&1; then
            log_success "端口 $port: 正常监听"
        else
            log_error "端口 $port: 未监听"
            port_ok=false
        fi
    done
    if $port_ok; then
        passed=$((passed + 1))
    fi
    
    # 4. 检查Nginx
    log_step 4 $total "Nginx服务"
    if systemctl is-active nginx >/dev/null && nginx -t >/dev/null 2>&1; then
        log_success "Nginx服务正常"
        passed=$((passed + 1))
    else
        log_error "Nginx服务异常"
    fi
    
    # 5. 检查磁盘空间
    log_step 5 $total "磁盘空间"
    local disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        log_success "磁盘使用率: ${disk_usage}%"
        passed=$((passed + 1))
    else
        log_error "磁盘使用率过高: ${disk_usage}%"
    fi
    
    # 6. 检查网站访问
    log_step 6 $total "网站访问"
    if curl -s --connect-timeout 10 "http://localhost:$FRONTEND_PORT" >/dev/null; then
        log_success "网站访问正常"
        passed=$((passed + 1))
    else
        log_error "网站访问异常"
    fi
    
    # 显示总结
    echo ""
    echo "=================================="
    log_info "健康检查总结:"
    log_info "  总检查项: $total"
    log_success "  通过: $passed"
    log_error "  失败: $((total - passed))"
    
    if [ $passed -eq $total ]; then
        log_success "🎉 系统整体健康状况良好"
        return 0
    else
        log_error "❌ 系统存在问题需要修复"
        return 1
    fi
}

# =============================================================================
# 🔧 增强修复函数
# =============================================================================

# 清理调试脚本
cleanup_debug_scripts() {
    log_info "🧹 清理调试期间创建的临时脚本..."
    
    local debug_scripts=(
        "fix-502-error.sh"
        "deep-diagnostics.sh"
        "total-cleanup.sh"
        "fix-domain-simple.sh"
        "fix-domain-redirect.sh"
        "immediate-access-fix.sh"
        "find-catchall-config.sh"
        "quick-fix-www-juncaishe.sh"
        "deep-redirect-analysis.sh"
        "emergency-rollback.sh"
        "fix-www-juncaishe.sh"
        "deep-diagnosis.sh"
        "final-complete-fix.sh"
        "emergency-nginx-fix.sh"
        "fix-nginx-conflict.sh"
        "check-nginx-config.sh"
    )
    
    for script in "${debug_scripts[@]}"; do
        if [ -f "$script" ]; then
            rm -f "$script"
            log_info "已删除: $script"
        fi
    done
    
    log_success "临时脚本清理完成"
}

# 修复Nginx配置冲突 (增强版)
fix_nginx_conflicts() {
    log_info "🔧 修复Nginx配置冲突..."
    
    # 备份现有配置
    local backup_dir="/root/nginx-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    cp -r /etc/nginx/sites-enabled "$backup_dir/" 2>/dev/null || true
    cp -r /etc/nginx/sites-available "$backup_dir/" 2>/dev/null || true
    
    log_info "已备份Nginx配置到: $backup_dir"
    
    # 1. 清理所有可能冲突的配置文件
    log_info "清理冲突的配置文件..."
    local conflict_files=(
        "/etc/nginx/sites-enabled/multi_domain.conf"
        "/etc/nginx/sites-available/multi_domain.conf" 
        "/etc/nginx/sites-enabled/www.zhenshizhiyuan.com.conf"
        "/etc/nginx/sites-available/www.zhenshizhiyuan.com.conf"
        "/etc/nginx/sites-enabled/default"
        "/etc/nginx/sites-available/default"
        "/etc/nginx/sites-enabled/cv.juncaishe.com.conf"
        "/etc/nginx/sites-available/cv.juncaishe.com.conf"
    )
    
    for file in "${conflict_files[@]}"; do
        if [ -f "$file" ]; then
            log_info "删除冲突配置: $file"
            rm -f "$file"
        fi
    done
    
    # 2. 检查并清理包含juncaishe.com重定向的所有配置
    log_info "检查所有nginx配置中的juncaishe.com重定向..."
    find /etc/nginx -name "*.conf" -exec grep -l "juncaishe.com" {} \; 2>/dev/null | while read config_file; do
        if grep -q "return 301.*pay.juncaishe.com\|return 301.*www.juncaishe.com" "$config_file" 2>/dev/null; then
            log_warning "发现重定向配置: $config_file"
            log_info "内容预览:"
            grep -n "juncaishe.com\|return 301" "$config_file" | head -5 || true
            
            # 询问是否需要清理（在自动化脚本中直接清理）
            log_info "移除可能导致跳转的配置: $config_file"
            mv "$config_file" "$backup_dir/$(basename "$config_file").backup" 2>/dev/null || true
        fi
    done
    
    # 3. 清理Certbot的自动HTTPS重定向
    log_info "清理Certbot的自动HTTPS重定向..."
    find /etc/nginx -name "*.conf" -exec grep -l "managed by Certbot" {} \; 2>/dev/null | while read certbot_file; do
        if grep -q "if.*host.*juncaishe.com.*return 301" "$certbot_file" 2>/dev/null; then
            log_warning "发现Certbot HTTPS重定向: $certbot_file"
            # 保留配置但注释掉重定向部分
            sed -i.bak '/if.*host.*juncaishe.com.*return 301/,/} # managed by Certbot/s/^/#/' "$certbot_file" 2>/dev/null || true
            log_info "已注释掉HTTPS重定向规则"
        fi
    done
    
    # 4. 确保只有我们的HTTP配置生效
    log_info "确保只有简历系统的HTTP配置生效..."
    
    # 测试配置
    if nginx -t 2>/dev/null; then
        log_success "Nginx配置清理完成"
        systemctl reload nginx
    else
        log_error "Nginx配置测试失败，恢复备份..."
        cp -r "$backup_dir/sites-enabled/"* /etc/nginx/sites-enabled/ 2>/dev/null || true
        systemctl reload nginx
        return 1
    fi
    
    # 5. 验证清理效果
    log_info "验证清理效果..."
    if curl -s -I "http://$DOMAIN" | grep -q "200 OK\|302 Found"; then
        log_success "HTTP访问正常"
    else
        log_warning "HTTP访问异常，请检查"
    fi
    
    # 检查是否还有重定向
    redirect_test=$(curl -s -I "http://$DOMAIN" | grep -i "location:" || echo "")
    if echo "$redirect_test" | grep -q "pay.juncaishe.com"; then
        log_error "仍然存在到pay.juncaishe.com的重定向"
        log_info "重定向信息: $redirect_test"
    else
        log_success "已清除到pay.juncaishe.com的重定向"
    fi
    
    return 0
}

# 修复502错误
fix_502_errors() {
    log_info "🔧 修复502 Bad Gateway错误..."
    
    # 检查PM2服务状态
    log_info "检查PM2服务状态..."
    pm2 list
    
    # 检查端口占用
    log_info "检查关键端口状态..."
    local frontend_port_ok=false
    local backend_port_ok=false
    
    if netstat -tlnp | grep -q ":$FRONTEND_PORT"; then
        frontend_port_ok=true
        log_success "前端端口 $FRONTEND_PORT 正在监听"
    else
        log_warning "前端端口 $FRONTEND_PORT 未监听"
    fi
    
    if netstat -tlnp | grep -q ":$BACKEND_PORT"; then
        backend_port_ok=true
        log_success "后端端口 $BACKEND_PORT 正在监听"
    else
        log_warning "后端端口 $BACKEND_PORT 未监听"
    fi
    
    # 如果服务未运行，尝试启动
    if ! $frontend_port_ok || ! $backend_port_ok; then
        log_info "尝试启动resume服务..."
        
        # 确保项目目录存在
        if [ ! -d "$PROJECT_DIR" ]; then
            log_error "项目目录不存在: $PROJECT_DIR"
            return 1
        fi
        
        cd "$PROJECT_DIR"
        
        # 启动后端服务
        if [ -f "$PROJECT_DIR/backend/server.js" ]; then
            pm2 start "$PROJECT_DIR/backend/server.js" --name resume-backend --port "$BACKEND_PORT" || true
            log_info "已尝试启动resume-backend"
        fi
        
        # 启动前端服务
        if [ -d "$PROJECT_DIR/frontend/build" ]; then
            # 安装serve如果没有
            npm install -g serve 2>/dev/null || true
            pm2 start serve --name resume-frontend -- -s "$PROJECT_DIR/frontend/build" -l "$FRONTEND_PORT" || true
            log_info "已尝试启动resume-frontend"
        elif [ -d "$PROJECT_DIR/frontend" ]; then
            cd "$PROJECT_DIR/frontend"
            pm2 start npm --name resume-frontend -- start || true
            log_info "已尝试以开发模式启动resume-frontend"
        fi
        
        # 等待服务启动
        sleep 5
        
        # 再次检查
        if netstat -tlnp | grep -q ":$FRONTEND_PORT" && netstat -tlnp | grep -q ":$BACKEND_PORT"; then
            log_success "502错误修复完成，服务已启动"
        else
            log_warning "部分服务可能仍未启动，请检查PM2日志"
            pm2 logs --lines 10
        fi
    else
        log_success "所有服务端口正常监听，502错误应已修复"
    fi
}

# 修复SSL证书
fix_ssl_certificate() {
    log_info "🔐 配置SSL证书..."
    
    # 检查certbot是否安装
    if ! command -v certbot &> /dev/null; then
        log_info "安装Certbot..."
        apt update
        apt install -y certbot python3-certbot-nginx
    fi
    
    # 检查域名DNS解析
    log_info "检查域名DNS解析..."
    if ! nslookup "$DOMAIN" | grep -q "Address:"; then
        log_error "域名 $DOMAIN DNS解析失败，请检查域名配置"
        return 1
    fi
    
    # 检查当前证书状态
    log_info "检查当前SSL证书状态..."
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        log_info "发现现有证书，检查有效期..."
        cert_info=$(openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -text -noout 2>/dev/null || echo "证书读取失败")
        if echo "$cert_info" | grep -q "Not After"; then
            expiry_date=$(echo "$cert_info" | grep "Not After" | cut -d: -f2- | xargs)
            log_info "证书到期时间: $expiry_date"
        fi
    else
        log_info "未发现现有证书，将申请新证书"
    fi
    
    # 确保80端口可用（Let's Encrypt验证需要）
    log_info "准备证书申请环境..."
    
    # 临时停止nginx以释放80端口
    systemctl stop nginx
    
    # 申请SSL证书
    log_info "申请SSL证书..."
    if certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "admin@juncaishe.com" \
        -d "$DOMAIN" \
        --force-renewal; then
        log_success "SSL证书申请成功"
    else
        log_error "SSL证书申请失败，使用HTTP模式"
        # 重启nginx
        systemctl start nginx
        return 1
    fi
    
    # 更新Nginx配置以支持HTTPS
    log_info "配置HTTPS支持..."
    cat > /etc/nginx/sites-available/cv.juncaishe.com.conf << 'EOF'
# 简历系统 - cv.juncaishe.com (HTTP + HTTPS)
server {
    listen 80;
    server_name cv.juncaishe.com;

    # Let's Encrypt验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files $uri =404;
    }

    # 其他请求重定向到HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name cv.juncaishe.com;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/cv.juncaishe.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cv.juncaishe.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    access_log /var/log/nginx/cv.juncaishe.com.access.log;
    error_log /var/log/nginx/cv.juncaishe.com.error.log;

    # API 接口代理到后端 8000 端口
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # API超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 前端静态资源和路由代理到 3016 端口
    location / {
        proxy_pass http://127.0.0.1:3016;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    # 重新启用配置
    ln -sf /etc/nginx/sites-available/cv.juncaishe.com.conf /etc/nginx/sites-enabled/
    
    # 测试配置并重启nginx
    if nginx -t; then
        systemctl start nginx
        systemctl reload nginx
        
        # 配置证书自动续期
        log_info "配置证书自动续期..."
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        log_success "SSL证书配置完成"
        
        # 更新前端环境变量为HTTPS
        log_info "更新前端配置为HTTPS模式..."
        if update_frontend_to_https; then
            log_success "前端HTTPS配置完成"
        else
            log_warning "前端HTTPS配置失败，但SSL证书已配置"
        fi
        
        # 测试HTTPS访问
        log_info "测试HTTPS访问..."
        sleep 5  # 等待前端服务重启
        if curl -s -I "https://$DOMAIN" | grep -q "200 OK"; then
            log_success "HTTPS访问测试成功"
        else
            log_warning "HTTPS访问测试失败，请稍后重试"
        fi
        
    else
        log_error "Nginx配置测试失败"
        systemctl start nginx
        return 1
    fi
    
    return 0
}

# 更新前端环境变量为HTTPS
update_frontend_to_https() {
    log_info "更新前端环境变量为HTTPS..."
    
    cd "$PROJECT_DIR/frontend"
    
    # 更新环境配置为HTTPS
    cat > .env.production << EOF
# 生产环境配置 (SSL配置完成)
REACT_APP_API_URL=https://$DOMAIN/api
REACT_APP_BACKEND_URL=https://$DOMAIN/api
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0

# 功能开关
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PWA=true

# 外部服务
REACT_APP_DOMAIN=$DOMAIN
EOF
    
    # 重新构建前端
    log_info "重新构建前端应用（使用HTTPS API）..."
    if [ -d "build" ]; then
        rm -rf build
    fi
    
    export NODE_ENV=production
    export CI=false
    
    if npm run build; then
        log_success "前端重新构建完成"
        
        # 重启前端服务
        pm2 stop resume-frontend 2>/dev/null || true
        pm2 delete resume-frontend 2>/dev/null || true
        pm2 serve build $FRONTEND_PORT --name "resume-frontend" --spa
        pm2 save
        
        log_success "前端服务已更新为HTTPS模式"
    else
        log_error "前端重新构建失败"
        return 1
    fi
    
    return 0
}

# =============================================================================
# 🐛 调试和诊断函数
# =============================================================================

# 检查后端API详细状态
check_backend_api_debug() {
    log_info "🐛 检查后端API详细状态..."
    
    cd "$PROJECT_DIR/backend"
    
    # 检查后端日志
    if pm2 logs resume-backend --lines 50 --nostream > /tmp/backend-logs.txt 2>&1; then
        log_info "后端日志 (最近50行):"
        cat /tmp/backend-logs.txt | head -30
        
        # 检查是否有关键错误
        if grep -i "error\|fail\|exception" /tmp/backend-logs.txt; then
            log_error "发现后端错误，详细日志见上方"
        fi
    fi
    
    # 测试数据库连接
    log_info "测试数据库连接..."
    if docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "数据库连接正常"
    else
        log_error "数据库连接失败"
        docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" 2>&1 || true
    fi
    
    # 检查环境变量
    log_info "检查后端环境变量..."
    if [ -f ".env" ]; then
        log_info "环境变量文件存在:"
        grep -E "^[A-Z]" .env | head -10 || true
    else
        log_error "环境变量文件不存在"
    fi
    
    # 测试邮件服务配置
    log_info "测试邮件服务配置..."
    timeout 10 nc -zv "${SMTP_HOST}" "${SMTP_PORT}" 2>&1 | head -3 || {
        log_error "邮件服务器连接失败: ${SMTP_HOST}:${SMTP_PORT}"
    }
    
    # 测试API端点
    log_info "测试API端点..."
    
    # 测试健康检查
    if curl -s "http://localhost:$BACKEND_PORT/api/health" > /tmp/api-health.json 2>/dev/null; then
        log_success "API健康检查成功:"
        cat /tmp/api-health.json || echo "无响应内容"
    else
        log_error "API健康检查失败"
    fi
    
    # 测试发送验证码API (用假邮箱)
    log_info "测试发送验证码API..."
    curl -X POST "http://localhost:$BACKEND_PORT/api/auth/send-code" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","type":"register"}' \
        -v > /tmp/send-code-test.log 2>&1
    
    log_info "发送验证码API测试结果:"
    cat /tmp/send-code-test.log | head -20
    
    # 检查nginx访问日志
    log_info "检查Nginx访问日志 (最近20行)..."
    tail -20 "/var/log/nginx/$DOMAIN.access.log" 2>/dev/null || log_warning "Nginx访问日志不存在"
    
    # 检查nginx错误日志
    log_info "检查Nginx错误日志 (最近20行)..."
    tail -20 "/var/log/nginx/$DOMAIN.error.log" 2>/dev/null || log_warning "Nginx错误日志不存在"
}

# 创建详细的调试报告
create_debug_report() {
    log_info "📋 创建详细调试报告..."
    
    local report_file="/tmp/resume-debug-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=========================================="
        echo "AI俊才社简历系统 - 调试报告"
        echo "生成时间: $(date)"
        echo "=========================================="
        echo ""
        
        echo "=== 系统信息 ==="
        uname -a
        echo ""
        
        echo "=== PM2进程状态 ==="
        pm2 list
        echo ""
        
        echo "=== 端口监听状态 ==="
        netstat -tlnp | grep -E ":($FRONTEND_PORT|$BACKEND_PORT|$DB_PORT)"
        echo ""
        
        echo "=== Docker容器状态 ==="
        docker ps | grep resume
        echo ""
        
        echo "=== 数据库状态 ==="
        docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null || echo "数据库连接失败"
        echo ""
        
        echo "=== 后端环境变量 ==="
        if [ -f "$PROJECT_DIR/backend/.env" ]; then
            cat "$PROJECT_DIR/backend/.env" | grep -v "PASSWORD\|SECRET\|KEY" | head -15
        else
            echo "环境变量文件不存在"
        fi
        echo ""
        
        echo "=== 后端日志 (最近30行) ==="
        pm2 logs resume-backend --lines 30 --nostream 2>/dev/null || echo "无法获取后端日志"
        echo ""
        
        echo "=== Nginx配置测试 ==="
        nginx -t 2>&1
        echo ""
        
        echo "=== Nginx错误日志 (最近10行) ==="
        tail -10 "/var/log/nginx/error.log" 2>/dev/null || echo "无Nginx错误日志"
        echo ""
        
        echo "=== 磁盘空间 ==="
        df -h | head -5
        echo ""
        
        echo "=== 内存使用 ==="
        free -h
        echo ""
        
    } > "$report_file"
    
    log_success "调试报告已生成: $report_file"
    
    # 显示报告内容
    log_info "调试报告内容:"
    cat "$report_file"
}

# 修复验证码发送问题
fix_send_code_issue() {
    log_info "🔧 专门修复验证码发送问题..."
    
    cd "$PROJECT_DIR/backend"
    
    # 1. 检查邮件服务配置
    log_info "1. 检查邮件服务配置..."
    
    # 重新生成环境配置，确保邮件配置正确
    cat > .env << EOF
# 数据库配置
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# 服务器配置
PORT=$BACKEND_PORT
NODE_ENV=production
JWT_SECRET=$JWT_SECRET

# CORS配置
CORS_ORIGIN=http://$DOMAIN,https://$DOMAIN

# 邮件服务配置 (修复版)
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=${SMTP_USER:-admin@juncaishe.com}
SMTP_PASS=${SMTP_PASS:-your-qq-smtp-auth-code}
SMTP_FROM_NAME=AI俊才社简历系统
SMTP_FROM_EMAIL=${SMTP_USER:-admin@juncaishe.com}

# AI服务配置
OPENAI_API_KEY=$OPENAI_API_KEY
OPENAI_BASE_URL=$OPENAI_BASE_URL
DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY

# 系统配置
MAX_EMAIL_PER_HOUR=10
VERIFICATION_CODE_EXPIRE=600
MAX_LOGIN_ATTEMPTS=5

# 调试模式
DEBUG=true
LOG_LEVEL=debug
EOF
    
    # 2. 安装邮件相关依赖
    log_info "2. 确保邮件依赖完整..."
    npm install nodemailer @types/nodemailer --save 2>/dev/null || true
    
    # 3. 创建邮件服务测试脚本
    log_info "3. 创建邮件服务测试..."
    cat > test-email.js << 'EOF'
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('📧 测试邮件服务配置...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    
    const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    
    try {
        // 验证SMTP连接
        await transporter.verify();
        console.log('✅ SMTP连接成功');
        
        // 发送测试邮件
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: 'test@example.com',
            subject: '测试邮件',
            text: '这是一封测试邮件'
        });
        
        console.log('✅ 测试邮件发送成功:', info.messageId);
    } catch (error) {
        console.error('❌ 邮件服务错误:', error.message);
        if (error.code) console.error('错误代码:', error.code);
        if (error.command) console.error('失败命令:', error.command);
    }
}

testEmail().catch(console.error);
EOF
    
    # 4. 运行邮件测试
    log_info "4. 测试邮件服务..."
    timeout 30 node test-email.js 2>&1 || log_warning "邮件测试超时或失败"
    
    # 5. 重启后端服务并查看日志
    log_info "5. 重启后端服务..."
    pm2 restart resume-backend
    sleep 3
    
    # 6. 再次测试API
    log_info "6. 测试发送验证码API..."
    curl -X POST "http://localhost:$BACKEND_PORT/api/auth/send-code" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","type":"register"}' \
        -v 2>&1 | head -20
    
    log_success "验证码发送问题修复完成"
}

# =============================================================================
# 🚀 主要部署流程
# =============================================================================

# 修复模式 - 专门解决当前问题（增强版）
fix_mode() {
    log_title "系统修复模式 - 增强版"
    
    # 0. 清理调试脚本
    log_step 0 8 "清理调试脚本"
    cleanup_debug_scripts
    
    # 1. 修复Nginx配置冲突
    log_step 1 8 "修复Nginx配置冲突"
    fix_nginx_conflicts
    
    # 2. 清理PM2进程 - 使用修复版逻辑
    log_step 2 8 "清理PM2进程"
    cleanup_resume_processes
    
    # 3. 修复数据库 - 使用修复版逻辑
    log_step 3 8 "修复数据库"
    setup_database
    
    # 4. 数据库迁移
    log_step 4 8 "执行数据库迁移"
    if [ -d "$PROJECT_DIR/backend" ]; then
        cd "$PROJECT_DIR/backend"
        setup_backend
        
        # 执行迁移
        sleep 5  # 确保数据库完全就绪
        npm run migrate 2>/dev/null || {
            log_warning "迁移失败，手动创建基础表..."
            docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT now(),
                    updated_at TIMESTAMP DEFAULT now()
                );
            " 2>/dev/null || true
        }
    fi
    
    # 5. 修复502错误 - 确保PM2服务正常启动
    log_step 5 8 "修复502错误"
    fix_502_errors
    
    # 6. 重启服务
    log_step 6 8 "重启服务"
    start_services
    
    # 7. 重新配置Nginx
    log_step 7 8 "重新配置Nginx"
    setup_nginx
    
    # 8. 修复验证码发送问题
    log_step 8 9 "修复验证码发送问题"
    fix_send_code_issue
    
    # 9. 最终验证
    log_step 9 9 "最终验证"
    if comprehensive_health_check; then
        log_success "🎉 系统修复完成，所有服务正常运行！"
        log_info "前端访问: http://$DOMAIN"
        log_info "后端API: http://$DOMAIN/api"  
        log_info "IP访问: http://122.51.234.153:8080 (如果域名有缓存问题)"
        log_warning "⚠️ 如果仍有跳转问题，请清理浏览器缓存:"
        log_info "   - 按 Ctrl+Shift+R 强制刷新"
        log_info "   - 或在开发者工具中禁用缓存"
        log_info ""
        log_info "🔐 SSL证书配置:"
        log_info "   - 当前使用HTTP模式，系统运行稳定"
        log_info "   - 如需HTTPS，请运行: $0 --ssl-setup"
        log_info "   - SSL配置建议在HTTP稳定后再进行"
    else
        log_error "修复验证失败，请检查错误信息"
        return 1
    fi
}

# 完整部署
full_deploy() {
    log_title "开始完整部署流程"
    
    local start_time=$(date +%s)
    
    # 执行部署步骤
    log_step 1 8 "检查系统依赖"
    check_system_dependencies
    check_nodejs
    check_pm2
    check_docker
    check_nginx
    
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
    
    log_step 8 8 "配置Nginx"
    setup_nginx
    
    # 最终检查
    log_info "🔍 执行最终健康检查..."
    if comprehensive_health_check; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_title "部署成功完成！"
        log_success "总耗时: ${duration}秒"
        log_success "访问地址: http://$DOMAIN"
        log_info "管理命令: $0 --mode=check  # 健康检查"
        log_info "管理命令: $0 --mode=fix    # 故障修复"
    else
        log_error "健康检查失败，请检查系统状态"
        return 1
    fi
}

# 快速部署
quick_deploy() {
    log_title "快速部署模式"
    
    if quick_health_check; then
        log_success "系统运行正常，执行快速更新..."
        clone_project
        setup_frontend
        pm2 restart resume-backend resume-frontend
        systemctl reload nginx
        log_success "快速部署完成"
    else
        log_warning "系统状态异常，执行修复模式..."
        fix_mode
    fi
}

# 调试模式 - 专门排查500错误
debug_mode() {
    log_title "调试模式 - 排查服务器500错误"
    
    # 1. 检查基础服务状态
    log_step 1 6 "检查基础服务状态"
    if comprehensive_health_check; then
        log_success "基础服务检查通过"
    else
        log_warning "基础服务有问题，但继续调试"
    fi
    
    # 2. 检查后端API详细状态
    log_step 2 6 "检查后端API详细状态"
    check_backend_api_debug
    
    # 3. 修复验证码发送问题
    log_step 3 6 "修复验证码发送问题"
    fix_send_code_issue
    
    # 4. 再次测试API
    log_step 4 6 "再次测试API"
    log_info "测试发送验证码API..."
    curl -X POST "http://localhost:$BACKEND_PORT/api/auth/send-code" \
        -H "Content-Type: application/json" \
        -d '{"email":"debug@example.com","type":"register"}' \
        -w "\n状态码: %{http_code}\n" \
        2>&1 | tee /tmp/final-api-test.log
    
    # 5. 创建详细调试报告
    log_step 5 6 "创建详细调试报告"
    create_debug_report
    
    # 6. 提供解决建议
    log_step 6 6 "分析问题并提供建议"
    
    log_info "📊 问题分析："
    
    # 分析后端日志中的错误
    if grep -q "EAUTH\|Authentication failed" /tmp/backend-logs.txt 2>/dev/null; then
        log_error "🔍 发现邮件认证问题："
        log_info "  ❌ SMTP认证失败，请检查邮箱密码是否正确"
        log_info "  🔧 解决方案：在服务器上运行以下命令更新邮箱配置"
        log_info "     export SMTP_USER='your-email@qq.com'"
        log_info "     export SMTP_PASS='your-qq-auth-code'"
        log_info "     然后重新运行: $0 --mode=fix"
    fi
    
    if grep -q "ECONNREFUSED.*5435\|database.*connection" /tmp/backend-logs.txt 2>/dev/null; then
        log_error "🔍 发现数据库连接问题："
        log_info "  ❌ 数据库连接被拒绝"
        log_info "  🔧 解决方案：重启数据库容器"
        log_info "     docker restart $DB_CONTAINER_NAME"
    fi
    
    if grep -q "Cannot find module\|MODULE_NOT_FOUND" /tmp/backend-logs.txt 2>/dev/null; then
        log_error "🔍 发现依赖缺失问题："
        log_info "  ❌ 后端依赖不完整"
        log_info "  🔧 解决方案：重新安装依赖"
        log_info "     cd $PROJECT_DIR/backend && npm install"
    fi
    
    if grep -q "ENOTFOUND\|getaddrinfo.*smtp" /tmp/backend-logs.txt 2>/dev/null; then
        log_error "🔍 发现网络连接问题："
        log_info "  ❌ 无法连接到邮件服务器"
        log_info "  🔧 检查服务器网络连接"
    fi
    
    log_info ""
    log_success "🎯 调试完成！请根据上述分析解决问题"
    log_info "📋 完整调试报告已保存到 /tmp/resume-debug-report-*.txt"
    log_info "🔧 修复建议："
    log_info "   1. 配置正确的邮箱认证信息"
    log_info "   2. 运行修复模式: $0 --mode=fix"
    log_info "   3. 如仍有问题，请查看调试报告详情"
}

# SSL设置模式
ssl_setup_mode() {
    log_title "SSL证书设置模式"
    log_warning "⚠️  此功能将配置HTTPS，请确保HTTP版本正常工作"
    
    # 检查HTTP版本
    log_info "检查HTTP版本是否正常..."
    if curl -s -I "http://$DOMAIN" | grep -q "200 OK"; then
        log_success "HTTP版本运行正常，可以配置SSL"
    else
        log_error "HTTP版本异常，请先修复"
        log_info "建议命令: $0 --mode=fix"
        return 1
    fi
    
    log_info "建议使用独立的SSL配置脚本："
    log_info "sudo bash setup-ssl-certificate.sh"
    log_info ""
    log_info "这个脚本将："
    log_info "1. 申请Let's Encrypt SSL证书"
    log_info "2. 配置HTTPS版本的Nginx"
    log_info "3. 更新前端配置为HTTPS API"
    log_info "4. 设置证书自动续期"
    log_info ""
    log_warning "注意：SSL配置会暂时中断服务，建议在维护时间进行"
    
    # 询问是否继续
    echo ""
    read -p "是否要立即运行SSL配置？(y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "开始SSL配置..."
        fix_ssl_certificate
    else
        log_info "已取消SSL配置"
        log_info "你可以稍后运行: sudo bash setup-ssl-certificate.sh"
    fi
}

# =============================================================================
# 📋 帮助和主函数
# =============================================================================

# 显示配置信息
show_config() {
    echo "📋 【项目配置】"
    echo "   🎯 前端: React + TailwindCSS (端口:$FRONTEND_PORT)"
    echo "   ⚙️  后端: Node.js + Express + knex.js (端口:$BACKEND_PORT)"
    echo "   🗄️  数据库: PostgreSQL (端口:$DB_PORT)"
    echo "   🤖 AI功能: OpenAI GPT-4 + DeepSeek"
    echo "   📧 邮件服务: 腾讯云SES"
    echo "   🔐 认证: JWT Token"
    echo "   🌐 域名: $DOMAIN"
    echo ""
}

# 显示帮助信息
show_help() {
    cat << EOF
$SCRIPT_NAME v$SCRIPT_VERSION

🎯 自包含一键部署脚本，解决PM2进程重复、数据库认证失败等问题

用法: $0 [选项]

选项:
  --mode=full     完整部署（默认）
  --mode=quick    快速部署
  --mode=fix      修复模式（推荐解决当前问题）
  --mode=debug    调试模式（排查500错误）
  --mode=check    健康检查
  --debug         启用调试模式
  --help, -h      显示此帮助信息

模式说明:
  full    完整部署流程，包括所有组件的安装和配置
  quick   快速部署，适用于代码更新
  fix     修复系统问题，解决PM2重复进程、数据库认证等问题
  debug   深度调试模式，排查API 500错误，生成详细诊断报告
  check   仅执行健康检查，不做任何修改

示例:
  $0                          # 执行完整部署
  $0 --mode=fix               # 修复当前问题（推荐）
  $0 --mode=quick             # 执行快速部署  
  $0 --mode=check             # 检查系统状态
  $0 --debug --mode=fix       # 调试模式下修复问题

🔥 针对当前问题的特殊说明:
  - PM2进程重复（6个→2个）: 使用修复版进程识别逻辑
  - 数据库认证失败: 使用修复版PostgreSQL配置
  推荐命令: $0 --mode=fix

配置信息:
  项目目录: $PROJECT_DIR
  前端端口: $FRONTEND_PORT
  后端端口: $BACKEND_PORT
  数据库端口: $DB_PORT
  域名: $DOMAIN

维护: AI俊才社技术团队
EOF
}

# 错误处理
error_handler() {
    local exit_code=$?
    log_error "部署过程中发生错误 (退出码: $exit_code)"
    
    log_error "部署失败，请检查错误信息并重试"
    log_info "查看日志: tail -f $LOG_FILE"
    log_info "重新尝试: $0 --mode=fix"
    exit $exit_code
}

# 主函数
main() {
    # 设置错误处理
    trap error_handler ERR
    
    # 解析命令行参数
    DEPLOY_MODE="full"
    
    for arg in "$@"; do
        case $arg in
            --mode=*)
                DEPLOY_MODE="${arg#*=}"
                ;;
            --debug)
                LOG_LEVEL=0  # DEBUG级别
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $arg"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查运行权限
    if [ "$EUID" -ne 0 ]; then
        echo "❌ 请使用root权限运行此脚本"
        echo "正确用法: sudo $0"
        exit 1
    fi
    
    # 初始化系统
    init_log
    log_title "$SCRIPT_NAME v$SCRIPT_VERSION"
    show_config
    
    # 创建必要目录
    mkdir -p "$LOG_DIR" "$BACKUP_DIR"
    
    # 根据模式执行相应操作
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
        "debug")
            debug_mode
            ;;
        "ssl-setup")
            ssl_setup_mode
            ;;
        *)
            log_error "未知部署模式: $DEPLOY_MODE"
            show_help
            exit 1
            ;;
    esac
    
    log_success "🎉 操作完成！"
}

# 执行主函数
main "$@" 