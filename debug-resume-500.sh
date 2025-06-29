#!/bin/bash
# =============================================================================
# AI俊才社简历系统 - 500错误快速调试脚本
# =============================================================================
# 
# 🎯 专门用于排查发送验证码500错误问题
# 🚀 使用: sudo bash debug-resume-500.sh
#
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目配置
PROJECT_DIR="/home/ubuntu/resume"
BACKEND_PORT=8000
DB_CONTAINER_NAME="resume-postgres"
DOMAIN="cv.juncaishe.com"

echo -e "${GREEN}🐛 AI俊才社简历系统 - 500错误快速调试${NC}"
echo "=================================================="

# 1. 检查PM2进程状态
echo -e "\n${BLUE}[1/8]${NC} 检查PM2进程状态..."
if pm2 list | grep -q "resume-backend.*online"; then
    echo -e "${GREEN}✅ 后端进程运行正常${NC}"
else
    echo -e "${RED}❌ 后端进程异常${NC}"
    pm2 list | grep resume || echo "无resume进程"
fi

# 2. 检查端口监听
echo -e "\n${BLUE}[2/8]${NC} 检查端口监听状态..."
if lsof -i ":$BACKEND_PORT" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端端口 $BACKEND_PORT 正常监听${NC}"
    lsof -i ":$BACKEND_PORT"
else
    echo -e "${RED}❌ 后端端口 $BACKEND_PORT 未监听${NC}"
fi

# 3. 检查数据库连接
echo -e "\n${BLUE}[3/8]${NC} 检查数据库连接..."
if docker exec "$DB_CONTAINER_NAME" psql -U resume_user -d resume_db -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 数据库连接正常${NC}"
else
    echo -e "${RED}❌ 数据库连接失败${NC}"
    docker ps | grep postgres || echo "数据库容器未运行"
fi

# 4. 检查后端日志
echo -e "\n${BLUE}[4/8]${NC} 检查后端日志 (最近20行)..."
if pm2 logs resume-backend --lines 20 --nostream 2>/dev/null; then
    echo -e "${GREEN}✅ 后端日志获取成功${NC}"
else
    echo -e "${RED}❌ 无法获取后端日志${NC}"
fi

# 5. 检查环境变量
echo -e "\n${BLUE}[5/8]${NC} 检查后端环境变量..."
if [ -f "$PROJECT_DIR/backend/.env" ]; then
    echo -e "${GREEN}✅ 环境变量文件存在${NC}"
    echo "关键配置:"
    grep -E "^(SMTP_|DB_|PORT)" "$PROJECT_DIR/backend/.env" | head -10 || echo "无关键配置"
else
    echo -e "${RED}❌ 环境变量文件不存在${NC}"
fi

# 6. 测试API健康检查
echo -e "\n${BLUE}[6/8]${NC} 测试API健康检查..."
if curl -s "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ API健康检查成功${NC}"
    echo "响应内容:"
    curl -s "http://localhost:$BACKEND_PORT/api/health" | jq . 2>/dev/null || curl -s "http://localhost:$BACKEND_PORT/api/health"
else
    echo -e "${RED}❌ API健康检查失败${NC}"
    echo "尝试连接详情:"
    curl -v "http://localhost:$BACKEND_PORT/api/health" 2>&1 | head -10
fi

# 7. 测试发送验证码API
echo -e "\n${BLUE}[7/8]${NC} 测试发送验证码API..."
echo "发送测试请求到: http://localhost:$BACKEND_PORT/api/auth/send-code"

response=$(curl -s -w "\n状态码:%{http_code}" -X POST "http://localhost:$BACKEND_PORT/api/auth/send-code" \
    -H "Content-Type: application/json" \
    -d '{"email":"debug@example.com","type":"register"}' 2>&1)

echo "API响应:"
echo "$response"

if echo "$response" | grep -q "状态码:500"; then
    echo -e "${RED}❌ 确认存在500错误${NC}"
