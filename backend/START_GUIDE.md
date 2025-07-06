# 🚀 Resume Backend 启动与监控指南

## 快速启动

### 开发环境启动

```bash
# 1. 传统方式启动（适合开发调试）
npm start

# 2. 自动重载启动（开发时推荐）
npm run dev

# 3. PM2管理启动（生产级别）
npm run start:dev
```

### 生产环境启动

```bash
# 使用PM2启动生产环境
npm run start:prod

# 设置开机自启动
npm run startup
npm run save
```

## 🔧 PM2 管理命令

### 基本操作

```bash
# 查看状态
npm run status

# 查看日志
npm run logs

# 查看错误日志
npm run logs:error

# 查看输出日志
npm run logs:out

# 重启服务
npm run restart

# 重载服务（零停机）
npm run reload

# 停止服务
npm run stop

# 删除服务
npm run delete
```

### 监控和调试

```bash
# 实时监控
npm run monit

# 健康检查（单次）
npm run health

# 持续健康监控
npm run health:monitor
```

## 📊 健康检查系统

### 自动监控功能

- **检查间隔**: 30秒
- **失败阈值**: 连续3次失败触发恢复
- **监控端点**:
  - `/api/health` - 基础健康检查
  - `/api/v2/tasks/test/status` - API功能检查

### 自动恢复机制

1. **检测服务异常** - 连续失败超过阈值
2. **尝试PM2重启** - 优先使用PM2管理
3. **直接进程启动** - PM2失败时的备用方案
4. **验证恢复** - 自动重新检查服务状态

### 手动健康检查

```bash
# 执行单次健康检查
npm run health

# 启动持续监控（推荐在生产环境后台运行）
npm run health:monitor &
```

## 🗂️ 日志管理

### 日志文件位置

```
backend/logs/
├── pm2-combined.log    # 合并日志
├── pm2-out.log        # 标准输出日志
├── pm2-error.log      # 错误日志
└── pm2.pid           # 进程ID文件
```

### 查看日志

```bash
# 实时查看所有日志
npm run logs

# 只查看错误日志
npm run logs:error

# 直接查看日志文件
tail -f logs/pm2-combined.log
```

## 🛠️ 故障排除

### 常见问题

1. **端口占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :8000
   
   # 杀死占用进程
   kill -9 <PID>
   ```

2. **PM2服务未启动**
   ```bash
   # 重新启动PM2服务
   npm run start:dev
   ```

3. **健康检查失败**
   ```bash
   # 手动检查服务状态
   curl http://localhost:8000/api/health
   
   # 查看详细错误日志
   npm run logs:error
   ```

4. **数据库连接问题**
   ```bash
   # 检查环境变量
   cat .env
   
   # 测试数据库连接
   npm run migrate:status
   ```

### 紧急恢复步骤

如果服务完全无响应：

```bash
# 1. 停止所有相关进程
npm run stop
pm2 delete all

# 2. 清理端口
lsof -ti:8000 | xargs kill -9

# 3. 重新启动
npm run start:dev

# 4. 验证服务
npm run health
```

## 📋 最佳实践

### 生产环境部署

1. **使用PM2管理**
   ```bash
   npm run start:prod
   npm run save
   ```

2. **设置开机自启**
   ```bash
   npm run startup
   # 按提示执行显示的命令
   ```

3. **启用健康监控**
   ```bash
   # 在后台运行健康监控
   nohup npm run health:monitor > /dev/null 2>&1 &
   ```

4. **定期备份配置**
   ```bash
   npm run save  # 保存PM2配置
   ```

### 监控建议

- 生产环境建议运行 `npm run health:monitor` 进行持续监控
- 定期检查日志文件大小，必要时进行日志轮转
- 监控服务器资源使用情况（内存、CPU）
- 设置告警机制，在服务异常时及时通知

### 性能优化

- 根据负载调整 `max_memory_restart` 设置
- 监控重启次数，频繁重启可能表明存在内存泄漏
- 使用 `npm run monit` 实时查看性能指标

## 🔗 相关资源

- [PM2 官方文档](https://pm2.keymetrics.io/)
- [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [健康检查脚本源码](./scripts/health-check.js)
- [PM2 配置文件](./ecosystem.config.js)

---

## 📞 支持

如果遇到问题，请按以下顺序排查：

1. 查看健康检查结果：`npm run health`
2. 检查服务状态：`npm run status`
3. 查看错误日志：`npm run logs:error`
4. 按照故障排除步骤操作
5. 如仍无法解决，请联系技术支持并提供日志信息 