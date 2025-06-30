#!/bin/bash

# 🔧 Nginx配置冲突高级诊断和修复脚本
# 解决多配置文件争夺同一域名的问题

echo "🔍 Nginx配置冲突诊断和修复脚本"
echo "========================================"

# 检查函数
check_nginx_configs() {
    echo "📋 第1步：检查所有nginx配置文件"
    echo "----------------------------------------"
    
    echo "🔍 查找所有包含cv.juncaishe.com的配置文件："
    find /etc/nginx/ -name "*.conf" -o -name "*resume*" -o -name "*sites-*" 2>/dev/null | while read file; do
        if [ -f "$file" ] && grep -l "cv.juncaishe.com" "$file" 2>/dev/null; then
            echo "⚠️  发现配置文件: $file"
            echo "   包含的server块："
            grep -A 2 -B 1 "server_name.*cv.juncaishe.com" "$file" 2>/dev/null || echo "   (无法读取内容)"
            echo ""
        fi
    done
    
    echo "🔍 检查main nginx.conf是否包含冲突的server块："
    if grep -q "server_name.*cv\.juncaishe\.com" /etc/nginx/nginx.conf 2>/dev/null; then
        echo "❌ /etc/nginx/nginx.conf 包含冲突的server块！"
        grep -A 5 -B 5 "server_name.*cv.juncaishe.com" /etc/nginx/nginx.conf
    else
        echo "✅ /etc/nginx/nginx.conf 无冲突server块"
    fi
    
    echo ""
    echo "🔍 检查sites-enabled目录："
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "sites-enabled目录不存在"
    
    echo ""
    echo "🔍 检查include语句："
    grep -n "include.*sites" /etc/nginx/nginx.conf 2>/dev/null || echo "nginx.conf中无sites-enabled包含语句"
}

