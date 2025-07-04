const knex = require('knex')(require('../knexfile').development);
const { Resume } = require('../models/Resume');
const resumeParseService = require('../services/resumeParseService');
const aiService = require('../services/aiService');
const AIPrompt = require('../models/AIPrompt');

// 模拟用户的真实简历数据
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

const TEST_USER_ID = 2;

console.log('🚀 开始简历解析流程测试...\n');

async function testCompleteResumeFlow() {
    try {
        // 步骤1: 检查数据库连接
        console.log('📊 [步骤1] 检查数据库连接...');
        await knex.raw('SELECT 1');
        console.log('✅ 数据库连接成功\n');

        // 步骤2: 模拟简历文本输入
        console.log('📄 [步骤2] 模拟简历文本输入...');
        console.log('输入的原始简历文本:');
        console.log(MOCK_RESUME_TEXT);
        console.log(`✅ 简历文本长度: ${MOCK_RESUME_TEXT.length} 字符\n`);

        // 步骤3: 获取AI解析提示词
        console.log('🤖 [步骤3] 获取AI解析提示词...');
        const promptData = await AIPrompt.getRenderedPrompt('resume_parsing');
        console.log('获取的提示词信息:');
        console.log('- ID:', promptData?.id || 'N/A');
        console.log('- 名称:', promptData?.name || 'N/A');
        console.log('- 类别:', promptData?.category || 'N/A');
        console.log('- 提示词长度:', promptData?.prompt?.length || 0, '字符');
        console.log('- 提示词前100字符:', (promptData?.prompt || '').substring(0, 100) + '...');
        console.log('✅ AI提示词获取成功\n');

        // 步骤4: 保存基础简历记录
        console.log('💾 [步骤4] 保存基础简历记录...');
        const baseResumeData = {
            user_id: TEST_USER_ID,
            title: '测试简历-流程验证',
            status: 'processing',
            is_base: true,
            source: 'upload',
            generation_log: MOCK_RESUME_TEXT // 临时使用这个字段保存原始文本
        };

        console.log('保存的基础简历数据:');
        console.log(JSON.stringify(baseResumeData, null, 2));

        const baseResumeId = await resumeParseService.saveBaseResume(baseResumeData);
        console.log(`✅ 基础简历保存成功，ID: ${baseResumeId}\n`);

        // 步骤5: 调用AI服务进行解析
        console.log('🔍 [步骤5] 调用AI服务进行解析...');
        console.log('发送给AI的数据:');
        console.log('- 简历文本:', MOCK_RESUME_TEXT.substring(0, 100) + '...');
        console.log('- 提示词ID:', promptData.id);
        console.log('- 提示词类别:', promptData.category);

        const parseStartTime = Date.now();
        const parsedData = await aiService.parseResumeContent(MOCK_RESUME_TEXT, promptData);
        const parseEndTime = Date.now();
        
        console.log(`✅ AI解析完成，耗时: ${parseEndTime - parseStartTime}ms`);
        console.log('AI解析结果:');
        console.log(JSON.stringify(parsedData, null, 2));
        console.log('');

        // 步骤6: 验证解析结果格式
        console.log('✅ [步骤6] 验证解析结果格式...');
        const requiredFields = ['profile', 'workExperiences', 'educations', 'skills'];
        const validationResults = [];
        
        for (const field of requiredFields) {
            const exists = parsedData.hasOwnProperty(field);
            const type = typeof parsedData[field];
            const isArray = Array.isArray(parsedData[field]);
            
            validationResults.push({
                field,
                exists,
                type,
                isArray,
                value: parsedData[field]
            });
            
            console.log(`- ${field}: ${exists ? '✅' : '❌'} 存在, 类型: ${type}, 是数组: ${isArray}`);
        }
        
        console.log('详细验证结果:');
        console.log(JSON.stringify(validationResults, null, 2));
        console.log('');

        // 步骤7: 保存解析结果到数据库
        console.log('💾 [步骤7] 保存解析结果到数据库...');
        const updateData = {
            status: 'completed',
            resume_data: JSON.stringify(parsedData),
            updated_at: new Date()
        };

        console.log('更新的数据:');
        console.log(JSON.stringify(updateData, null, 2));

        await knex('resumes').where('id', baseResumeId).update(updateData);
        console.log(`✅ 解析结果保存成功，简历ID: ${baseResumeId}\n`);

        // 步骤8: 从数据库读取验证
        console.log('🔍 [步骤8] 从数据库读取验证...');
        const savedResume = await knex('resumes').where('id', baseResumeId).first();
        console.log('数据库中保存的简历记录:');
        console.log('- ID:', savedResume.id);
        console.log('- 用户ID:', savedResume.user_id);
        console.log('- 标题:', savedResume.title);
        console.log('- 状态:', savedResume.status);
        console.log('- 是否基础简历:', savedResume.is_base);
        console.log('- 创建时间:', savedResume.created_at);
        console.log('- 更新时间:', savedResume.updated_at);
        console.log('- 原始文本长度:', savedResume.generation_log ? savedResume.generation_log.length : 0);
        console.log('- 解析数据长度:', savedResume.resume_data ? savedResume.resume_data.length : 0);

        // 解析并验证存储的JSON数据
        let storedParsedData = null;
        try {
            storedParsedData = JSON.parse(savedResume.resume_data);
            console.log('✅ 存储的JSON数据解析成功');
        } catch (error) {
            console.log('❌ 存储的JSON数据解析失败:', error.message);
        }

        if (storedParsedData) {
            console.log('存储的解析数据详情:');
            console.log(JSON.stringify(storedParsedData, null, 2));
        }
        console.log('');

        // 步骤9: 模拟前端API调用
        console.log('🌐 [步骤9] 模拟前端API调用...');
        console.log('模拟调用 GET /api/resumes/{id} 接口...');
        
        const apiResponse = await Resume.findByIdAndUser(baseResumeId, TEST_USER_ID);
        console.log('API响应数据:');
        console.log(JSON.stringify(apiResponse, null, 2));
        console.log('');

        // 步骤10: 最终结果对比
        console.log('🔍 [步骤10] 最终结果对比...');
        console.log('=== 原始输入 ===');
        console.log(MOCK_RESUME_TEXT);
        console.log('');
        
        console.log('=== AI解析结果 ===');
        console.log(JSON.stringify(parsedData, null, 2));
        console.log('');
        
        console.log('=== 数据库存储结果 ===');
        console.log(JSON.stringify(storedParsedData, null, 2));
        console.log('');
        
        console.log('=== 前端API响应 ===');
        console.log(JSON.stringify(apiResponse, null, 2));
        console.log('');

        // 数据一致性检查
        console.log('🔍 数据一致性检查:');
        const aiProfile = parsedData.profile || {};
        const storedProfile = storedParsedData?.profile || {};
        const apiProfile = apiResponse?.resume_data?.profile || {};

        console.log('个人信息对比:');
        console.log('- AI解析姓名:', aiProfile.name);
        console.log('- 数据库存储姓名:', storedProfile.name);
        console.log('- API返回姓名:', apiProfile.name);
        console.log('- 邮箱一致性:', aiProfile.email === storedProfile.email && storedProfile.email === apiProfile.email ? '✅' : '❌');
        console.log('- 电话一致性:', aiProfile.phone === storedProfile.phone && storedProfile.phone === apiProfile.phone ? '✅' : '❌');

        console.log('\n🎉 简历解析流程测试完成！');
        console.log('🔍 请检查上述每一步的输出结果，确认问题出现在哪个环节。');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        console.error('错误堆栈:', error.stack);
    } finally {
        await knex.destroy();
    }
}

// 运行测试
testCompleteResumeFlow(); 