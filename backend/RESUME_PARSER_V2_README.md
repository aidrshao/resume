# 简历解析服务 V2 使用说明

## 概述

V2版本的简历解析服务是一个全新的、独立的后端模块，提供异步的简历文件解析功能。该服务支持PDF、Word文档和文本文件的解析，使用AI技术提取结构化信息，并转换为统一的数据格式。

## 核心特性

- **异步处理**: 使用任务队列系统，支持长时间运行的解析任务
- **多格式支持**: PDF (.pdf)、Word文档 (.docx, .doc)、文本文件 (.txt)
- **AI驱动**: 集成DeepSeek和GPT模型进行智能解析
- **统一数据格式**: 输出符合UNIFIED_RESUME_SCHEMA规范的结构化数据
- **实时状态跟踪**: 支持前端轮询任务状态和进度
- **错误恢复**: 内置重试机制和错误处理
- **Redis支持**: 使用Redis作为任务队列和缓存，提供高性能
- **内存备用**: 当Redis不可用时自动切换到内存队列

## API端点

### 1. 简历解析

**端点**: `POST /api/v2/resumes/parse`

**功能**: 上传简历文件并创建解析任务

**请求**:
```bash
curl -X POST \
  http://localhost:8000/api/v2/resumes/parse \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/path/to/resume.pdf"
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued",
    "message": "简历文件已上传，正在排队处理...",
    "estimated_time": "90-120秒",
    "polling_interval": 2000
  },
  "request_id": "PARSE_1640995200000_abc123",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. 任务状态查询

**端点**: `GET /api/v2/tasks/:taskId/status`

**功能**: 查询指定任务的执行状态

**请求**:
```bash
curl -X GET \
  http://localhost:8000/api/v2/tasks/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "progress": 60,
    "message": "AI正在分析简历内容...",
    "estimated_remaining_time": "30-60秒",
    "updated_at": "2024-01-01T12:01:30.000Z"
  },
  "request_id": "STATUS_1640995260000_def456",
  "timestamp": "2024-01-01T12:01:30.000Z"
}
```

**任务状态说明**:
- `queued`: 任务已加入队列，等待处理
- `processing`: 任务正在处理中
- `completed`: 任务已完成
- `failed`: 任务处理失败

### 3. 获取解析结果

**端点**: `GET /api/v2/tasks/:taskId/result`

**功能**: 获取已完成任务的解析结果

**请求**:
```bash
curl -X GET \
  http://localhost:8000/api/v2/tasks/550e8400-e29b-41d4-a716-446655440000/result \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "resume_data": {
      "personalInfo": {
        "name": "张三",
        "email": "zhangsan@example.com",
        "phone": "13800138000",
        "location": "北京市朝阳区",
        "summary": "具有5年前端开发经验的软件工程师..."
      },
      "workExperience": [...],
      "education": [...],
      "skills": [...],
      "projects": [...],
      "languages": [...]
    },
    "original_filename": "张三-简历.pdf",
    "processed_at": "2024-01-01T12:02:00.000Z",
    "schema_version": "2.1",
    "metadata": {
      "file_size": 1048576,
      "file_type": "application/pdf",
      "processing_time": 120000
    }
  },
  "message": "简历解析结果获取成功",
  "request_id": "RESULT_1640995320000_ghi789",
  "timestamp": "2024-01-01T12:02:00.000Z"
}
```

## 前端集成示例

### JavaScript/React示例

```javascript
class ResumeParserV2 {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
  }

  /**
   * 上传并解析简历
   */
  async parseResume(file) {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${this.apiBaseUrl}/api/v2/resumes/parse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: formData
    });

    return await response.json();
  }

  /**
   * 轮询任务状态
   */
  async pollTaskStatus(taskId, onProgress, onComplete, onError) {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${this.apiBaseUrl}/api/v2/tasks/${taskId}/status`,
          {
            headers: {
              'Authorization': `Bearer ${this.authToken}`
            }
          }
        );

        const result = await response.json();

        if (result.success) {
          const { status, progress, message } = result.data;

          // 更新进度
          onProgress(progress, message);

          // 检查是否完成
          if (status === 'completed') {
            clearInterval(pollInterval);
            const resultData = await this.getTaskResult(taskId);
            onComplete(resultData);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            onError(new Error(result.data.error || '解析失败'));
          }
        } else {
          clearInterval(pollInterval);
          onError(new Error(result.message || '状态查询失败'));
        }
      } catch (error) {
        clearInterval(pollInterval);
        onError(error);
      }
    }, 2000); // 每2秒轮询一次

    return pollInterval;
  }

  /**
   * 获取解析结果
   */
  async getTaskResult(taskId) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/v2/tasks/${taskId}/result`,
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      }
    );

    return await response.json();
  }
}

