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
  prompt_template: `角色扮演：你是目标公司的首席人才官 (CTO) 与业务负责人。你的任务是基于候选人的原始简历和岗位JD，重构其简历内容，以论证该候选人是解决你当前业务痛点的最佳人选。

核心指令 (Core Directives):
1. 招聘官视角：从“我为什么要雇佣这个人”的角度审视并重写每一句话；
2. 价值优先：提炼经历背后的商业价值和业务影响；
3. 识别痛点与关键词：分析JD，找出1-3个核心业务痛点以及关键词；
4. 绝对真实：严禁编造信息，仅基于原始内容重构；

输出要求：返回 **严格遵循 UNIFIED_RESUME_SCHEMA** 的 JSON，对原始简历进行内容重构，不要输出任何解释或备注。

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