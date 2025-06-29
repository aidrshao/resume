#!/bin/bash
# 腾讯云服务器部署环境检测脚本
# 用于检查AI俊才社简历管理系统的部署环境

set -e

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo "🔍 $1"
    echo "=============================================="
}

# 主要检测函数
check_system_info() {
    print_header "系统基本信息"
    
    print_status "info" "操作系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    print_status "info" "内核版本: $(uname -r)"
    print_status "info" "架构: $(uname -m)"
    print_status "info" "当前用户: $(whoami)"
    print_status "info" "用户ID: $(id)"
    print_status "info" "系统时间: $(date)"
    print_status "info" "系统负载: $(uptime)"
}

check_disk_space() {
    print_header "磁盘空间检查"
    
    df -h
    echo ""
    
    # 检查根目录可用空间
    available_gb=$(df / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $available_gb =~ ^[0-9]+$ ]] && [ "$available_gb" -gt 5 ]; then
        print_status "success" "磁盘空间充足: ${available_gb}GB 可用"
    else
        print_status "error" "磁盘空间不足！建议至少5GB可用空间"
    fi
}

check_memory() {
    print_header "内存检查"
    
    free -h
    echo ""
    
    # 检查可用内存
    available_mb=$(free -m | awk 'NR==2{print $7}')
    if [ "$available_mb" -gt 1024 ]; then
        print_status "success" "内存充足: ${available_mb}MB 可用"
    else
        print_status "warning" "内存偏低: ${available_mb}MB 可用，建议至少1GB"
    fi
}

check_network() {
    print_header "网络连接检查"
    
    # 检查基本网络连接
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        print_status "success" "外网连接正常"
    else
        print_status "error" "外网连接失败！"
    fi
    
    # 检查DNS解析
    if nslookup github.com >/dev/null 2>&1; then
        print_status "success" "DNS解析正常"
    else
        print_status "error" "DNS解析失败！"
    fi
    
    # 检查GitHub连接
    if curl -s --connect-timeout 5 https://api.github.com >/dev/null; then
        print_status "success" "GitHub API连接正常"
    else
        print_status "warning" "GitHub API连接异常"
    fi
}

check_user_permissions() {
    print_header "用户权限检查"
    
    # 检查sudo权限
    if sudo -n true 2>/dev/null; then
        print_status "success" "sudo权限正常（无需密码）"
    elif sudo -l >/dev/null 2>&1; then
        print_status "warning" "有sudo权限但需要密码"
    else
        print_status "error" "无sudo权限！"
    fi
    
    # 检查用户组
    if groups | grep -q docker; then
        print_status "success" "用户在docker组中"
    else
        print_status "warning" "用户不在docker组中"
    fi
}

check_docker() {
    print_header "Docker环境检查"
    
    # 检查Docker是否安装
    if command -v docker >/dev/null 2>&1; then
        print_status "success" "Docker已安装: $(docker --version)"
        
        # 检查Docker服务状态
        if systemctl is-active docker >/dev/null 2>&1; then
            print_status "success" "Docker服务运行中"
        else
            print_status "error" "Docker服务未运行"
            print_status "info" "尝试启动Docker服务..."
            if sudo systemctl start docker; then
                print_status "success" "Docker服务启动成功"
            else
                print_status "error" "Docker服务启动失败"
            fi
        fi
        
        # 检查Docker权限
        if docker ps >/dev/null 2>&1; then
            print_status "success" "Docker权限正常"
        else
            print_status "warning" "Docker权限异常，需要sudo"
        fi
        
        # 测试Docker运行
        if docker run --rm hello-world >/dev/null 2>&1; then
            print_status "success" "Docker运行测试通过"
        else
            print_status "error" "Docker运行测试失败"
        fi
        
    else
        print_status "error" "Docker未安装！"
        print_status "info" "安装Docker命令:"
        echo "  sudo apt update"
        echo "  sudo apt install -y docker.io"
        echo "  sudo systemctl start docker"
        echo "  sudo systemctl enable docker"
        echo "  sudo usermod -aG docker \$USER"
    fi
}

check_nodejs() {
    print_header "Node.js环境检查"
    
    if command -v node >/dev/null 2>&1; then
        node_version=$(node --version)
        print_status "success" "Node.js已安装: $node_version"
        
        # 检查版本是否满足要求（需要Node.js 20+）
        major_version=$(echo $node_version | cut -d'.' -f1 | sed 's/v//')
        if [ "$major_version" -ge 20 ]; then
            print_status "success" "Node.js版本满足要求"
        else
            print_status "warning" "Node.js版本偏低，推荐20+版本"
        fi
    else
        print_status "error" "Node.js未安装！"
        print_status "info" "安装Node.js命令:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
    fi
    
    if command -v npm >/dev/null 2>&1; then
        print_status "success" "npm已安装: $(npm --version)"
    else
        print_status "error" "npm未安装！"
    fi
}

