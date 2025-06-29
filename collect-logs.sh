#!/bin/bash

# 日志收集脚本 - AI俊才社简历系统
# 用于收集所有相关日志进行问题诊断

LOG_DIR="/tmp/resume_logs_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"

echo "🔍 AI俊才社简历系统 - 日志收集工具"
echo "=================================================="
echo "📁 日志收集目录: $LOG_DIR"
echo ""

# 1. 系统基础信息
echo "📊 收集系统基础信息..."
{
    echo "=== 系统信息 ==="
    uname -a
    echo ""
    echo "=== 时间信息 ==="
    date
    echo ""
    echo "=== 磁盘使用情况 ==="
    df -h
    echo ""
    echo "=== 内存使用情况 ==="
    free -h
    echo ""
    echo "=== CPU使用情况 ==="
    top -bn1 | head -20
} > "$LOG_DIR/system_info.log" 2>&1

# 2. PM2相关日志
echo "🔄 收集PM2日志..."
{
    echo "=== PM2进程状态 ==="
    pm2 status
    echo ""
    echo "=== PM2列表详情 ==="
    pm2 list
    echo ""
    echo "=== PM2信息 ==="
    pm2 info all
    echo ""
    echo "=== PM2环境变量 ==="
    pm2 env 0 2>/dev/null || echo "PM2进程0不存在"
} > "$LOG_DIR/pm2_status.log" 2>&1

# 3. PM2应用日志
echo "📝 收集PM2应用日志..."
if pm2 list | grep -q "resume-backend"; then
    pm2 logs resume-backend --lines 100 --nostream > "$LOG_DIR/pm2_backend.log" 2>&1
else
    echo "resume-backend进程不存在" > "$LOG_DIR/pm2_backend.log"
fi

if pm2 list | grep -q "resume-frontend"; then
    pm2 logs resume-frontend --lines 100 --nostream > "$LOG_DIR/pm2_frontend.log" 2>&1
else
    echo "resume-frontend进程不存在" > "$LOG_DIR/pm2_frontend.log"
fi

# 4. Docker相关日志
echo "🐳 收集Docker日志..."
{
    echo "=== Docker进程状态 ==="
    docker ps -a
    echo ""
    echo "=== Docker镜像列表 ==="
    docker images
    echo ""
    echo "=== Docker网络 ==="
    docker network ls
    echo ""
    echo "=== Docker存储 ==="
    docker system df
} > "$LOG_DIR/docker_status.log" 2>&1

# 5. PostgreSQL容器日志
echo "🐘 收集PostgreSQL日志..."
if docker ps | grep -q "resume-postgres"; then
    docker logs resume-postgres --tail 200 > "$LOG_DIR/postgres.log" 2>&1
else
    echo "resume-postgres容器不存在或未运行" > "$LOG_DIR/postgres.log"
fi

# 6. 网络和端口状态
echo "🌐 收集网络状态..."
{
    echo "=== 端口监听状态 ==="
    netstat -tlnp | grep -E ":(3000|8000|5435|80|443)"
    echo ""
    echo "=== 所有监听端口 ==="
    netstat -tlnp
    echo ""
    echo "=== 网络连接状态 ==="
    netstat -an | grep -E ":(3000|8000|5435)" | head -20
} > "$LOG_DIR/network_status.log" 2>&1

# 7. Nginx日志（如果存在）
echo "🌐 收集Nginx日志..."
if systemctl is-active nginx >/dev/null 2>&1; then
    {
        echo "=== Nginx状态 ==="
        systemctl status nginx
        echo ""
        echo "=== Nginx配置测试 ==="
        nginx -t
        echo ""
        echo "=== Nginx访问日志 (最近100行) ==="
        tail -100 /var/log/nginx/access.log 2>/dev/null || echo "访问日志不存在"
        echo ""
        echo "=== Nginx错误日志 (最近100行) ==="
        tail -100 /var/log/nginx/error.log 2>/dev/null || echo "错误日志不存在"
    } > "$LOG_DIR/nginx.log" 2>&1
else
    echo "Nginx服务未运行" > "$LOG_DIR/nginx.log"
fi

# 8. 系统日志
echo "📋 收集系统日志..."
{
    echo "=== 系统服务状态 ==="
    systemctl --failed
    echo ""
    echo "=== 最近系统日志 ==="
    journalctl --since "1 hour ago" --no-pager | tail -200
} > "$LOG_DIR/system.log" 2>&1

# 9. 应用配置文件
echo "⚙️ 收集应用配置..."
if [ -d "/home/ubuntu/resume" ]; then
    PROJECT_DIR="/home/ubuntu/resume"
elif [ -d "/tmp/resume" ]; then
    PROJECT_DIR="/tmp/resume"
else
    PROJECT_DIR=""
fi

if [ -n "$PROJECT_DIR" ]; then
    {
        echo "=== 项目结构 ==="
        find "$PROJECT_DIR" -maxdepth 3 -type f -name "*.json" -o -name "*.js" -o -name ".env*" | head -20
        echo ""
        
        echo "=== 后端package.json ==="
        if [ -f "$PROJECT_DIR/backend/package.json" ]; then
            cat "$PROJECT_DIR/backend/package.json"
        else
            echo "后端package.json不存在"
        fi
        echo ""
        
        echo "=== 前端package.json ==="
        if [ -f "$PROJECT_DIR/frontend/package.json" ]; then
            cat "$PROJECT_DIR/frontend/package.json"
        else
            echo "前端package.json不存在"
        fi
        echo ""
        
        echo "=== 后端环境配置 (隐藏敏感信息) ==="
        if [ -f "$PROJECT_DIR/backend/.env" ]; then
            grep -v -E "(PASSWORD|SECRET|KEY)" "$PROJECT_DIR/backend/.env" || echo "环境文件为空或只有敏感信息"
        else
            echo "后端.env文件不存在"
        fi
    } > "$LOG_DIR/app_config.log" 2>&1
