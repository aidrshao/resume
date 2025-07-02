# AI俊才社简历系统 - 备份系统使用指南

## 📋 概述

本备份系统为AI俊才社简历系统提供企业级的数据保护方案，确保在重新部署或系统故障时数据不会丢失。

## 🔧 备份系统组件

### 1. 核心脚本
- `backup_system.sh` - 主备份脚本（企业级功能）
- `quick_backup.sh` - 快速备份脚本（部署前使用）
- `restore_data.sh` - 数据恢复脚本
- `backup_test.sh` - 备份系统测试脚本

### 2. 配置文件
- `backup_config.conf` - 备份系统配置
- `/etc/cron.d/resume-backup` - 自动备份计划

### 3. 存储目录
- `/var/backups/resume-system/` - 主备份目录（不会被部署覆盖）
- `/var/backups/resume-system-emergency/` - 紧急备份目录
- `/var/log/resume-backup/` - 备份日志目录

## 🚀 快速开始

### 部署备份系统
```bash
# 完整部署（包含备份系统）
sudo ./deploy.sh

# 或单独部署备份系统
sudo ./backup_system.sh setup
```

### 立即备份
```bash
# 快速备份（推荐在部署前使用）
sudo ./quick_backup.sh backup

# 完整备份
sudo ./backup_system.sh backup daily
```

### 恢复数据
```bash
# 交互式恢复（推荐）
sudo ./restore_data.sh interactive

# 自动恢复最新备份
sudo ./restore_data.sh auto-latest
```

## 📅 自动备份计划

系统会自动执行以下备份：

| 备份类型 | 执行时间 | 保留时间 | 说明 |
|---------|---------|---------|------|
| 日备份 | 每日凌晨2点 | 30天 | 增量备份，快速恢复 |
| 周备份 | 周日凌晨3点 | 12周 | 完整备份，中期保护 |
| 月备份 | 每月1号凌晨4点 | 12个月 | 归档备份，长期保存 |
| 年备份 | 每年1月1日凌晨5点 | 3年 | 历史备份，合规要求 |

## 🔍 备份内容

### 数据库备份
- 用户数据（users表）
- 简历数据（resumes表）
- 用户信息（user_infos表）
- 所有相关表和索引
- 数据库结构和约束

### 文件备份
- 上传的简历文件（PDF、DOC等）
- 用户头像图片
- 系统配置文件
- 重要日志文件

### 配置备份
- 环境变量文件（.env）
- Nginx配置
- PM2配置
- 数据库配置

## 📖 详细使用说明

### 1. 备份操作

#### 快速备份（部署前推荐）
```bash
# 执行快速备份
sudo ./quick_backup.sh backup

# 查看备份文件
sudo ./quick_backup.sh list

# 验证备份完整性
sudo ./quick_backup.sh verify
```

#### 完整备份
```bash
# 日备份
sudo ./backup_system.sh backup daily

# 周备份
sudo ./backup_system.sh backup weekly

# 月备份
sudo ./backup_system.sh backup monthly

# 年备份
sudo ./backup_system.sh backup yearly
```

#### 高级备份选项
```bash
# 带压缩的备份
sudo ./backup_system.sh backup daily --compress

# 带加密的备份
sudo ./backup_system.sh backup daily --encrypt

# 备份到远程服务器
sudo ./backup_system.sh backup daily --remote

# 仅备份数据库
sudo ./backup_system.sh backup database

# 仅备份文件
sudo ./backup_system.sh backup files
```

### 2. 恢复操作

#### 交互式恢复（推荐新手）
```bash
sudo ./restore_data.sh interactive
```

#### 命令行恢复
```bash
# 恢复数据库
sudo ./restore_data.sh database /var/backups/resume-system/daily/database_backup_20250101_020000.sql.gz

# 恢复上传文件
sudo ./restore_data.sh uploads /var/backups/resume-system/daily/uploads_backup_20250101_020000.tar.gz

# 恢复配置文件
sudo ./restore_data.sh config /var/backups/resume-system/daily/config_backup_20250101_020000.tar.gz

# 完整恢复最新备份
sudo ./restore_data.sh auto-latest
```

### 3. 备份管理

#### 查看备份状态
```bash
# 列出所有备份
sudo ./backup_system.sh list

# 查看备份统计
sudo ./backup_system.sh status

# 验证备份完整性
sudo ./backup_system.sh verify /var/backups/resume-system/daily/backup_20250101_020000.tar.gz
```

#### 清理备份
```bash
# 按策略清理过期备份
sudo ./backup_system.sh cleanup

# 强制清理所有备份
sudo ./backup_system.sh cleanup --force

# 清理指定类型的备份
sudo ./backup_system.sh cleanup daily
```

### 4. 监控和日志

#### 查看备份日志
```bash
# 查看最新日志
sudo tail -f /var/log/resume-backup/backup.log

# 查看错误日志
sudo grep "ERROR" /var/log/resume-backup/backup.log

# 查看特定日期的日志
sudo grep "2025-01-01" /var/log/resume-backup/backup.log
```

#### 监控备份状态
```bash
# 检查备份服务状态
sudo systemctl status cron

# 查看定时任务
sudo crontab -l

# 测试备份系统
sudo ./backup_test.sh
```

## ⚙️ 配置说明

### 修改备份配置
编辑配置文件：
```bash
sudo nano /var/backups/resume-system/backup_config.conf
```

