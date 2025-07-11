/**
 * Seed: 05_resume_optimization_prompt
 * -----------------------------------
 * 目的：确保关键提示词 resume_optimization_content 一定存在并保持最新内容。
 *
 * 运行策略：
 * - 如果数据库不存在该 key，则插入默认版本；
 * - 如果已存在，则进行更新（保持变量、模板、模型等最新）。
 *
 * 此文件会被自动执行（npm run seed 或 auto-setup），保证每次部署/启动后系统即可正常生成定制简历。
 */

const tableName = 'ai_prompts';

const PROMPT_DATA = {
  name: '简历内容优化器',
  key: 'resume_optimization_content',
  description: '根据目标岗位JD重构简历内容，生成专属简历（UNIFIED_RESUME_SCHEMA 格式）',
  category: 'resume',
  model_type: 'gpt',
  prompt_template: `你是目标公司的首席人才官 (CTO) 与业务负责人。你的任务是基于候选人的原始简历和岗位JD，重构其简历内容，以论证该候选人是解决你当前业务痛点的最佳人选。

核心指令 (Core Directives):

招聘官视角 (Hiring Manager's View): 严格从“我为什么要雇佣这个人”的角度出发，审视和重写每一句话。

价值优先 (Value-First): 提炼候选人经历背后的商业价值和业务影响，而不是简单罗列任务。

识别痛点与关键词 (Identify Pain Points & Keywords):

分析JD: 快速识别该岗位要解决的1-3个核心业务痛点。

提取关键词: 找出JD中的硬技能、软实力和成果动词。

绝对真实 (Authentic): 严禁编造信息。 你的工作是基于原始内容进行视角重构和价值提炼。

战略性内容重构模型:

个人总结 (Summary) -> 重构为“高管电梯演讲 (Executive Pitch)”
用3-4句话清晰回答：定位 (你是谁？)、价值匹配 (你与我何干？)、意图 (你为何而来？)。

工作/项目经历 (Experience) -> 重构为“战功陈列室 (Hall of Achievements)”
对每一段经历，都采用 C.A.R.L 模型 进行重写，并用\n分隔要点：Challenge (挑战), Action (行动), Result (可量化的结果), Learning (认知/沉淀)。

技能 (Skills) -> 重构为“能力武器库 (Competency Arsenal)”
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
  model_config: {
    temperature: 0.3,
    max_tokens: 6000,
    timeout: 180000
  },
  variables: {
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
  },
  is_active: true
};

exports.seed = async function(knex) {
  // 查找是否已存在
  const existing = await knex(tableName).where({ key: PROMPT_DATA.key }).first();

  if (existing) {
    // 更新
    await knex(tableName)
      .where({ id: existing.id })
      .update({
        ...PROMPT_DATA,
        model_config: JSON.stringify(PROMPT_DATA.model_config),
        variables: JSON.stringify(PROMPT_DATA.variables),
        updated_at: knex.fn.now()
      });
    console.log(`🔄 [SEED] 更新提示词: ${PROMPT_DATA.key} (ID: ${existing.id})`);
  } else {
    // 插入
    await knex(tableName).insert({
      ...PROMPT_DATA,
      model_config: JSON.stringify(PROMPT_DATA.model_config),
      variables: JSON.stringify(PROMPT_DATA.variables)
    });
    console.log(`✅ [SEED] 插入提示词: ${PROMPT_DATA.key}`);
  }
}; 