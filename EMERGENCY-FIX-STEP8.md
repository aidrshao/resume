# 🚨 紧急修复：第8步卡死问题解决方案

## 问题描述
部署脚本在第8步"启动PM2服务（增强版）"时卡死，通常卡在：
```
[8/10] 启动PM2服务（增强版）
▶ 启动PM2服务（增强版）
[INFO] 🧹 清理环境和释放磁盘空间...
[INFO] 清理旧备份目录...
[INFO] 清理Docker未使用资源...
[INFO] 🔄 彻底清理PM2进程...
```

## 🚀 立即解决方案

### 方案1：使用快速模式（推荐）
```bash
# 按 Ctrl+C 中断当前脚本
# 然后运行快速模式（跳过所有清理）
./deploy.sh --mode=quick
```

### 方案2：手动重启并跳过清理
```bash
# 如果第8步卡死，在另一个终端窗口执行：
cd /tmp
SKIP_CLEANUP=true ./deploy.sh --mode=fix
```

### 方案3：紧急手动启动服务
```bash
# 如果脚本完全卡死，手动启动服务：
cd /home/ubuntu/resume/backend
pm2 start server.js --name resume-backend

cd /home/ubuntu/resume/frontend  
pm2 serve build 3016 --name resume-frontend --spa

# 检查状态
pm2 list
```

## 📊 验证服务状态
```bash
# 检查PM2服务
pm2 list

# 检查端口监听
lsof -i :8000   # 后端
lsof -i :3016   # 前端

# 测试访问
curl http://localhost:8000/health
curl http://localhost:3016
```

## 🔧 v7.7版本修复说明

新版本已修复第8步卡死问题：
- ✅ 修复Docker清理超时问题
- ✅ 添加快速启动模式start_services_fast()
- ✅ 快速部署模式跳过所有清理操作
- ✅ 减少Docker清理超时时间到20秒
- ✅ 提供清理失败时的友好提示

## 📋 使用建议

**推荐命令顺序：**
1. ./deploy.sh --mode=quick （快速部署，跳过清理）
2. ./deploy.sh --mode=check （检查系统状态）
3. ./deploy.sh --mode=fix   （如有问题再修复）

**避免使用：**
- ./deploy.sh （完整模式包含清理，可能卡死）

## 🆘 紧急联系
如果问题仍然存在，可以：
1. 查看PM2日志：pm2 logs
2. 检查系统资源：htop 或 free -m
3. 重启系统：reboot（最后手段）
