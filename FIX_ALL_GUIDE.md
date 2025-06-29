# 🛠️ 一键修复脚本使用指南

## 🎯 脚本功能

`fix-all-issues.sh` 是一个智能的服务器修复脚本，能够：

- ✅ **自动检测用户权限**（root、sudo、普通用户）
- ✅ **一次性修复所有问题**
- ✅ **智能权限适配**（根据权限选择修复策略）
- ✅ **彩色输出显示**（清晰的状态反馈）
- ✅ **修复验证检查**（确保修复效果）

## 🚀 使用方法

### 方案一：直接在服务器上运行（推荐）

```bash
# 1. SSH登录到服务器
ssh ubuntu@122.51.234.153

# 2. 上传脚本（选择其中一种方法）

# 方法A：直接创建脚本文件
nano fix-all-issues.sh
# 粘贴脚本内容并保存

# 方法B：从GitHub下载（如果已推送）
wget https://raw.githubusercontent.com/您的用户名/resume/main/fix-all-issues.sh

# 3. 给脚本执行权限
chmod +x fix-all-issues.sh

# 4. 运行脚本（推荐使用sudo）
sudo ./fix-all-issues.sh
```

### 方案二：使用scp上传脚本

```bash
# 在本地执行（将脚本上传到服务器）
scp fix-all-issues.sh ubuntu@122.51.234.153:~/

# SSH登录服务器
ssh ubuntu@122.51.234.153

# 运行脚本
chmod +x fix-all-issues.sh
sudo ./fix-all-issues.sh
```

## 🔐 权限说明

脚本会自动检测权限并采用相应策略：

### ⭐ **Root权限**（推荐）
```bash
# 切换到root用户
sudo su -
./fix-all-issues.sh
```
**修复内容：**
- ✅ 修复sudo权限问题
- ✅ 配置用户组权限
- ✅ 修复Docker权限
- ✅ 升级Node.js到v20
- ✅ 修复Nginx配置
- ✅ 配置防火墙规则
- ✅ 安装全局包
- ✅ 创建项目目录

### 🟡 **Sudo权限**
```bash
sudo ./fix-all-issues.sh
```
**修复内容：**
- ✅ 修复sudo权限问题
- ✅ 配置用户组权限
- ✅ 修复Docker权限
- ✅ 升级Node.js到v20
- ✅ 修复Nginx配置
- ✅ 配置防火墙规则
- ✅ 安装全局包

### 🔴 **普通用户权限**
```bash
./fix-all-issues.sh
```
**修复内容：**
- ⚠️ 仅限用户级修复
- ❌ 无法修复关键系统问题

## 📊 输出示例

脚本运行时会显示彩色状态：

```
🚀 AI俊才社服务器一键修复脚本
================================
🎯 自动检测权限并修复所有问题

ℹ️  当前用户: ubuntu
✅ 检测到sudo权限（无需密码）

ℹ️  开始修复程序...

==============================================
🔧 使用SUDO权限进行修复
==============================================
ℹ️  尝试修复sudo权限...
✅ sudo权限修复尝试完成
ℹ️  配置用户组权限...
✅ 用户组权限已配置
ℹ️  修复Docker...
✅ Docker已修复
...
```

## 🧪 修复后验证

脚本会自动验证修复结果，您也可以手动检查：

```bash
# 检查sudo权限
sudo echo "sudo权限测试"

# 检查Docker权限
docker ps

# 检查Node.js版本
node --version

# 检查Nginx配置
sudo nginx -t

# 检查PM2
pm2 --version

# 重新运行检测脚本
./check.sh
```

## 🔄 重新登录生效

为确保所有权限更改生效，建议修复后重新登录：

```bash
# 退出当前会话
exit

# 重新SSH登录
ssh ubuntu@122.51.234.153

# 验证修复效果
docker ps
sudo nginx -t
```

## 🚀 GitHub Actions部署

修复完成后，您可以：

1. **重新触发部署**：
   - 推送新的提交到GitHub
   - 或在GitHub Actions页面手动触发workflow

2. **检查部署日志**：
   - 查看是否还有"Process completed with exit code 1"错误
   - 如有新错误，根据具体日志进一步排查

## ⚠️ 常见问题

### 1. "Permission denied"错误
```bash
chmod +x fix-all-issues.sh
```

### 2. 无法获得sudo权限
```bash
# 联系系统管理员或使用root用户
su - root
./fix-all-issues.sh
```

### 3. 脚本执行中断
```bash
# 查看详细错误信息
./fix-all-issues.sh 2>&1 | tee fix-log.txt
```

### 4. Docker权限仍有问题
```bash
# 重新登录后测试
exit
ssh ubuntu@服务器IP
docker ps
```

## 📈 修复前后对比

| 检查项目 | 修复前状态 | 修复后状态 |
|---------|-----------|-----------|
| sudo权限 | ❌ 损坏 | ✅ 正常 |
| Docker权限 | ❌ 异常 | ✅ 正常 |
| Node.js版本 | ⚠️ v18 | ✅ v20+ |
| Nginx配置 | ❌ 错误 | ✅ 正确 |
| 用户组 | ❌ 缺失 | ✅ 已配置 |
| 防火墙 | ⚠️ 未配置 | ✅ 已配置 |

## 🎉 成功标志

修复成功后，您应该看到：

```
==============================================
🔧 修复完成！
==============================================

✅ 所有可修复的问题已处理
ℹ️  🔄 建议重新登录以应用所有更改: exit && ssh ubuntu@服务器IP
ℹ️  🧪 运行测试: docker ps && node --version && sudo nginx -t
ℹ️  🚀 现在可以重新触发GitHub Actions部署

📋 修复摘要：
✅ sudo权限已修复
✅ 用户组权限已配置
✅ Docker权限已修复
✅ Node.js已升级到v20
✅ Nginx配置已修复
✅ 防火墙已配置
✅ 项目目录已准备
✅ 全局包已安装
```

现在您的GitHub Actions部署应该能够正常工作了！🎊 