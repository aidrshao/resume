# 新域名迁移方案：resume.juncaishe.com

## 📋 方案概述

从 `cv.junvaishe.com` 迁移到 `resume.juncaishe.com` 的完整方案，包含代码层面的修改和配置更新。

## 🔍 需要修改的组件分析

### 1. 前端配置修改 (React)
```javascript
// 当前可能的配置位置
- frontend/.env
- frontend/src/config/
- frontend/package.json (proxy设置)
- frontend/public/index.html (meta标签)
```

### 2. 后端配置修改 (Node.js + Express)
```javascript
// 需要检查的配置
- backend/.env (CORS_ORIGIN)
- backend/src/config/
- backend/middleware/cors.js
- backend/routes/ (绝对URL引用)
```

### 3. 基础设施配置
```bash
# 需要更新的配置
- /etc/nginx/sites-available/resume
- SSL证书配置
- 防火墙规则
- 监控配置
```

## 🛠️ 详细修改方案

### 阶段1：配置文件检查与修改

#### 1.1 检查现有配置
```bash
# 检查前端配置
find /home/ubuntu/resume/frontend -name "*.env*" -o -name "*.config.js" -o -name "package.json" | xargs grep -l "junvaishe\|cv\." 2>/dev/null

# 检查后端配置
find /home/ubuntu/resume/backend -name "*.env*" -o -name "*.js" | xargs grep -l "junvaishe\|cv\." 2>/dev/null

# 检查硬编码的域名
grep -r "cv.junvaishe.com" /home/ubuntu/resume/ 2>/dev/null
```

#### 1.2 前端配置修改
```javascript
// frontend/.env (如果存在)
REACT_APP_API_BASE_URL=https://resume.juncaishe.com/api
REACT_APP_DOMAIN=resume.juncaishe.com

// frontend/src/config/config.js (如果存在)
const config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'https://resume.juncaishe.com/api',
  domain: 'resume.juncaishe.com'
};

// frontend/package.json (proxy设置)
{
  "proxy": "https://resume.juncaishe.com"
}
```

#### 1.3 后端配置修改
```javascript
// backend/.env
CORS_ORIGIN=https://resume.juncaishe.com,http://resume.juncaishe.com
DOMAIN=resume.juncaishe.com
BASE_URL=https://resume.juncaishe.com

// backend/middleware/cors.js (如果存在)
const allowedOrigins = [
  'https://resume.juncaishe.com',
  'http://resume.juncaishe.com',
  'http://localhost:3000', // 开发环境
  'http://localhost:3016'  // 生产环境前端端口
];
```

### 阶段2：代码层面修改（如果需要）

#### 2.1 API调用基础URL
```javascript
// 检查是否有硬编码的API URL
// frontend/src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://resume.juncaishe.com/api';

// 替换所有硬编码的API调用
// 从：fetch('https://cv.junvaishe.com/api/...')
// 到：fetch(`${API_BASE_URL}/...`)
```

#### 2.2 CORS配置更新
```javascript
// backend/app.js 或 backend/server.js
const cors = require('cors');

app.use(cors({
  origin: [
    'https://resume.juncaishe.com',
    'http://resume.juncaishe.com',
    'http://localhost:3000',
    'http://localhost:3016'
  ],
  credentials: true
}));
```

#### 2.3 邮件模板和通知
```javascript
// 检查邮件模板中的域名引用
// backend/templates/email.html
// 搜索并替换域名引用
```

### 阶段3：基础设施配置

#### 3.1 Nginx配置
```nginx
# /etc/nginx/sites-available/resume
server {
    listen 80;
    server_name resume.juncaishe.com;
    
    # 其他配置保持不变
}
```

#### 3.2 SSL证书
```bash
# 申请新域名的SSL证书
sudo certbot --nginx -d resume.juncaishe.com
```

## 🔧 自动化迁移脚本

