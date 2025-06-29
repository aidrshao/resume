# 🔍 服务器部署环境检测指南

## 📋 使用方法

### 步骤1：上传脚本到服务器
将 `server-deployment-check.sh` 脚本上传到您的腾讯云服务器：

```bash
# 方法1：使用scp命令（本地执行）
scp server-deployment-check.sh root@YOUR_SERVER_IP:~/

# 方法2：直接在服务器上下载
wget https://raw.githubusercontent.com/您的用户名/resume/main/server-deployment-check.sh
chmod +x server-deployment-check.sh
```

### 步骤2：在服务器上运行检测
```bash
# SSH登录到服务器
ssh root@YOUR_SERVER_IP

# 运行检测脚本
./server-deployment-check.sh
```

## 🎯 检测内容

该脚本将全面检测以下内容：

### ✅ 系统基础环境
- 操作系统版本和架构
- 磁盘空间（至少5GB）
- 内存状况（推荐1GB+）
- 系统负载情况

### 🌐 网络连接
- 外网连接测试
- DNS解析测试
- GitHub API连接测试

### 👤 权限检查
- sudo权限验证
- docker用户组检查
- 文件系统权限

### 🐳 Docker环境
- Docker安装状态
- Docker服务运行状态
- Docker权限测试
- 容器运行测试

### 🟢 Node.js环境
- Node.js版本（需要20+）
- npm安装状态
- PM2进程管理器

### 🌐 Web服务器
- Nginx安装和配置
- SSL工具（OpenSSL, Certbot）

### 🔌 端口检查
检查关键端口占用情况：
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)  
- 3000 (前端)
- 8000 (后端)
- 5432 (PostgreSQL)

### 🔥 防火墙设置
- UFW状态检查
- iptables规则检查

## 📊 输出说明

脚本使用彩色输出标识检测结果：

- ✅ **绿色**：正常，无需处理
- ⚠️ **黄色**：警告，建议优化
- ❌ **红色**：错误，需要修复
- ℹ️ **蓝色**：信息提示

## 🔧 自动修复

检测完成后，脚本会自动生成 `fix-deployment-environment.sh` 修复脚本：

```bash
# 运行自动修复脚本
./fix-deployment-environment.sh

# 重新登录以应用docker组权限
exit
ssh root@YOUR_SERVER_IP
```

## ⚠️ 常见问题

### 1. "Permission denied" 错误
```bash
chmod +x server-deployment-check.sh
```

### 2. Docker权限问题
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 3. 端口被占用
查看占用进程：
```bash
sudo lsof -i :端口号
sudo netstat -tulpn | grep 端口号
```

### 4. 防火墙阻止连接
开放必要端口：
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
```

## 🚀 部署故障排查流程

1. **运行检测脚本**
   ```bash
   ./server-deployment-check.sh > check-result.txt 2>&1
   ```

2. **修复红色❌错误**
   ```bash
   ./fix-deployment-environment.sh
   ```

3. **重新检测**
   ```bash
   ./server-deployment-check.sh
   ```

4. **测试GitHub Actions**
   重新触发部署

## 📞 技术支持

如果检测发现严重问题，请将检测结果 (`check-result.txt`) 发送给技术支持团队。

---

*该脚本适用于Ubuntu/Debian系统，其他Linux发行版可能需要调整包管理器命令。* 