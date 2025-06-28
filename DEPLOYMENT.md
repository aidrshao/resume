# AI俊才社简历系统 - 部署指南

## 🚀 自动部署

### 1. GitHub Secrets配置

在GitHub仓库中配置以下Secrets：

| Secret名称 | 值 | 说明 |
|-----------|---|------|
| `HOST` | `122.51.234.153` | 服务器IP地址 |
| `USERNAME` | `ubuntu` | SSH用户名 |
| `PRIVATE_KEY` | SSH私钥内容 | 从-----BEGIN开始的完整私钥 |

### 2. 自动部署触发

- **推送到main分支**：自动触发部署
- **手动触发**：在GitHub Actions页面手动运行workflow

### 3. 安全部署流程

1. ✅ 检出代码
2. ✅ 安装依赖并构建前端
3. ✅ 创建安全部署包
4. ✅ 上传到服务器
5. ✅ 执行安全部署脚本：
   - **🔍 预检系统环境（端口冲突检查、资源检查）**
   - **💾 自动备份现有应用和数据库**
   - **⏹️ 优雅停止现有服务**
   - **🐳 安全Docker容器管理（避免冲突）**
   - **📂 部署新代码**
   - **🚀 启动服务（PM2进程管理）**
   - **🌐 配置Nginx反向代理**
   - **🏥 健康检查**
   - **🔄 失败时自动回滚**

## 🌐 访问地址

部署完成后，可通过以下地址访问：

- **直接访问**：`http://122.51.234.153:3000`
- **Nginx代理**：`http://122.51.234.153:8080`

## 📊 服务管理

### PM2命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs resume-backend
pm2 logs resume-frontend

# 重启服务
pm2 restart resume-backend
pm2 restart resume-frontend

# 停止服务
pm2 stop resume-backend
pm2 stop resume-frontend
```

### Docker数据库管理

```bash
# 查看数据库容器状态
docker ps | grep resume-postgres

# 查看数据库日志
docker logs resume-postgres

# 连接到数据库
docker exec -it resume-postgres psql -U resume_user -d resume_db

# 重启数据库
docker restart resume-postgres
```

## 🛠️ 手动部署（备用方案）

如果自动部署失败，可以手动执行：

```bash
# 1. 登录服务器
ssh ubuntu@122.51.234.153

# 2. 克隆代码
git clone https://github.com/your-username/resume.git
cd resume

# 3. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 4. 构建前端
cd frontend && npm run build

# 5. 配置环境变量
cp backend/env.example backend/.env
# 编辑 .env 文件配置数据库和API密钥

# 6. 启动数据库
docker run -d \
  --name resume-postgres \
  --restart unless-stopped \
  -e POSTGRES_DB=resume_db \
  -e POSTGRES_USER=resume_user \
  -e POSTGRES_PASSWORD=resume_pass123 \
  -p 5432:5432 \
  -v resume_postgres_data:/var/lib/postgresql/data \
  postgres:15

# 7. 运行迁移
cd backend && npm run migrate

# 8. 启动服务
npm install -g pm2 serve
pm2 start server.js --name resume-backend --cwd /path/to/backend
pm2 start --name resume-frontend "serve -s /path/to/frontend/build -p 3000"
pm2 save
```

## 🔧 配置说明

### 环境变量

| 变量名 | 值 | 说明 |
|-------|---|------|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `8000` | 后端端口 |
| `DB_HOST` | `localhost` | 数据库主机 |
| `DB_PORT` | `5432` | 数据库端口 |
| `DB_NAME` | `resume_db` | 数据库名 |
| `DB_USER` | `resume_user` | 数据库用户 |
| `DB_PASS` | `resume_pass123` | 数据库密码 |
| `JWT_SECRET` | `your-secret-key` | JWT密钥 |
| `OPENAI_API_KEY` | `sk-xxx` | OpenAI API密钥 |
| `OPENAI_BASE_URL` | `https://api.agicto.cn/v1` | API代理地址 |

### 端口配置

- **前端**：3000（PM2服务）
- **后端**：8000（PM2服务）
- **数据库**：5432（Docker容器）
- **Nginx代理**：8080（可通过80/443端口反向代理）

### Nginx配置

如果需要通过80/443端口访问，在现有Nginx配置中添加：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🚨 故障排除

### 常见问题

1. **部署失败**：检查GitHub Secrets配置是否正确
2. **服务无法启动**：检查端口是否被占用
3. **数据库连接失败**：确认PostgreSQL容器是否正常运行
4. **API调用失败**：检查OpenAI API密钥是否有效

### 日志查看

```bash
# GitHub Actions日志
在GitHub仓库的Actions页面查看

# 服务器日志
pm2 logs
docker logs resume-postgres

# Nginx日志
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 🛡️ 安全特性

### 现有程序保护
- **端口冲突检测**：自动检查3000、8000、5432端口占用情况
- **优雅停止**：使用PM2优雅停止现有Node.js服务
- **备份机制**：部署前自动备份应用和数据库
- **回滚保护**：部署失败时自动恢复到上一版本

### Docker冲突避免
- **容器检查**：检测现有resume-postgres容器
- **数据保护**：保留现有数据卷，仅更新容器
- **数据库备份**：更新前自动备份数据库
- **唯一命名**：使用项目特定的容器名避免冲突

### SSL证书管理
- **自动检测**：检查现有SSL证书状态
- **智能申请**：域名解析验证后自动申请Let's Encrypt证书
- **自动续期**：设置crontab自动续期任务
- **配置更新**：自动更新Nginx SSL配置

### 系统资源检查
- **磁盘空间**：确保至少2GB可用空间
- **内存检查**：建议至少512MB可用内存
- **权限验证**：防止root用户部署
- **依赖检查**：自动安装缺失的系统依赖

## 📝 备注

- 确保服务器已安装Docker和Node.js（脚本会自动安装）
- 80/443端口被其他服务占用时，使用8080端口访问
- 定期备份数据库：`pg_dump -h localhost -U resume_user resume_db > backup.sql`
- SSL证书配置请参考：[SSL_SETUP.md](SSL_SETUP.md) 