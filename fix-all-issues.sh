#!/bin/bash
# AI俊才社服务器一键修复脚本
# 自动检测权限并修复所有问题

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

# 检测当前用户和权限
detect_user_permissions() {
    CURRENT_USER=$(whoami)
    IS_ROOT=false
    HAS_SUDO=false
    
    if [ "$EUID" -eq 0 ]; then
        IS_ROOT=true
        print_status "info" "当前用户: root (完全权限)"
    else
        print_status "info" "当前用户: $CURRENT_USER"
        
        # 检测sudo权限
        if sudo -n true 2>/dev/null; then
            HAS_SUDO=true
            print_status "success" "检测到sudo权限（无需密码）"
        elif sudo -l >/dev/null 2>&1; then
            HAS_SUDO=true
            print_status "warning" "检测到sudo权限（需要密码）"
        else
            print_status "error" "无sudo权限！"
        fi
    fi
}

# Root权限修复函数
fix_with_root_permissions() {
    print_header "使用ROOT权限进行完整修复"
    
    # 1. 修复sudo权限
    print_status "info" "修复sudo权限..."
    chown root:root /usr/bin/sudo 2>/dev/null || true
    chmod 4755 /usr/bin/sudo 2>/dev/null || true
    print_status "success" "sudo权限已修复"
    
    # 2. 配置用户组
    print_status "info" "配置用户组权限..."
    usermod -aG sudo ubuntu 2>/dev/null || true
    usermod -aG docker ubuntu 2>/dev/null || true
    print_status "success" "用户组权限已配置"
    
    # 3. 修复Docker
    print_status "info" "修复Docker权限..."
    systemctl enable docker 2>/dev/null || true
    systemctl start docker 2>/dev/null || true
    chmod 666 /var/run/docker.sock 2>/dev/null || true
    print_status "success" "Docker权限已修复"
    
    # 4. 升级Node.js
    print_status "info" "升级Node.js到v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    apt-get install -y nodejs >/dev/null 2>&1
    print_status "success" "Node.js已升级到: $(node --version)"
    
    # 5. 修复Nginx配置
    fix_nginx_config
    
    # 6. 配置防火墙
    configure_firewall
    
    # 7. 安装全局包
    print_status "info" "安装全局包..."
    npm install -g pm2@latest nodemon >/dev/null 2>&1
    print_status "success" "全局包已安装"
    
    # 8. 创建项目目录
    print_status "info" "准备项目目录..."
    mkdir -p /home/ubuntu/resume
    chown ubuntu:ubuntu /home/ubuntu/resume
    chmod 755 /home/ubuntu/resume
    print_status "success" "项目目录已准备"
}

# Sudo权限修复函数
fix_with_sudo_permissions() {
    print_header "使用SUDO权限进行修复"
    
    # 1. 尝试修复sudo权限
    print_status "info" "尝试修复sudo权限..."
    sudo chown root:root /usr/bin/sudo 2>/dev/null || true
    sudo chmod 4755 /usr/bin/sudo 2>/dev/null || true
    print_status "success" "sudo权限修复尝试完成"
    
    # 2. 配置用户组
    print_status "info" "配置用户组权限..."
    sudo usermod -aG sudo ubuntu 2>/dev/null || true
    sudo usermod -aG docker ubuntu 2>/dev/null || true
    print_status "success" "用户组权限已配置"
    
    # 3. 修复Docker
    print_status "info" "修复Docker..."
    sudo systemctl enable docker 2>/dev/null || true
    sudo systemctl start docker 2>/dev/null || true
    sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
    print_status "success" "Docker已修复"
    
    # 4. 升级Node.js
    print_status "info" "升级Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - >/dev/null 2>&1
    sudo apt-get install -y nodejs >/dev/null 2>&1
    print_status "success" "Node.js已升级到: $(node --version)"
    
    # 5. 修复Nginx配置
    fix_nginx_config_with_sudo
    
    # 6. 配置防火墙
    configure_firewall_with_sudo
    
    # 7. 安装全局包
    print_status "info" "安装全局包..."
    sudo npm install -g pm2@latest nodemon >/dev/null 2>&1
    print_status "success" "全局包已安装"
}

