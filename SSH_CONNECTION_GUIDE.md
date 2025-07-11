# SSH连接配置指南

## 方案一：使用优化的部署脚本（推荐）

我已经优化了 `deploy_1.sh` 脚本，添加了专门的修复功能：

### 🔥 一键修复所有问题
```bash
sudo bash deploy_1.sh --fix-all
```

### 🎯 针对性修复
```bash
# 修复SPA路由404问题
sudo bash deploy_1.sh --fix-spa

# 修复401认证问题  
sudo bash deploy_1.sh --fix-auth
```

## 方案二：配置SSH密钥连接

如果您希望配置SSH密钥以便远程连接服务器，请按以下步骤操作：

### 1. 在本地生成SSH密钥（如果还没有）

```bash
# 在本地机器上执行
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

按回车使用默认路径，设置密码（可选）。

### 2. 查看本地公钥

```bash
cat ~/.ssh/id_rsa.pub
```

复制输出的内容（以 `ssh-rsa` 开头）。

### 3. 在服务器上添加公钥

登录到您的服务器，然后执行：

```bash
# 创建.ssh目录（如果不存在）
mkdir -p ~/.ssh

# 设置正确的权限
chmod 700 ~/.ssh

# 添加公钥到authorized_keys
echo "你的公钥内容" >> ~/.ssh/authorized_keys

# 设置正确的权限
chmod 600 ~/.ssh/authorized_keys
```

### 4. 测试SSH连接

在本地机器上测试：

```bash
ssh root@resume.juncaishe.com
```

## 当前问题分析

根据您提供的日志，当前主要问题是：

### 1. SPA路由404问题
- **现象**: 访问 `/login` 等路由返回404
- **原因**: Nginx配置不正确，没有处理SPA路由
- **解决方案**: 使用 `--fix-spa` 修复

### 2. 401认证问题  
- **现象**: API请求返回401错误
- **原因**: JWT_SECRET可能在部署时发生变化
- **解决方案**: 使用 `--fix-auth` 修复

### 3. 前端进程冲突
- **现象**: PM2中有多余的 `resume-frontend` 进程
- **原因**: 静态文件应该由Nginx直接服务，不需要额外的Node.js进程
- **解决方案**: 脚本会自动停止冲突进程

## 推荐操作流程

1. **立即修复当前问题**：
   ```bash
   sudo bash deploy_1.sh --fix-all
   ```

2. **验证修复结果**：
   - 访问: https://resume.juncaishe.com
   - 测试登录: https://resume.juncaishe.com/login
   - 检查简历页面: https://resume.juncaishe.com/resumes

3. **如果仍有问题，查看日志**：
   ```bash
   # 查看PM2日志
   pm2 logs resume-backend --lines 20
   
   # 查看Nginx错误日志
   tail -f /var/log/nginx/error.log
   
   # 查看部署日志
   tail -f /var/log/deploy_resume.log
   ```

## 技术细节

### SPA路由修复内容
- 配置 `try_files $uri $uri/ /index.html`
- 停止不必要的PM2前端进程
- 优化静态文件缓存策略

### 401认证修复内容
- 检查和重新生成JWT_SECRET
- 重启后端服务应用新配置
- 验证API健康状态

### Nginx配置优化
- 正确的SSL配置
- API代理配置
- 静态文件服务配置
- 错误页面处理

## 联系支持

如果问题仍然存在，请提供以下信息：
1. 修复脚本的执行日志
2. PM2服务状态: `pm2 list`
3. Nginx状态: `systemctl status nginx`
4. 错误日志内容

---
*最后更新: 2025-01-11* 