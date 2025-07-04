const knex = require('knex')(require('../knexfile').development);
const AIPrompt = require('../models/AIPrompt');
const aiService = require('../services/aiService');

const MOCK_RESUME_TEXT = `
邵俊
邮箱：346935824@qq.com
电话：13767918257
职位：索信达控股AI创新中心主任
技能：cursor
荣誉：国家信息标准委员会突出贡献专家
教育：法国巴黎六大

工作经历：
索信达控股AI创新中心主任 (2020-至今)
- 负责AI技术研发和创新
- 领导团队开发智能解决方案
- 参与国家标准制定工作

教育背景：
法国巴黎六大 计算机科学 硕士 (2018-2020)
`;

async function debugPromptIssue() {
    try {
        console.log('🔍 开始调试提示词问题...\n');

        // 1. 检查数据库中的提示词
        console.log('📊 [步骤1] 检查数据库中的提示词...');
        const allPrompts = await knex('ai_prompts').select('*');
        console.log('数据库中的所有提示词:');
        allPrompts.forEach(prompt => {
            console.log(`- ID: ${prompt.id}, Key: ${prompt.key}, Name: ${prompt.name}, Active: ${prompt.is_active}`);
        });
        console.log('');

        // 2. 查找简历解析提示词
        console.log('🔍 [步骤2] 查找简历解析提示词...');
        const resumePrompt = await knex('ai_prompts')
            .where('key', 'resume_parsing')
            .first();
        
        if (!resumePrompt) {
            console.log('❌ 没有找到key为"resume_parsing"的提示词');
            return;
        }

        console.log('找到的简历解析提示词:');
        console.log('- ID:', resumePrompt.id);
        console.log('- Key:', resumePrompt.key);
        console.log('- Name:', resumePrompt.name);
        console.log('- Category:', resumePrompt.category);
        console.log('- Active:', resumePrompt.is_active);
        console.log('- Template长度:', resumePrompt.prompt_template?.length || 0);
        console.log('- Template前100字符:', (resumePrompt.prompt_template || '').substring(0, 100));
        console.log('');

        // 3. 使用AIPrompt.getRenderedPrompt方法（正确传递变量）
        console.log('🤖 [步骤3] 使用AIPrompt.getRenderedPrompt方法...');
        const promptData = await AIPrompt.getRenderedPrompt('resume_parsing', {
            resumeText: MOCK_RESUME_TEXT
        });
        console.log('getRenderedPrompt返回的数据:');
        console.log('类型:', typeof promptData);
        console.log('- ID:', promptData.id);
        console.log('- Name:', promptData.name);
        console.log('- Key:', promptData.key);
        console.log('- RenderedTemplate长度:', promptData.renderedTemplate?.length || 0);
        console.log('- RenderedTemplate前200字符:', (promptData.renderedTemplate || '').substring(0, 200));
        console.log('');

        // 4. 直接调用AI服务（使用正确的字段）
        console.log('🔍 [步骤4] 直接调用AI服务...');
        if (promptData && promptData.renderedTemplate) {
            console.log('开始AI解析...');
            
            // 创建正确的数据结构给AI服务
            const aiPromptData = {
                ...promptData,
                prompt: promptData.renderedTemplate // AI服务期望的字段名
            };
            
            const result = await aiService.parseResumeContent(MOCK_RESUME_TEXT, aiPromptData);
            console.log('AI解析结果:');
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log('❌ promptData或renderedTemplate为空，无法调用AI服务');
            console.log('promptData:', promptData);
        }

    } catch (error) {
        console.error('❌ 调试过程中发生错误:', error);
        console.error('错误堆栈:', error.stack);
    } finally {
        await knex.destroy();
    }
}

debugPromptIssue(); 