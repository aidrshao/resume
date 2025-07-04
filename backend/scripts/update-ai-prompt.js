/**
 * 更新AI提示词脚本
 * 修复定制简历生成中AI返回数据格式不正确的问题
 */

require('dotenv').config();
const AIPrompt = require('../models/AIPrompt');
const { db } = require('../config/database');

async function updateAIPrompt() {
  console.log('🚀 开始更新AI提示词...');
  
  try {
    const newPromptTemplate = `角色扮演： 你是目标公司的首席人才官 (CTO) 与业务负责人。你的任务是基于候选人的原始简历和岗位JD，重构其简历内容，以论证该候选人是解决你当前业务痛点的最佳人选。

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

最终输出要求:
你的最终输出必须是一个严格遵循以下JSON格式的对象，只包含优化后的简历内容。不要包含任何其他文字、解释或备忘录。

必需的JSON结构：
{
  "profile": {
    "name": "姓名",
    "email": "邮箱",
    "phone": "电话",
    "location": "地址",
    "portfolio": "作品集链接",
    "linkedin": "LinkedIn链接",
    "summary": "个人总结"
  },
  "workExperience": [
    {
      "company": "公司名称",
      "position": "职位",
      "duration": "任职时间",
      "description": "工作描述"
    }
  ],
  "projectExperience": [
    {
      "name": "项目名称",
      "role": "担任角色",
      "duration": "项目周期",
      "description": "项目描述",
      "url": "项目链接"
    }
  ],
  "education": [
    {
      "school": "学校名称",
      "degree": "学位",
      "major": "专业",
      "duration": "就读时间"
    }
  ],
  "skills": [
    {
      "category": "技能分类",
      "details": "具体技能"
    }
  ],
  "customSections": [
    {
      "title": "自定义章节标题",
      "content": "章节内容"
    }
  ]
}

注意：所有字段都是必需的，即使原始简历中没有某些信息，也必须包含相应的空数组[]或空字符串""。

输入信息：

目标岗位JD: \${jobDescription}

(可选) 岗位关键信息: \${preAnalyzedInfo}

基础简历数据 (JSON): \${baseResumeData}

现在，请开始优化。`;

    console.log('📝 新提示词长度:', newPromptTemplate.length);
    
    // 更新AI提示词
    const result = await AIPrompt.update(6, {
      prompt_template: newPromptTemplate,
      updated_at: new Date()
    });
    
    console.log('✅ AI提示词更新成功');
    console.log('📊 更新结果:', result ? 'success' : 'failed');
    
    // 验证更新结果
    const updatedPrompt = await AIPrompt.findByKey('resume_optimization_content');
    if (updatedPrompt) {
      console.log('✅ 验证成功: 提示词已更新');
      console.log('📝 更新后长度:', updatedPrompt.prompt_template.length);
      console.log('🔍 包含projectExperience:', updatedPrompt.prompt_template.includes('projectExperience') ? '✅' : '❌');
    } else {
      console.error('❌ 验证失败: 无法获取更新后的提示词');
    }
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    console.error('🔍 错误堆栈:', error.stack);
  } finally {
    await db.destroy();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行更新
if (require.main === module) {
  updateAIPrompt().catch(error => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
}

module.exports = { updateAIPrompt }; 