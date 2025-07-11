#!/bin/bash

# 紧急认证修复脚本
# 解决JWT密钥变更导致的401认证问题

PROJECT_DIR="/home/ubuntu/resume"
DOMAIN="resume.juncaishe.com"

echo "🚨 开始紧急认证修复..."
echo "项目目录: $PROJECT_DIR"
echo "域名: $DOMAIN"
echo "=========================================="

# 步骤1: 检查当前JWT配置
echo "📋 步骤1: 检查当前JWT配置"
cd "$PROJECT_DIR/backend"
if grep -q "JWT_SECRET" .env; then
    JWT_LENGTH=$(grep "JWT_SECRET" .env | cut -d= -f2 | wc -c)
    echo "✅ 当前JWT_SECRET长度: $JWT_LENGTH"
else
    echo "⚠️ 未找到JWT_SECRET配置"
fi

# 步骤2: 重启后端服务以应用JWT配置
echo "📋 步骤2: 重启后端服务"
pm2 restart resume-backend
echo "等待后端服务启动..."
sleep 5

# 检查后端服务状态
if pm2 list | grep "resume-backend" | grep -q "online"; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务启动失败"
    pm2 logs resume-backend --lines 10
    exit 1
fi

# 步骤3: 测试后端API连通性
echo "📋 步骤3: 测试后端API"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/auth/profile")
echo "API健康检查状态码: $API_STATUS"

if [ "$API_STATUS" = "401" ]; then
    echo "✅ API返回401是正常的（未认证状态）"
elif [ "$API_STATUS" = "200" ]; then
    echo "⚠️ API返回200（可能有缓存的token）"
else
    echo "⚠️ API返回状态码: $API_STATUS"
fi

# 步骤4: 检查Nginx配置和SPA路由
echo "📋 步骤4: 检查Nginx SPA配置"
if grep -q "try_files.*index.html" /etc/nginx/sites-available/resume; then
    echo "✅ Nginx SPA路由配置正确"
else
    echo "⚠️ Nginx SPA路由配置可能有问题"
fi

# 测试前端页面
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/")
echo "前端页面状态码: $FRONTEND_STATUS"

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ 前端页面可以正常访问"
else
    echo "❌ 前端页面访问失败"
fi

# 步骤5: 测试完整的登录流程
echo "📋 步骤5: 测试管理员登录API"
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"admin123456"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 管理员登录API测试成功"
    echo "登录响应: $LOGIN_RESPONSE"
else
    echo "❌ 管理员登录API测试失败"
    echo "登录响应: $LOGIN_RESPONSE"
fi

# 步骤6: 显示解决方案
echo "📋 步骤6: 用户操作指南"
echo ""
echo "🔧 用户需要执行的操作:"
echo "1. 打开浏览器，访问 https://$DOMAIN"
echo "2. 按F12打开开发者工具"
echo "3. 切换到 Application (应用) 标签"
echo "4. 在左侧找到 Local Storage"
echo "5. 展开 https://$DOMAIN"
echo "6. 删除所有包含 'token' 或 'user' 的条目"
echo "7. 强制刷新页面 (Ctrl+F5 或 Cmd+Shift+R)"
echo "8. 重新登录:"
echo "   - 管理员邮箱: admin@example.com"
echo "   - 管理员密码: admin123456"
echo ""

# 步骤7: 系统状态总结
echo "📋 步骤7: 系统状态总结"
echo "PM2进程状态:"
pm2 status

echo ""
echo "Nginx状态:"
systemctl status nginx --no-pager -l | head -5

echo ""
echo "Docker容器状态:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep resume

echo ""
echo "=========================================="
echo "🎉 紧急认证修复完成！"
echo ""
echo "关键修复内容:"
echo "1. ✅ 检查了JWT配置"
echo "2. ✅ 重启了后端服务"
echo "3. ✅ 验证了API连通性"
echo "4. ✅ 检查了Nginx SPA配置"
echo ""
echo "⚠️ 重要提醒:"
echo "- 用户需要清除浏览器中的旧token"
echo "- 清除后重新登录即可正常使用"
echo "- 如果仍有问题，请检查浏览器控制台错误"
echo ""
echo "🔗 测试链接:"
echo "- 主页: https://$DOMAIN/"
echo "- 登录: https://$DOMAIN/login"
echo "- 管理后台: https://$DOMAIN/admin" 