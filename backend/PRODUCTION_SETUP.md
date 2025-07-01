# 生产环境部署指南

## 🚀 快速解决管理员登录问题

如果您在生产环境中遇到"管理员账号不存在"的问题，请按以下步骤操作：

### 1. 检查当前环境

```bash
# 在您的服务器上，进入项目目录
cd /path/to/your/resume/backend

# 检查环境设置
echo "NODE_ENV: $NODE_ENV"
```

### 2. 设置生产环境变量

确保设置了以下环境变量（在 `.env` 文件或系统环境中）：

```bash
# 数据库配置
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password

# JWT密钥
JWT_SECRET=your-secret-key

# 环境标识
NODE_ENV=production
```

### 3. 运行管理员初始化脚本

```bash
# 方法1：使用我们提供的生产环境脚本
NODE_ENV=production node scripts/production-init.js

# 方法2：如果上面不行，使用基础脚本
node scripts/init-admin.js
```

### 4. 验证管理员账号

脚本执行成功后，您应该看到：

```
✅ [MAIN] 管理员账号初始化完成！
📝 [MAIN] 登录信息:
   邮箱: admin@example.com
   密码: admin123456
```

### 5. 测试登录

使用以下凭据登录管理后台：
- **邮箱**: `admin@example.com`
- **密码**: `admin123456`

## 🔧 故障排除

### 问题1: 数据库连接失败

如果看到数据库连接错误：

1. 检查数据库服务是否运行
2. 验证数据库连接参数
3. 确认数据库用户权限
4. 检查防火墙设置

```bash
# 测试数据库连接
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;"
```

### 问题2: 表不存在

如果提示表不存在，需要运行数据库迁移：

```bash
# 运行数据库迁移
NODE_ENV=production npx knex migrate:latest
```

### 问题3: 环境变量未设置

创建 `.env` 文件：

```bash
# 在backend目录下创建.env文件
cat > .env << EOF
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resume_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
EOF
```

### 问题4: 权限不足

确保应用有数据库写入权限：

```sql
-- 在PostgreSQL中授权
GRANT ALL PRIVILEGES ON DATABASE resume_db TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

## 📋 完整部署检查清单

### 数据库设置
- [ ] PostgreSQL服务正在运行
- [ ] 数据库已创建
- [ ] 用户权限已配置
- [ ] 网络连接正常

### 环境配置
- [ ] NODE_ENV=production
- [ ] 数据库连接参数正确
- [ ] JWT_SECRET已设置
- [ ] 其他必要环境变量已配置

### 应用初始化
- [ ] 数据库迁移已运行
- [ ] 管理员账号已创建
- [ ] 管理员登录测试通过

### 安全设置
- [ ] 默认密码已修改
- [ ] HTTPS已启用
- [ ] 防火墙已配置
- [ ] 定期备份已设置

## 🌐 管理后台访问

### 本地开发
```
http://localhost:3016/admin
```

### 生产环境
```
https://your-domain.com/admin
```

## 🔒 安全建议

1. **立即修改默认密码**
   - 首次登录后立即修改管理员密码

2. **使用强密码**
   - 至少12位字符
   - 包含大小写字母、数字和特殊字符

3. **启用HTTPS**
   - 生产环境必须使用HTTPS
   - 配置SSL证书

4. **定期备份**
   - 设置数据库自动备份
   - 测试备份恢复流程

5. **监控访问**
   - 监控管理后台访问日志
   - 设置异常访问告警

## 📞 获取帮助

如果仍然遇到问题，请检查：

1. **应用日志**
   ```bash
   # 查看应用日志
   tail -f /path/to/your/logs/app.log
   ```

2. **数据库日志**
   ```bash
   # 查看PostgreSQL日志
   tail -f /var/log/postgresql/postgresql.log
   ```

3. **系统资源**
   ```bash
   # 检查系统资源
   free -h
   df -h
   ```

---

💡 **提示**: 保存好管理员凭据，并在首次登录后立即修改密码以确保安全。 