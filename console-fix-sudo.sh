#!/bin/bash
# 通过腾讯云控制台修复sudo权限的脚本
# 需要在控制台的"实例"页面使用"发送命令"功能运行

echo "🔧 腾讯云控制台sudo权限修复脚本"
echo "================================"

# 检查当前用户
echo "当前用户: $(whoami)"
echo "当前权限: $(id)"

# 修复sudo权限
echo ""
echo "🔧 修复sudo权限..."

# 修复sudo二进制文件权限
chown root:root /usr/bin/sudo
chmod 4755 /usr/bin/sudo

echo "✅ sudo权限已修复"

# 验证修复结果
echo ""
echo "🧪 验证修复结果..."
CURRENT_PERMS=$(stat -c "%a %U:%G" /usr/bin/sudo)
echo "修复后权限: $CURRENT_PERMS"

if [ "$(stat -c "%a" /usr/bin/sudo)" = "4755" ] && [ "$(stat -c "%U" /usr/bin/sudo)" = "root" ]; then
    echo "✅ sudo权限修复成功！"
    
    # 确保ubuntu用户在sudo组中
    echo ""
    echo "🔧 配置ubuntu用户权限..."
    usermod -aG sudo ubuntu
    usermod -aG docker ubuntu
    echo "✅ 用户组权限已配置"
    
    echo ""
    echo "🎉 修复完成！现在ubuntu用户可以使用sudo了"
    echo "请在ubuntu用户下重新运行: ./safe_fix.sh"
    
else
    echo "❌ 修复失败，请检查权限"
fi 