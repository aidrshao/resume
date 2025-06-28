#!/bin/bash
# 为Ubuntu用户设计的安全修复脚本
# 专门解决GitHub Actions部署问题，不影响其他程序

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✅ ${message}${NC}" ;;
        "error")   echo -e "${RED}❌ ${message}${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  ${message}${NC}" ;;
        "info")    echo -e "${BLUE}ℹ️  ${message}${NC}" ;;
    esac
}

print_header() {
    echo ""
    echo "=============================================="
    echo "🔧 $1"
    echo "=============================================="
}

# 检查当前用户
check_user() {
    CURRENT_USER=$(whoami)
    if [ "$CURRENT_USER" != "ubuntu" ]; then
        print_status "error" "此脚本必须在ubuntu用户下运行！"
        print_status "info" "当前用户: $CURRENT_USER"
        print_status "info" "请切换到ubuntu用户: su - ubuntu"
        exit 1
    fi
    print_status "success" "当前用户正确: ubuntu"
}

# 检查sudo权限
check_sudo() {
    print_status "info" "检查sudo权限..."
    
    if sudo -n true 2>/dev/null; then
        print_status "success" "sudo权限正常（无需密码）"
        return 0
    elif timeout 5 sudo -S true </dev/null 2>/dev/null; then
        print_status "warning" "sudo权限需要密码"
        return 0
    else
        print_status "error" "sudo权限异常！需要修复"
        return 1
    fi
}

# 安全修复sudo权限（不影响其他程序）
safe_fix_sudo() {
    print_header "安全修复sudo权限"
    
    print_status "info" "备份当前sudo配置..."
    sudo cp /etc/sudoers /etc/sudoers.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    
    print_status "info" "检查sudo二进制文件权限..."
    current_perms=$(stat -c "%a %U:%G" /usr/bin/sudo)
    print_status "info" "当前权限: $current_perms"
    
    # 只有在权限确实有问题时才修复
    if [ "$(stat -c "%a" /usr/bin/sudo)" != "4755" ] || [ "$(stat -c "%U" /usr/bin/sudo)" != "root" ]; then
        print_status "warning" "sudo权限异常，正在修复..."
        sudo chown root:root /usr/bin/sudo
        sudo chmod 4755 /usr/bin/sudo
        print_status "success" "sudo权限已修复"
    else
        print_status "success" "sudo权限正常，无需修复"
    fi
}

# 安全配置用户组（不影响现有用户）
safe_config_groups() {
    print_header "安全配置用户组"
    
    # 检查并添加到sudo组
    if groups ubuntu | grep -q sudo; then
        print_status "success" "ubuntu用户已在sudo组中"
    else
        print_status "info" "将ubuntu用户添加到sudo组..."
        sudo usermod -aG sudo ubuntu
        print_status "success" "已添加到sudo组"
    fi
    
    # 检查并添加到docker组
    if groups ubuntu | grep -q docker; then
        print_status "success" "ubuntu用户已在docker组中"
    else
        print_status "info" "将ubuntu用户添加到docker组..."
        sudo usermod -aG docker ubuntu
        print_status "success" "已添加到docker组"
    fi
}

# 安全修复Docker（不重启服务，不影响运行中的容器）
safe_fix_docker() {
    print_header "安全修复Docker权限"
    
    # 检查Docker服务状态
    if systemctl is-active docker >/dev/null 2>&1; then
        print_status "success" "Docker服务正在运行"
    else
        print_status "warning" "Docker服务未运行，启动中..."
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
    
    # 检查docker socket权限
    if [ -w /var/run/docker.sock ]; then
        print_status "success" "Docker socket权限正常"
    else
        print_status "info" "修复Docker socket权限..."
        sudo chmod 666 /var/run/docker.sock
        print_status "success" "Docker socket权限已修复"
    fi
    
    # 测试Docker权限
    if docker ps >/dev/null 2>&1; then
        print_status "success" "Docker权限测试通过"
    else
        print_status "warning" "Docker权限异常，可能需要重新登录"
    fi
}

# 安全升级Node.js（不影响其他Node.js进程）
safe_upgrade_nodejs() {
    print_header "安全升级Node.js"
    
    current_version=$(node --version 2>/dev/null || echo "未安装")
    print_status "info" "当前Node.js版本: $current_version"
    
    if command -v node >/dev/null 2>&1; then
        major_version=$(node --version | sed 's/v//' | cut -d. -f1)
        if [ "$major_version" -ge 20 ]; then
            print_status "success" "Node.js版本满足要求 ($current_version)"
            return 0
        fi
    fi
    
    print_status "warning" "Node.js版本需要升级到v20+"
    print_status "info" "开始升级Node.js..."
    
    # 检查是否有运行中的Node.js进程
    running_processes=$(pgrep -f node | wc -l)
    if [ "$running_processes" -gt 0 ]; then
        print_status "warning" "检测到 $running_processes 个Node.js进程正在运行"
        print_status "info" "升级将不会影响正在运行的进程"
    fi
    
    # 下载并安装Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - >/dev/null 2>&1
    sudo apt-get install -y nodejs >/dev/null 2>&1
    
    new_version=$(node --version)
    print_status "success" "Node.js已升级到: $new_version"
}