elif echo "$response" | grep -q "状态码:200"; then
    echo -e "${GREEN}✅ API响应正常${NC}"
else
    echo -e "${YELLOW}⚠️  API响应异常${NC}"
fi

# 8. 错误分析和建议
echo -e "\n${BLUE}[8/8]${NC} 错误分析和修复建议..."

# 保存后端日志到临时文件用于分析
pm2 logs resume-backend --lines 50 --nostream > /tmp/backend-debug.log 2>/dev/null || touch /tmp/backend-debug.log

echo -e "\n${YELLOW}📊 问题分析:${NC}"

if grep -qi "EAUTH\|authentication.*failed\|invalid.*login" /tmp/backend-debug.log; then
    echo -e "${RED}🔍 发现邮件认证问题:${NC}"
    echo "   ❌ SMTP认证失败"
    echo -e "   ${GREEN}🔧 解决方案:${NC}"
    echo "      1. 检查邮箱密码是否为QQ邮箱授权码(不是登录密码)"
    echo "      2. 确认SMTP配置正确"
    echo "      3. 运行: sudo bash deploy-standalone.sh --mode=debug"
fi

if grep -qi "ECONNREFUSED.*5435\|database.*connection\|postgres.*error" /tmp/backend-debug.log; then
    echo -e "${RED}🔍 发现数据库连接问题:${NC}"
    echo "   ❌ 数据库连接被拒绝"
    echo -e "   ${GREEN}🔧 解决方案:${NC}"
    echo "      1. 重启数据库: docker restart $DB_CONTAINER_NAME"
    echo "      2. 检查数据库端口: docker port $DB_CONTAINER_NAME"
    echo "      3. 重新部署: sudo bash deploy-standalone.sh --mode=fix"
fi

if grep -qi "cannot find module\|module_not_found\|nodemailer.*not.*found" /tmp/backend-debug.log; then
    echo -e "${RED}🔍 发现依赖缺失问题:${NC}"
    echo "   ❌ 后端依赖不完整"
    echo -e "   ${GREEN}🔧 解决方案:${NC}"
    echo "      1. 重新安装依赖: cd $PROJECT_DIR/backend && npm install"
    echo "      2. 安装邮件依赖: npm install nodemailer"
    echo "      3. 重启服务: pm2 restart resume-backend"
fi

if grep -qi "ENOTFOUND\|getaddrinfo.*smtp\|network.*error" /tmp/backend-debug.log; then
    echo -e "${RED}🔍 发现网络连接问题:${NC}"
    echo "   ❌ 无法连接到邮件服务器"
    echo -e "   ${GREEN}🔧 解决方案:${NC}"
    echo "      1. 检查服务器网络连接"
    echo "      2. 测试SMTP连接: telnet smtp.qq.com 587"
    echo "      3. 检查防火墙设置"
fi

if ! grep -qi "error\|fail\|exception" /tmp/backend-debug.log; then
    echo -e "${YELLOW}⚠️  日志中未发现明显错误，可能是配置问题${NC}"
    echo -e "   ${GREEN}🔧 建议操作:${NC}"
    echo "      1. 检查邮箱配置是否正确"
    echo "      2. 运行完整调试: sudo bash deploy-standalone.sh --mode=debug"
    echo "      3. 重新部署: sudo bash deploy-standalone.sh --mode=fix"
fi

echo -e "\n${GREEN}🎯 调试完成！${NC}"
echo -e "${BLUE}📋 下一步操作建议:${NC}"
echo "   1. 根据上述分析修复问题"
echo "   2. 运行详细调试: sudo bash deploy-standalone.sh --mode=debug"
echo "   3. 运行修复模式: sudo bash deploy-standalone.sh --mode=fix"
echo ""
echo -e "${YELLOW}📄 调试日志已保存到: /tmp/backend-debug.log${NC}"
echo -e "${YELLOW}🔧 如需帮助，请查看完整部署脚本的调试功能${NC}"

# 清理临时文件
rm -f /tmp/backend-debug.log 