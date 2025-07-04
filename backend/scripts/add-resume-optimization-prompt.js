/**
 * 添加简历优化提示词配置
 * 为MVP阶段的专属简历功能添加核心提示词
 * 
 * 执行方式：node backend/scripts/add-resume-optimization-prompt.js
 */

const AIPrompt = require('../models/AIPrompt');

/**
 * 简历优化提示词模板
 */
const RESUME_OPTIMIZATION_PROMPT = {
  name: '简历内容优化器',
  key: 'resume_optimization_content',
  prompt_template: `角色扮演： 你是目标公司的首席人才官 (CTO) 与业务负责人。你的任务是基于候选人的原始简历和岗位JD，重构其简历内容，以论证该候选人是解决你当前业务痛点的最佳人选。

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
对每一段经历，都采用 C.A.R.L 模型 进行重写：Challenge (挑战), Action (行动), Result (可量化的结果), Learning (认知/沉淀)。

技能 (Skills) -> 重构为"能力武器库 (Competency Arsenal)"
将其重构为更有逻辑的结构：核心能力、技术/工具栈、可迁移能力。

最终输出要求 (MVP版):
你的最终输出必须是一个严格遵循UNIFIED_RESUME_SCHEMA格式的JSON对象，只包含优化后的简历内容。不要包含任何其他文字、解释或备忘录。

输入信息：

目标岗位JD: \${jobDescription}

(可选) 岗位关键信息: \${preAnalyzedInfo}

基础简历数据 (JSON): \${baseResumeData}

现在，请开始优化。`,
  description: 'MVP版本的简历优化提示词，用于根据目标岗位JD优化候选人简历内容，生成专属简历',
  category: 'resume',
  model_type: 'gpt',
  model_config: {
    temperature: 0.3,
    max_tokens: 6000,
    timeout: 180000
  },
  variables: {
    jobDescription: '目标岗位的职位描述',
    preAnalyzedInfo: '岗位关键信息（可选）',
    baseResumeData: '基础简历的JSON数据'
  },
  is_active: true
};

/**
 * 添加提示词到数据库
 */
async function addResumeOptimizationPrompt() {
  try {
    console.log('🚀 [PROMPT_SETUP] 开始添加简历优化提示词...\n');
    
    // 检查是否已存在
    const existing = await AIPrompt.findByKey(RESUME_OPTIMIZATION_PROMPT.key);
    if (existing) {
      console.log('⚠️ [PROMPT_SETUP] 提示词已存在，将进行更新...');
      
      const updated = await AIPrompt.update(existing.id, RESUME_OPTIMIZATION_PROMPT);
      
      console.log('✅ [PROMPT_SETUP] 提示词更新成功！');
      console.log('📊 [PROMPT_INFO] 更新信息:', {
        id: updated.id,
        name: updated.name,
        key: updated.key,
        model_type: updated.model_type,
        template_length: updated.prompt_template.length,
        is_active: updated.is_active
      });
      
    } else {
      const created = await AIPrompt.create(RESUME_OPTIMIZATION_PROMPT);
      
      console.log('✅ [PROMPT_SETUP] 提示词创建成功！');
      console.log('📊 [PROMPT_INFO] 创建信息:', {
        id: created.id,
        name: created.name,
        key: created.key,
        model_type: created.model_type,
        template_length: created.prompt_template.length,
        is_active: created.is_active
      });
    }
    
    console.log('\n🎉 [PROMPT_SETUP] 简历优化提示词配置完成！');
    console.log('📝 [NEXT_STEPS] 现在可以使用专属简历生成功能了。');
    
  } catch (error) {
    console.error('❌ [PROMPT_SETUP] 添加提示词失败:', error.message);
    console.error('🔍 [ERROR_DETAIL] 错误详情:', error.stack);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addResumeOptimizationPrompt()
    .then(() => {
      console.log('\n🏁 [SCRIPT_END] 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 [SCRIPT_ERROR] 脚本执行失败:', error.message);
      process.exit(1);
    });
}

module.exports = { addResumeOptimizationPrompt, RESUME_OPTIMIZATION_PROMPT }; 