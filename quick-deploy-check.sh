#!/bin/bash
# GitHub Actions部署问题快速诊断脚本
# 专门检查部署失败的常见原因

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🚀 GitHub Actions部署问题快速诊断"
echo "========================================"

# 1. 检查SSH连接
echo ""
echo "📡 检查SSH连接..."
if ss -tlnp | grep :22 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ SSH服务运行中 (端口22)${NC}"
else
    echo -e "${RED}❌ SSH服务异常！${NC}"
fi

# 2. 检查磁盘空间
echo ""
echo "💾 检查磁盘空间..."
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅ 磁盘空间充足 (使用率: ${DISK_USAGE}%)${NC}"
else
    echo -e "${RED}❌ 磁盘空间不足！使用率: ${DISK_USAGE}%${NC}"
fi

# 3. 检查内存
echo ""
echo "🧠 检查内存状况..."
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEM_USAGE" -lt 90 ]; then
    echo -e "${GREEN}✅ 内存状况良好 (使用率: ${MEM_USAGE}%)${NC}"
else
    echo -e "${YELLOW}⚠️  内存使用率偏高: ${MEM_USAGE}%${NC}"
fi

# 4. 检查Docker
echo ""
echo "🐳 检查Docker状态..."
if command -v docker >/dev/null 2>&1; then
    if systemctl is-active docker >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker运行正常${NC}"
    else
        echo -e "${RED}❌ Docker服务未运行${NC}"
        echo "尝试启动: sudo systemctl start docker"
    fi
else
    echo -e "${RED}❌ Docker未安装${NC}"
fi

# 5. 检查关键端口
echo ""
echo "🔌 检查端口占用..."
for PORT in 80 443 3000 8000; do
    if lsof -i :$PORT >/dev/null 2>&1; then
        PROCESS=$(lsof -i :$PORT | grep LISTEN | head -1 | awk '{print $1}')
        echo -e "${YELLOW}⚠️  端口 $PORT 被占用 ($PROCESS)${NC}"
    else
        echo -e "${GREEN}✅ 端口 $PORT 可用${NC}"
    fi
done

# 6. 检查GitHub连接
echo ""
echo "🌐 检查GitHub连接..."
if curl -s --connect-timeout 5 https://api.github.com >/dev/null; then
    echo -e "${GREEN}✅ GitHub连接正常${NC}"
else
    echo -e "${RED}❌ GitHub连接失败${NC}"
fi

# 7. 检查必要目录权限
echo ""
echo "📁 检查目录权限..."
HOME_DIR="/home/$(whoami)"
if [ -w "$HOME_DIR" ]; then
    echo -e "${GREEN}✅ 用户目录可写${NC}"
else
    echo -e "${RED}❌ 用户目录权限异常${NC}"
fi

# 8. 检查系统负载
echo ""
echo "⚡ 检查系统负载..."
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
LOAD_INT=$(echo "$LOAD" | cut -d. -f1)
if [ "$LOAD_INT" -lt 2 ]; then
    echo -e "${GREEN}✅ 系统负载正常: $LOAD${NC}"
else
    echo -e "${YELLOW}⚠️  系统负载偏高: $LOAD${NC}"
fi

# 生成修复建议
echo ""
echo "🔧 修复建议："
echo "=============="

# 检查是否有严重问题
ISSUES=0

if ! command -v docker >/dev/null 2>&1; then
    echo "❌ 安装Docker: sudo apt install -y docker.io"
    ISSUES=1
fi

if ! systemctl is-active docker >/dev/null 2>&1; then
    echo "❌ 启动Docker: sudo systemctl start docker && sudo systemctl enable docker"
    ISSUES=1
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    echo "❌ 清理磁盘空间: sudo apt autoremove && sudo docker system prune -f"
    ISSUES=1
fi

if ! curl -s --connect-timeout 5 https://api.github.com >/dev/null; then
    echo "❌ 检查网络和DNS设置"
    ISSUES=1
fi

if [ "$ISSUES" -eq 0 ]; then
    echo -e "${GREEN}✅ 未发现严重问题，可以尝试重新部署${NC}"
    echo ""
    echo "💡 GitHub Actions部署故障可能原因："
    echo "1. GitHub Secrets配置错误"
    echo "2. SSH密钥过期或无效"
    echo "3. 服务器IP地址变更"
    echo "4. 部署脚本权限问题"
    echo ""
    echo "建议检查GitHub仓库的Actions日志获取详细错误信息"
fi

echo ""
echo "📊 系统概览："
echo "=============="
echo "操作系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "IP地址: $(curl -s ifconfig.me 2>/dev/null || echo '获取失败')"
echo "当前时间: $(date)"
echo "运行时间: $(uptime -p)"

echo ""
echo "🔗 有用的命令："
echo "================"
echo "查看系统日志: sudo journalctl -f"
echo "查看Docker日志: sudo docker logs [容器名]"
echo "查看端口占用: sudo netstat -tulpn"
echo "查看进程: ps aux | grep [进程名]"
echo "重启服务: sudo systemctl restart [服务名]" 