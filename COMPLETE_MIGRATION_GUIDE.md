# 完整数据迁移指南

本指南提供了将现有简历数据转换为统一格式的完整解决方案。

## 📋 目录

1. [迁移概述](#迁移概述)
2. [迁移前准备](#迁移前准备)
3. [数据转换规则](#数据转换规则)
4. [使用方法](#使用方法)
5. [生产环境部署](#生产环境部署)
6. [故障排除](#故障排除)

## 🎯 迁移概述

### 目的
将现有的各种格式的简历数据统一转换为标准化的数据结构，提高数据一致性和系统可维护性。

### 核心功能
- **自动数据转换**: 将旧格式数据转换为统一的新格式
- **数据验证**: 确保转换后的数据符合新的数据规范
- **备份机制**: 迁移前自动创建数据备份
- **进度监控**: 实时显示迁移进度和状态
- **错误处理**: 完善的错误处理和回滚机制
- **详细报告**: 生成完整的迁移报告

## 🚀 迁移前准备

### 1. 环境检查
```bash
# 确保数据库连接正常
npm run migrate:status

# 检查Node.js版本 (建议>=14.0)
node --version

# 检查依赖是否安装完整
npm install
```

### 2. 数据库备份
```bash
# 创建数据库备份（推荐）
pg_dump -h localhost -U your_username -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3. 运行迁移测试
```bash
# 测试迁移脚本功能
npm run migrate:complete:test
```

## 📊 数据转换规则

### 统一数据格式 (UNIFIED_RESUME_SCHEMA)

```javascript
{
  profile: {
    name: "姓名",
    email: "邮箱",
    phone: "电话",
    location: "地址",
    portfolio: "作品集",
    linkedin: "LinkedIn",
    summary: "个人简介"
  },
  workExperience: [
    {
      company: "公司名称",
      position: "职位",
      duration: "任职时间",
      description: "工作描述"
    }
  ],
  projectExperience: [
    {
      name: "项目名称",
      role: "担任角色",
      duration: "项目时间",
      description: "项目描述",
      url: "项目链接"
    }
  ],
  education: [
    {
      school: "学校名称",
      degree: "学位",
      major: "专业",
      duration: "就读时间"
    }
  ],
  skills: [
    {
      category: "技能分类",
      details: "技能详情"
    }
  ],
  customSections: [
    {
      title: "自定义标题",
      content: "自定义内容"
    }
  ]
}
```

### 字段映射规则

| 旧字段名 | 新字段名 | 备注 |
|---------|---------|------|
| `personalInfo.name` | `profile.name` | 个人信息统一到profile |
| `workExperiences` | `workExperience` | 工作经历统一格式 |
| `personalInfo.email` | `profile.email` | 邮箱信息 |
| `skills` (array) | `skills` (categorized) | 技能分类化 |
| `awards` | `customSections` | 获奖经历作为自定义区块 |

## 🛠️ 使用方法

### 方法一：直接运行迁移（推荐）

```bash
# 运行完整数据迁移
npm run migrate:complete

# 或使用简化命令（用于deploy.sh）
npm run migrate:complete:run
```

### 方法二：分步执行

```bash
# 1. 先运行数据库结构迁移
npm run migrate

# 2. 再运行数据格式迁移
node backend/scripts/complete-data-migration.js
```

### 方法三：测试模式

```bash
# 仅测试，不执行实际迁移
npm run migrate:complete:test
```

## 🚀 生产环境部署

### 在deploy.sh中的集成

在您的`deploy.sh`脚本中添加以下内容：

```bash
#!/bin/bash

echo "🚀 开始生产环境部署..."

# ... 其他部署步骤 ...

# 数据库迁移
echo "📊 运行数据库迁移..."
cd backend
npm run migrate

# 数据格式迁移
echo "🔄 运行数据格式迁移..."
npm run migrate:complete:run

# 检查迁移结果
if [ $? -eq 0 ]; then
    echo "✅ 数据迁移完成"
else
    echo "❌ 数据迁移失败，终止部署"
    exit 1
fi

# ... 其他部署步骤 ...

echo "🎉 部署完成"
```

### 一键部署命令

```bash
# 完整的一键部署
./deploy.sh
```

## 📈 迁移流程详解

### 1. 准备阶段
- 检查数据库连接
- 验证表结构
- 创建数据备份

### 2. 数据获取
- 查找需要迁移的记录
- 按批次处理数据（每批50条）

### 3. 数据转换
- 使用`convertToUnifiedSchema`函数转换数据
- 处理字段映射和数据结构调整
- 验证转换结果

### 4. 数据更新
- 更新`unified_data`字段
- 设置`schema_version`为2.1
- 更新`updated_at`时间戳

### 5. 验证和报告
- 验证迁移结果
- 生成详细报告
- 保存日志文件

## 🔧 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
错误: 数据库连接失败: connect ECONNREFUSED
解决: 检查数据库是否启动，确认连接参数正确
```

#### 2. 表结构不存在
```bash
错误: 表结构检查失败: unified_data字段不存在
解决: 运行 npm run migrate 创建必要的表结构
```

#### 3. 数据转换失败
```bash
错误: 数据验证失败: profile字段缺失或格式错误
解决: 检查原始数据格式，可能需要手动修复数据
```

#### 4. 权限不足
```bash
错误: 权限不足，无法创建备份表
解决: 确保数据库用户有足够的权限
```

### 调试方法

#### 1. 启用详细日志
迁移脚本会自动输出详细日志，包括：
- 每条记录的处理状态
- 数据转换过程
- 错误详情和堆栈

#### 2. 检查迁移报告
迁移完成后会生成JSON格式的详细报告：
```
backend/logs/migration-report-YYYY-MM-DD-HH-MM-SS.json
```

#### 3. 手动验证数据
```sql
-- 检查迁移后的数据
SELECT id, schema_version, 
       CASE 
         WHEN unified_data IS NULL THEN '无数据'
         WHEN unified_data::text = '{}' THEN '空对象'
         ELSE '有数据'
       END as data_status
FROM resumes 
ORDER BY updated_at DESC 
LIMIT 10;
```

## 📋 迁移检查清单

### 迁移前
- [ ] 数据库备份已创建
- [ ] 测试脚本运行通过
- [ ] 确认有足够的磁盘空间
- [ ] 通知相关人员维护时间

### 迁移中
- [ ] 监控迁移进度
- [ ] 检查错误日志
- [ ] 确保服务器稳定运行

### 迁移后
- [ ] 验证数据完整性
- [ ] 检查应用功能
- [ ] 清理备份数据（如需要）
- [ ] 更新文档

## 🎯 性能优化建议

### 大数据量处理
- 迁移脚本支持分批处理（默认50条/批）
- 批次间有100ms间隔避免数据库压力
- 可根据服务器性能调整批次大小

### 内存优化
- 避免一次性加载大量数据
- 及时释放不需要的对象引用
- 监控内存使用情况

## 📞 技术支持

如果在迁移过程中遇到问题，请：

1. 查看迁移日志文件
2. 运行测试脚本诊断问题
3. 检查数据库连接和权限
4. 联系技术团队寻求支持

---

**重要提醒**: 在生产环境执行迁移前，请务必在测试环境验证迁移脚本的正确性。 