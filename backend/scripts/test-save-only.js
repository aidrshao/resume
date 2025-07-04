const ResumeParseService = require('../services/resumeParseService');

// 模拟AI解析后的结构化数据
const mockStructuredData = {
  profile: {
    name: '邵俊',
    email: '346935824@qq.com',
    phone: '13767918257',
    location: null,
    portfolio: null,
    linkedin: null,
    summary: '索信达控股AI创新中心主任'
  },
  workExperience: [
    {
      company: '索信达控股',
      position: 'AI创新中心主任',
      duration: '2020-至今',
      description: '负责AI技术研发和创新\n领导团队开发智能解决方案\n参与国家标准制定工作'
    }
  ],
  education: [
    {
      school: '法国巴黎六大',
      degree: '硕士',
      major: '计算机科学',
      duration: '2018-2020'
    }
  ],
  skills: [
    {
      category: '技术技能',
      details: 'cursor'
    }
  ],
  customSections: [
    {
      title: '荣誉奖项',
      content: '国家信息标准委员会突出贡献专家'
    }
  ]
};

const mockOriginalText = `邵俊
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
法国巴黎六大 计算机科学 硕士 (2018-2020)`;

async function testSaveOnly() {
    try {
        console.log('🔧 直接测试数据保存功能...\n');

        console.log('📊 模拟的结构化数据:');
        console.log(JSON.stringify(mockStructuredData, null, 2));
        console.log('');

        console.log('💾 开始保存到数据库...');
        const savedResume = await ResumeParseService.saveBaseResume(
            2, // 用户ID
            mockOriginalText,
            mockStructuredData
        );

        console.log('✅ 保存成功！');
        console.log('📝 保存的简历信息:');
        console.log('- ID:', savedResume.id);
        console.log('- 标题:', savedResume.title);
        console.log('- 状态:', savedResume.status);

        console.log('\n🔍 验证保存的数据...');
        if (savedResume.resume_data) {
            console.log('✅ resume_data字段存在');
            
            let parsedData;
            if (typeof savedResume.resume_data === 'string') {
                parsedData = JSON.parse(savedResume.resume_data);
            } else {
                parsedData = savedResume.resume_data;
            }
            
            console.log('📊 保存的数据验证:');
            console.log('- 姓名:', parsedData.profile?.name);
            console.log('- 邮箱:', parsedData.profile?.email);
            console.log('- 电话:', parsedData.profile?.phone);
            
            if (parsedData.profile?.name === '邵俊' && 
                parsedData.profile?.email === '346935824@qq.com' &&
                parsedData.profile?.phone === '13767918257') {
                console.log('\n🎉 ✅ 修复成功！数据正确保存了您的真实信息！');
            } else {
                console.log('\n❌ 数据保存不正确');
            }
        } else {
            console.log('❌ resume_data字段为空');
        }

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        console.error('错误详情:', error);
    }
}

testSaveOnly(); 