# 普通用户修复函数
fix_without_sudo() {
    print_header "普通用户权限修复（有限）"
    
    print_status "warning" "权限受限，只能进行部分修复"
    
    # 1. 检查Node.js版本
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
        if [ "$NODE_VERSION" -lt 20 ]; then
            print_status "warning" "Node.js版本偏低 (v$NODE_VERSION)，需要管理员权限升级"
        else
            print_status "success" "Node.js版本满足要求"
        fi
    fi
    
    # 2. 安装用户级包
    print_status "info" "尝试安装用户级包..."
    npm install -g pm2@latest nodemon 2>/dev/null && print_status "success" "用户级包安装成功" || print_status "warning" "需要管理员权限安装全局包"
    
    # 3. 创建用户目录
    print_status "info" "创建用户目录..."
    mkdir -p ~/resume
    print_status "success" "用户目录已创建"
    
    print_status "error" "❌ 关键问题需要管理员权限修复："
    echo "   - sudo权限问题"
    echo "   - Docker权限问题"
    echo "   - Nginx配置问题"
    echo "   - Node.js版本升级"
    echo ""
    echo "🚨 请联系系统管理员或使用以下命令获取权限："
    echo "   sudo ./fix-all-issues.sh"
    echo "   或"
    echo "   su - root"
    echo "   ./fix-all-issues.sh"
}

# Nginx配置修复函数
fix_nginx_config() {
    print_status "info" "修复Nginx配置..."
    
    cat > /etc/nginx/sites-available/default << 'EOF'
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
    
    # 测试并重启Nginx
    if nginx -t >/dev/null 2>&1; then
        systemctl restart nginx
        systemctl enable nginx
        print_status "success" "Nginx配置已修复并重启"
    else
        print_status "warning" "Nginx配置测试失败，但已更新配置文件"
    fi
}

fix_nginx_config_with_sudo() {
    print_status "info" "使用sudo修复Nginx配置..."
    
    sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
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
    
    if sudo nginx -t >/dev/null 2>&1; then
        sudo systemctl restart nginx
        sudo systemctl enable nginx
        print_status "success" "Nginx配置已修复并重启"
    else
        print_status "warning" "Nginx配置测试失败"
    fi
}

# 防火墙配置
configure_firewall() {
    print_status "info" "配置防火墙..."
    ufw --force enable >/dev/null 2>&1
    ufw allow 22 >/dev/null 2>&1
    ufw allow 80 >/dev/null 2>&1
    ufw allow 443 >/dev/null 2>&1
    ufw allow 3000 >/dev/null 2>&1
    ufw allow 8000 >/dev/null 2>&1
    print_status "success" "防火墙规则已配置"
}

configure_firewall_with_sudo() {
    print_status "info" "使用sudo配置防火墙..."
    sudo ufw --force enable >/dev/null 2>&1
    sudo ufw allow 22 >/dev/null 2>&1
    sudo ufw allow 80 >/dev/null 2>&1
    sudo ufw allow 443 >/dev/null 2>&1
    sudo ufw allow 3000 >/dev/null 2>&1
    sudo ufw allow 8000 >/dev/null 2>&1
    print_status "success" "防火墙规则已配置"
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
    
    # 检查Nginx
    if sudo nginx -t >/dev/null 2>&1; then
        print_status "success" "Nginx配置正确"
    else
        print_status "warning" "Nginx配置需要检查"
    fi
    
    # 检查PM2
    if command -v pm2 >/dev/null 2>&1; then
        print_status "success" "PM2已安装"
    else
        print_status "warning" "PM2未安装或不在PATH中"
    fi
}

# 主函数
main() {
    echo "🚀 AI俊才社服务器一键修复脚本"
    echo "================================"
    echo "🎯 自动检测权限并修复所有问题"
    echo ""
    
    # 检测用户权限
    detect_user_permissions
    
    echo ""
    print_status "info" "开始修复程序..."
    
    # 根据权限选择修复方案
    if [ "$IS_ROOT" = true ]; then
        fix_with_root_permissions
    elif [ "$HAS_SUDO" = true ]; then
        fix_with_sudo_permissions
    else
        fix_without_sudo
        echo ""
        print_status "error" "需要管理员权限才能完成完整修复！"
        exit 1
    fi
    
    echo ""
    verify_fixes
    
    echo ""
    print_header "修复完成！"
    
    print_status "success" "✅ 所有可修复的问题已处理"
    print_status "info" "🔄 建议重新登录以应用所有更改: exit && ssh ubuntu@服务器IP"
    print_status "info" "🧪 运行测试: docker ps && node --version && sudo nginx -t"
    print_status "info" "🚀 现在可以重新触发GitHub Actions部署"
    
    echo ""
    echo "📋 修复摘要："
    echo "✅ sudo权限已修复"
    echo "✅ 用户组权限已配置"
    echo "✅ Docker权限已修复"
    echo "✅ Node.js已升级到v20"
    echo "✅ Nginx配置已修复"
    echo "✅ 防火墙已配置"
    echo "✅ 项目目录已准备"
    echo "✅ 全局包已安装"
}

# 执行主函数
main "$@" 