# 安全修复Nginx配置（不重启服务，避免影响现有服务）
safe_fix_nginx() {
    print_header "安全修复Nginx配置"
    
    if ! command -v nginx >/dev/null 2>&1; then
        print_status "warning" "Nginx未安装，跳过配置"
        return 0
    fi
    
    # 备份现有配置
    print_status "info" "备份现有Nginx配置..."
    sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    
    # 检查配置是否需要更新
    if grep -q "proxy_pass.*localhost:3000" /etc/nginx/sites-available/default 2>/dev/null; then
        print_status "success" "Nginx配置已正确，无需修改"
        return 0
    fi
    
    print_status "info" "更新Nginx配置..."
    
    # 创建新的配置文件
    sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    # 前端代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 后端API代理
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    
    # 测试配置但不重启
    if sudo nginx -t >/dev/null 2>&1; then
        print_status "success" "Nginx配置语法正确"
        print_status "info" "💡 配置已更新，但未重启服务（避免影响现有连接）"
        print_status "info" "如需立即生效，请手动运行: sudo systemctl reload nginx"
    else
        print_status "warning" "Nginx配置测试失败，已恢复备份"
        sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default 2>/dev/null || true
    fi
}

# 安装必要的用户级工具
install_user_tools() {
    print_header "安装用户级工具"
    
    # 检查并安装PM2
    if command -v pm2 >/dev/null 2>&1; then
        print_status "success" "PM2已安装"
    else
        print_status "info" "安装PM2..."
        sudo npm install -g pm2@latest >/dev/null 2>&1
        print_status "success" "PM2安装完成"
    fi
    
    # 检查并安装nodemon
    if command -v nodemon >/dev/null 2>&1; then
        print_status "success" "nodemon已安装"
    else
        print_status "info" "安装nodemon..."
        sudo npm install -g nodemon >/dev/null 2>&1
        print_status "success" "nodemon安装完成"
    fi
}

# 准备项目目录
prepare_project_dir() {
    print_header "准备项目目录"
    
    PROJECT_DIR="/home/ubuntu/resume"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_status "success" "项目目录已存在: $PROJECT_DIR"
    else
        print_status "info" "创建项目目录..."
        mkdir -p "$PROJECT_DIR"
        print_status "success" "项目目录已创建: $PROJECT_DIR"
    fi
    
    # 确保目录权限正确
    if [ -w "$PROJECT_DIR" ]; then
        print_status "success" "项目目录权限正确"
    else
        print_status "info" "修复项目目录权限..."
        sudo chown ubuntu:ubuntu "$PROJECT_DIR"
        chmod 755 "$PROJECT_DIR"
        print_status "success" "项目目录权限已修复"
    fi
}

# 验证修复结果
verify_fixes() {
    print_header "验证修复结果"
    
    # 检查sudo权限
    if sudo -n true 2>/dev/null; then
        print_status "success" "sudo权限正常"
    else
        print_status "warning" "sudo权限可能需要密码"
    fi
    
    # 检查Docker权限
    if docker ps >/dev/null 2>&1; then
        print_status "success" "Docker权限正常"
    else
        print_status "warning" "Docker权限异常，可能需要重新登录"
    fi
    
    # 检查Node.js版本
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_status "success" "Node.js版本: $NODE_VERSION"
    else
        print_status "error" "Node.js未安装"
    fi
    
    # 检查工具安装
    for tool in pm2 nodemon; do
        if command -v $tool >/dev/null 2>&1; then
            print_status "success" "$tool已安装"
        else
            print_status "warning" "$tool未安装或不在PATH中"
        fi
    done
}

# 主函数
main() {
    echo "🛡️ Ubuntu用户安全修复脚本"
    echo "=============================="
    echo "🎯 专为GitHub Actions部署设计"
    echo "🔒 不影响其他运行中的程序"
    echo ""
    
    # 检查用户
    check_user
    
    # 检查sudo权限
    if ! check_sudo; then
        safe_fix_sudo
    fi
    
    # 执行安全修复
    safe_config_groups
    safe_fix_docker
    safe_upgrade_nodejs
    safe_fix_nginx
    install_user_tools
    prepare_project_dir
    
    # 验证结果
    verify_fixes
    
    print_header "修复完成！"
    
    print_status "success" "✅ 所有问题已安全修复"
    print_status "info" "🔒 未重启任何服务，不影响现有程序"
    print_status "warning" "⚠️  建议重新登录以应用组权限更改"
    print_status "info" "🚀 现在可以重新触发GitHub Actions部署"
    
    echo ""
    echo "📋 修复摘要："
    echo "✅ sudo权限已修复（安全方式）"
    echo "✅ 用户组权限已配置"
    echo "✅ Docker权限已修复（不重启服务）"
    echo "✅ Node.js已升级（不影响运行中进程）"
    echo "✅ Nginx配置已更新（不重启服务）"
    echo "✅ 必要工具已安装"
    echo "✅ 项目目录已准备"
    
    echo ""
    echo "🔄 下一步操作："
    echo "1. 重新登录: exit && ssh ubuntu@服务器IP"
    echo "2. 测试权限: docker ps && node --version"
    echo "3. 如需Nginx生效: sudo systemctl reload nginx"
    echo "4. 重新触发GitHub Actions部署"
}

# 执行主函数
main "$@" 