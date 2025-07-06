# V2简历解析服务部署指南

## 🎉 功能完成概述

已成功创建了全新的V2版本简历解析服务，该服务完全独立于现有系统，提供高性能的异步简历解析功能。

### ✅ 已完成的组件

1. **新建API路由** (`backend/routes/v2/tasks.js`)
   - `POST /api/v2/resumes/parse` - 简历上传解析
   - `GET /api/v2/tasks/:taskId/status` - 任务状态查询
   - `GET /api/v2/tasks/:taskId/result` - 结果获取

2. **上传控制器** (`backend/controllers/v2/resumeParserController.js`)
   - 文件上传处理（PDF/Word/TXT）
   - 任务创建和队列管理
   - 错误处理和文件验证

3. **任务状态控制器** (`backend/controllers/v2/taskStatusController.js`)
   - 任务状态查询
   - 结果获取
   - 权限验证

4. **任务队列服务** (`backend/services/v2/taskQueueService.js`)
   - Redis队列管理
   - 内存队列备份
   - 任务状态跟踪

5. **任务处理器** (`backend/services/v2/resumeParseTaskHandler.js`)
   - 文本提取（PDF/Word/TXT）
   - AI解析集成
   - 数据转换
   - 结果存储

6. **路由集成** - 已在`server.js`中注册V2路由

7. **依赖更新** - 已添加`ioredis`依赖到`package.json`

8. **环境配置** - 已更新`env.example`添加Redis配置

## 🚀 快速部署步骤

### 1. 环境准备

确保您的系统已安装：
- Node.js (>= 16.0.0)
- PostgreSQL
- Redis (推荐，可选)

### 2. 依赖安装

依赖包已自动安装完成，包含：
- `ioredis` - Redis客户端
- `uuid` - 任务ID生成
- `pdf-parse` - PDF解析
- `mammoth` - Word文档解析

### 3. 环境变量配置

在`.env`文件中添加以下配置：

```bash
# Redis配置（推荐）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# AI API配置（必须）
DEEPSEEK_API_KEY=your-deepseek-api-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.agicto.cn/v1
```

### 4. Redis安装（可选但推荐）

**macOS**:
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Docker**:
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

> **注意**: 如果没有Redis，服务会自动使用内存队列，功能不受影响，但性能会有所降低。

### 5. 启动服务

```bash
cd backend
npm start
```

或开发模式：
```bash
npm run dev
```

### 6. 验证部署

检查服务健康状态：
```bash
curl http://localhost:8000/health
```

预期响应：
```json
{
  "success": true,
  "message": "服务器运行正常",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🧪 API测试

### 1. 获取JWT Token

```bash
curl -X POST http://localhost:8000/generate-token \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "email": "test@example.com"}'
```

### 2. 测试简历解析

```bash
curl -X POST http://localhost:8000/api/v2/resumes/parse \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/path/to/your/resume.pdf"
```

### 3. 查询任务状态

```bash
curl -X GET http://localhost:8000/api/v2/tasks/TASK_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. 获取解析结果

```bash
curl -X GET http://localhost:8000/api/v2/tasks/TASK_ID/result \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📁 新增文件结构

```
backend/
├── routes/v2/
│   └── tasks.js                           # V2路由定义
├── controllers/v2/
│   ├── resumeParserController.js          # 文件上传控制器
│   └── taskStatusController.js            # 任务状态控制器
├── services/v2/
│   ├── taskQueueService.js                # 任务队列服务
│   └── resumeParseTaskHandler.js          # 任务处理器
├── uploads/v2/
│   └── resumes/                           # 上传文件存储目录
└── RESUME_PARSER_V2_README.md             # 使用说明文档
```

## ⚡ 性能特性

- **异步处理**: 不阻塞API响应，支持长时间运行任务
- **并发支持**: 多任务同时处理
- **智能重试**: 自动错误恢复和重试机制
- **内存优化**: 自动清理临时文件和过期数据
- **高可用性**: Redis故障时自动切换内存队列

## 🔒 安全特性

- **身份验证**: 所有API需要JWT令牌
- **权限控制**: 用户只能访问自己的任务
- **文件验证**: 严格的文件类型和大小限制
- **数据隔离**: 任务数据按用户隔离存储

## 📊 监控和日志

服务提供详细的控制台日志：
- 🚀 任务创建和开始
- 📊 进度更新和状态变化
- ✅ 成功完成和结果存储
- ❌ 错误处理和故障诊断

## 🔧 故障排除

### 常见问题

1. **Redis连接失败**
   - 检查Redis服务是否启动
   - 验证连接配置
   - 服务会自动切换到内存模式

2. **AI API调用失败**
   - 检查API密钥配置
   - 验证网络连接
   - 查看控制台错误日志

3. **文件上传失败**
   - 检查文件大小（最大50MB）
   - 验证文件格式（PDF/Word/TXT）
   - 确保uploads目录权限

4. **任务处理缓慢**
   - AI服务响应时间较长是正常的
   - 大文件需要更多处理时间
   - 检查网络连接稳定性

### 日志检查

查看服务日志中的关键标识：
- `[RESUME_PARSER_V2]` - 解析控制器日志
- `[TASK_QUEUE_V2]` - 队列服务日志
- `[RESUME_PARSE_HANDLER]` - 处理器日志

## 📈 扩展建议

1. **生产环境优化**
   - 配置Redis集群
   - 添加负载均衡
   - 实施日志聚合

2. **功能增强**
   - 支持更多文件格式
   - 添加简历模板检测
   - 实现批量处理

3. **监控改进**
   - 集成APM工具
   - 添加性能指标
   - 实现告警机制

## ✅ 部署检查清单

- [ ] Node.js环境就绪
- [ ] PostgreSQL连接正常
- [ ] Redis服务启动（可选）
- [ ] 环境变量配置完成
- [ ] AI API密钥有效
- [ ] 依赖包安装完成
- [ ] 服务启动成功
- [ ] API端点响应正常
- [ ] 文件上传测试通过
- [ ] 任务处理流程验证

## 🎯 总结

V2简历解析服务已完全构建完成，提供：

✅ **完整的异步处理流程** - 从文件上传到结果获取
✅ **高性能队列系统** - Redis支持和内存备份
✅ **智能AI解析** - 集成DeepSeek和GPT模型
✅ **统一数据格式** - 符合UNIFIED_RESUME_SCHEMA规范
✅ **完善的错误处理** - 详细的错误码和重试机制
✅ **生产级代码质量** - 完整的JSDoc注释和日志记录

该服务完全独立于现有系统，可以安全部署和使用，为您的简历管理系统提供强大的解析能力。 