// 使用示例
const parser = new ResumeParserV2('http://localhost:8000', 'your-jwt-token');

// 处理文件上传
document.getElementById('resume-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // 开始解析
    const parseResult = await parser.parseResume(file);
    
    if (parseResult.success) {
      const taskId = parseResult.data.taskId;
      
      // 开始轮询状态
      parser.pollTaskStatus(
        taskId,
        (progress, message) => {
          console.log(`进度: ${progress}% - ${message}`);
          // 更新UI进度条
        },
        (result) => {
          console.log('解析完成:', result);
          // 处理解析结果
        },
        (error) => {
          console.error('解析失败:', error);
          // 处理错误
        }
      );
    }
  } catch (error) {
    console.error('上传失败:', error);
  }
});
```

## 环境配置

### 必需的环境变量

```bash
# Redis配置（用于任务队列）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# AI API配置
DEEPSEEK_API_KEY=your-deepseek-api-key
AGICTO_API_KEY=your-agicto-api-key
```

### 依赖包安装

确保以下依赖包已安装：

```bash
npm install ioredis uuid pdf-parse mammoth
```

## 处理流程

1. **文件上传**: 客户端上传简历文件到`/api/v2/resumes/parse`
2. **任务创建**: 服务器验证文件并创建后台解析任务
3. **返回任务ID**: 立即返回任务ID给客户端
4. **后台处理**: 任务处理器执行以下步骤：
   - 文本提取（根据文件类型）
   - 获取AI解析提示词
   - AI分析简历内容
   - 数据格式转换
   - 结果存储
5. **状态轮询**: 客户端定期查询任务状态
6. **获取结果**: 任务完成后获取解析结果

## 错误处理

### 常见错误代码

- `UNAUTHORIZED`: 用户认证失败
- `FILE_MISSING`: 未检测到上传文件
- `INVALID_FILE_TYPE`: 不支持的文件类型
- `FILE_TOO_LARGE`: 文件大小超过限制（50MB）
- `TASK_NOT_FOUND`: 任务不存在或已过期
- `ACCESS_DENIED`: 无权访问此任务
- `TASK_FAILED`: 任务处理失败

### 重试策略

- 网络错误: 建议客户端实现指数退避重试
- 任务失败: 用户可重新上传文件进行解析
- Redis不可用: 自动切换到内存队列，功能不受影响

## 性能优化

- **文件大小限制**: 最大支持50MB文件
- **并发处理**: 支持多个任务同时处理
- **内存管理**: 自动清理临时文件和过期任务
- **缓存策略**: 使用Redis缓存任务状态和结果
- **超时设置**: AI请求设置合理超时时间

## 监控和日志

服务提供详细的日志记录，包括：

- 请求处理日志
- 任务执行状态
- AI服务调用记录
- 错误和异常信息
- 性能指标统计

## 安全特性

- **认证验证**: 所有API都需要有效的JWT令牌
- **权限控制**: 用户只能访问自己的任务
- **文件安全**: 上传文件类型和大小验证
- **数据清理**: 自动清理临时文件和过期数据

## 技术架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   前端客户端    │───▶│   API Gateway    │───▶│   控制器层      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Redis队列     │◀───│   任务队列服务   │◀───│   任务处理器    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                          ┌─────────────────┐
│   状态缓存      │                          │   AI服务集成    │
└─────────────────┘                          └─────────────────┘
```

这个V2版本的简历解析服务提供了高性能、高可用性的解析能力，完全独立于现有系统，可以安全地部署和使用。 