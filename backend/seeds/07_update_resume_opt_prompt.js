/**
 * Seed: 07_update_resume_opt_prompt
 * 作用：把 key = resume_optimization_content 的 prompt_template 更新为最新的业务版本。
 */

exports.seed = async function(knex) {
  const key = 'resume_optimization_content';

  const NEW_TEMPLATE = `你是目标公司的首席人才官 (CTO) 与业务负责人。你的任务是基于候选人的原始简历和岗位JD，重构其简历内容，以论证该候选人是解决你当前业务痛点的最佳人选。

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
<JSON_TEMPLATE_PLACEHOLDER>

输入信息：

目标岗位 JD: \${jobDescription}

(可选) 岗位关键信息: \${preAnalyzedInfo}

基础简历数据 (JSON): \${baseResumeData}

现在，请开始优化。`;

  const exist = await knex('ai_prompts').where({ key }).first();
  if (exist) {
    await knex('ai_prompts').where({ id: exist.id }).update({
      prompt_template: NEW_TEMPLATE,
      updated_at: knex.fn.now()
    });
    console.log('🔄 [SEED] 更新 resume_optimization_content 提示词完成');
  } else {
    await knex('ai_prompts').insert({
      name: '简历内容优化器',
      key,
      prompt_template: NEW_TEMPLATE,
      category: 'resume',
      model_type: 'gpt',
      is_active: true,
      model_config: JSON.stringify({ temperature: 0.3, max_tokens: 6000, timeout: 180000 })
    });
    console.log('✅ [SEED] 插入 resume_optimization_content 提示词完成');
  }
}; 