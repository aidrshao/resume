#!/bin/bash

# AI俊才社简历管理系统 - 腾讯云Ubuntu 22.04一键部署脚本
# 作者: AI Assistant
# 版本: 1.0

set -e

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行，请使用sudo执行"
        exit 1
    fi
}

# 更新系统
update_system() {
    log_info "更新系统软件包..."
    apt update && apt upgrade -y
    log_success "系统更新完成"
}

# 安装基础依赖
install_dependencies() {
    log_info "安装基础依赖..."
    apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    log_success "基础依赖安装完成"
}

# 安装Docker
install_docker() {
    if command -v docker &> /dev/null; then
        log_warning "Docker已安装，跳过安装步骤"
        return
    fi
    
    log_info "安装Docker..."
    
    # 添加Docker官方GPG密钥
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # 添加Docker仓库
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 安装Docker Engine
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # 启动Docker服务
    systemctl enable docker
    systemctl start docker
    
    # 添加当前用户到docker组
    usermod -aG docker $SUDO_USER 2>/dev/null || true
    
    log_success "Docker安装完成"
}

# 安装Docker Compose
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose已安装，跳过安装步骤"
        return
    fi
    
    log_info "安装Docker Compose..."
    
    # 下载最新版本的Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # 添加执行权限
    chmod +x /usr/local/bin/docker-compose
    
    # 创建软链接
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log_success "Docker Compose安装完成"
}

# 安装Node.js
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_warning "Node.js已安装 ($NODE_VERSION)，跳过安装步骤"
        return
    fi
    
    log_info "安装Node.js 20.x..."
    
    # 添加NodeSource仓库
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    # 安装Node.js
    apt install -y nodejs
    
    log_success "Node.js安装完成"
}

# 安装Nginx
install_nginx() {
    if command -v nginx &> /dev/null; then
        log_warning "Nginx已安装，跳过安装步骤"
        return
    fi
    
    log_info "安装Nginx..."
    apt install -y nginx
    
    # 启动Nginx服务
    systemctl enable nginx
    systemctl start nginx
    
    log_success "Nginx安装完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # 启用UFW
    ufw --force enable
    
    # 允许SSH
    ufw allow ssh
    
    # 允许HTTP和HTTPS
    ufw allow 80
    ufw allow 443
    
    # 允许应用端口（如果需要直接访问）
    ufw allow 8000
    ufw allow 3016
    
    log_success "防火墙配置完成"
}

# 配置环境变量
configure_environment() {
    log_info "配置环境变量..."
    
    # 检查是否存在.env文件
    if [ ! -f ".env" ]; then
        if [ -f "env.production.template" ]; then
            log_warning ".env文件不存在，从生产环境模板创建..."
            cp env.production.template .env
            log_warning "重要：请编辑.env文件，填入正确的配置信息！"
            log_warning "配置文件位置: $(pwd)/.env"
            log_warning "必须配置的项目："
            log_warning "1. DB_PASSWORD - 数据库密码"
            log_warning "2. JWT_SECRET - JWT密钥"
            log_warning "3. AGICTO_API_KEY - AI API密钥"
            log_warning "4. TENCENT_SECRET_ID - 腾讯云密钥ID"
            log_warning "5. TENCENT_SECRET_KEY - 腾讯云密钥"
            
            echo ""
            echo "是否现在编辑.env文件？(y/n)"
            read -r edit_env
            if [ "$edit_env" = "y" ] || [ "$edit_env" = "Y" ]; then
                nano .env
            fi
        else
            log_error ".env和env.production.template文件都不存在！"
            exit 1
        fi
    fi
    
    log_success "环境变量配置检查完成"
}

# 配置Nginx反向代理
configure_nginx() {
    log_info "配置Nginx反向代理..."
    
    # 备份原始配置
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup 2>/dev/null || true
    
    # 复制应用配置文件
    if [ -f "nginx.conf" ]; then
        cp nginx.conf /etc/nginx/sites-available/resume-app
        ln -sf /etc/nginx/sites-available/resume-app /etc/nginx/sites-enabled/
        
        # 删除默认站点
        rm -f /etc/nginx/sites-enabled/default
        
        # 测试Nginx配置
        nginx -t
        
        # 重启Nginx
        systemctl restart nginx
        
        log_success "Nginx配置完成"
    else
        log_warning "nginx.conf文件不存在，跳过Nginx配置"
    fi
}

# 构建并启动服务
start_services() {
    log_info "构建并启动服务..."
    
    # 停止可能正在运行的服务
    docker-compose down 2>/dev/null || true
    
    # 构建镜像
    docker-compose build --no-cache
    
    # 启动服务
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    docker-compose ps
    
    log_success "服务启动完成"
}

# 检查服务健康状态
check_health() {
    log_info "检查服务健康状态..."
    
    # 检查PostgreSQL
    if docker-compose exec -T postgres pg_isready -U resume_user > /dev/null 2>&1; then
        log_success "PostgreSQL服务正常"
    else
        log_error "PostgreSQL服务异常"
        return 1
    fi
    
    # 检查后端服务
    if curl -s http://localhost:8000/status > /dev/null 2>&1; then
        log_success "后端服务正常"
    else
        log_error "后端服务异常"
        return 1
    fi
    
    # 检查Nginx
    if curl -s http://localhost > /dev/null 2>&1; then
        log_success "Nginx服务正常"
    else
        log_error "Nginx服务异常"
        return 1
    fi
    
    log_success "所有服务健康检查通过"
}

# 显示部署结果
show_result() {
    log_success "🎉 部署完成！"
    echo ""
    echo "==================== 部署信息 ===================="
    echo "应用目录: $(pwd)"
    echo "前端地址: http://$(curl -s ifconfig.me)"
    echo "后端API: http://$(curl -s ifconfig.me):8000"
    echo "管理命令:"
    echo "  查看日志: docker-compose logs -f"
    echo "  重启服务: docker-compose restart"
    echo "  停止服务: docker-compose down"
    echo "  启动服务: docker-compose up -d"
    echo ""
    echo "⚠️  重要提醒:"
    echo "1. 请确保已正确配置.env文件中的所有密钥"
    echo "2. 建议启用HTTPS证书 (Let's Encrypt)"
    echo "3. 定期备份数据库数据"
    echo "=================================================="
}

# 主函数
main() {
    log_info "开始部署AI俊才社简历管理系统..."
    
    # 检查root权限
    check_root
    
    # 更新系统
    update_system
    
    # 安装依赖
    install_dependencies
    install_docker
    install_docker_compose
    install_nodejs
    install_nginx
    
    # 配置系统
    configure_firewall
    configure_environment
    configure_nginx
    
    # 启动服务
    start_services
    
    # 健康检查
    check_health
    
    # 显示结果
    show_result
}

# 执行主函数
main "$@" 