check_pm2() {
    print_header "PM2进程管理器检查"
    
    if command -v pm2 >/dev/null 2>&1; then
        print_status "success" "PM2已安装: $(pm2 --version)"
        print_status "info" "当前PM2进程列表:"
        pm2 list 2>/dev/null || print_status "warning" "PM2进程列表为空"
    else
        print_status "warning" "PM2未安装"
        print_status "info" "安装PM2命令: sudo npm install -g pm2"
    fi
}

check_nginx() {
    print_header "Nginx Web服务器检查"
    
    if command -v nginx >/dev/null 2>&1; then
        print_status "success" "Nginx已安装: $(nginx -v 2>&1)"
        
        if systemctl is-active nginx >/dev/null 2>&1; then
            print_status "success" "Nginx服务运行中"
        else
            print_status "warning" "Nginx服务未运行"
        fi
        
        # 测试Nginx配置
        if sudo nginx -t >/dev/null 2>&1; then
            print_status "success" "Nginx配置文件正确"
        else
            print_status "error" "Nginx配置文件有错误"
        fi
    else
        print_status "warning" "Nginx未安装"
        print_status "info" "安装Nginx命令: sudo apt install -y nginx"
    fi
}

check_ports() {
    print_header "端口可用性检查"
    
    # 检查常用端口
    ports=(22 80 443 3000 8000 5432)
    
    for port in "${ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1; then
            process=$(lsof -i :$port | grep LISTEN | head -1 | awk '{print $1}')
            print_status "warning" "端口 $port 被占用 (进程: $process)"
        else
            print_status "success" "端口 $port 可用"
        fi
    done
}

check_firewall() {
    print_header "防火墙设置检查"
    
    # 检查ufw
    if command -v ufw >/dev/null 2>&1; then
        ufw_status=$(sudo ufw status 2>/dev/null || echo "inactive")
        print_status "info" "UFW防火墙状态: $ufw_status"
    fi
    
    # 检查iptables
    if command -v iptables >/dev/null 2>&1; then
        rule_count=$(sudo iptables -L | wc -l)
        print_status "info" "iptables规则数量: $rule_count"
    fi
    
    # 检查关键端口
    print_status "info" "建议开放的端口: 22(SSH), 80(HTTP), 443(HTTPS)"
}

check_ssl_tools() {
    print_header "SSL工具检查"
    
    if command -v openssl >/dev/null 2>&1; then
        print_status "success" "OpenSSL已安装: $(openssl version)"
    else
        print_status "warning" "OpenSSL未安装"
    fi
    
    if command -v certbot >/dev/null 2>&1; then
        print_status "success" "Certbot已安装: $(certbot --version)"
    else
        print_status "info" "Certbot未安装（SSL证书申请工具）"
        print_status "info" "安装命令: sudo apt install -y certbot python3-certbot-nginx"
    fi
}

generate_deployment_script() {
    print_header "生成部署修复脚本"
    
    cat > fix-deployment-environment.sh << 'EOF'
#!/bin/bash
# AI俊才社部署环境修复脚本

echo "🔧 开始修复部署环境..."

# 更新系统包
sudo apt update

# 安装Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "安装Docker..."
    sudo apt install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
fi

# 安装Node.js 20
if ! command -v node >/dev/null 2>&1; then
    echo "安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 安装PM2
if ! command -v pm2 >/dev/null 2>&1; then
    echo "安装PM2..."
    sudo npm install -g pm2
fi

# 安装Nginx
if ! command -v nginx >/dev/null 2>&1; then
    echo "安装Nginx..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# 安装其他必要工具
sudo apt install -y curl wget git unzip lsof

echo "✅ 环境修复完成！"
echo "⚠️  请重新登录或运行: newgrp docker"
EOF

    chmod +x fix-deployment-environment.sh
    print_status "success" "修复脚本已生成: fix-deployment-environment.sh"
    print_status "info" "运行命令: ./fix-deployment-environment.sh"
}

# 主函数
main() {
    echo "🚀 AI俊才社简历管理系统 - 服务器部署环境检测"
    echo "=================================================="
    echo "检测时间: $(date)"
    echo "服务器信息: $(hostname) ($(curl -s ifconfig.me 2>/dev/null || echo 'IP获取失败'))"
    echo ""
    
    check_system_info
    check_disk_space
    check_memory
    check_network
    check_user_permissions
    check_docker
    check_nodejs
    check_pm2
    check_nginx
    check_ports
    check_firewall
    check_ssl_tools
    generate_deployment_script
    
    echo ""
    echo "=============================================="
    echo "🎯 检测完成！"
    echo "=============================================="
    echo ""
    echo "📋 下一步建议："
    echo "1. 如有红色❌错误，请先修复这些问题"
    echo "2. 运行修复脚本: ./fix-deployment-environment.sh"
    echo "3. 重新测试GitHub Actions部署"
    echo "4. 如需帮助，请将此检测结果发送给技术支持"
    echo ""
}

# 执行主函数
main "$@" 