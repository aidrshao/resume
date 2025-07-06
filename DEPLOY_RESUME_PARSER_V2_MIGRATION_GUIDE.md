# 简历解析模块v2.0数据库迁移部署指南

## 概述

本指南描述了针对简历解析模块重构（v2.0）对deploy.sh部署脚本的增强更新。主要解决了统一数据架构迁移和数据完整性保障问题。

## 更新版本

- 版本: v1.8.0-resume-parser-v2-migration-enhanced
- 更新日期: 2025-07-06
- 主要功能: 支持简历解析模块重构的数据库迁移

## 新增功能

### 1. 增强的数据库迁移系统

#### 新增命令选项
```bash
# 独立执行数据库迁移（简历解析模块重构专用）
sudo bash deploy.sh --migration-only

# 验证数据库迁移状态和数据完整性
sudo bash deploy.sh --verify-migration

# 仅创建数据库备份
sudo bash deploy.sh --db-backup-only
```

#### 迁移流程增强
- **自动备份**: 迁移前自动创建数据备份
- **多步验证**: 分步骤执行迁移并验证每个步骤
- **智能回滚**: 迁移失败时自动回滚到备份状态
- **完整性检查**: 迁移后验证数据完整性

### 2. 统一数据架构支持

#### 新的表结构
```sql
-- 新增字段
ALTER TABLE resumes ADD COLUMN unified_data JSONB;
ALTER TABLE resumes ADD COLUMN schema_version VARCHAR(10) DEFAULT '2.1';

-- 数据转换
UPDATE resumes SET unified_data = resume_data::jsonb WHERE resume_data IS NOT NULL;
UPDATE resumes SET schema_version = '2.1';
```

#### 数据迁移流程
1. **备份原始数据**: 自动创建迁移前备份
2. **结构验证**: 检查表结构完整性
3. **数据转换**: 将旧格式数据转换为统一格式
4. **完整性验证**: 验证转换结果
5. **清理备份**: 成功后清理临时备份

### 3. 故障排除增强

#### 新增诊断命令
```bash
# 检查统一数据架构
docker exec resume-postgres psql -U resume_user -d resume_db -c "
SELECT 
    COUNT(*) as total_resumes,
    COUNT(unified_data) as with_unified_data,
    COUNT(CASE WHEN schema_version='2.1' THEN 1 END) as correct_version 
FROM resumes;"

# 检查字段存在性
docker exec resume-postgres psql -U resume_user -d resume_db -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='resumes' 
AND column_name IN ('unified_data', 'schema_version');"
```

## 使用指南

### 生产环境部署

#### 推荐部署流程
```bash
# 1. 创建数据库备份
sudo bash deploy.sh --db-backup-only

# 2. 执行完整部署（包含迁移）
sudo bash deploy.sh

# 3. 验证迁移结果
sudo bash deploy.sh --verify-migration
```

#### 仅迁移模式（适用于已部署环境）
```bash
# 1. 备份数据
sudo bash deploy.sh --db-backup-only

# 2. 执行迁移
sudo bash deploy.sh --migration-only

# 3. 验证结果
sudo bash deploy.sh --verify-migration
```

### 故障处理

#### 迁移失败处理
```bash
# 1. 查看错误日志
tail -f /var/log/resume-deploy-error.log

# 2. 检查数据库状态
docker exec resume-postgres psql -U resume_user -d resume_db -c "SELECT COUNT(*) FROM resumes;"

# 3. 手动回滚（如果自动回滚失败）
ls -la /tmp/migration_backup_*
# 使用最新的备份目录进行手动恢复

# 4. 重新尝试迁移
sudo bash deploy.sh --migration-only
```

#### 数据完整性问题
```bash
# 检查迁移状态
sudo bash deploy.sh --verify-migration

# 如果发现问题，重新执行迁移
sudo bash deploy.sh --migration-only
```

## 技术细节

### 迁移步骤详解

#### 1. 备份阶段
- 使用`pg_dump`创建数据和结构备份
- 备份文件存储在`/tmp/migration_backup_时间戳/`
- 记录备份路径用于回滚

#### 2. 结构验证
- 检查`unified_data`和`schema_version`字段是否存在
- 验证字段类型（JSONB和VARCHAR）
- 确认表索引完整性

#### 3. 数据转换
- 将`resume_data`转换为`unified_data`（JSONB格式）
- 将`content`转换为`unified_data`（如果存在）
- 设置`schema_version`为'2.1'

#### 4. 完整性验证
- 统计迁移成功率
- 验证数据格式正确性
- 检查字段约束

#### 5. 清理阶段
- 删除临时备份文件
- 清理迁移锁定文件
- 更新部署状态

### 回滚机制

#### 自动回滚条件
- 结构验证失败
- 数据转换失败
- 完整性验证失败

#### 回滚流程
1. 停止当前迁移进程
2. 从备份恢复数据
3. 提供手动恢复指导
4. 记录回滚日志

## 兼容性说明

### 向后兼容
- 保留原`resume_data`字段（可选）
- 支持旧API格式
- 渐进式迁移策略

### 新功能支持
- 统一数据格式（unified_data）
- 版本控制（schema_version）
- 增强的数据验证

## 监控和日志

### 关键日志位置
- 部署日志: `/var/log/resume-deploy.log`
- 错误日志: `/var/log/resume-deploy-error.log`
- 迁移备份: `/tmp/migration_backup_*`

### 监控指标
- 迁移成功率
- 数据完整性百分比
- 迁移耗时
- 备份大小

## 最佳实践

### 生产环境
1. **始终先备份**: 使用`--db-backup-only`创建备份
2. **分步执行**: 使用`--migration-only`独立执行迁移
3. **验证结果**: 使用`--verify-migration`确认迁移成功
4. **监控日志**: 实时监控部署和错误日志

### 开发环境
1. **快速部署**: 直接使用`sudo bash deploy.sh`
2. **问题修复**: 使用`--smart-fix`智能修复
3. **状态诊断**: 使用`--diagnose`检查系统状态

## 常见问题

### Q: 迁移失败怎么办？
A: 脚本会自动尝试回滚，如果失败请查看`/tmp/migration_backup_*`目录手动恢复。

### Q: 如何确认迁移成功？
A: 运行`sudo bash deploy.sh --verify-migration`检查数据完整性。

### Q: 可以重复执行迁移吗？
A: 可以，脚本会检查已迁移的数据并跳过。

### Q: 迁移会影响现有服务吗？
A: 迁移过程中可能短暂影响服务，建议在维护窗口执行。

## 支持和维护

如遇到问题，请按以下顺序排查：

1. 查看部署日志: `tail -f /var/log/resume-deploy.log`
2. 执行系统诊断: `sudo bash deploy.sh --diagnose`
3. 尝试智能修复: `sudo bash deploy.sh --smart-fix`
4. 手动验证迁移: `sudo bash deploy.sh --verify-migration`

更多技术支持请参考项目README或联系开发团队。 