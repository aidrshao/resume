#!/bin/bash
# =============================================================================
# 后端部署模块 - AI俊才社简历系统
# =============================================================================

# 克隆或更新项目代码
clone_project() {
    log_info "📥 获取项目代码..."
    
    # 备份现有项目
    if [ -d "$PROJECT_DIR" ]; then
        local backup_dir="${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
        log_info "备份现有项目到: $backup_dir"
        mv "$PROJECT_DIR" "$backup_dir"
    fi
    
    # 测试GitHub SSH连接
    log_debug "测试GitHub SSH连接..."
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        log_success "GitHub SSH连接正常"
    else
        log_warning "GitHub SSH连接失败，尝试HTTPS方式"
        GIT_REPO="https://github.com/aidrshao/resume.git"
    fi
    
    # 克隆项目
    log_info "克隆项目: $GIT_REPO"
    if git clone "$GIT_REPO" "$PROJECT_DIR"; then
        log_success "项目克隆成功"
    else
        log_error "项目克隆失败"
        return 1
    fi
    
    cd "$PROJECT_DIR"
}

# 安装后端依赖
install_backend_deps() {
    log_info "📦 安装后端依赖..."
    
    cd "$PROJECT_DIR/backend"
    
    # 清理node_modules
    if [ -d "node_modules" ]; then
        log_debug "清理现有依赖..."
        rm -rf node_modules package-lock.json
    fi
    
    # 设置npm源
    npm config set registry https://registry.npmmirror.com
    
    # 安装依赖
    if npm install --production; then
        log_success "后端依赖安装完成"
    else
        log_error "后端依赖安装失败"
        return 1
    fi
}

# 创建后端环境配置
create_backend_env() {
    log_info "📝 创建后端环境配置..."
    
    cd "$PROJECT_DIR/backend"
    
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
    
    # 验证配置
    if [ -f ".env" ]; then
        log_success "后端环境配置创建完成"
        log_debug "环境变量验证: NODE_ENV=$(grep NODE_ENV .env | cut -d= -f2)"
    else
        log_error "环境配置创建失败"
        return 1
    fi
}

# 测试后端配置
test_backend_config() {
    log_info "🔍 测试后端配置..."
    
    cd "$PROJECT_DIR/backend"
    
    # 检查关键文件
    local missing_files=()
    
    if [ ! -f "server.js" ]; then
        missing_files+=("server.js")
    fi
    
    if [ ! -f "package.json" ]; then
        missing_files+=("package.json")
    fi
    
    if [ ! -f ".env" ]; then
        missing_files+=(".env")
    fi
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        log_error "缺少关键文件: ${missing_files[*]}"
        return 1
    fi
    
    # 测试Node.js语法
    if node -c server.js >/dev/null 2>&1; then
        log_success "后端代码语法检查通过"
    else
        log_warning "后端代码语法检查异常"
    fi
    
    # 验证依赖
    if npm ls --depth=0 >/dev/null 2>&1; then
        log_success "后端依赖验证通过"
    else
        log_warning "后端依赖验证异常"
    fi
}

# 设置后端
setup_backend() {
    log_subtitle "配置后端服务"
    
    # 安装依赖
    install_backend_deps || return 1
    
    # 创建环境配置
    create_backend_env || return 1
    
    # 测试配置
    test_backend_config || return 1
    
    log_success "后端设置完成"
}

# 导出函数
export -f clone_project install_backend_deps create_backend_env
export -f test_backend_config setup_backend 