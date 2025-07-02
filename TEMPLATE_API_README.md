# 简历模板管理API系统

## 📋 概述

这是一个基于数据库驱动的简历模板管理系统，替代了原有的硬编码文件管理方式。系统提供完整的模板CRUD功能，支持管理员后台管理和用户前端选择。

## 🏗️ 系统架构

### 技术栈
- **后端**: Node.js + Express + Knex.js
- **数据库**: PostgreSQL
- **验证**: Joi
- **认证**: JWT

### 数据库表结构
```sql
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,                    -- 主键ID
  name VARCHAR(100) NOT NULL,               -- 模板名称
  html_content TEXT NOT NULL,               -- HTML模板内容  
  css_content TEXT NOT NULL,                -- CSS样式内容
  thumbnail_url VARCHAR(500),               -- 缩略图URL
  is_premium BOOLEAN DEFAULT false,         -- 是否付费模板
  status VARCHAR(20) DEFAULT 'draft',       -- 模板状态 (draft/published/archived)
  category VARCHAR(50) DEFAULT 'general',   -- 模板分类
  description TEXT,                         -- 模板描述
  sort_order INTEGER DEFAULT 0,            -- 排序权重
  created_at TIMESTAMP DEFAULT now(),      -- 创建时间
  updated_at TIMESTAMP DEFAULT now()       -- 更新时间
);
```

## 🔌 API接口文档

### 公开接口 (无需认证)

#### 1. 获取已发布模板列表
```http
GET /api/templates
```

**查询参数**:
- `category` (可选): 按分类筛选
- `isPremium` (可选): 按付费状态筛选 (true/false)

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "经典商务模板",
      "thumbnail_url": "/images/templates/classic-business.jpg",
      "is_premium": false,
      "category": "business",
      "description": "经典商务风格简历模板",
      "sort_order": 1
    }
  ],
  "message": "获取模板列表成功"
}
```

#### 2. 获取单个模板详情
```http
GET /api/templates/:id
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "经典商务模板",
    "html_content": "<!DOCTYPE html>...",
    "css_content": "body { font-family: ... }",
    "thumbnail_url": "/images/templates/classic-business.jpg",
    "is_premium": false,
    "status": "published",
    "category": "business",
    "description": "经典商务风格简历模板"
  },
  "message": "获取模板详情成功"
}
```

#### 3. 获取模板分类列表
```http
GET /api/templates/categories
```

**响应示例**:
```json
{
  "success": true,
  "data": ["business", "modern", "creative", "minimal"],
  "message": "获取分类列表成功"
}
```

### 管理员接口 (需要管理员权限)

#### 4. 获取所有模板 (管理员用)
```http
GET /api/templates/admin
Authorization: Bearer <admin_token>
```

**查询参数**:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认10
- `status` (可选): 按状态筛选
- `category` (可选): 按分类筛选

#### 5. 创建新模板
```http
POST /api/templates
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "新模板名称",
  "html_content": "<!DOCTYPE html>...",
  "css_content": "body { ... }",
  "thumbnail_url": "/images/thumbnails/new-template.jpg",
  "is_premium": false,
  "status": "draft",
  "category": "modern",
  "description": "模板描述",
  "sort_order": 1
}
```

#### 6. 更新模板
```http
PUT /api/templates/:id
Authorization: Bearer <admin_token>
Content-Type: application/json
```

#### 7. 删除模板
```http
DELETE /api/templates/:id
Authorization: Bearer <admin_token>
```

#### 8. 获取模板统计信息
```http
GET /api/templates/statistics
Authorization: Bearer <admin_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total": 10,
    "published": 7,
    "draft": 2,
    "archived": 1,
    "premium": 4,
    "free": 6,
    "by_category": {
      "business": 3,
      "modern": 2,
      "creative": 2
    }
  }
}
```

## 🚀 部署和使用

### 1. 运行数据库迁移
```bash
cd backend
npm run migrate
```

### 2. 插入种子数据
```bash
npm run seed
```

### 3. 启动服务器
```bash
npm run dev
```

### 4. 测试API
```bash
# 使用测试脚本
node scripts/test-template-api.js

# 或者手动测试
curl http://localhost:8000/api/templates
```

## 🧪 测试

### 自动化测试
项目包含了完整的API测试脚本：

```bash
# 基础测试（不需要管理员权限）
node scripts/test-template-api.js

# 包含管理员功能测试
ADMIN_TOKEN=your_admin_token node scripts/test-template-api.js
```

### 测试覆盖
- ✅ 服务器健康检查
- ✅ 获取已发布模板列表
- ✅ 获取单个模板详情
- ✅ 获取模板分类
- ✅ 管理员获取所有模板
- ✅ 获取模板统计信息
- ✅ 创建/更新/删除模板

## 📝 模板变量系统

### HTML模板支持的变量
模板使用Handlebars语法，支持以下变量：

```javascript
{
  personalInfo: {
    name: "姓名",
    phone: "电话",
    email: "邮箱", 
    location: "地址",
    summary: "个人简介"
  },
  workExperiences: [
    {
      position: "职位",
      company: "公司",
      startDate: "开始日期",
      endDate: "结束日期", 
      description: "工作描述"
    }
  ],
  educations: [
    {
      school: "学校",
      degree: "学位",
      major: "专业",
      startDate: "开始日期",
      endDate: "结束日期",
      gpa: "GPA"
    }
  ],
  skills: ["技能1", "技能2"],
  projects: [
    {
      name: "项目名",
      startDate: "开始日期",
      endDate: "结束日期",
      description: "项目描述",
      technologies: ["技术1", "技术2"]
    }
  ]
}
```

### 模板示例
```html
<h1>{{personalInfo.name}}</h1>
<p>{{personalInfo.phone}} | {{personalInfo.email}}</p>

{{#if personalInfo.summary}}
<section>
  <h2>个人简介</h2>
  <p>{{personalInfo.summary}}</p>
</section>
{{/if}}

{{#each workExperiences}}
<div>
  <h3>{{position}} - {{company}}</h3>
  <p>{{startDate}} - {{endDate}}</p>
  <p>{{description}}</p>
</div>
{{/each}}
```

## 🔧 开发说明

### 文件结构
```
backend/
├── migrations/
│   └── 20250702130000_create_templates_table.js  # 数据库迁移
├── models/
│   └── Template.js                               # 模板数据模型
├── controllers/
│   └── templateController.js                     # 控制器
├── routes/
│   └── templateRoutes.js                         # 路由定义
├── seeds/
│   └── 03_templates.js                           # 种子数据
├── scripts/
│   └── test-template-api.js                      # 测试脚本
└── utils/
    └── validation.js                             # 验证规则
```

### 扩展开发
1. **添加新字段**: 修改迁移文件和模型
2. **新增验证规则**: 更新 `utils/validation.js`
3. **扩展API**: 在控制器中添加新方法，在路由中注册
4. **添加测试**: 更新测试脚本

## 🔒 安全注意事项

1. **管理员权限**: 所有CUD操作都需要管理员权限
2. **数据验证**: 所有输入都经过严格验证
3. **SQL注入防护**: 使用参数化查询
4. **XSS防护**: 输出转义处理

## 📞 支持

如有问题或建议，请联系开发团队。

---

**更新日志**:
- v1.0.0 (2025-07-02): 初始版本，支持完整的模板CRUD功能 