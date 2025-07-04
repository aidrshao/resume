# Deploy.sh 一键部署脚本使用指南

## 🚀 快速开始

### 基础部署

```bash
# 标准一键部署
sudo bash deploy.sh
```

### 特定模式部署

```bash
# 快速部署（跳过某些检查，适合重复部署）
sudo bash deploy.sh --mode=quick

# 修复模式（专注修复现有问题）
sudo bash deploy.sh --mode=fix

# 清理重新部署（删除现有安装，从头开始）
sudo bash deploy.sh --mode=cleanup
sudo bash deploy.sh
```

### 专项修复

```bash
# 仅修复数据库问题
sudo bash deploy.sh --db-fix-only

# 仅重新配置Nginx
sudo bash deploy.sh --nginx-only
```

### 部分部署

```bash
# 跳过前端部署
sudo bash deploy.sh --skip-frontend

# 跳过后端部署
sudo bash deploy.sh --skip-backend

# 跳过数据库迁移
sudo bash deploy.sh --no-migration
```

## 🔧 主要功能特性

### ✅ 已集成的修复功能

1. **数据库字段修复**
   - 自动修复 `resume_data` 字段问题
   - 智能迁移到 `unified_data` 格式
   - 多重重试机制确保迁移成功

2. **智能错误处理**
   - 3次重试机制
   - 自动检测和修复数据库结构问题
   - 详细的错误日志和故障排除指南

3. **多种部署模式**
   - **normal**: 标准部署模式
   - **quick**: 快速部署（跳过依赖重新安装）
   - **fix**: 修复模式（专注解决问题）
   - **cleanup**: 清理重新部署

4. **智能端口分配**
   - 自动检测可用端口
   - 避免端口冲突

5. **完整的系统检查**
   - 系统资源检查
   - 依赖安装验证
   - 服务健康检查

## 📋 部署流程

### 标准部署流程（9个步骤）

1. **[1/9] 检查系统环境** - 验证操作系统和资源
2. **[2/9] 安装依赖** - 安装Node.js、Docker、PM2等
3. **[3/9] 准备项目目录** - 克隆/更新代码
4. **[4/9] 检测端口** - 智能分配可用端口
5. **[5/9] 配置数据库** - 启动PostgreSQL容器
6. **[6/9] 配置后端服务** - 安装依赖、运行迁移、启动服务
7. **[7/9] 配置前端服务** - 构建React应用、启动服务
8. **[8/9] 配置Nginx** - 设置反向代理
9. **[9/9] 最终验证** - 健康检查和功能验证

### 修复流程

如果在任何步骤遇到问题，脚本会：

1. **自动重试**：重要操作（如数据库迁移）有3次重试机会
2. **智能修复**：运行 `fix-production-database.js` 修复数据库问题
3. **基础恢复**：如果修复失败，创建基础表结构确保系统可运行
4. **详细指导**：显示故障排除指南帮助手动解决问题

## 🔍 故障排除

### 常见问题和解决方案

#### 1. 数据库迁移失败

**现象**：看到 `resume_data` 字段不存在的错误

**解决**：
```bash
# 方法1：使用修复模式
sudo bash deploy.sh --mode=fix

# 方法2：仅修复数据库
sudo bash deploy.sh --db-fix-only

# 方法3：清理重新部署
sudo bash deploy.sh --mode=cleanup
sudo bash deploy.sh
```

#### 2. 端口被占用

**现象**：服务无法启动，提示端口已被占用

**解决**：脚本会自动检测并分配可用端口，无需手动处理

#### 3. 系统资源不足

**现象**：部署过程中出现内存或磁盘空间警告

**解决**：
- 清理系统空间：`sudo apt autoremove && sudo apt autoclean`
- 检查Docker容器：`docker system prune -f`

#### 4. 网络问题

**现象**：下载依赖失败

**解决**：
```bash
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com/
sudo bash deploy.sh
```

### 日志查看

```bash
# 查看部署日志
tail -f /var/log/resume-deploy.log

# 查看错误日志
tail -f /var/log/resume-deploy-error.log

# 查看应用日志
pm2 logs
```

## 📊 部署后验证

### 系统状态检查

```bash
# 查看所有服务状态
pm2 list

# 查看端口监听状态
netstat -tlnp | grep -E ":(3016|8000|5432)"

# 查看Docker容器
docker ps
```

### 功能测试

1. **访问前端**：http://cv.juncaishe.com
2. **API健康检查**：http://cv.juncaishe.com/health
3. **简历上传测试**：登录后上传简历文件

### 测试账号

- **邮箱**：test@juncaishe.com
- **密码**：test123456

## 🎯 性能优化建议

### 快速重复部署

如果需要频繁部署（如开发测试），推荐使用：

```bash
# 第一次完整部署
sudo bash deploy.sh

# 后续快速部署
sudo bash deploy.sh --mode=quick
```

### 生产环境部署

生产环境推荐使用标准模式，确保所有检查都通过：

```bash
sudo bash deploy.sh
```

## 📝 版本信息

- **脚本版本**：v1.6.0
- **最后更新**：2025-01-07
- **兼容性**：Ubuntu 18.04+, CentOS 7+

## 🆘 获取帮助

```bash
# 查看帮助信息
sudo bash deploy.sh --help

# 查看脚本版本和状态
sudo bash deploy.sh | head -10
```

---

**重要提示**：
- 始终使用 `sudo` 权限运行脚本
- 确保服务器有足够的内存（≥2GB）和磁盘空间（≥10GB）
- 首次部署建议使用标准模式，后续可使用快速模式 