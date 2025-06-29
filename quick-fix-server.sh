#!/bin/bash
# 快速修复当前服务器的Resume部署问题

echo "🚀 快速修复Resume服务问题"
echo "=============================="

# 1. 强制清理并重启PM2进程
echo "🧹 清理PM2进程..."
pm2 delete resume-backend resume-frontend 2>/dev/null || true
sleep 2

# 2. 强制重启服务
echo "🚀 重新启动服务..."
cd /home/ubuntu/resume/backend
pm2 start server.js --name "resume-backend" --env production --force

cd /home/ubuntu/resume/frontend  
pm2 start serve --name "resume-frontend" -- -s build -l 3016 --force

# 3. 保存配置
pm2 save

# 4. 检查服务状态
echo ""
echo "📊 服务状态："
pm2 list

echo ""
echo "🌐 测试访问："
echo "前端 (端口3016):"
curl -I http://127.0.0.1:3016 2>/dev/null | head -2 || echo "前端无响应"

echo ""
echo "后端 (端口8000):"
curl -I http://127.0.0.1:8000 2>/dev/null | head -2 || echo "后端无响应"

echo ""
echo "域名访问:"
curl -I http://cv.juncaishe.com 2>/dev/null | head -2 || echo "域名访问失败"

echo ""
echo "✅ 快速修复完成！"
echo "如果还有问题，运行: bash fix-ssl-and-restart.sh 配置SSL" 