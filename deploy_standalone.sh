#!/bin/bash

# AI俊才社简历系统 - 优化版部署脚本
# 修复数据库字段问题和简历上传功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志文件
LOG_FILE="/var/log/resume-deploy.log"
ERROR_LOG="/var/log/resume-deploy-error.log"

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$ERROR_LOG"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

# 帮助信息
show_help() {
    cat << EOF
AI俊才社简历系统 - 优化版部署脚本

用法:
    sudo bash deploy_standalone.sh [选项]

选项:
    --help              显示帮助信息
    --nginx-only        仅重新配置Nginx
    --db-fix-only       仅修复数据库问题
    --no-migration      跳过数据库迁移
    --force             强制重新部署

示例:
    sudo bash deploy_standalone.sh
    sudo bash deploy_standalone.sh --nginx-only
    sudo bash deploy_standalone.sh --db-fix-only

EOF
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "请使用root权限运行此脚本"
        exit 1
    fi
}

# 创建日志目录
setup_logging() {
    mkdir -p $(dirname "$LOG_FILE")
    touch "$LOG_FILE" "$ERROR_LOG"
    chmod 644 "$LOG_FILE" "$ERROR_LOG"
}

# 检查系统环境
check_system() {
    log "检查系统环境..."
    
    # 检查操作系统
    if ! command -v apt-get &> /dev/null && ! command -v yum &> /dev/null; then
        error "不支持的操作系统，仅支持Ubuntu/Debian和CentOS/RHEL"
        exit 1
    fi
    
    # 检查网络连接
    if ! ping -c 1 google.com &> /dev/null; then
        warning "网络连接可能存在问题，继续尝试部署..."
    fi
}

# 安装依赖
install_dependencies() {
    log "安装系统依赖..."
    
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        apt-get update
        apt-get install -y curl wget git nginx postgresql-client
        
        # 安装Node.js
        if ! command -v node &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
        fi
        
        # 安装Docker
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            systemctl start docker
            systemctl enable docker
        fi
        
        # 安装Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        yum update -y
        yum install -y curl wget git nginx postgresql
        
        # 安装Node.js
        if ! command -v node &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
            yum install -y nodejs
        fi
        
        # 安装Docker
        if ! command -v docker &> /dev/null; then
            yum install -y docker
            systemctl start docker
            systemctl enable docker
        fi
        
        # 安装Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
    fi
    
    # 安装PM2
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
}

# 准备项目目录
prepare_project() {
    log "准备项目目录..."
    
    PROJECT_DIR="/home/ubuntu/resume"
    
    if [ -d "$PROJECT_DIR" ]; then
        log "项目目录已存在，更新代码..."
        cd "$PROJECT_DIR"
        git pull origin main || {
            warning "Git拉取失败，尝试重新克隆..."
            cd /home/ubuntu
            rm -rf resume
            git clone https://github.com/shaojunc/resume.git
            cd resume
        }
    else
        log "克隆项目代码..."
        cd /home/ubuntu
        git clone https://github.com/shaojunc/resume.git
        cd resume
    fi
    
    chown -R ubuntu:ubuntu "$PROJECT_DIR"
}

# 智能端口检测
detect_ports() {
    log "检测可用端口..."
    
    # 检查端口是否被占用
    check_port() {
        local port=$1
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            return 1
        fi
        return 0
    }
    
    # 前端端口检测
    FRONTEND_PORT=3016
    for port in {3016..3030}; do
        if check_port $port; then
            FRONTEND_PORT=$port
            break
        fi
    done
    
    # 后端端口检测
    BACKEND_PORT=8000
    for port in {8000..8020}; do
        if check_port $port; then
            BACKEND_PORT=$port
            break
        fi
    done
    
    # 数据库端口检测
    DB_PORT=5432
    for port in {5432..5442}; do
        if check_port $port; then
            DB_PORT=$port
            break
        fi
    done
    
    log "分配端口: 前端=$FRONTEND_PORT, 后端=$BACKEND_PORT, 数据库=$DB_PORT"
}

# 配置数据库
setup_database() {
    log "配置PostgreSQL数据库..."
    
    # 停止现有容器
    docker stop resume-postgres 2>/dev/null || true
    docker rm resume-postgres 2>/dev/null || true
    
    # 启动PostgreSQL容器
    docker run -d \
        --name resume-postgres \
        -e POSTGRES_DB=resume_db \
        -e POSTGRES_USER=resume_user \
        -e POSTGRES_PASSWORD=resume_password_2024 \
        -p "$DB_PORT:5432" \
        -v resume_postgres_data:/var/lib/postgresql/data \
        --restart unless-stopped \
        postgres:13
    
    # 等待数据库启动
    log "等待数据库启动..."
    for i in {1..30}; do
        if docker exec resume-postgres pg_isready -U resume_user -d resume_db > /dev/null 2>&1; then
            log "数据库启动成功"
            break
        fi
        sleep 2
    done
}

