/**
 * AI提示词初始化种子数据
 * 插入系统默认的AI提示词模板
 */

exports.seed = async function(knex) {
  // 幂等处理：检查并更新现有记录，避免主键冲突

  // 定义提示词数据列表
  const prompts = [
    {
      name: '简历内容优化器',
      key: 'resume_optimization_content',
      category: 'resume',
      model_type: 'gpt',
      description: '根据目标岗位JD重构简历内容，生成专属简历（UNIFIED_RESUME_SCHEMA 格式）',
      prompt_template: `你是目标公司的首席人才官 (CTO) 与业务负责人。你的任务是基于候选人的原始简历和岗位JD，重构其简历内容，以论证该候选人是解决你当前业务痛点的最佳人选。

核心指令 (Core Directives):

招聘官视角 (Hiring Manager's View): 严格从"我为什么要雇佣这个人"的角度出发，审视和重写每一句话。

价值优先 (Value-First): 提炼候选人经历背后的商业价值和业务影响，而不是简单罗列任务。

识别痛点与关键词 (Identify Pain Points & Keywords):

分析JD: 快速识别该岗位要解决的1-3个核心业务痛点。

提取关键词: 找出JD中的硬技能、软实力和成果动词。

绝对真实 (Authentic): 严禁编造信息。 你的工作是基于原始内容进行视角重构和价值提炼。

战略性内容重构模型:

个人总结 (Summary) -> 重构为"高管电梯演讲 (Executive Pitch)"
用3-4句话清晰回答：定位 (你是谁？)、价值匹配 (你与我何干？)、意图 (你为何而来？)。

工作/项目经历 (Experience) -> 重构为"战功陈列室 (Hall of Achievements)"
对每一段经历，都采用 C.A.R.L 模型 进行重写，并用\n分隔要点：Challenge (挑战), Action (行动), Result (可量化的结果), Learning (认知/沉淀)。

技能 (Skills) -> 重构为"能力武器库 (Competency Arsenal)"
将其重构为更有逻辑的结构：核心能力、技术/工具栈、可迁移能力。

最终输出要求 (最高优先级):

你的输出必须是一个严格遵循以下UNIFIED_RESUME_SCHEMA格式的JSON对象，只包含优化后的简历内容。不要输出任何解释、备注或代码块标记。

返回JSON格式模板：
{
  "profile": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "portfolio": "string",
    "linkedin": "string",
    "summary": "string"
  },
  "workExperience": [
    {
      "company": "string",
      "position": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "projectExperience": [
    {
      "name": "string",
      "role": "string",
      "duration": "string",
      "description": "string",
      "url": "string"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "major": "string",
      "duration": "string"
    }
  ],
  "skills": [
    {
      "category": "string",
      "details": "string"
    }
  ],
  "customSections": [
    {
      "title": "string",
      "content": "string"
    }
  ]
}

输入参数：
- 目标岗位 JD: \${jobDescription}
- (可选) 岗位关键信息: \${preAnalyzedInfo}
- 基础简历数据 (JSON): \${baseResumeData}
`,
      model_config: JSON.stringify({
        temperature: 0.3,
        max_tokens: 6000,
        timeout: 180000
      }),
      variables: JSON.stringify({
        jobDescription: {
          type: 'text',
          description: '目标岗位JD',
          required: true
        },
        preAnalyzedInfo: {
          type: 'text',
          description: '岗位关键信息 (可选)',
          required: false
        },
        baseResumeData: {
          type: 'json',
          description: '基础简历 JSON 数据',
          required: true
        }
      }),
      is_active: true
    },
    {
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
  ];

  // 幂等操作：检查并更新或插入
  for (const promptData of prompts) {
    const existing = await knex('ai_prompts').where({ key: promptData.key }).first();
    
    if (existing) {
      // 更新现有记录
      await knex('ai_prompts')
        .where({ id: existing.id })
        .update({
          ...promptData,
          updated_at: knex.fn.now()
        });
      console.log(`🔄 [SEED] 更新提示词: ${promptData.key} (ID: ${existing.id})`);
    } else {
      // 插入新记录
      await knex('ai_prompts').insert(promptData);
      console.log(`✅ [SEED] 插入提示词: ${promptData.key}`);
    }
  }

  console.log('✅ [SEED] ai_prompts 已同步 (幂等)');
}; 