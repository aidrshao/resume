#!/bin/bash

echo "🔧 AI俊才社简历系统 - 快速修复脚本"
echo "====================================="

# 停止当前可能运行的进程
echo "🛑 停止当前部署进程..."
pkill -f "npm install" 2>/dev/null || true
pkill -f "frontend" 2>/dev/null || true

# 清理错误的PM2进程
echo "🧹 清理错误的PM2进程..."
pm2 delete resume-frontend 2>/dev/null || true

# 停止并删除问题数据库容器
echo "🗄️ 重置数据库容器..."
docker stop resume-postgres 2>/dev/null || true
docker rm resume-postgres 2>/dev/null || true

# 清理项目目录
echo "📁 清理项目目录..."
rm -rf /home/ubuntu/resume 2>/dev/null || true

echo "✅ 清理完成，准备重新部署..."
echo ""
echo "🚀 现在请运行修复版部署脚本："
echo "   ./fix-deploy-complete.sh"
echo ""
echo "📋 修复内容："
echo "   ✅ 数据库密码特殊字符问题"
echo "   ✅ JWT密钥特殊字符问题" 
echo "   ✅ nginx配置自动设置"
echo "   ✅ 智能端口清理功能" 