# 配置后端
setup_backend() {
    log "配置后端服务..."
    
    cd "$PROJECT_DIR/backend"
    
    # 安装依赖
    npm install --production
    
    # 创建环境配置
    cat > .env << EOF
NODE_ENV=production
PORT=$BACKEND_PORT
DB_HOST=localhost
DB_PORT=$DB_PORT
DB_USER=resume_user
DB_PASSWORD=resume_password_2024
DB_NAME=resume_db
JWT_SECRET=your-jwt-secret-key-2024
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.agicto.cn/v1
GPT_API_KEY=your-gpt-api-key
GPT_BASE_URL=https://api.agicto.cn/v1
UPLOAD_PATH=/home/ubuntu/resume/backend/uploads
EOF
    
    # 创建上传目录
    mkdir -p uploads
    chown -R ubuntu:ubuntu uploads
    
    # 运行数据库迁移
    if [ "$SKIP_MIGRATION" != "true" ]; then
        log "运行数据库迁移..."
        npm run migrate || {
            error "数据库迁移失败，尝试修复..."
            node scripts/fix-production-database.js
        }
    fi
    
    # 停止现有服务
    pm2 stop resume-backend 2>/dev/null || true
    pm2 delete resume-backend 2>/dev/null || true
    
    # 启动后端服务
    pm2 start server.js --name resume-backend --env production
    pm2 save
}

# 配置前端
setup_frontend() {
    log "配置前端服务..."
    
    cd "$PROJECT_DIR/frontend"
    
    # 安装依赖
    npm install --production
    
    # 创建环境配置
    cat > .env << EOF
REACT_APP_API_URL=http://localhost:$BACKEND_PORT
REACT_APP_FRONTEND_URL=http://localhost:$FRONTEND_PORT
EOF
    
    # 构建前端
    npm run build
    
    # 停止现有服务
    pm2 stop resume-frontend 2>/dev/null || true
    pm2 delete resume-frontend 2>/dev/null || true
    
    # 启动前端服务
    pm2 serve build $FRONTEND_PORT --name resume-frontend --spa
    pm2 save
}

# 配置Nginx
setup_nginx() {
    log "配置Nginx反向代理..."
    
    # 备份原配置
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d%H%M%S) 2>/dev/null || true
    
    # 创建新配置
    cat > /etc/nginx/sites-available/resume << EOF
server {
    listen 80;
    server_name cv.juncaishe.com;
    
    # 日志配置
    access_log /var/log/nginx/resume_access.log;
    error_log /var/log/nginx/resume_error.log;
    
    # 前端静态文件
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
    }
    
    # API接口
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
        
        # 文件上传配置
        client_max_body_size 50M;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:$BACKEND_PORT/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/resume /etc/nginx/sites-enabled/resume
    
    # 删除默认配置
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    
    # 重启Nginx
    systemctl restart nginx
    systemctl enable nginx
}

# 修复数据库问题
fix_database() {
    log "修复数据库问题..."
    
    cd "$PROJECT_DIR/backend"
    
    # 运行数据库修复脚本
    node scripts/fix-production-database.js
    
    log "数据库修复完成"
}

# 最终验证
verify_deployment() {
    log "验证部署结果..."
    
    # 检查服务状态
    pm2 list
    
    # 检查端口监听
    netstat -tlnp | grep -E ":($FRONTEND_PORT|$BACKEND_PORT|$DB_PORT) "
    
    # 检查Docker容器
    docker ps | grep resume-postgres
    
    # 检查Nginx状态
    systemctl status nginx
    
    # 健康检查
    sleep 10
    if curl -f http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        log "后端健康检查通过"
    else
        error "后端健康检查失败"
    fi
    
    if curl -f http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        log "前端健康检查通过"
    else
        error "前端健康检查失败"
    fi
    
    log "部署完成！"
    log "访问地址:"
    log "  - 主站: http://cv.juncaishe.com"
    log "  - 直接访问: http://$(hostname -I | awk '{print $1}'):$FRONTEND_PORT"
    log "  - API: http://$(hostname -I | awk '{print $1}'):$BACKEND_PORT"
}

# 主函数
main() {
    log "开始部署AI俊才社简历系统..."
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --nginx-only)
                NGINX_ONLY=true
                shift
                ;;
            --db-fix-only)
                DB_FIX_ONLY=true
                shift
                ;;
            --no-migration)
                SKIP_MIGRATION=true
                shift
                ;;
            --force)
                FORCE_DEPLOY=true
                shift
                ;;
            *)
                error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查root权限
    check_root
    
    # 设置日志
    setup_logging
    
    # 仅修复数据库
    if [ "$DB_FIX_ONLY" = true ]; then
        PROJECT_DIR="/home/ubuntu/resume"
        fix_database
        exit 0
    fi
    
    # 仅配置Nginx
    if [ "$NGINX_ONLY" = true ]; then
        detect_ports
        setup_nginx
        exit 0
    fi
    
    # 完整部署流程
    log "[1/9] 检查系统环境"
    check_system
    
    log "[2/9] 安装依赖"
    install_dependencies
    
    log "[3/9] 准备项目目录"
    prepare_project
    
    log "[4/9] 检测端口"
    detect_ports
    
    log "[5/9] 配置数据库"
    setup_database
    
    log "[6/9] 配置后端服务"
    setup_backend
    
    log "[7/9] 配置前端服务"
    setup_frontend
    
    log "[8/9] 配置Nginx"
    setup_nginx
    
    log "[9/9] 最终验证"
    verify_deployment
    
    log "🎉 部署完成！"
}

# 捕获错误
trap 'error "部署脚本异常退出"; exit 1' ERR

# 运行主函数
main "$@" 