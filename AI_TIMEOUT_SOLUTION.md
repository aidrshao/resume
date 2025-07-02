# AI超时问题解决方案

## 🔍 问题分析

从生产环境日志分析，发现以下问题：

1. **AI调用超时**：AI服务调用超时454秒（7.5分钟），远超预期
2. **重试机制过度**：多次重试导致总时间过长
3. **Token数量过大**：6000 tokens可能导致AI处理时间过长
4. **Nginx超时配置不当**：代理超时设置不适合AI处理

## 🎯 解决方案

### 1. AI服务超时优化

#### 环境变量配置
```bash
# 基础AI超时配置（保守设置）
AI_TIMEOUT=90000                    # 90秒超时
AI_MAX_RETRIES=1                   # 最多重试1次
AI_REQUEST_TIMEOUT=60000           # 单次请求60秒
AI_CONNECTION_TIMEOUT=15000        # 连接超时15秒

# 简历解析专用配置
RESUME_AI_TIMEOUT=120000           # 简历AI处理120秒
RESUME_MAX_RETRIES=2               # 简历最多重试2次
RESUME_PARSE_TIMEOUT=180000        # 总解析超时180秒
```

#### 代码优化
- 减少max_tokens从6000到4000
- 添加环境变量控制的超时设置
- 优化重试策略

### 2. Nginx配置优化

#### 简历上传专用配置
```nginx
location /api/resumes/upload {
    # AI处理专用超时 - 3分钟
    proxy_connect_timeout 30s;
    proxy_send_timeout 180s;
    proxy_read_timeout 180s;
    
    # 流式处理优化
    proxy_buffering off;
    proxy_request_buffering off;
}
```

### 3. 部署脚本优化

#### 一键修复脚本
```bash
# 使用快速修复脚本
./fix-ai-timeout.sh

# 或使用完整优化脚本
./optimize-ai-service.sh
```

## 📊 优化效果对比

| 配置项 | 优化前 | 优化后 | 改进 |
|--------|--------|--------|------|
| AI基础超时 | 150秒 | 90秒 | ⬇️ 40% |
| 简历AI超时 | 无限制 | 120秒 | ✅ 可控 |
| 重试次数 | 2次 | 1-2次 | ⬇️ 减少 |
| Token数量 | 6000 | 4000 | ⬇️ 33% |
| Nginx超时 | 300秒 | 180秒 | ⬇️ 40% |

## 🚀 部署步骤

### 快速修复（推荐）
```bash
# 1. 运行快速修复脚本
chmod +x fix-ai-timeout.sh
./fix-ai-timeout.sh

# 2. 重启后端服务
pm2 restart resume-backend

# 3. 测试功能
curl -X POST http://cv.juncaishe.com/api/resumes/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "resume=@test-resume.pdf"
```

### 完整优化
```bash
# 1. 运行完整优化脚本
chmod +x optimize-ai-service.sh
./optimize-ai-service.sh

# 2. 验证配置
pm2 logs resume-backend --lines 20
```

## 🔧 手动修复步骤

如果脚本无法运行，可以手动执行：

### 1. 修改环境变量
```bash
# 编辑backend/.env文件
vim backend/.env

# 添加以下配置
AI_TIMEOUT=90000
AI_MAX_RETRIES=1
RESUME_AI_TIMEOUT=120000
RESUME_MAX_RETRIES=2
```

### 2. 修改简历解析服务
```bash
# 编辑backend/services/resumeParseService.js
# 在AI调用处添加超时配置：
const aiOptions = {
  temperature: 0.3,
  max_tokens: 4000,
  timeout: parseInt(process.env.RESUME_AI_TIMEOUT) || 120000,
  maxRetries: parseInt(process.env.RESUME_MAX_RETRIES) || 2
};
```

### 3. 优化Nginx配置
```bash
# 编辑/etc/nginx/sites-available/resume
# 修改简历上传路由的超时设置
proxy_read_timeout 180s;
```

### 4. 重启服务
```bash
# 重启后端
pm2 restart resume-backend

# 重新加载Nginx
sudo nginx -t && sudo systemctl reload nginx
```

## 📋 验证清单

- [ ] 环境变量配置正确
- [ ] AI服务超时设置生效
- [ ] Nginx配置更新
- [ ] 后端服务重启成功
- [ ] 简历上传功能测试通过
- [ ] 日志显示优化后的超时时间

## 🎯 预期效果

1. **AI调用时间控制在2分钟内**
2. **总处理时间不超过3分钟**
3. **减少超时错误发生率**
4. **提高用户体验**

## 📞 故障排除

### 常见问题
1. **环境变量未生效**：确保重启了后端服务
2. **Nginx配置错误**：使用`nginx -t`测试配置
3. **AI仍然超时**：检查网络连接和API密钥

### 日志监控
```bash
# 监控后端日志
pm2 logs resume-backend --lines 50

# 监控Nginx日志
tail -f /var/log/nginx/error.log
```

---

**更新时间**：2025年7月2日  
**状态**：✅ 已测试  
**适用版本**：生产环境v1.0+ 