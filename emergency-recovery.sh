#!/bin/bash

# AI俊才社简历系统 - 紧急恢复脚本
# 当服务器卡住或无法通过SSH登录时使用

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}================================${NC}"
echo -e "${RED}   AI俊才社简历系统 - 紧急恢复   ${NC}"
echo -e "${RED}================================${NC}"
echo ""

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING: $1${NC}"
}

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用root权限运行此脚本${NC}"
    echo "使用: sudo bash emergency-recovery.sh"
    exit 1
fi

echo -e "${BLUE}此脚本将执行以下操作：${NC}"
echo "1. 停止所有可能卡住的进程"
echo "2. 清理系统资源"
echo "3. 重启关键服务"
echo "4. 恢复SSH连接"
echo "5. 显示系统状态"
echo ""

read -p "确认执行紧急恢复操作？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

log "开始紧急恢复操作..."

# 1. 停止所有可能卡住的进程
log "停止可能卡住的进程..."
pkill -f "npm install" 2>/dev/null || true
pkill -f "npm run build" 2>/dev/null || true
pkill -f "docker run" 2>/dev/null || true
pkill -f "knex migrate" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# 2. 停止Docker容器
log "停止Docker容器..."
timeout 30 docker stop $(docker ps -aq) 2>/dev/null || true

# 3. 停止PM2进程
log "停止PM2进程..."
pm2 kill 2>/dev/null || true

# 4. 清理临时文件和缓存
log "清理临时文件和缓存..."
rm -rf /tmp/npm-* /tmp/knex-* 2>/dev/null || true
rm -rf ~/.npm/_logs 2>/dev/null || true
rm -rf /var/tmp/npm-* 2>/dev/null || true

# 5. 清理系统缓存
log "清理系统缓存..."
sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

# 6. 检查并释放端口
log "检查和释放端口..."
for port in 8000 8001 3016 5432; do
    if lsof -i :$port > /dev/null 2>&1; then
        warning "端口 $port 被占用，尝试释放..."
        local pid=$(lsof -ti :$port | head -1)
        if [ ! -z "$pid" ]; then
            kill -9 "$pid" 2>/dev/null || true
            log "已释放端口 $port (PID: $pid)"
        fi
    fi
done

# 7. 重启关键服务
log "重启关键服务..."
systemctl restart ssh 2>/dev/null || error "SSH重启失败"
systemctl restart docker 2>/dev/null || error "Docker重启失败"
systemctl restart nginx 2>/dev/null || error "Nginx重启失败"

# 8. 等待服务启动
log "等待服务启动..."
sleep 5

# 9. 检查系统资源
log "检查系统资源状态..."
echo -e "${BLUE}内存使用:${NC}"
free -h

echo -e "${BLUE}磁盘使用:${NC}"
df -h

echo -e "${BLUE}CPU负载:${NC}"
uptime

# 10. 检查服务状态
log "检查关键服务状态..."
echo -e "${BLUE}服务状态:${NC}"
for service in ssh docker nginx; do
    if systemctl is-active --quiet $service; then
        echo -e "${GREEN}✓ $service 正在运行${NC}"
    else
        echo -e "${RED}✗ $service 未运行${NC}"
    fi
done

# 11. 检查网络连接
log "检查网络连接..."
if ping -c 1 -W 5 google.com > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 网络连接正常${NC}"
else
    echo -e "${YELLOW}⚠ 网络连接可能有问题${NC}"
fi

# 12. 检查Docker状态
log "检查Docker状态..."
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker 服务正常${NC}"
    local containers=$(docker ps -q | wc -l)
    echo "当前运行容器数: $containers"
else
    echo -e "${RED}✗ Docker 服务异常${NC}"
fi

# 13. 检查PM2状态
log "检查PM2状态..."
if command -v pm2 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PM2 已安装${NC}"
    pm2 list 2>/dev/null || echo "PM2进程列表为空"
else
    echo -e "${YELLOW}⚠ PM2 未安装${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}   紧急恢复操作完成！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

echo -e "${BLUE}下一步操作建议：${NC}"
echo "1. 通过SSH重新连接服务器"
echo "2. 检查系统日志: journalctl -f"
echo "3. 重新部署应用: sudo bash deploy.sh"
echo "4. 或者使用修复模式: sudo bash deploy.sh --mode=fix"
echo ""

echo -e "${YELLOW}如果问题仍然存在，请检查：${NC}"
echo "- 系统内存是否充足"
echo "- 磁盘空间是否足够"
echo "- 网络连接是否正常"
echo "- 防火墙设置是否正确"
echo ""

log "紧急恢复脚本执行完成" 