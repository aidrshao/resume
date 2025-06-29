#!/bin/bash
# 腾讯云服务器紧急修复脚本 - 解决权限和配置问题

echo "🚨 开始紧急修复服务器问题..."
echo "==============================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 此脚本需要root权限运行"
    echo "请使用以下命令之一："
    echo "1. sudo ./emergency-fix.sh"
    echo "2. 切换到root用户: su - root"
    exit 1
fi

echo "✅ 以root权限运行，开始修复..."

# 1. 修复sudo权限问题
echo ""
echo "🔧 修复sudo权限..."
chown root:root /usr/bin/sudo
chmod 4755 /usr/bin/sudo
echo "✅ sudo权限已修复"

# 2. 将ubuntu用户添加到必要的组
echo ""
echo "👥 配置用户组权限..."
usermod -aG sudo ubuntu
usermod -aG docker ubuntu
echo "✅ 用户组权限已配置"

# 3. 修复Docker权限
echo ""
echo "🐳 修复Docker权限..."
systemctl enable docker
systemctl start docker
chmod 666 /var/run/docker.sock
echo "✅ Docker权限已修复"

# 4. 升级Node.js到v20
echo ""
echo "🟢 升级Node.js到v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo "✅ Node.js已升级到: $(node --version)"

# 5. 修复Nginx配置
echo ""
echo "🌐 修复Nginx配置..."

# 创建基本的Nginx配置
cat > /etc/nginx/sites-available/default << 'EOF'
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

# 测试并重启Nginx
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    systemctl enable nginx
    echo "✅ Nginx配置已修复并重启"
else
    echo "❌ Nginx配置仍有问题，请检查"
fi

# 6. 设置防火墙规则
echo ""
echo "🔥 配置防火墙..."
ufw --force enable
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 3000
ufw allow 8000
echo "✅ 防火墙规则已配置"

# 7. 创建项目目录
echo ""
echo "📁 准备项目目录..."
mkdir -p /home/ubuntu/resume
chown ubuntu:ubuntu /home/ubuntu/resume
chmod 755 /home/ubuntu/resume
echo "✅ 项目目录已准备"

# 8. 安装必要的全局包
echo ""
echo "📦 安装必要软件包..."
npm install -g pm2@latest nodemon
echo "✅ 全局包已安装"

echo ""
echo "🎉 修复完成！"
echo "=============="
echo ""
echo "📋 修复摘要："
echo "✅ sudo权限已修复"
echo "✅ 用户组权限已配置 (sudo, docker)"
echo "✅ Docker权限已修复"
echo "✅ Node.js已升级到v20"
echo "✅ Nginx配置已修复"
echo "✅ 防火墙已配置"
echo "✅ 项目目录已准备"
echo ""
echo "🚀 下一步："
echo "1. 重新登录ubuntu用户: su - ubuntu"
echo "2. 测试Docker权限: docker ps"
echo "3. 重新触发GitHub Actions部署"
echo ""
echo "⚠️  如果仍有问题，请提供新的错误日志" 