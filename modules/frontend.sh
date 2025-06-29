#!/bin/bash
# =============================================================================
# 前端部署模块 - AI俊才社简历系统
# =============================================================================

# 安装前端依赖
install_frontend_deps() {
    log_info "📦 安装前端依赖..."
    
    cd "$PROJECT_DIR/frontend"
    
    # 清理node_modules
    if [ -d "node_modules" ]; then
        log_debug "清理现有依赖..."
        rm -rf node_modules package-lock.json
    fi
    
    # 设置npm源
    npm config set registry https://registry.npmmirror.com
    
    # 安装依赖
    if npm install; then
        log_success "前端依赖安装完成"
    else
        log_error "前端依赖安装失败"
        return 1
    fi
}

# 创建前端环境配置
create_frontend_env() {
    log_info "📝 创建前端环境配置..."
    
    cd "$PROJECT_DIR/frontend"
    
    cat > .env.production << EOF
# 生产环境配置
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
    
    if [ -f ".env.production" ]; then
        log_success "前端环境配置创建完成"
    else
        log_error "前端环境配置创建失败"
        return 1
    fi
}

# 构建前端
build_frontend() {
    log_info "🔨 构建前端应用..."
    
    cd "$PROJECT_DIR/frontend"
    
    # 清理旧构建
    if [ -d "build" ]; then
        rm -rf build
    fi
    
    # 设置构建环境
    export NODE_ENV=production
    export CI=false  # 忽略警告当作错误
    
    # 开始构建
    log_debug "执行npm run build..."
    if npm run build; then
        log_success "前端构建完成"
    else
        log_error "前端构建失败"
        return 1
    fi
    
    # 验证构建结果
    if [ -d "build" ] && [ -f "build/index.html" ]; then
        local build_size=$(du -sh build | cut -f1)
        log_success "构建验证通过，大小: $build_size"
    else
        log_error "构建验证失败，缺少必要文件"
        return 1
    fi
}

# 检查前端文件结构
check_frontend_structure() {
    log_info "🔍 检查前端文件结构..."
    
    cd "$PROJECT_DIR/frontend"
    
    # 检查关键文件
    local missing_files=()
    
    if [ ! -f "package.json" ]; then
        missing_files+=("package.json")
    fi
    
    if [ ! -f "public/index.html" ]; then
        missing_files+=("public/index.html")
    fi
    
    if [ ! -d "src" ]; then
        missing_files+=("src/")
    fi
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        log_error "缺少关键文件: ${missing_files[*]}"
        return 1
    fi
    
    # 检查package.json中的scripts
    if ! grep -q '"build"' package.json; then
        log_error "package.json缺少build脚本"
        return 1
    fi
    
    log_success "前端文件结构检查通过"
}

# 优化前端构建
optimize_frontend() {
    log_info "⚡ 优化前端构建..."
    
    cd "$PROJECT_DIR/frontend/build"
    
    # 压缩静态文件
    if command -v gzip &> /dev/null; then
        log_debug "压缩CSS和JS文件..."
        find . -name "*.css" -o -name "*.js" | while read -r file; do
            if [ ! -f "${file}.gz" ]; then
                gzip -c "$file" > "${file}.gz"
            fi
        done
        log_success "文件压缩完成"
    fi
    
    # 设置文件权限
    chmod -R 644 .
    find . -type d -exec chmod 755 {} \;
    
    log_success "前端优化完成"
}

# 设置前端
setup_frontend() {
    log_subtitle "配置前端应用"
    
    # 检查文件结构
    check_frontend_structure || return 1
    
    # 安装依赖
    install_frontend_deps || return 1
    
    # 创建环境配置
    create_frontend_env || return 1
    
    # 构建应用
    build_frontend || return 1
    
    # 优化构建
    optimize_frontend || return 1
    
    log_success "前端设置完成"
}

# 导出函数
export -f install_frontend_deps create_frontend_env build_frontend
export -f check_frontend_structure optimize_frontend setup_frontend 