/**
 * AI提示词初始化种子数据
 * 插入系统默认的AI提示词模板
 */

exports.seed = async function(knex) {
  // 清空现有数据
  await knex('ai_prompts').del();

  // 插入初始提示词数据
  await knex('ai_prompts').insert([
    {
      id: 1,
      name: '简历优化专家',
      key: 'resume_optimization',
      category: 'resume',
      model_type: 'gpt',
      description: '针对特定岗位优化简历内容，提升匹配度和面试通过率',
      prompt_template: `你是一位拥有10年+经验的顶级简历优化专家和人力资源顾问。你深度理解不同行业的招聘偏好，善于挖掘候选人的亮点并精准匹配岗位要求。

## 📋 任务目标
为候选人优化简历，使其精准匹配目标岗位，大幅提升面试通过率。

## 🎯 目标岗位信息
- **目标公司**: \${targetCompany}
- **目标岗位**: \${targetPosition}
- **岗位描述**:
\${jobDescription}

\${userRequirements ? \`## 🔥 用户特殊要求
\${userRequirements}

\` : ''}## 📊 当前简历数据
\${resumeData}

## 🚀 优化策略与要求

### 1. 🎪 个人简介优化 (核心竞争力展示)
- **关键词匹配**: 精准嵌入岗位JD中的核心关键词和技能要求
- **价值定位**: 用2-3句话突出最匹配的核心竞争力和独特价值
- **成果量化**: 用具体数据展示过往成就 (如: 提升XX%效率、负责XX万用户产品)
- **行业洞察**: 体现对\${targetCompany}所在行业和业务的理解
- **职业目标**: 明确表达与该岗位的契合度和发展规划

### 2. 💼 工作经历优化 (经验价值最大化)
- **STAR法则**: 用Situation-Task-Action-Result结构重写经历描述
- **相关性排序**: 将最匹配岗位要求的经历放在前面，调整时间线合理性
- **成果量化**: 每个经历至少包含2-3个量化成果 (数据、百分比、规模等)
- **技能映射**: 确保每段经历都能映射到岗位要求的核心技能
- **问题解决**: 突出解决复杂问题的能力和创新思维
- **团队协作**: 展现领导力和跨部门协作经验

### 3. 🏗️ 项目经历优化 (技术实力展示)
- **项目选择**: 优先展示与目标岗位技术栈和业务场景最匹配的项目
- **技术深度**: 详细描述使用的技术栈、架构设计和解决方案
- **业务价值**: 强调项目对业务的实际价值和影响
- **难点突破**: 重点描述遇到的技术难点和创新解决方案
- **团队角色**: 明确在项目中的角色定位和主要贡献
- **成果展示**: 用数据说话 (性能提升、用户增长、成本节约等)

### 4. 🛠️ 技能优化 (能力标签精准化)
- **优先级排序**: 将岗位要求的核心技能排在前面
- **技能分层**: 区分核心技能、相关技能和辅助技能
- **熟练度标注**: 对每个技能标注熟练程度 (精通/熟练/了解)
- **删繁就简**: 移除与岗位无关或过时的技能
- **新技能补充**: 基于经历合理推断并添加隐含的相关技能
- **行业适配**: 使用该行业和岗位的标准技能表述

### 5. 🎓 教育背景优化
- **相关性**: 突出与岗位相关的专业课程、毕业设计或学术成果
- **成绩亮点**: 如有优异成绩或获奖经历，适当展示
- **持续学习**: 展示相关的培训、认证或自学经历

## 📝 输出要求

1. **保持结构**: 严格保持原有JSON格式和字段结构
2. **内容真实**: 在原有经历基础上优化，不编造虚假信息
3. **语言精炼**: 使用简洁有力的专业表述
4. **关键词优化**: 自然融入岗位相关关键词，提高ATS通过率
5. **详细说明**: 在optimizations字段中详细说明每项优化的理由和效果

## 🎯 返回格式

请严格按照以下JSON格式返回，不要包含任何其他文字或解释：

{
  "personalInfo": {
    "name": "姓名",
    "phone": "电话", 
    "email": "邮箱",
    "location": "地址",
    "summary": "重新优化的个人简介，突出与\${targetPosition}岗位的匹配度"
  },
  "educations": [...],
  "workExperiences": [...],
  "projects": [...],
  "skills": [...],
  "languages": [...],
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
    "personalInfo": {},
    "workExperiences": [],
    "projects": [],
    "skills": [],
    "educations": []
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
      description: '从简历文本中提取结构化信息，识别个人信息、工作经历、教育背景等',
      prompt_template: `你是一个专业的简历解析专家，请仔细分析以下简历文本，提取所有可能的结构化信息。

简历文本内容：
\${resumeText}

请按照以下步骤仔细解析：

第一步：识别个人基本信息
- 姓名：通常在简历开头，可能是最大的文字或单独一行
- 联系方式：手机号码（11位数字，可能有分隔符）
- 邮箱：包含@符号的邮箱地址
- 地址：城市、省份信息
- 个人简介：通常有"个人简介"、"自我评价"、"简介"等标题

第二步：识别教育背景
- 寻找学校名称、专业、学位、时间等信息
- 注意"教育经历"、"教育背景"、"学习经历"等关键词

第三步：识别工作经历
- 寻找公司名称、职位、工作时间、工作描述
- 注意"工作经历"、"工作经验"、"职业经历"等关键词
- 每个工作经历都要单独提取

第四步：识别项目经验
- 寻找项目名称、项目描述、使用技术等
- 注意"项目经验"、"项目经历"、"主要项目"等关键词

第五步：识别技能信息
- 编程语言、技术栈、工具等
- 注意"技能"、"专业技能"、"技术栈"等关键词

请严格按照以下JSON格式返回结果：

{
  "personalInfo": {
    "name": "从简历中提取的完整姓名",
    "phone": "手机号码（保持原格式）",
    "email": "邮箱地址", 
    "location": "居住地址或城市",
    "summary": "个人简介或自我评价的完整内容",
    "objective": "求职意向或职业目标"
  },
  "educations": [
    {
      "school": "学校完整名称",
      "degree": "学位类型（学士/硕士/博士/专科等）",
      "major": "专业名称",
      "startDate": "入学时间（YYYY-MM格式）",
      "endDate": "毕业时间（YYYY-MM格式）",
      "gpa": "GPA成绩（如果有）",
      "honors": ["学术荣誉或奖项"],
      "courses": ["主要课程"],
      "description": "其他教育相关描述"
    }
  ],
  "workExperiences": [
    {
      "company": "公司完整名称",
      "position": "职位名称",
      "department": "部门名称",
      "location": "工作地点",
      "startDate": "入职时间（YYYY-MM格式）",
      "endDate": "离职时间（YYYY-MM格式，在职写'至今'）",
      "description": "工作职责和内容的详细描述",
      "achievements": ["具体工作成就", "量化的工作成果"],
      "technologies": ["使用的技术、工具、软件"],
      "teamSize": "团队规模（如果提到）",
      "reportTo": "汇报对象（如果提到）"
    }
  ],
  "projects": [
    {
      "name": "项目名称",
      "role": "在项目中的角色",
      "company": "项目所属公司",
      "startDate": "项目开始时间", 
      "endDate": "项目结束时间",
      "description": "项目详细描述和背景",
      "responsibilities": ["具体职责"],
      "achievements": ["项目成果和影响"],
      "technologies": ["使用的技术栈"],
      "teamSize": "项目团队规模",
      "budget": "项目预算（如果提到）"
    }
  ],
  "skills": {
    "technical": ["编程语言", "开发框架", "数据库", "开发工具"],
    "professional": ["专业技能", "行业知识"],
    "soft": ["软技能", "沟通能力", "领导力"],
    "certifications": ["获得的证书", "资格认证"]
  },
  "languages": [
    {
      "language": "语言名称（中文/英文/日文等）",
      "level": "熟练程度（母语/精通/熟练/一般）",
      "certification": "语言证书（如CET-6、托福、雅思分数）"
    }
  ],
  "awards": [
    {
      "name": "奖项名称",
      "issuer": "颁发机构",
      "date": "获奖时间",
      "description": "奖项说明"
    }
  ],
  "publications": [
    {
      "title": "论文或著作标题",
      "journal": "发表期刊或出版社",
      "date": "发表时间",
      "authors": ["作者列表"]
    }
  ],
  "interests": ["个人兴趣爱好"]
}

重要提取规则：
1. 个人信息是最重要的，请务必仔细提取姓名、电话、邮箱
2. 每个工作经历、教育经历、项目都要单独成条目
3. 保留所有时间信息，统一格式为YYYY-MM
4. 技能要详细分类，不要遗漏
5. 保留所有量化数据和具体成就
6. 如果某个字段确实没有信息，设为null或空数组
7. 只返回JSON格式，不要包含任何其他文字

现在开始解析：`,
      model_config: JSON.stringify({
        temperature: 0.3,
        max_tokens: 6000,
        timeout: 180000
      }),
      variables: JSON.stringify({
        resumeText: {
          type: 'text',
          description: '需要解析的简历文本内容',
          required: true
        }
      }),
      is_active: true
    }
  ]);

  console.log('✅ AI提示词种子数据插入完成');
}; 