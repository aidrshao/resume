/**
 * AI提示词初始化种子数据
 * 插入系统默认的AI提示词模板
 */

exports.seed = async function(knex) {
  // 删除现有数据
  await knex('ai_prompts').del();

  // 插入新的提示词数据
  await knex('ai_prompts').insert([
    {
      id: 1,
      name: '简历优化器',
      key: 'resume_optimizer',
      category: 'resume',
      model_type: 'gpt',
      description: '根据目标岗位优化简历内容，提升匹配度',
      prompt_template: `你是一位资深的简历优化专家，请根据目标岗位要求对用户简历进行深度优化。

## 🎯 目标岗位信息
- **公司**: \${targetCompany}
- **职位**: \${targetPosition}  
- **岗位描述**: \${jobDescription}

## 📄 当前简历数据
\${resumeData}

## 💡 用户特殊要求
\${userRequirements}

## 🔧 优化策略

### 1. **个人简介优化**
- 重新定位核心竞争力，突出与目标岗位的匹配度
- 融入岗位关键词，提升ATS系统通过率
- 量化个人成就，用数据说话

### 2. **工作经历重组**
- 调整经历顺序，将最相关的工作经历提前
- 使用STAR法则(Situation, Task, Action, Result)重写工作描述
- 突出与目标岗位相关的技能和成果

### 3. **项目经历精选**
- 筛选与目标岗位最匹配的项目
- 强调技术栈和解决方案的相关性
- 量化项目成果和业务价值

### 4. **技能标签优化**
- 重新排序技能，优先展示岗位核心技能
- 补充岗位要求中提到的技能关键词
- 删除不相关或过时的技能

### 5. **关键词优化**
- 在各个模块中自然融入JD中的关键词
- 提升简历在ATS系统中的匹配分数
- 保持语言自然流畅

## 🎯 返回格式

请严格按照以下JSON格式返回，不要包含任何其他文字或解释：

{
  "profile": {
    "name": "姓名",
    "phone": "电话", 
    "email": "邮箱",
    "location": "地址",
    "summary": "重新优化的个人简介，突出与\${targetPosition}岗位的匹配度"
  },
  "education": [...],
  "workExperience": [...],
  "projectExperience": [...],
  "skills": [...],
  "customSections": [...],
  "optimizations": [
    "个人简介：基于\${targetCompany}\${targetPosition}岗位要求，重新定位核心竞争力...",
    "工作经历：将最相关的XX经历提前，用STAR法则重写描述...",
    "项目经历：突出XX技术栈项目，强调与目标岗位的技术匹配度...",
    "技能优化：重新排序技能标签，优先展示\${targetPosition}核心技能...",
    "关键词优化：在各模块中自然融入岗位JD中的关键词...",
    "数据量化：为XX%的经历添加了具体的数据和成果指标..."
  ]
}`,
      model_config: JSON.stringify({
        temperature: 0.3,
        max_tokens: 6000,
        timeout: 150000
      }),
      variables: JSON.stringify({
        targetCompany: {
          type: 'string',
          description: '目标公司名称',
          required: true
        },
        targetPosition: {
          type: 'string', 
          description: '目标岗位名称',
          required: true
        },
        jobDescription: {
          type: 'text',
          description: '岗位描述和要求',
          required: true
        },
        resumeData: {
          type: 'json',
          description: '当前简历数据',
          required: true
        },
        userRequirements: {
          type: 'text',
          description: '用户特殊要求',
          required: false
        }
      }),
      is_active: true
    },
    {
      id: 2,
      name: '简历建议生成器',
      key: 'resume_suggestions',
      category: 'resume',
      model_type: 'deepseek',
      description: '分析简历内容，提供改进建议和优化方向',
      prompt_template: `你是一位专业的简历顾问，请分析以下简历内容，并提供具体的改进建议。

## 📊 简历数据
\${resumeData}

## 🎯 分析要求

请从以下维度分析简历并提供建议：

### 1. 内容完整性
- 检查是否缺少关键信息
- 评估信息的充实程度
- 建议补充的内容

### 2. 表述质量
- 语言表达的专业性
- 描述的具体性和量化程度
- 关键词的使用情况

### 3. 结构布局
- 信息组织的逻辑性
- 重点内容的突出程度
- 整体结构的合理性

### 4. 匹配度提升
- 针对不同岗位的适配建议
- 技能标签的优化方向
- 经历描述的改进空间

## 📝 输出格式

请按以下JSON格式返回分析结果：

{
  "overallScore": 85,
  "summary": "整体评价和主要问题总结",
  "suggestions": [
    {
      "category": "个人简介",
      "priority": "high",
      "issue": "缺少量化成果",
      "suggestion": "建议在个人简介中加入具体的数据和成果",
      "example": "例如：负责XX万用户产品，提升XX%的转化率"
    }
  ],
  "strengths": ["优势点1", "优势点2"],
  "improvements": ["改进点1", "改进点2"]
}`,
      model_config: JSON.stringify({
        temperature: 0.7,
        max_tokens: 4000,
        timeout: 120000
      }),
      variables: JSON.stringify({
        resumeData: {
          type: 'json',
          description: '简历数据',
          required: true
        }
      }),
      is_active: true
    },
    {
      id: 3,
      name: '用户信息收集助手',
      key: 'user_info_collector',
      category: 'chat',
      model_type: 'deepseek',
      description: '通过对话收集用户的个人信息和工作经历',
      prompt_template: `你是一位专业的简历咨询顾问，正在通过对话帮助用户完善个人信息。

## 📋 当前收集的信息
\${collectedInfo}

## 💬 对话历史
\${conversationHistory}

## 👤 用户最新消息
\${userMessage}

## 🎯 任务目标

1. 分析用户消息，提取有用的个人信息
2. 识别还需要收集的关键信息
3. 以友好、专业的方式引导用户提供更多信息
4. 确保信息的准确性和完整性

## 📝 输出格式

请按以下JSON格式返回：

{
  "extractedInfo": {
    "profile": {},
    "workExperience": [],
    "projectExperience": [],
    "skills": [],
    "education": []
  },
  "missingInfo": ["还需要收集的信息类型"],
  "nextQuestion": "下一个要问的问题",
  "response": "对用户的回复消息"
}`,
      model_config: JSON.stringify({
        temperature: 0.6,
        max_tokens: 3000,
        timeout: 90000
      }),
      variables: JSON.stringify({
        collectedInfo: {
          type: 'json',
          description: '已收集的用户信息',
          required: true
        },
        conversationHistory: {
          type: 'array',
          description: '对话历史记录',
          required: true
        },
        userMessage: {
          type: 'string',
          description: '用户最新消息',
          required: true
        }
      }),
      is_active: true
    },
    {
      id: 4,
      name: '简历解析专家',
      key: 'resume_parsing',
      category: 'parsing',
      model_type: 'deepseek',
      description: '解析简历文本，提取结构化信息',
      prompt_template: `你是专业的简历解析专家，请将以下简历文本解析为结构化数据。

## 📄 简历原文
\${resumeText}

## 🎯 解析要求

请严格按照以下要求进行解析：

1. **原文提取**: 只提取简历中明确存在的信息，不要推测或补充
2. **格式规范**: 严格按照指定的JSON格式输出
3. **信息完整**: 尽可能提取所有有价值的信息
4. **字段标准**: 使用统一的字段名称和格式

## 📝 输出格式

请严格按照以下JSON格式返回，不要包含任何其他文字或解释：

{
  "profile": {
    "name": "从简历中提取的姓名",
    "email": "邮箱地址",
    "phone": "电话号码", 
    "location": "居住地址",
    "portfolio": "个人网站或作品集链接",
    "linkedin": "LinkedIn链接",
    "summary": "个人简介或自我描述"
  },
  "workExperience": [
    {
      "company": "公司名称",
      "position": "职位名称",
      "duration": "工作时间段",
      "description": "工作内容和成就描述"
    }
  ],
  "projectExperience": [
    {
      "name": "项目名称", 
      "role": "项目角色",
      "duration": "项目时间",
      "description": "项目描述和技术要点",
      "url": "项目链接（如有）"
    }
  ],
  "education": [
    {
      "school": "学校名称",
      "degree": "学位",
      "major": "专业",
      "duration": "就读时间",
      "gpa": "GPA（如有）"
    }
  ],
  "skills": [
    {
      "category": "技能分类",
      "details": "具体技能列表"
    }
  ],
  "customSections": [
    {
      "title": "其他重要信息的标题（如：荣誉奖项、专利、证书等）",
      "content": "具体内容"
    }
  ]
}`,
      model_config: JSON.stringify({
        temperature: 0.3,
        max_tokens: 6000,
        timeout: 180000
      }),
      variables: JSON.stringify({
        resumeText: {
          type: 'text',
          description: '需要解析的简历文本',
          required: true
        }
      }),
      is_active: true
    }
  ]);

  console.log('✅ AI提示词种子数据插入完成');
}; 