# 修复函数
fix_nginx_conflicts() {
    echo ""
    echo "🔧 第2步：修复nginx配置冲突"
    echo "----------------------------------------"
    
    # 备份当前配置
    echo "📦 备份当前nginx配置..."
    cp /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null
    
    # 清理主nginx.conf中的冲突server块
    echo "🧹 清理nginx.conf中的冲突server块..."
    if grep -q "server_name.*cv\.juncaishe\.com" /etc/nginx/nginx.conf 2>/dev/null; then
        echo "⚠️  发现冲突server块，正在清理..."
        # 创建临时文件来清理server块
        awk '
        BEGIN { in_server = 0; skip_server = 0; brace_count = 0 }
        /^[[:space:]]*server[[:space:]]*{/ { 
            in_server = 1; 
            brace_count = 1; 
            server_content = $0 "\n"
            next 
        }
        in_server == 1 {
            server_content = server_content $0 "\n"
            if (/^[[:space:]]*{/) brace_count++
            if (/^[[:space:]]*}/) brace_count--
            if (brace_count == 0) {
                in_server = 0
                if (server_content !~ /cv\.juncaishe\.com/) {
                    printf "%s", server_content
                } else {
                    print "    # 冲突的cv.juncaishe.com server块已被移除"
                }
                server_content = ""
            }
            next
        }
        { print }
        ' /etc/nginx/nginx.conf > /tmp/nginx.conf.clean
        
        mv /tmp/nginx.conf.clean /etc/nginx/nginx.conf
        echo "✅ nginx.conf冲突server块已清理"
    else
        echo "✅ nginx.conf无需清理"
    fi
    
    # 确保包含sites-enabled
    echo "🔗 确保nginx.conf包含sites-enabled目录..."
    if ! grep -q "include /etc/nginx/sites-enabled" /etc/nginx/nginx.conf; then
        echo "📝 添加sites-enabled包含语句..."
        sed -i '/http {/a\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
        echo "✅ 已添加sites-enabled包含语句"
    else
        echo "✅ sites-enabled包含语句已存在"
    fi
    
    # 检查resume配置文件
    echo "🔍 检查resume配置文件状态..."
    if [ -f /etc/nginx/sites-available/resume ]; then
        echo "✅ resume配置文件存在"
        if [ -L /etc/nginx/sites-enabled/resume ]; then
            echo "✅ resume配置文件已启用"
        else
            echo "🔗 启用resume配置文件..."
            ln -sf /etc/nginx/sites-available/resume /etc/nginx/sites-enabled/resume
            echo "✅ resume配置文件已启用"
        fi
    else
        echo "❌ resume配置文件不存在，需要重新生成"
        return 1
    fi
    
    # 清理其他可能的冲突配置
    echo "🧹 清理其他可能的冲突配置..."
    for file in /etc/nginx/sites-enabled/*; do
        if [ -f "$file" ] && [ "$(basename "$file")" != "resume" ]; then
            if grep -q "cv.juncaishe.com" "$file" 2>/dev/null; then
                echo "⚠️  发现冲突文件: $file"
                echo "📦 备份并移除: $file"
                mv "$file" "/tmp/$(basename "$file").conflicted.$(date +%Y%m%d_%H%M%S)"
                echo "✅ 已移除冲突文件"
            fi
        fi
    done
}

# 测试函数
test_nginx_config() {
    echo ""
    echo "🧪 第3步：测试修复效果"
    echo "----------------------------------------"
    
    echo "📋 测试nginx配置语法..."
    if nginx -t; then
        echo "✅ nginx配置语法正确"
    else
        echo "❌ nginx配置语法错误"
        return 1
    fi
    
    echo ""
    echo "🔄 重启nginx服务..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "✅ nginx服务重启成功"
    else
        echo "❌ nginx服务重启失败"
        return 1
    fi
    
    echo ""
    echo "🧪 测试API路由..."
    sleep 2
    
    # 测试健康检查
    echo "测试健康检查 (/health)："
    health_response=$(curl -s http://localhost/health 2>/dev/null)
    echo "响应内容: $health_response"
    
    if echo "$health_response" | grep -q '"success"' && echo "$health_response" | grep -q '"message"'; then
        echo "✅ 健康检查返回正确的JSON格式"
    else
        echo "❌ 健康检查返回格式异常"
        echo "这表明请求仍被路由到错误的服务"
    fi
    
    # 测试API路由
    echo ""
    echo "测试API路由 (/api/resumes/upload)："
    api_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/api/resumes/upload 2>/dev/null)
    echo "API路由状态码: $api_status"
    
    if [ "$api_status" = "401" ] || [ "$api_status" = "403" ]; then
        echo "✅ API路由正常（认证失败符合预期）"
    elif [ "$api_status" = "404" ]; then
        echo "⚠️  API路由404，检查路由配置"
    elif [ "$api_status" = "504" ]; then
        echo "❌ API路由仍然504，代理配置仍有问题"
    else
        echo "🔍 API路由状态: $api_status"
    fi
}

# 显示详细信息
show_debug_info() {
    echo ""
    echo "🔍 第4步：详细调试信息"
    echo "----------------------------------------"
    
    echo "📊 当前端口监听状态："
    netstat -tlnp | grep -E ":80|:800|:300" | sort
    
    echo ""
    echo "📋 PM2服务状态："
    pm2 list | grep resume
    
    echo ""
    echo "🔍 当前nginx配置文件内容（resume）："
    if [ -f /etc/nginx/sites-enabled/resume ]; then
        echo "后端代理端口配置："
        grep "127.0.0.1:" /etc/nginx/sites-enabled/resume | head -3
    else
        echo "❌ resume配置文件不存在"
    fi
    
    echo ""
    echo "📝 nginx错误日志（最新10行）："
    tail -10 /var/log/nginx/error.log 2>/dev/null || echo "无法读取错误日志"
}

# 主流程
main() {
    check_nginx_configs
    fix_nginx_conflicts
    
    if [ $? -eq 0 ]; then
        test_nginx_config
        show_debug_info
        
        echo ""
        echo "🎯 修复完成总结："
        echo "================================"
        echo "✅ 已清理nginx配置冲突"
        echo "✅ 已确保使用正确的resume配置"
        echo "✅ 已重启nginx服务"
        echo ""
        echo "如果问题仍然存在，请运行以下命令检查："
        echo "curl -s http://localhost/health | head -5"
        echo "curl -s -w '%{http_code}' -X POST http://localhost/api/resumes/upload"
    else
        echo ""
        echo "❌ 修复过程中遇到错误，可能需要手动检查"
        echo "建议重新运行部署脚本重新生成nginx配置"
    fi
}

# 执行主流程
main 