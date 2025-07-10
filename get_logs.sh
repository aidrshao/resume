#!/bin/bash

echo "=== 简历系统日志获取工具 ==="
echo ""

# 显示菜单
echo "请选择要查看的日志："
echo "1. 后端实时日志 (PM2)"
echo "2. 后端错误日志"
echo "3. 后端最近100行日志"
echo "4. 检查后端状态"
echo "5. 检查端口占用"
echo "6. 测试CORS配置"
echo "7. 显示所有日志选项"
echo ""

# 如果有参数，直接执行
if [ "$1" ]; then
    choice="$1"
else
    read -p "输入选项 (1-7): " choice
fi

case $choice in
    1)
        echo "🔍 显示后端实时日志..."
        echo "提示：按 Ctrl+C 停止查看"
        echo ""
        cd backend && npm run logs
        ;;
    2)
        echo "❌ 显示后端错误日志..."
        cd backend && npm run logs:error
        ;;
    3)
        echo "📋 显示后端最近100行日志..."
        cd backend && pm2 logs resume-backend --lines 100
        ;;
    4)
        echo "📊 检查后端状态..."
        cd backend && pm2 status
        echo ""
        echo "🌐 检查端口占用："
        lsof -i :8000
        ;;
    5)
        echo "🔍 检查端口占用情况..."
        echo "端口 8000:"
        lsof -i :8000
        echo ""
        echo "端口 3000:"
        lsof -i :3000
        echo ""
        echo "端口 80:"
        lsof -i :80
        echo ""
        echo "端口 443:"
        lsof -i :443
        ;;
    6)
        echo "🧪 测试CORS配置..."
        echo "测试来自 https://resume.juncaishe.com 的请求："
        curl -H "Origin: https://resume.juncaishe.com" \
             -H "Access-Control-Request-Method: POST" \
             -H "Access-Control-Request-Headers: Content-Type" \
             -X OPTIONS http://localhost:8000/api/auth/login -v
        ;;
    7)
        echo "📖 所有可用的日志命令："
        echo ""
        echo "后端日志命令："
        echo "  cd backend && npm run logs          # 实时日志"
        echo "  cd backend && npm run logs:error    # 错误日志"
        echo "  cd backend && npm run logs:out      # 输出日志"
        echo "  cd backend && pm2 logs resume-backend --lines 100  # 最近100行"
        echo ""
        echo "状态检查："
        echo "  cd backend && pm2 status            # PM2状态"
        echo "  cd backend && pm2 monit             # 实时监控"
        echo "  lsof -i :8000                       # 端口占用"
        echo ""
        echo "CORS测试："
        echo "  curl -H \"Origin: https://resume.juncaishe.com\" \\"
        echo "       -H \"Access-Control-Request-Method: POST\" \\"
        echo "       -H \"Access-Control-Request-Headers: Content-Type\" \\"
        echo "       -X OPTIONS http://localhost:8000/api/auth/login -v"
        ;;
    *)
        echo "❌ 无效选项，请输入 1-7"
        exit 1
        ;;
esac 