#!/bin/bash
# 诊断cv.juncaishe.com访问问题

echo "🔍 诊断cv.juncaishe.com访问问题"
echo "=================================="

echo "1. PM2进程状态："
pm2 list

echo ""
echo "2. nginx配置检查："
echo "sites-enabled目录："
ls -la /etc/nginx/sites-enabled/

echo ""
echo "3. cv.juncaishe.com配置内容："
if [ -f /etc/nginx/sites-enabled/cv.juncaishe.com ]; then
  cat /etc/nginx/sites-enabled/cv.juncaishe.com | head -20
else
  echo "❌ cv.juncaishe.com配置文件不存在"
fi

echo ""
echo "4. 端口监听状态："
netstat -tlnp | grep -E "(3016|8000)"

echo ""
echo "5. DNS解析测试："
nslookup cv.juncaishe.com

echo ""
echo "6. 本地访问测试："
echo "前端端口3016："
curl -I http://127.0.0.1:3016 2>/dev/null | head -3 || echo "❌ 前端无响应"

echo ""
echo "后端端口8000："
curl -I http://127.0.0.1:8000 2>/dev/null | head -3 || echo "❌ 后端无响应"

echo ""
echo "7. 域名访问测试："
echo "HTTP访问："
curl -I http://cv.juncaishe.com 2>/dev/null | head -5 || echo "❌ HTTP访问失败"

echo ""
echo "HTTPS访问："
curl -I https://cv.juncaishe.com 2>/dev/null | head -5 || echo "❌ HTTPS访问失败"

echo ""
echo "8. SSL证书状态："
if [ -d /etc/letsencrypt/live/cv.juncaishe.com ]; then
  echo "✅ SSL证书存在"
  ls -la /etc/letsencrypt/live/cv.juncaishe.com/
else
  echo "❌ SSL证书不存在"
fi

echo ""
echo "🔧 建议修复步骤："
echo "1. 如果PM2进程有问题: bash quick-fix-server.sh"
echo "2. 如果需要SSL证书: bash fix-ssl-and-restart.sh" 
echo "3. 如果需要完整重部署: bash fix-deploy-complete.sh" 