else
    echo "项目目录不存在" > "$LOG_DIR/app_config.log"
fi

# 10. 数据库连接测试
echo "🔗 测试数据库连接..."
{
    echo "=== 数据库连接测试 ==="
    if docker ps | grep -q "resume-postgres"; then
        echo "测试数据库连接..."
        docker exec resume-postgres psql -U resume_user -d resume_db -c "SELECT version();" 2>&1 || echo "数据库连接失败"
        echo ""
        echo "测试数据库表..."
        docker exec resume-postgres psql -U resume_user -d resume_db -c "\dt" 2>&1 || echo "无法列出表"
    else
        echo "数据库容器未运行"
    fi
} > "$LOG_DIR/database_test.log" 2>&1

# 11. 进程和资源使用
echo "💻 收集进程信息..."
{
    echo "=== Node.js进程 ==="
    ps aux | grep node | grep -v grep
    echo ""
    echo "=== 所有运行的进程 (按内存排序) ==="
    ps aux --sort=-%mem | head -20
    echo ""
    echo "=== 端口占用详情 ==="
    lsof -i :3000 2>/dev/null || echo "端口3000未被占用"
    lsof -i :8000 2>/dev/null || echo "端口8000未被占用"
    lsof -i :5435 2>/dev/null || echo "端口5435未被占用"
} > "$LOG_DIR/processes.log" 2>&1

# 12. 最近的部署日志
echo "📄 收集部署相关日志..."
{
    echo "=== 查找最近的部署脚本日志 ==="
    find /tmp /var/log /home -name "*deploy*" -type f -mtime -1 2>/dev/null | head -10
    echo ""
    
    echo "=== PM2启动日志 ==="
    if [ -f "/root/.pm2/pm2.log" ]; then
        tail -100 /root/.pm2/pm2.log
    else
        echo "PM2主日志不存在"
    fi
} > "$LOG_DIR/deployment.log" 2>&1

# 13. 错误日志汇总
echo "🚨 收集错误信息..."
{
    echo "=== 系统错误日志 ==="
    dmesg | tail -50
    echo ""
    
    echo "=== 查找最近的错误 ==="
    journalctl --priority=err --since "1 hour ago" --no-pager
} > "$LOG_DIR/errors.log" 2>&1

# 生成日志摘要
echo "📊 生成日志摘要..."
{
    echo "AI俊才社简历系统 - 日志收集摘要"
    echo "========================================"
    echo "收集时间: $(date)"
    echo "服务器: $(hostname)"
    echo ""
    
    echo "🔍 关键状态检查:"
    echo "- PM2进程数量: $(pm2 list 2>/dev/null | grep -c "│" || echo "PM2未运行")"
    echo "- Docker容器数量: $(docker ps --format "table {{.Names}}" | grep -c resume || echo "0")"
    echo "- 网络端口状态:"
    echo "  * 3000端口: $(netstat -tln | grep :3000 >/dev/null && echo "监听中" || echo "未监听")"
    echo "  * 8000端口: $(netstat -tln | grep :8000 >/dev/null && echo "监听中" || echo "未监听")"
    echo "  * 5435端口: $(netstat -tln | grep :5435 >/dev/null && echo "监听中" || echo "未监听")"
    echo ""
    
    echo "📁 收集的日志文件:"
    ls -la "$LOG_DIR"
    echo ""
    
    echo "💾 日志总大小: $(du -sh "$LOG_DIR" | cut -f1)"
} > "$LOG_DIR/summary.log" 2>&1

# 打包日志文件
echo "📦 打包日志文件..."
cd /tmp
ARCHIVE_NAME="resume_logs_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$ARCHIVE_NAME" "$(basename "$LOG_DIR")"

echo ""
echo "✅ 日志收集完成!"
echo "=================================================="
echo "📁 日志目录: $LOG_DIR"
echo "📦 压缩包: /tmp/$ARCHIVE_NAME"
echo ""
echo "🔍 主要日志文件说明:"
echo "  • summary.log      - 系统状态摘要"
echo "  • pm2_status.log   - PM2进程状态"
echo "  • pm2_backend.log  - 后端应用日志"
echo "  • pm2_frontend.log - 前端应用日志"
echo "  • postgres.log     - 数据库日志"
echo "  • docker_status.log- Docker状态"
echo "  • network_status.log- 网络端口状态"
echo "  • system.log       - 系统日志"
echo "  • errors.log       - 错误日志汇总"
echo "  • app_config.log   - 应用配置信息"
echo ""
echo "📋 建议查看顺序:"
echo "  1. summary.log     (整体状态)"
echo "  2. pm2_status.log  (进程状态)"
echo "  3. postgres.log    (数据库问题)"
echo "  4. errors.log      (错误信息)"
echo ""
echo "💡 提取关键信息命令:"
echo "   cat $LOG_DIR/summary.log"
echo "   cat $LOG_DIR/pm2_status.log"
echo "   tail -50 $LOG_DIR/postgres.log" 