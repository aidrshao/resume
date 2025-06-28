#!/bin/bash
# SSH连接测试脚本
# 帮助验证服务器连接是否正常

echo "🔑 SSH连接测试工具"
echo "================================"

# 提示用户输入信息
read -p "请输入服务器IP地址: " HOST
read -p "请输入用户名: " USERNAME
read -p "请输入SSH私钥文件路径 (如 ~/.ssh/id_rsa): " KEY_PATH

echo ""
echo "🧪 测试连接到: $USERNAME@$HOST"
echo "🔐 使用私钥: $KEY_PATH"
echo ""

# 检查私钥文件是否存在
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ 私钥文件不存在: $KEY_PATH"
    exit 1
fi

# 检查私钥权限
KEY_PERMS=$(stat -f %A "$KEY_PATH" 2>/dev/null || stat -c %a "$KEY_PATH" 2>/dev/null)
if [ "$KEY_PERMS" != "600" ]; then
    echo "⚠️ 私钥权限不正确，正在修复..."
    chmod 600 "$KEY_PATH"
fi

# 测试SSH连接
echo "🔍 测试SSH连接..."
if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i "$KEY_PATH" "$USERNAME@$HOST" "echo '✅ SSH连接成功!'; whoami; uname -a"; then
    echo ""
    echo "✅ SSH连接测试通过！"
    echo ""
    echo "🐳 测试Docker安装..."
    if ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" "$USERNAME@$HOST" "docker --version" 2>/dev/null; then
        echo "✅ Docker已安装"
    else
        echo "❌ Docker未安装或无权限"
    fi
    
    echo ""
    echo "👤 测试sudo权限..."
    if ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" "$USERNAME@$HOST" "sudo -n echo '✅ sudo权限正常'" 2>/dev/null; then
        echo "✅ sudo权限正常"
    else
        echo "❌ sudo需要密码或无权限"
    fi
    
    echo ""
    echo "💾 检查磁盘空间..."
    ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" "$USERNAME@$HOST" "df -h | head -2"
    
else
    echo ""
    echo "❌ SSH连接失败！"
    echo ""
    echo "🔧 常见解决方案："
    echo "1. 检查服务器IP地址是否正确"
    echo "2. 确认SSH端口（默认22）是否开放"
    echo "3. 验证用户名是否存在"
    echo "4. 检查私钥格式是否正确"
    echo "5. 确认服务器防火墙设置"
fi 