# 前端API配置修复指南

## 问题描述

在部署过程中，前端出现了网络连接错误，具体表现为：
- 登录页面显示 "Network Error"
- 浏览器控制台显示 "ERR_CONNECTION_REFUSED"
- API请求失败，无法连接到后端服务

## 问题原因

**前端代理配置与后端实际端口不匹配**

1. **后端实际运行端口**: 8001
2. **前端代理配置端口**: 8000 (错误)
3. **导致结果**: 前端请求无法到达后端

### 端口变更原因

在部署过程中，系统检测到端口8000被占用，自动将后端服务迁移到8001端口：

```bash
[2025-07-10 11:07:16] 后端端口 8000 被占用: 98297 PM2 v6
[2025-07-10 11:07:16] ⚠️ 端口 8000 被其他服务占用，寻找新端口...
[2025-07-10 11:07:16] 为后端服务选择新端口: 8001
```

但前端的代理配置文件没有同步更新，仍然指向8000端口。

## 解决方案

### 方案一：使用自动修复脚本（推荐）

1. **在服务器上，进入项目根目录**：
   ```bash
   cd /path/to/your/resume/project
   ```

2. **运行修复脚本**：
   ```bash
   chmod +x fix-frontend-api-config.sh
   ./fix-frontend-api-config.sh
   ```

3. **等待脚本执行完成**（约2-3分钟）

4. **验证修复结果**：
   - 检查服务状态：`pm2 status`
   - 测试前端访问：浏览器打开 `http://localhost:3016`
   - 测试登录功能

### 方案二：手动修复

如果自动脚本失败，可以手动执行以下步骤：

#### 1. 修改前端代理配置

编辑 `frontend/src/setupProxy.js`：

```javascript
// 将这行：
target: 'http://localhost:8000',

// 改为：
target: 'http://localhost:8001',
```

#### 2. 创建前端环境变量

创建 `frontend/.env` 文件：

```bash
# 前端环境变量配置
REACT_APP_API_URL=http://localhost:8001/api
PORT=3016
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true
```

#### 3. 重新构建前端

```bash
cd frontend
npm run build
```

#### 4. 重启前端服务

```bash
pm2 stop resume-frontend
pm2 delete resume-frontend
pm2 start serve --name resume-frontend -- -s build -l 3016
pm2 save
```

## 验证修复

修复完成后，请验证以下内容：

### 1. 服务状态检查

```bash
pm2 status
```

应该看到：
- `resume-backend` 状态为 `online`
- `resume-frontend` 状态为 `online`

### 2. 端口监听检查

```bash
lsof -i :8001  # 后端端口
lsof -i :3016  # 前端端口
```

### 3. API连接测试

```bash
curl -s http://localhost:8001/api/health
```

应该返回健康检查信息。

### 4. 前端功能测试

1. 打开浏览器，访问：`http://localhost:3016`
2. 尝试登录功能
3. 检查浏览器控制台是否还有错误

## 预防措施

为了避免类似问题，建议：

1. **端口配置集中管理**：使用环境变量统一管理端口配置
2. **部署脚本优化**：确保端口变更时同步更新所有相关配置
3. **配置文件模板化**：使用模板文件动态生成配置

## 相关文件

本次修复涉及的文件：
- `frontend/src/setupProxy.js` - 前端代理配置
- `frontend/.env` - 前端环境变量
- `frontend/test-admin-frontend.html` - 管理员测试页面
- `frontend/test-cambridge-template.html` - 模板测试页面

## 技术说明

### 前端代理机制

React开发服务器使用 `http-proxy-middleware` 将API请求代理到后端：

```
浏览器请求 → 前端服务(3016) → 代理到后端(8001) → 返回响应
```

### 生产环境配置

在生产环境中，通过Nginx配置反向代理：

```nginx
location /api {
    proxy_pass http://localhost:8001;
}
```

## 故障排除

如果修复后仍有问题，请检查：

1. **防火墙设置**：确保端口8001和3016未被防火墙阻止
2. **服务日志**：`pm2 logs` 查看详细错误信息
3. **Nginx配置**：如果使用域名访问，检查Nginx配置
4. **网络连接**：确保服务器网络正常

## 支持

如果遇到其他问题，请提供：
- 错误信息截图
- `pm2 status` 输出
- `pm2 logs` 相关日志
- 浏览器控制台错误信息

---

*修复脚本会自动备份原配置文件，可以安全执行。* 