#!/bin/bash

echo "=== 前端API URL诊断和修复工具 ==="
echo ""

# 检查当前配置
echo "🔍 1. 检查当前前端API配置..."
echo ""

# 检查前端build目录中的实际配置
if [ -d "frontend/build" ]; then
    echo "📁 检查打包后的前端配置："
    echo "查找API URL相关配置..."
    
    # 查找main.js文件中的API配置
    main_js=$(find frontend/build/static/js -name "main.*.js" | head -1)
    if [ -f "$main_js" ]; then
        echo "📄 主要JS文件: $main_js"
        echo ""
        echo "🔍 搜索localhost:8000引用："
        grep -o "localhost:8000[^\"']*" "$main_js" || echo "   ✅ 未找到localhost:8000"
        echo ""
        echo "🔍 搜索API URL配置："
        grep -o "/api[^\"']*" "$main_js" | head -5 || echo "   ℹ️ 未找到/api相关配置"
    else
        echo "❌ 未找到main.js文件"
    fi
else
    echo "❌ frontend/build目录不存在，前端可能未构建"
fi

echo ""
echo "🔍 2. 检查环境变量和配置..."
echo ""

# 检查前端环境配置
if [ -f "frontend/.env" ]; then
    echo "📄 frontend/.env 文件内容："
    cat frontend/.env
else
    echo "ℹ️ frontend/.env 文件不存在"
fi

if [ -f "frontend/.env.production" ]; then
    echo ""
    echo "📄 frontend/.env.production 文件内容："
    cat frontend/.env.production
else
    echo "ℹ️ frontend/.env.production 文件不存在"
fi

if [ -f "frontend/.env.local" ]; then
    echo ""
    echo "📄 frontend/.env.local 文件内容："
    cat frontend/.env.local
else
    echo "ℹ️ frontend/.env.local 文件不存在"
fi

echo ""
echo "🔍 3. 检查当前域名和API访问..."
echo ""

# 测试当前API访问
echo "🧪 测试本地API访问："
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "   ✅ localhost:8000 API 可访问"
else
    echo "   ❌ localhost:8000 API 不可访问"
fi

echo ""
echo "🧪 测试生产域名API访问："
if curl -s https://resume.juncaishe.com/api/health > /dev/null 2>&1; then
    echo "   ✅ resume.juncaishe.com API 可访问"
else
    echo "   ❌ resume.juncaishe.com API 不可访问"
fi

echo ""
echo "=== 修复选项 ==="
echo ""
echo "请选择修复方案："
echo "1. 创建正确的生产环境配置 (.env.production)"
echo "2. 修改前端代码使用相对路径"
echo "3. 重新构建前端（使用相对API路径）"
echo "4. 显示详细的修复说明"
echo "5. 跳过修复，只查看诊断"
echo ""

read -p "输入选项 (1-5): " choice

case $choice in
    1)
        echo "📝 创建 frontend/.env.production 文件..."
        cat > frontend/.env.production << 'EOF'
# 生产环境配置
REACT_APP_API_URL=/api
GENERATE_SOURCEMAP=false
EOF
        echo "✅ 已创建 frontend/.env.production"
        echo ""
        echo "📝 创建 frontend/.env.local 文件 (开发环境)..."
        cat > frontend/.env.local << 'EOF'
# 开发环境配置
REACT_APP_API_URL=http://localhost:8000
EOF
        echo "✅ 已创建 frontend/.env.local"
        echo ""
        echo "⚠️ 需要重新构建前端才能生效，运行："
        echo "   cd frontend && npm run build"
        ;;
    2)
        echo "📝 修改前端API配置文件..."
        # 备份原文件
        cp frontend/src/utils/api.js frontend/src/utils/api.js.backup
        
        # 修改API_BASE_URL
        sed -i '' 's|process.env.REACT_APP_API_URL || '"'"'/api'"'"'|'"'"'/api'"'"'|g' frontend/src/utils/api.js
        
        echo "✅ 已修改 frontend/src/utils/api.js"
        echo "   API_BASE_URL 现在使用相对路径 '/api'"
        echo ""
        echo "⚠️ 需要重新构建前端才能生效，运行："
        echo "   cd frontend && npm run build"
        ;;
    3)
        echo "🔄 重新构建前端..."
        echo ""
        
        # 确保有正确的环境配置
        if [ ! -f "frontend/.env.production" ]; then
            echo "📝 创建 frontend/.env.production..."
            cat > frontend/.env.production << 'EOF'
REACT_APP_API_URL=/api
GENERATE_SOURCEMAP=false
EOF
        fi
        
        echo "🏗️ 开始构建前端..."
        cd frontend && npm run build
        
        if [ $? -eq 0 ]; then
            echo "✅ 前端构建成功！"
            echo ""
            echo "🔄 现在需要重新部署前端，运行部署脚本："
            echo "   ./deploy_1.sh"
        else
            echo "❌ 前端构建失败"
        fi
        ;;
    4)
        echo "📖 详细修复说明："
        echo ""
        echo "问题分析："
        echo "- 前端正在请求 http://localhost:8000/api/*"
        echo "- 在生产环境中，localhost不可访问"
        echo "- 需要配置正确的API URL"
        echo ""
        echo "解决方案："
        echo ""
        echo "方案1: 使用相对路径 (推荐)"
        echo "- 创建 frontend/.env.production 设置 REACT_APP_API_URL=/api"
        echo "- 这样前端会请求 https://resume.juncaishe.com/api/*"
        echo "- 通过nginx代理转发到后端"
        echo ""
        echo "方案2: 使用绝对路径"
        echo "- 设置 REACT_APP_API_URL=https://resume.juncaishe.com"
        echo "- 直接请求域名API"
        echo ""
        echo "方案3: 代码修改"
        echo "- 直接修改 frontend/src/utils/api.js"
        echo "- 硬编码使用 '/api' 路径"
        echo ""
        echo "执行步骤："
        echo "1. 选择并应用修复方案"
        echo "2. 重新构建前端: cd frontend && npm run build"
        echo "3. 重新部署: ./deploy_1.sh"
        echo "4. 测试登录功能"
        ;;
    5)
        echo "ℹ️ 诊断完成，未进行修复"
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "=== 下一步操作建议 ==="
echo ""
echo "1. 查看后端实时日志: ./get_logs.sh 1"
echo "2. 测试CORS配置: ./get_logs.sh 6"
echo "3. 重新构建并部署前端"
echo "4. 在浏览器中测试登录功能" 