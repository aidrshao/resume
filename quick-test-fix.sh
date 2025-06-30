#!/bin/bash

# 🧪 快速验证nginx修复效果脚本

echo "🧪 快速验证nginx修复效果"
echo "========================"

# 测试1：健康检查响应格式
echo "📋 测试1：健康检查响应格式"
echo "---------------------"
health_response=$(curl -s http://localhost/health 2>/dev/null | head -c 200)
echo "响应内容（前200字符）: $health_response"

if echo "$health_response" | grep -q '"success".*true'; then
    echo "✅ 健康检查返回正确的JSON格式 - 修复成功！"
elif echo "$health_response" | grep -q "healthy"; then
    echo "❌ 健康检查仍返回'healthy'字符串 - 需要运行 ./fix-nginx-conflicts.sh"
    exit 1
else
    echo "⚠️  健康检查响应异常，需要进一步检查"
fi

echo ""

# 测试2：API路由状态码
echo "📋 测试2：API路由状态码测试"
echo "---------------------"
echo "正在测试API路由（可能需要几秒钟）..."
api_status=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/api/resumes/upload 2>/dev/null || echo "timeout")

echo "API路由状态码: $api_status"

if [ "$api_status" = "401" ] || [ "$api_status" = "403" ]; then
    echo "✅ API路由正常（认证失败符合预期）- 修复成功！"
elif [ "$api_status" = "504" ]; then
    echo "❌ API路由仍然504 - 需要运行 ./fix-nginx-conflicts.sh"
    exit 1
elif [ "$api_status" = "timeout" ]; then
    echo "⚠️  API路由测试超时 - 可能需要检查服务状态"
else
    echo "🔍 API路由状态码: $api_status （需要进一步检查）"
fi

echo ""

# 测试3：服务状态检查
echo "📋 测试3：服务状态检查"
echo "---------------------"
echo "PM2服务状态："
pm2 list | grep resume | awk '{print "  " $2 " - " $10}'

echo ""
echo "端口监听状态："
netstat -tlnp | grep -E ":80|:800|:300" | awk '{print "  " $1 " " $4}' | sort

echo ""

# 综合评估
echo "🎯 修复效果综合评估"
echo "=================="

if echo "$health_response" | grep -q '"success"' && ([ "$api_status" = "401" ] || [ "$api_status" = "403" ]); then
    echo "🎉 修复完全成功！"
    echo ""
    echo "✅ 健康检查返回正确JSON格式"
    echo "✅ API路由返回正确状态码"
    echo "✅ 系统已恢复正常"
    echo ""
    echo "可以继续使用系统功能。如有问题，请查看详细文档："
    echo "cat NGINX-504-问题解决方案.md"
else
    echo "⚠️  修复可能不完整，建议运行完整修复："
    echo ""
    echo "🔧 运行专用修复脚本："
    echo "./fix-nginx-conflicts.sh"
    echo ""
    echo "或者"
    echo ""
    echo "🔄 重新运行部署脚本："
    echo "./deploy.sh"
fi 