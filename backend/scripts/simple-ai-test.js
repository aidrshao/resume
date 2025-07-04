const AIPrompt = require('../models/AIPrompt');
const ResumeParseService = require('../services/resumeParseService');

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

async function testAI() {
    try {
        console.log('🔍 开始简历解析测试...\n');

        console.log('📝 输入的简历文本:');
        console.log(MOCK_RESUME_TEXT);

        // 直接调用ResumeParseService的结构化方法
        console.log('\n🚀 调用ResumeParseService.structureResumeText...');
        const result = await ResumeParseService.structureResumeText(MOCK_RESUME_TEXT);
        
        console.log('\n✅ 简历解析完成！');
        console.log('\n📊 解析结果:');
        console.log(JSON.stringify(result, null, 2));

        // 验证关键字段
        console.log('\n🔍 验证关键字段:');
        if (result.profile) {
            console.log('✅ profile字段存在');
            console.log('- 姓名:', result.profile.name || '未找到');
            console.log('- 邮箱:', result.profile.email || '未找到');
            console.log('- 电话:', result.profile.phone || '未找到');
        } else {
            console.log('❌ profile字段缺失');
        }

        if (result.workExperience && Array.isArray(result.workExperience)) {
            console.log('✅ workExperience字段存在，长度:', result.workExperience.length);
            result.workExperience.forEach((work, index) => {
                console.log(`  工作${index + 1}: ${work.company} - ${work.position}`);
            });
        } else {
            console.log('❌ workExperience字段缺失或不是数组');
        }

        if (result.education && Array.isArray(result.education)) {
            console.log('✅ education字段存在，长度:', result.education.length);
            result.education.forEach((edu, index) => {
                console.log(`  教育${index + 1}: ${edu.school} - ${edu.major}`);
            });
        } else {
            console.log('❌ education字段缺失或不是数组');
        }

        if (result.skills && Array.isArray(result.skills)) {
            console.log('✅ skills字段存在，长度:', result.skills.length);
        } else {
            console.log('❌ skills字段缺失或不是数组');
        }

        console.log('\n🎉 测试完成！');
        console.log('\n🔍 关键发现:');
        console.log('1. 如果姓名显示为 "邵俊"，说明AI正确解析了您的真实信息');
        console.log('2. 如果显示的是其他示例信息，则表明AI使用了默认数据');

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        console.error('错误详情:', error);
    }
}

testAI(); 