### 配置检查脚本
```bash
#!/bin/bash
# check-domain-config.sh

PROJECT_DIR="/home/ubuntu/resume"
OLD_DOMAIN="cv.junvaishe.com"
NEW_DOMAIN="resume.juncaishe.com"

echo "=== 检查域名配置 ==="

# 检查前端配置
echo "1. 检查前端配置..."
find "$PROJECT_DIR/frontend" -type f \( -name "*.js" -o -name "*.json" -o -name "*.env*" \) -exec grep -l "$OLD_DOMAIN" {} \; 2>/dev/null

# 检查后端配置
echo "2. 检查后端配置..."
find "$PROJECT_DIR/backend" -type f \( -name "*.js" -o -name "*.json" -o -name "*.env*" \) -exec grep -l "$OLD_DOMAIN" {} \; 2>/dev/null

# 检查nginx配置
echo "3. 检查Nginx配置..."
grep -l "$OLD_DOMAIN" /etc/nginx/sites-available/* 2>/dev/null

# 检查硬编码域名
echo "4. 检查硬编码域名..."
grep -r "$OLD_DOMAIN" "$PROJECT_DIR" --include="*.js" --include="*.json" --include="*.html" 2>/dev/null
```

### 配置更新脚本
```bash
#!/bin/bash
# update-domain-config.sh

PROJECT_DIR="/home/ubuntu/resume"
OLD_DOMAIN="cv.junvaishe.com"
NEW_DOMAIN="resume.juncaishe.com"

echo "=== 更新域名配置 ==="

# 备份配置文件
backup_dir="/tmp/domain_migration_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

# 更新前端配置
if [ -f "$PROJECT_DIR/frontend/.env" ]; then
    cp "$PROJECT_DIR/frontend/.env" "$backup_dir/"
    sed -i "s/$OLD_DOMAIN/$NEW_DOMAIN/g" "$PROJECT_DIR/frontend/.env"
fi

# 更新后端配置
if [ -f "$PROJECT_DIR/backend/.env" ]; then
    cp "$PROJECT_DIR/backend/.env" "$backup_dir/"
    sed -i "s/$OLD_DOMAIN/$NEW_DOMAIN/g" "$PROJECT_DIR/backend/.env"
fi

# 更新package.json中的proxy设置
find "$PROJECT_DIR" -name "package.json" -exec sed -i "s/$OLD_DOMAIN/$NEW_DOMAIN/g" {} \;

# 更新nginx配置
cp /etc/nginx/sites-available/resume "$backup_dir/"
sed -i "s/$OLD_DOMAIN/$NEW_DOMAIN/g" /etc/nginx/sites-available/resume

echo "配置更新完成，备份保存在: $backup_dir"
```

## 🎯 推荐的迁移策略

### 策略A：直接替换（推荐）
```bash
# 1. 运行诊断脚本
sudo bash fix-domain-dns.sh

# 2. 检查配置
bash check-domain-config.sh

# 3. 更新配置
sudo bash update-domain-config.sh

# 4. 重启服务
pm2 restart all
sudo systemctl reload nginx
```

### 策略B：双域名并存（平滑迁移）
```bash
# 1. 保留现有配置
# 2. 添加新域名配置
# 3. 逐步切换流量
# 4. 最终停用旧域名
```

## 📋 预期代码修改清单

### 必须修改的文件
```
✅ 配置文件修改（必须）
- backend/.env (CORS_ORIGIN)
- frontend/.env (API_BASE_URL) 
- nginx配置文件

⚠️ 可能需要修改的文件
- frontend/src/config/config.js
- backend/middleware/cors.js
- package.json (proxy设置)

❓ 需要检查的文件
- 邮件模板
- 静态文件中的域名引用
- 第三方服务回调URL
```

### 不需要修改的文件
```
✅ 大部分业务逻辑代码
✅ 数据库结构
✅ API接口定义
✅ 组件逻辑
```

## 🔍 风险评估

### 低风险
- 配置文件修改
- Nginx配置更新
- 环境变量调整

### 中风险
- CORS配置修改
- API调用基础URL更改
- 第三方服务回调

### 高风险
- 硬编码域名（如果存在）
- 邮件模板和通知
- 外部依赖配置

## 🚀 执行建议

1. **先运行诊断脚本**，了解需要修改的具体文件
2. **创建配置备份**，确保可以快速回滚
3. **逐步修改配置**，避免一次性修改过多
4. **测试每个修改步骤**，确保服务正常运行
5. **最后申请SSL证书**，启用HTTPS访问

## 📞 技术支持

如果在迁移过程中遇到问题，可以：
1. 查看错误日志：`pm2 logs`
2. 检查Nginx日志：`tail -f /var/log/nginx/error.log`
3. 回滚配置：使用备份文件恢复
4. 联系技术支持

---

**总结**：从架构角度看，这个修改应该主要是配置层面的，核心业务代码不需要大幅修改。关键是要仔细检查所有配置文件和可能的硬编码域名。 