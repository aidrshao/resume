#!/bin/bash

# Nginx配置修复验证脚本
# 用于快速检查nginx端口配置是否正确

echo "🔍 Nginx配置端口验证脚本"
echo "================================"

# 检查当前运行的服务端口
echo "📊 当前服务运行状态："
echo "PM2进程："
pm2 list | grep resume

echo ""
echo "端口监听状态："
netstat -tlnp | grep -E ":80|:300|:800" | sort

echo ""
echo "🔍 检查nginx配置文件："
if [ -f /etc/nginx/sites-enabled/resume ]; then
    echo "✅ 动态nginx配置文件存在"
    echo "后端代理端口："
    grep "127.0.0.1:" /etc/nginx/sites-enabled/resume | head -3
else
    echo "❌ 动态nginx配置文件不存在"
fi

if [ -f /home/ubuntu/resume/nginx.conf ]; then
    echo "⚠️  发现项目根目录旧nginx.conf文件（应已废弃）"
else
    echo "✅ 项目根目录无旧nginx.conf文件"
fi

echo ""
echo "🧪 测试API连通性："
echo "健康检查测试："
curl -s -w "状态码: %{http_code}\n" http://localhost/health | head -3

echo ""
echo "API路由测试："
curl -s -w "状态码: %{http_code}\n" -X POST http://localhost/api/resumes/upload | head -1

echo ""
echo "🎯 如果看到JSON响应和200/401状态码，说明修复成功！" 