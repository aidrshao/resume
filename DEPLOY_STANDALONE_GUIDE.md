# AI俊才社简历系统 - 优化版部署指南

## 🎯 快速开始

### 1. 使用优化版部署脚本

```bash
# 下载并运行优化版部署脚本
sudo bash deploy_standalone.sh
```

### 2. 查看帮助信息

```bash
sudo bash deploy_standalone.sh --help
```

## 📋 系统要求

- **操作系统**: Ubuntu 18.04+ / CentOS 7+
- **权限**: Root用户权限
- **内存**: 至少 2GB RAM
- **硬盘**: 至少 10GB 可用空间
- **网络**: 稳定的网络连接

### 预装软件要求

- Docker & Docker Compose
- Node.js 16+
- npm
- Git
- PM2
- Nginx

## 🔧 优化版部署脚本功能

### 已修复的问题

1. **数据库脚本错误**
   - 修复了 `knex is not a function` 错误
   - 修复了用户ID返回对象而非数字的问题

2. **迁移冲突问题**
   - 智能检测字段是否存在
   - 避免重复添加字段导致的冲突

3. **端口冲突处理**
   - 智能检测可用端口
   - 自动分配端口避免冲突

4. **Nginx配置优化**
   - 修复301重定向问题
   - 优化静态文件服务配置

5. **错误处理改进**
   - 更详细的错误日志
   - 智能重试机制

### 部署流程

1. **[1/9] 检查系统环境** - 验证系统兼容性和依赖
2. **[2/9] 准备项目目录** - 克隆/更新代码
3. **[3/9] 智能端口检测** - 自动分配可用端口
4. **[4/9] 配置数据库** - 启动PostgreSQL容器
5. **[5/9] 配置后端服务** - 安装依赖、运行迁移
6. **[6/9] 配置前端服务** - 构建React应用
7. **[7/9] 启动应用服务** - 启动PM2管理的服务
8. **[8/9] 配置Nginx** - 设置反向代理
9. **[9/9] 最终验证** - 健康检查和测试

## 🛠️ 故障排除

### 常见问题

#### 1. 数据库迁移失败

**问题**: 出现字段已存在错误
```bash
ERROR: column "unified_data" of relation "resumes" already exists
```

**解决方案**:
```bash
# 运行数据库修复脚本
cd /home/ubuntu/resume/backend
node scripts/fix-database-issues.js
```

#### 2. 端口被占用

**问题**: 服务无法启动，端口已被占用

**解决方案**:
脚本会自动检测并分配可用端口，查看部署日志确认实际端口：
```bash
tail -f /var/log/resume-deploy.log
```

#### 3. 用户ID类型错误

**问题**: 用户创建时返回对象而非数字

**解决方案**:
已在脚本中修复，如果仍有问题：
```bash
# 修复用户序列
cd /home/ubuntu/resume/backend
node scripts/fix-database-issues.js
```

#### 4. 前端301重定向问题

**问题**: 访问前端页面返回301重定向

**解决方案**:
```bash
# 检查Nginx配置
nginx -t
# 重新生成Nginx配置
sudo bash deploy_standalone.sh --nginx-only
```

#### 5. API接口无法访问

**问题**: 后端API返回404或502错误

**解决方案**:
```bash
# 检查后端服务状态
pm2 list
pm2 logs resume-backend

# 重启后端服务
pm2 restart resume-backend
```

### 日志查看

```bash
# 查看部署日志
tail -f /var/log/resume-deploy.log

# 查看PM2服务日志
pm2 logs

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log
```

### 服务管理

```bash
# 查看所有服务状态
pm2 list

# 重启所有服务
pm2 restart all

# 重启数据库
docker restart resume-postgres

# 重启Nginx
systemctl restart nginx
```

## 🧪 测试和验证

### 1. 服务状态检查

```bash
# 检查后端API
curl http://localhost:8000/api/health

# 检查前端服务
curl http://localhost:3016

# 检查数据库连接
docker exec resume-postgres psql -U resume_user -d resume_db -c "SELECT 1;"
```

### 2. 功能测试

**测试账号**:
- 邮箱: test@juncaishe.com
- 密码: test123456

**管理员账号**:
- 邮箱: admin@example.com
- 密码: admin123456

### 3. 访问地址

- **主站**: http://cv.juncaishe.com
- **直接访问**: http://your-server-ip:前端端口

## 📝 配置说明

### 环境变量

部署脚本会自动创建 `.env` 文件，包含以下关键配置：

```env
NODE_ENV=development
PORT=8000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=resume_db
DB_USER=resume_user
DB_PASSWORD=ResumePass123
JWT_SECRET=resume_app_jwt_secret_2024_very_secure_key_change_in_production
FRONTEND_URL=http://localhost:3016
```

### 端口配置

- **数据库端口**: 5433 (可自动调整)
- **后端端口**: 8000 (可自动调整)
- **前端端口**: 3016 (可自动调整)

### 文件路径

- **项目目录**: `/home/ubuntu/resume`
- **部署日志**: `/var/log/resume-deploy.log`
- **Nginx配置**: `/etc/nginx/sites-available/resume`
- **上传文件**: `/home/ubuntu/resume/backend/uploads`

## 🔄 更新和维护

### 更新代码

```bash
cd /home/ubuntu/resume
git pull origin main
sudo bash deploy_standalone.sh
```

### 备份数据

```bash
# 备份数据库
docker exec resume-postgres pg_dump -U resume_user resume_db > backup.sql

# 备份上传文件
tar -czf uploads-backup.tar.gz /home/ubuntu/resume/backend/uploads
```

### 恢复数据

```bash
# 恢复数据库
docker exec -i resume-postgres psql -U resume_user -d resume_db < backup.sql

# 恢复上传文件
tar -xzf uploads-backup.tar.gz -C /
```

## 🆘 紧急修复

如果部署失败，可以尝试以下步骤：

1. **查看错误日志**
   ```bash
   tail -100 /var/log/resume-deploy.log
   ```

2. **运行数据库修复脚本**
   ```bash
   cd /home/ubuntu/resume/backend
   node scripts/fix-database-issues.js
   ```

3. **重新部署**
   ```bash
   sudo bash deploy_standalone.sh
   ```

4. **清理并重新部署**
   ```bash
   # 停止所有服务
   pm2 delete all
   docker stop resume-postgres
   docker rm resume-postgres
   
   # 重新部署
   sudo bash deploy_standalone.sh
   ```

## 📞 技术支持

如果遇到无法解决的问题，请提供以下信息：

1. 系统信息 (`uname -a`)
2. 部署日志 (`/var/log/resume-deploy.log`)
3. 错误截图
4. 具体的错误信息

## 🎉 部署成功标志

部署成功后，您应该看到：

```
🎉 部署完成！

=== 🌐 访问地址 ===
主站地址: http://cv.juncaishe.com
直接访问: http://your-server-ip:3016

=== 🧪 测试账号 ===
邮箱: test@juncaishe.com
密码: test123456
```

祝您部署成功！🚀 