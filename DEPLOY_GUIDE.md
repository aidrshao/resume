# 🚀 AI俊才社简历系统 - 一键部署指南

## 📋 脚本功能概览

这个 `fix-deploy-complete.sh` 脚本包含了所有修复逻辑，支持一键部署和多种运维操作：

### ✅ 核心修复功能
- 智能端口清理和进程管理
- 数据库密码特殊字符修复
- JWT密钥安全配置
- nginx自动配置
- 前端public目录修复
- 数据库迁移和表结构创建
- PM2进程智能管理
- 错误处理和自动回滚
- 全面健康检查

## 🎯 快速开始

### 1. 完整部署（推荐）
```bash
# 下载脚本并赋予执行权限
chmod +x fix-deploy-complete.sh

# 一键部署
sudo bash fix-deploy-complete.sh
```

### 2. 其他实用命令
```bash
# 系统诊断
sudo bash fix-deploy-complete.sh diagnose

# 快速修复
sudo bash fix-deploy-complete.sh fix

# 完全清理
sudo bash fix-deploy-complete.sh clean

# 创建备份
sudo bash fix-deploy-complete.sh backup

# 查看帮助
bash fix-deploy-complete.sh help
```

## 🔧 部署后管理

部署成功后，会自动创建管理脚本：

### 快速管理命令
```bash
# 查看服务状态
/root/manage-resume.sh status

# 重启服务
/root/manage-resume.sh restart

# 查看实时日志
/root/manage-resume.sh logs

# 系统诊断
/root/manage-resume.sh diagnose

# 快速修复
/root/manage-resume.sh fix
```

## 🌐 访问地址

部署成功后可通过以下地址访问：

- **前端网站**: http://101.34.19.47:3016
- **后端API**: http://101.34.19.47:8000
- **API文档**: http://101.34.19.47:8000/api/docs

## 📊 服务信息

### 端口配置
- 前端服务：3016
- 后端服务：8000  
- 数据库：5435

### PM2进程
- resume-backend：后端API服务
- resume-frontend：前端Web服务

### 数据库
- 容器名：resume-postgres
- 数据库：resume_db
- 用户：resume_user

## 🔍 故障排除

### 常见问题解决
1. **端口冲突**：脚本会自动检测和清理
2. **权限问题**：确保使用 `sudo` 运行
3. **网络问题**：检查防火墙设置
4. **内存不足**：确保系统有足够内存

### 诊断命令
```bash
# 全面诊断
sudo bash fix-deploy-complete.sh diagnose

# 查看服务状态
pm2 list

# 查看容器状态
docker ps

# 查看端口占用
lsof -i :3016
lsof -i :8000
lsof -i :5435
```

## 🛡️ 安全特性

- **完全隔离**：使用独立端口和容器，不影响其他项目
- **智能清理**：只操作resume相关进程
- **数据保护**：清理时自动备份重要数据
- **权限控制**：需要root权限确保安全

## 📝 日志位置

- 后端日志：`/var/log/resume-backend.log`
- 前端日志：`/var/log/resume-frontend.log`
- nginx日志：`/var/log/nginx/cv.juncaishe.com.*.log`
- PM2日志：`pm2 logs resume-backend`

## 🆘 紧急处理

### 如果部署失败
```bash
# 快速修复
sudo bash fix-deploy-complete.sh fix

# 重新部署
sudo bash fix-deploy-complete.sh

# 完全清理后重新开始
sudo bash fix-deploy-complete.sh clean
sudo bash fix-deploy-complete.sh
```

### 备份重要数据
```bash
# 创建完整备份
sudo bash fix-deploy-complete.sh backup

# 手动备份数据库
docker exec resume-postgres pg_dump -U resume_user -d resume_db > backup.sql
```

## 💡 最佳实践

1. **定期备份**：建议每天备份数据库
2. **监控日志**：定期查看服务日志
3. **健康检查**：定期运行诊断命令
4. **更新维护**：及时更新系统和依赖

---

## 📞 技术支持

如遇问题，请联系 AI俊才社技术团队获取支持。

**祝您使用愉快！** 🎉 