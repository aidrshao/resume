#!/bin/bash
# =============================================================================
# 配置管理模块 - AI俊才社简历系统
# =============================================================================

# 项目配置
export PROJECT_NAME="AI俊才社简历系统"
export PROJECT_DIR="/home/ubuntu/resume"
export GIT_REPO="git@github.com:aidrshao/resume.git"

# 端口配置
export FRONTEND_PORT=3016
export BACKEND_PORT=8000
export DB_PORT=5435

# 数据库配置
export DB_HOST="localhost"
export DB_NAME="resume_db"
export DB_USER="resume_user"
export DB_PASSWORD="ResumePass123"
export DB_CONTAINER_NAME="resume-postgres"

# 域名配置
export DOMAIN="cv.juncaishe.com"

# 路径配置
export LOG_DIR="/var/log"
export BACKUP_DIR="/root/backups"
export MODULES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export SCRIPT_DIR="$(dirname "$MODULES_DIR")"

# JWT配置
export JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "default-jwt-secret-key")

# AI服务配置（需要用户提供）
export OPENAI_API_KEY="${OPENAI_API_KEY:-your-openai-api-key}"
export OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://api.agicto.cn/v1}"
export DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-your-deepseek-api-key}"

# 邮件服务配置
export SMTP_HOST="${SMTP_HOST:-smtp.qq.com}"
export SMTP_PORT="${SMTP_PORT:-587}"
export SMTP_USER="${SMTP_USER:-your-email@qq.com}"
export SMTP_PASS="${SMTP_PASS:-your-smtp-password}"

# 系统配置
export NODE_ENV="production"
export PM2_INSTANCES=1
export MAX_MEMORY="1G"

# 运行时配置
export MAX_RETRIES=3
export WAIT_TIMEOUT=60
export DEBUG_MODE=${DEBUG_MODE:-false}

# 创建必要目录
ensure_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "/var/www/certbot"
}

# 验证配置
validate_config() {
    local missing_configs=()
    
    # 检查必需的配置
    if [[ "$OPENAI_API_KEY" == "your-openai-api-key" ]]; then
        missing_configs+=("OPENAI_API_KEY")
    fi
    
    if [[ "$SMTP_USER" == "your-email@qq.com" ]]; then
        missing_configs+=("SMTP配置")
    fi
    
    if [ ${#missing_configs[@]} -gt 0 ]; then
        echo "⚠️ 警告: 以下配置需要手动设置:"
        for config in "${missing_configs[@]}"; do
            echo "  - $config"
        done
        echo ""
        echo "📝 请在部署前设置环境变量或修改 modules/config.sh"
        echo ""
    fi
}

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

# 加载环境变量
load_env() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        source "$env_file"
        echo "✅ 已加载环境配置: $env_file"
    fi
}

# 初始化配置
init_config() {
    # 创建必要目录
    mkdir -p "$LOG_DIR" "$BACKUP_DIR"
    
    # 验证配置
    validate_config
    
    # 设置环境变量
    export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
    
    return 0
}

# 导出函数
export -f ensure_directories validate_config show_config load_env init_config 