# 生产环境简历上传功能修复指南

## 问题描述

在生产环境中，简历上传功能出现了数据库字段错误：

```
column "resume_data" of relation "resumes" does not exist
```

## 问题根因

1. **数据库迁移问题**：生产环境的数据库结构与最新代码不一致
2. **字段名称不匹配**：代码中使用的字段名与数据库实际字段名不一致
3. **迁移脚本未正确执行**：统一schema迁移没有在生产环境中正确执行

## 解决方案

### 🔧 已修复的代码问题

1. **backend/services/resumeParseService.js**
   - 将 `resume_data` 字段修改为 `unified_data`
   - 确保数据格式统一

2. **backend/controllers/resumeController.js**
   - 将 `resume_data` 字段修改为 `unified_data`
   - 更新所有相关的保存逻辑

### 🚀 快速修复方法

#### 方法1：使用优化版部署脚本

```bash
# 下载最新代码并运行优化版部署脚本
cd /home/ubuntu/resume
git pull origin main
sudo bash deploy_standalone.sh
```

#### 方法2：仅修复数据库问题

```bash
# 如果只需要修复数据库问题
sudo bash deploy_standalone.sh --db-fix-only
```

#### 方法3：手动修复步骤

1. **更新代码**：
   ```bash
   cd /home/ubuntu/resume
   git pull origin main
   ```

2. **运行数据库修复脚本**：
   ```bash
   cd /home/ubuntu/resume/backend
   node scripts/fix-production-database.js
   ```

3. **重启后端服务**：
   ```bash
   pm2 restart resume-backend
   ```

### 📋 数据库修复脚本功能

`fix-production-database.js` 脚本会：

1. **检查字段状态**：
   - 检查 `resume_data` 字段是否存在
   - 检查 `unified_data` 字段是否存在
   - 检查 `schema_version` 字段是否存在

2. **添加缺失字段**：
   - 如果缺少 `unified_data` 字段，则添加
   - 如果缺少 `schema_version` 字段，则添加

3. **数据迁移**：
   - 将 `resume_data` 中的数据迁移到 `unified_data`
   - 确保数据格式正确

4. **清理旧字段**：
   - 在确认数据迁移完成后，删除 `resume_data` 字段

### 🔍 验证修复结果

1. **检查数据库字段**：
   ```bash
   cd /home/ubuntu/resume/backend
   node -e "
   const knex = require('./config/database');
   knex.raw('SELECT column_name FROM information_schema.columns WHERE table_name = \\'resumes\\' AND column_name IN (\\'resume_data\\', \\'unified_data\\')').then(result => {
     console.log('字段检查结果:', result.rows);
     process.exit(0);
   });
   "
   ```

2. **测试简历上传**：
   - 访问 http://cv.juncaishe.com
   - 登录后尝试上传简历
   - 确认没有出现数据库错误

3. **检查日志**：
   ```bash
   pm2 logs resume-backend
   ```

### 🛠️ 优化版部署脚本特性

新的 `deploy_standalone.sh` 脚本包含以下改进：

1. **智能错误处理**：
   - 自动检测和修复数据库问题
   - 智能端口分配避免冲突
   - 详细的错误日志记录

2. **灵活的部署选项**：
   ```bash
   # 完整部署
   sudo bash deploy_standalone.sh
   
   # 仅修复数据库
   sudo bash deploy_standalone.sh --db-fix-only
   
   # 仅重新配置Nginx
   sudo bash deploy_standalone.sh --nginx-only
   
   # 跳过数据库迁移
   sudo bash deploy_standalone.sh --no-migration
   ```

3. **详细的验证步骤**：
   - 服务状态检查
   - 端口监听检查
   - 健康检查
   - 功能验证

### 📝 注意事项

1. **备份数据**：在执行修复前，建议备份数据库
2. **测试环境**：如果可能，先在测试环境中验证修复效果
3. **监控日志**：修复后密切监控应用日志
4. **用户通知**：可能需要通知用户重新上传简历

### 🆘 紧急联系

如果修复过程中遇到问题，请：

1. 查看详细日志：`/var/log/resume-deploy.log`
2. 查看错误日志：`/var/log/resume-deploy-error.log`
3. 查看应用日志：`pm2 logs resume-backend`

### 🔮 后续优化建议

1. **添加数据库监控**：实时监控数据库结构变化
2. **完善测试流程**：在部署前进行充分的测试
3. **自动化部署**：考虑使用CI/CD流程
4. **备份策略**：定期备份数据库和配置文件

---

**最后更新时间**：2025-01-07
**适用版本**：v2.1+ 