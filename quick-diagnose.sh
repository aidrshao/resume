#!/bin/bash

# 快速诊断脚本 - AI俊才社简历系统
# 立即识别部署中的关键问题

echo "🔍 AI俊才社简历系统 - 快速诊断工具"
echo "========================================="
date
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

echo "🚀 1. PM2进程状态检查"
echo "-------------------"
PM2_OUTPUT=$(pm2 list 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$PM2_OUTPUT"
    
    # 检查resume进程
    RESUME_BACKEND=$(echo "$PM2_OUTPUT" | grep "resume-backend" | wc -l)
    RESUME_FRONTEND=$(echo "$PM2_OUTPUT" | grep "resume-frontend" | wc -l)
    
    echo ""
    echo "📊 Resume进程统计:"
    echo "  - Backend进程: $RESUME_BACKEND"
    echo "  - Frontend进程: $RESUME_FRONTEND"
    
    if [ $RESUME_BACKEND -gt 1 ] || [ $RESUME_FRONTEND -gt 1 ]; then
        echo -e "${YELLOW}⚠️ 检测到重复进程，这可能导致启动失败${NC}"
    fi
else
    echo -e "${RED}❌ PM2未运行或出现错误${NC}"
fi

echo ""
echo "🐳 2. Docker容器状态检查"
echo "----------------------"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAME|resume)"
if docker ps | grep -q "resume-postgres"; then
    echo -e "${GREEN}✅ PostgreSQL容器正在运行${NC}"
else
    echo -e "${RED}❌ PostgreSQL容器未运行${NC}"
fi

echo ""
echo "🔗 3. 数据库连接测试"
echo "-------------------"
if docker ps | grep -q "resume-postgres"; then
    echo "测试数据库连接..."
    DB_TEST=$(docker exec resume-postgres psql -U resume_user -d resume_db -c "SELECT 1;" 2>&1)
    if echo "$DB_TEST" | grep -q "1"; then
        echo -e "${GREEN}✅ 数据库连接成功${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
        echo "错误信息: $DB_TEST"
    fi
else
    echo -e "${YELLOW}⚠️ 数据库容器未运行，跳过连接测试${NC}"
fi

echo ""
echo "🌐 4. 端口占用检查"
echo "-----------------"
check_port() {
    local port=$1
    local service=$2
    if netstat -tln | grep -q ":$port "; then
        local pid=$(lsof -ti:$port 2>/dev/null)
        echo -e "${GREEN}✅ 端口$port被占用${NC} (PID: $pid, 服务: $service)"
    else
        echo -e "${RED}❌ 端口$port未被占用${NC} ($service)"
    fi
}

check_port "3000" "前端"
check_port "8000" "后端"
check_port "5435" "数据库"

echo ""
echo "⚙️ 5. 应用配置检查"
echo "-----------------"
if [ -f "/home/ubuntu/resume/backend/.env" ]; then
    echo -e "${GREEN}✅ 后端环境配置文件存在${NC}"
    echo "配置预览 (隐藏敏感信息):"
    grep -v -E "(PASSWORD|SECRET|KEY)" /home/ubuntu/resume/backend/.env | head -5
else
    echo -e "${RED}❌ 后端环境配置文件不存在${NC}"
fi

echo ""
echo "🚨 6. 关键错误检查"
echo "-----------------"

# 检查PM2日志中的错误
echo "检查PM2后端日志错误..."
if pm2 list | grep -q "resume-backend"; then
    BACKEND_ERRORS=$(pm2 logs resume-backend --lines 20 --nostream 2>/dev/null | grep -i error | tail -3)
    if [ -n "$BACKEND_ERRORS" ]; then
        echo -e "${RED}后端错误:${NC}"
        echo "$BACKEND_ERRORS"
    else
        echo -e "${GREEN}✅ 后端无明显错误${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ 后端进程未运行${NC}"
fi

# 检查数据库日志错误
echo ""
echo "检查数据库日志错误..."
if docker ps | grep -q "resume-postgres"; then
    DB_ERRORS=$(docker logs resume-postgres 2>&1 | grep -i -E "(error|fatal)" | tail -3)
    if [ -n "$DB_ERRORS" ]; then
        echo -e "${RED}数据库错误:${NC}"
        echo "$DB_ERRORS"
    else
        echo -e "${GREEN}✅ 数据库无明显错误${NC}"
    fi
fi

echo ""
echo "📋 7. 诊断总结"
echo "-------------"

# 总结关键问题
ISSUES=0

# PM2重复进程检查
if [ $RESUME_BACKEND -gt 1 ] || [ $RESUME_FRONTEND -gt 1 ]; then
    echo -e "${RED}🚨 问题1: PM2进程重复${NC}"
    echo "   解决方案: pm2 delete all && pm2 kill"
    ISSUES=$((ISSUES+1))
fi

# 数据库连接检查
if ! docker ps | grep -q "resume-postgres"; then
    echo -e "${RED}🚨 问题2: 数据库容器未运行${NC}"
    echo "   解决方案: 检查Docker状态和数据库配置"
    ISSUES=$((ISSUES+1))
elif echo "$DB_TEST" | grep -q "authentication failed"; then
    echo -e "${RED}🚨 问题3: 数据库密码认证失败${NC}"
    echo "   解决方案: 检查.env文件中的数据库密码"
    ISSUES=$((ISSUES+1))
fi

# 端口冲突检查
if ! netstat -tln | grep -q ":8000 "; then
    echo -e "${RED}🚨 问题4: 后端服务未启动${NC}"
    echo "   解决方案: 检查后端启动日志"
    ISSUES=$((ISSUES+1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 系统状态良好，未发现关键问题${NC}"
else
    echo -e "${YELLOW}📊 发现 $ISSUES 个问题需要修复${NC}"
fi

echo ""
echo "💡 建议的修复步骤:"
echo "1. 清理PM2进程: pm2 delete all && pm2 kill"
echo "2. 重启数据库: docker restart resume-postgres"
echo "3. 检查环境配置: cat /home/ubuntu/resume/backend/.env"
echo "4. 重新运行部署: ./deploy.sh"
echo ""
echo "📄 详细日志收集命令: ./collect-logs.sh" 