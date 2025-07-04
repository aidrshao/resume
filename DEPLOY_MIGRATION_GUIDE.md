# 生产环境数据迁移部署指南

## 🚀 快速部署

### 一键部署命令

```bash
# 在deploy.sh中添加以下内容
cd backend
npm run migrate:existing
```

### 完整的deploy.sh示例

```bash
#!/bin/bash

echo "🚀 开始生产环境部署..."

# 检查环境
if [ ! -f .env ]; then
    echo "❌ .env文件不存在"
    exit 1
fi

# 进入后端目录
cd backend

# 安装依赖
echo "📦 安装依赖..."
npm install

# 运行数据迁移
echo "🔄 运行数据迁移..."
npm run migrate:existing

# 检查迁移结果
if [ $? -eq 0 ]; then
    echo "✅ 数据迁移完成"
else
    echo "❌ 数据迁移失败，终止部署"
    exit 1
fi

# 启动服务
echo "🚀 启动服务..."
npm start

echo "🎉 部署完成"
```

## 🎯 迁移完成验证

### 验证数据结构

```bash
# 检查迁移后的数据结构
node -e "
const knex = require('./config/database');
knex('resumes')
  .select('id', 'title')
  .limit(1)
  .then(records => {
    if (records.length > 0) {
      return knex('resumes')
        .where('id', records[0].id)
        .select('resume_data')
        .first();
    }
  })
  .then(record => {
    const data = JSON.parse(record.resume_data);
    console.log('✅ 数据结构验证:');
    console.log('- 原始数据:', !!data.original);
    console.log('- 统一格式:', !!data.unified);
    console.log('- 迁移元数据:', !!data.metadata);
    console.log('- 迁移状态:', data.metadata?.migrated || false);
    knex.destroy();
  })
  .catch(err => {
    console.error('❌ 验证失败:', err);
    knex.destroy();
  });
"
```

### 查看迁移报告

```bash
# 查看最新的迁移报告
ls -la backend/logs/existing-data-migration-report-*.json | tail -1
```

## 🔧 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查.env文件中的数据库配置
   - 确保数据库服务正在运行

2. **权限不足**
   - 确保数据库用户有读写权限
   - 检查resume_data字段是否存在

3. **迁移部分失败**
   - 查看详细的迁移报告
   - 可以重新运行迁移（支持重复运行）

### 回滚操作

如果需要回滚到迁移前的状态，可以使用原始数据：

```javascript
// 回滚脚本示例
const knex = require('./config/database');

async function rollback() {
  const records = await knex('resumes').select('id', 'resume_data');
  
  for (const record of records) {
    try {
      const data = JSON.parse(record.resume_data);
      if (data.original) {
        await knex('resumes')
          .where('id', record.id)
          .update({
            resume_data: JSON.stringify(data.original)
          });
      }
    } catch (error) {
      console.error(`回滚记录 ${record.id} 失败:`, error);
    }
  }
}
```

## 📋 部署检查清单

- [ ] 数据库备份已完成
- [ ] .env文件配置正确
- [ ] 依赖已安装
- [ ] 运行`npm run migrate:existing`
- [ ] 验证迁移结果
- [ ] 测试应用功能
- [ ] 记录迁移日志

## 🎉 成功指标

- 迁移成功率: 100%
- 所有记录都有统一格式数据
- 保留了原始数据
- 生成了详细的迁移报告 