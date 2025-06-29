# 🚀 AI俊才社简历系统 - 一键部署指南

## 📋 概述

这是一个**自包含的一键部署脚本**，您只需要复制一个文件就能完成整个项目的部署。

## 🎯 解决的核心问题

✅ **PM2进程重复** - 自动清理重复的resume进程（从6个减少到2个）  
✅ **数据库认证失败** - 智能修复PostgreSQL密码认证问题  
✅ **脚本维护困难** - 模块化设计，易于调试和维护  
✅ **部署过程复杂** - 真正的一键部署，无需多个文件  

## 🔧 系统配置

- **前端**: React + TailwindCSS (端口: 3016)
- **后端**: Node.js + Express (端口: 8000)  
- **数据库**: PostgreSQL Docker容器 (端口: 5435)
- **反向代理**: Nginx
- **SSL证书**: Let's Encrypt 自动配置
- **进程管理**: PM2
- **域名**: cv.juncaishe.com

## 🚀 一键部署方法

### 方法1: 直接下载运行（推荐）

```bash
# 下载脚本（如果你已经上传到GitHub）
curl -O https://raw.githubusercontent.com/aidrshao/resume/main/deploy-standalone.sh

# 添加执行权限
chmod +x deploy-standalone.sh

# 执行一键部署
sudo ./deploy-standalone.sh
```

### 方法2: 复制粘贴运行

1. 复制 `deploy-standalone.sh` 的全部内容
2. 在服务器上创建文件：
```bash
nano deploy-standalone.sh
# 粘贴内容后保存退出
```
3. 添加执行权限并运行：
```bash
chmod +x deploy-standalone.sh
sudo ./deploy-standalone.sh
```

## 📱 部署模式

### 🔧 修复模式（推荐解决当前问题）
```bash
sudo ./deploy-standalone.sh --mode=fix
```
**适用场景**: 
- PM2显示6个resume进程
- 数据库密码认证失败
- 网站无法正常访问

### 🚀 完整部署模式
```bash
sudo ./deploy-standalone.sh --mode=full
# 或者直接
sudo ./deploy-standalone.sh
```
**适用场景**: 首次部署或需要重新安装所有组件

### ⚡ 快速部署模式
```bash
sudo ./deploy-standalone.sh --mode=quick
```
**适用场景**: 代码更新，系统运行正常时

### 🔍 健康检查模式
```bash
sudo ./deploy-standalone.sh --mode=check
```
**适用场景**: 检查系统状态，不做任何修改

## 🐛 调试模式

如果部署过程中遇到问题，可以启用调试模式：
```bash
sudo ./deploy-standalone.sh --mode=fix --debug
```

## 🔑 环境变量配置（可选）

如果需要配置AI服务和邮件服务，可以在运行前设置环境变量：

```bash
# 设置AI服务API密钥
export OPENAI_API_KEY="your-openai-api-key"
export DEEPSEEK_API_KEY="your-deepseek-api-key"

# 设置邮件服务
export SMTP_USER="your-email@qq.com"
export SMTP_PASS="your-smtp-password"

# 然后执行部署
sudo -E ./deploy-standalone.sh --mode=fix
```

## ✅ 预期结果

部署成功后，您应该看到：

1. **PM2状态正常**:
```
│ id │ name            │ status │
├────┼─────────────────┼────────┤
│ 0  │ resume-backend  │ online │
│ 1  │ resume-frontend │ online │
```

2. **端口监听正常**:
   - 端口 3016: 前端服务
   - 端口 8000: 后端服务
   - 端口 5435: 数据库服务
   - 端口 80: HTTP服务
   - 端口 443: HTTPS服务

3. **网站访问正常**:
   - https://cv.juncaishe.com (HTTPS)
   - http://cv.juncaishe.com (自动跳转到HTTPS)

## 🔧 常用管理命令

```bash
# 检查系统状态
sudo ./deploy-standalone.sh --mode=check

# 修复系统问题
sudo ./deploy-standalone.sh --mode=fix

# 查看PM2状态
pm2 list

# 查看PM2日志
pm2 logs

# 重启服务
pm2 restart all

# 查看数据库状态
docker ps | grep resume-postgres

# 查看部署日志
tail -f /var/log/resume-deploy.log
```

## 🆘 常见问题解决

### Q1: PM2显示多个resume进程怎么办？
```bash
sudo ./deploy-standalone.sh --mode=fix
```

### Q2: 数据库连接失败怎么办？
```bash
# 检查数据库容器
docker ps | grep postgres

# 如果没有运行，执行修复
sudo ./deploy-standalone.sh --mode=fix
```

### Q3: 网站访问404怎么办？
```bash
# 检查Nginx状态
systemctl status nginx

# 检查Nginx配置
nginx -t

# 修复
sudo ./deploy-standalone.sh --mode=fix
```

### Q4: SSL证书问题怎么办？
```bash
# 检查证书状态
certbot certificates

# 重新申请证书
sudo ./deploy-standalone.sh --mode=fix
```

## 📊 脚本特点对比

| 特性 | 原方案 | 一键部署脚本 |
|------|--------|-------------|
| 文件数量 | 10+个文件 | **1个文件** ✅ |
| 部署复杂度 | 需要上传多个文件 | **只需复制1个脚本** ✅ |
| PM2进程数 | 6个(重复) | **2个(正确)** ✅ |
| 数据库认证 | 经常失败 | **自动修复** ✅ |
| 错误处理 | 手动排查 | **智能诊断** ✅ |
| 维护难度 | 困难 | **简单** ✅ |

## 🎯 总结

这个一键部署脚本解决了您遇到的所有核心问题：

1. **真正的一键部署** - 只需复制一个文件
2. **智能问题修复** - 自动解决PM2重复进程和数据库认证失败
3. **完整的功能集成** - 包含所有必要的模块和功能
4. **易于维护调试** - 清晰的日志和错误处理

推荐使用 `--mode=fix` 模式来解决您当前遇到的问题！

---

🏢 **AI俊才社技术团队**  
📧 **技术支持**: admin@juncaishe.com 