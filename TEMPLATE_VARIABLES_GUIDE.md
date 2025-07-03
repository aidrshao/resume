# 📋 简历模板变量规范指南

> **重要提示**：本文档定义了简历模板中应使用的标准变量格式。所有管理员在创建或编辑模板时必须严格遵循此规范，以确保模板渲染的一致性。

## 🎯 变量命名规范

### 统一格式
所有变量使用 **双花括号** 包围，格式为：`{{variableName}}`

### 命名原则
- 使用 **驼峰命名法**（camelCase）
- 变量名必须 **语义化**，清晰表达含义
- **不允许** 使用缩写，优先完整单词

## 📊 标准变量列表

### 1. 个人基本信息

| 变量名 | 描述 | 示例值 | 必需 |
|--------|------|--------|------|
| `{{personalInfo.name}}` | 姓名 | 张三 | ✅ |
| `{{personalInfo.email}}` | 邮箱 | zhangsan@example.com | ✅ |
| `{{personalInfo.phone}}` | 电话 | 138-0000-0000 | ✅ |
| `{{personalInfo.location}}` | 地址 | 北京市朝阳区 | ✅ |
| `{{personalInfo.summary}}` | 个人简介 | 具有5年经验的软件工程师... | ❌ |

### 2. 工作经历

**列表渲染（推荐）：**
```html
{{#each workExperiences}}
<div class="work-item">
  <h4>{{this.position}}</h4>
  <div class="company">{{this.company}} | {{this.duration}}</div>
  <p>{{this.description}}</p>
</div>
{{/each}}
```

**单个变量（仅第一份工作）：**
| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `{{workExperiences.first.position}}` | 职位 | 高级软件工程师 |
| `{{workExperiences.first.company}}` | 公司 | 腾讯科技 |
| `{{workExperiences.first.duration}}` | 工作时间 | 2020-01 至 2023-06 |
| `{{workExperiences.first.description}}` | 工作描述 | 负责微信小程序... |

### 3. 教育背景

**列表渲染（推荐）：**
```html
{{#each educations}}
<div class="education-item">
  <h4>{{this.degree}}</h4>
  <div class="school">{{this.school}} | {{this.duration}}</div>
  <p>{{this.major}}</p>
</div>
{{/each}}
```

**单个变量（仅第一条教育）：**
| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `{{educations.first.school}}` | 学校 | 清华大学 |
| `{{educations.first.degree}}` | 学位 | 计算机科学硕士 |
| `{{educations.first.major}}` | 专业 | 计算机科学与技术 |
| `{{educations.first.duration}}` | 就读时间 | 2018-09 至 2020-06 |

### 4. 技能

**列表渲染（推荐）：**
```html
<div class="skills">
{{#each skills}}
  <span class="skill-tag">{{this}}</span>
{{/each}}
</div>
```

**字符串格式：**
| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `{{skills.list}}` | 技能列表（逗号分隔） | JavaScript, Python, React |

### 5. 项目经历

**列表渲染（推荐）：**
```html
{{#each projects}}
<div class="project-item">
  <h4>{{this.name}}</h4>
  <div class="project-meta">{{this.duration}}</div>
  <p>{{this.description}}</p>
  <div class="technologies">
    技术栈：{{this.technologies}}
  </div>
</div>
{{/each}}
```

### 6. 语言能力

**列表渲染：**
```html
{{#each languages}}
<div class="language-item">
  <span class="language-name">{{this.name}}</span>
  <span class="language-level">{{this.level}}</span>
</div>
{{/each}}
```

## ⚠️ 废弃的变量格式

以下格式已 **废弃**，请勿在新模板中使用：

❌ 简单格式（已废弃）：
- `{{name}}` → 使用 `{{personalInfo.name}}`
- `{{email}}` → 使用 `{{personalInfo.email}}`
- `{{phone}}` → 使用 `{{personalInfo.phone}}`
- `{{position}}` → 使用 `{{workExperiences.first.position}}`

## 📝 模板创建最佳实践

### 1. HTML结构规范

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{{personalInfo.name}} - 简历</title>
</head>
<body>
  <div class="resume-container">
    <!-- 个人信息区域 -->
    <header class="personal-info">
      <h1>{{personalInfo.name}}</h1>
      <div class="contact-info">
        <span>{{personalInfo.phone}}</span>
        <span>{{personalInfo.email}}</span>
        <span>{{personalInfo.location}}</span>
      </div>
    </header>
    
    <!-- 个人简介 -->
    {{#if personalInfo.summary}}
    <section class="summary">
      <h2>个人简介</h2>
      <p>{{personalInfo.summary}}</p>
    </section>
    {{/if}}
    
    <!-- 工作经历 -->
    <section class="work-experience">
      <h2>工作经历</h2>
      {{#each workExperiences}}
      <div class="work-item">
        <h3>{{this.position}}</h3>
        <div class="work-meta">{{this.company}} | {{this.duration}}</div>
        <p>{{this.description}}</p>
      </div>
      {{/each}}
    </section>
    
    <!-- 教育背景 -->
    <section class="education">
      <h2>教育背景</h2>
      {{#each educations}}
      <div class="education-item">
        <h3>{{this.degree}}</h3>
        <div class="education-meta">{{this.school}} | {{this.duration}}</div>
        <p>{{this.major}}</p>
      </div>
      {{/each}}
    </section>
    
    <!-- 技能 -->
    <section class="skills">
      <h2>专业技能</h2>
      <div class="skill-tags">
        {{#each skills}}
        <span class="skill-tag">{{this}}</span>
        {{/each}}
      </div>
    </section>
    
    <!-- 项目经历 -->
    <section class="projects">
      <h2>项目经历</h2>
      {{#each projects}}
      <div class="project-item">
        <h3>{{this.name}}</h3>
        <div class="project-meta">{{this.duration}}</div>
        <p>{{this.description}}</p>
        <div class="technologies">技术栈：{{this.technologies}}</div>
      </div>
      {{/each}}
    </section>
  </div>
</body>
</html>
```

### 2. CSS类名规范

建议使用以下标准CSS类名：

```css
/* 容器 */
.resume-container { /* 简历主容器 */ }

/* 个人信息 */
.personal-info { /* 个人信息区域 */ }
.contact-info { /* 联系方式 */ }

/* 各个章节 */
.summary { /* 个人简介 */ }
.work-experience { /* 工作经历 */ }
.education { /* 教育背景 */ }
.skills { /* 技能 */ }
.projects { /* 项目经历 */ }

/* 列表项 */
.work-item { /* 工作经历条目 */ }
.education-item { /* 教育背景条目 */ }
.project-item { /* 项目经历条目 */ }
.skill-tag { /* 技能标签 */ }
```

## 🚀 变量测试

创建模板后，系统会自动使用测试数据验证所有变量是否正确渲染。测试数据包含完整的简历信息结构。

## 📞 技术支持

如有疑问，请联系开发团队或查看：
- 系统日志：控制台会显示详细的变量替换日志
- 模板预览：管理界面提供实时预览功能
- 变量检查：系统会自动检测未定义的变量

---

**版本**：v1.0  
**更新时间**：2025-07-03  
**维护者**：开发团队 