主要配置项：
```bash
# 备份保留策略
BACKUP_RETENTION_DAYS=30
WEEKLY_RETENTION_WEEKS=12
MONTHLY_RETENTION_MONTHS=12
YEARLY_RETENTION_YEARS=3

# 压缩和加密
COMPRESSION_LEVEL=9
ENCRYPTION_ENABLED=true

# 远程备份
REMOTE_BACKUP_ENABLED=false
REMOTE_HOST="backup.example.com"
REMOTE_USER="backup"
REMOTE_PATH="/backups/resume-system"

# 通知设置
NOTIFICATION_ENABLED=true
NOTIFICATION_EMAIL="admin@juncaishe.com"
```

### 修改备份计划
编辑定时任务：
```bash
sudo nano /etc/cron.d/resume-backup
```

## 🚨 紧急恢复场景

### 场景1：部署失败，需要回滚数据
```bash
# 1. 停止服务
sudo pm2 stop all
sudo docker stop resume-postgres

# 2. 恢复最新备份
sudo ./restore_data.sh auto-latest

# 3. 重启服务
sudo ./deploy.sh --mode=quick
```

### 场景2：数据库损坏
```bash
# 1. 查看可用备份
sudo ./restore_data.sh list

# 2. 选择合适的备份进行恢复
sudo ./restore_data.sh database /var/backups/resume-system/daily/database_backup_YYYYMMDD_HHMMSS.sql.gz

# 3. 验证恢复结果
sudo ./restore_data.sh verify
```

### 场景3：文件丢失
```bash
# 1. 恢复上传文件
sudo ./restore_data.sh uploads /var/backups/resume-system/daily/uploads_backup_YYYYMMDD_HHMMSS.tar.gz

# 2. 设置正确权限
sudo chown -R www-data:www-data /home/ubuntu/resume/backend/uploads
sudo chmod -R 755 /home/ubuntu/resume/backend/uploads
```

## 🔐 安全最佳实践

### 1. 备份加密
```bash
# 启用GPG加密
sudo gpg --gen-key
sudo gpg --export-secret-keys > /root/.gnupg/backup_key.asc

# 配置加密
echo "ENCRYPTION_ENABLED=true" >> /var/backups/resume-system/backup_config.conf
echo "GPG_RECIPIENT=backup@juncaishe.com" >> /var/backups/resume-system/backup_config.conf
```

### 2. 远程备份
```bash
# 配置SSH密钥
ssh-keygen -t rsa -b 4096 -f /root/.ssh/backup_key
ssh-copy-id -i /root/.ssh/backup_key.pub backup@remote-server

# 启用远程备份
echo "REMOTE_BACKUP_ENABLED=true" >> /var/backups/resume-system/backup_config.conf
echo "REMOTE_HOST=backup.example.com" >> /var/backups/resume-system/backup_config.conf
echo "REMOTE_SSH_KEY=/root/.ssh/backup_key" >> /var/backups/resume-system/backup_config.conf
```

### 3. 备份验证
```bash
# 定期验证备份完整性
sudo ./backup_system.sh verify-all

# 设置验证计划
echo "0 6 * * * root /var/backups/resume-system/backup_system.sh verify-all" >> /etc/cron.d/resume-backup
```

## 📊 监控和告警

### 备份监控脚本
```bash
#!/bin/bash
# 检查备份状态
latest_backup=$(find /var/backups/resume-system -name "*.sql.gz" -mtime -1 | wc -l)
if [ $latest_backup -eq 0 ]; then
    echo "警告：24小时内无新备份" | mail -s "备份告警" admin@juncaishe.com
fi
```

### 集成监控系统
- Zabbix监控配置
- Prometheus指标收集
- Grafana仪表板显示
- 钉钉/企业微信告警

## ❓ 常见问题

### Q1: 备份失败怎么办？
```bash
# 检查日志
sudo tail -50 /var/log/resume-backup/backup.log

# 检查磁盘空间
df -h /var/backups

# 检查数据库连接
sudo docker exec resume-postgres psql -U resume_user -d resume_db -c "SELECT 1;"

# 手动重试备份
sudo ./backup_system.sh backup daily --verbose
```

### Q2: 恢复后数据不完整？
```bash
# 验证备份文件
sudo ./backup_system.sh verify /path/to/backup.tar.gz

# 检查恢复日志
sudo tail -50 /var/log/restore_data.log

# 尝试其他备份文件
sudo ./restore_data.sh list
```

### Q3: 自动备份没有执行？
```bash
# 检查cron服务
sudo systemctl status cron

# 查看cron日志
sudo tail -f /var/log/cron

# 检查定时任务
sudo cat /etc/cron.d/resume-backup

# 手动执行测试
sudo ./backup_system.sh backup daily
```

### Q4: 备份文件太大？
```bash
# 启用高压缩
echo "COMPRESSION_LEVEL=9" >> /var/backups/resume-system/backup_config.conf

# 排除不必要的文件
echo "EXCLUDE_PATTERNS=\"*.log *.tmp node_modules\"" >> /var/backups/resume-system/backup_config.conf

# 启用增量备份
echo "INCREMENTAL_BACKUP=true" >> /var/backups/resume-system/backup_config.conf
```

## 📞 技术支持

如遇到备份系统相关问题，请：

1. 查看日志文件：`/var/log/resume-backup/backup.log`
2. 运行诊断脚本：`sudo ./backup_test.sh`
3. 联系技术支持：admin@juncaishe.com

## 📝 更新日志

### v1.0.0 (2025-01-01)
- 初始版本发布
- 支持数据库、文件、配置备份
- 自动化备份计划
- 交互式恢复功能
- 企业级安全特性

---

**重要提醒**：定期测试备份恢复功能，确保在真正需要时能够成功恢复数据！ 