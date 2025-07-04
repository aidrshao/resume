/**
 * 测试简历解析功能 - 验证从数据库获取的提示词是否正常工作
 */

require('dotenv').config();
const ResumeParseService = require('../services/resumeParseService');

// 测试简历文本
const testResumeText = `
邵俊
软件工程师
手机：+86 138-0013-8000
邮箱：shaojun@example.com
地址：上海市浦东新区
LinkedIn: linkedin.com/in/shaojun

个人简介：
5年以上前端开发经验，专注于React和Node.js技术栈，有丰富的全栈开发经验。

教育背景：
2015-2019  复旦大学  计算机科学与技术  本科

工作经历：
2019-2023  腾讯科技有限公司  高级前端工程师
- 负责微信小程序开发，用户量达到500万+
- 使用React、TypeScript开发大型Web应用
- 优化前端性能，页面加载速度提升40%

项目经验：
智能简历系统  2023-至今  项目负责人
- 使用React + Node.js + PostgreSQL开发
- 集成GPT-4模型进行简历智能优化
- 项目网址：https://resume.example.com

技能：
- 编程语言：JavaScript, TypeScript, Python
- 前端框架：React, Vue.js, Angular
- 后端技术：Node.js, Express, Koa
- 数据库：PostgreSQL, MongoDB, Redis
`;

async function testResumeParsingFunction() {
  console.log('🧪 开始测试简历解析功能...\n');
  console.log('📝 测试简历文本长度:', testResumeText.length);

  try {
    console.log('🚀 开始调用 ResumeParseService.structureResumeText()...');
    
    const result = await ResumeParseService.structureResumeText(testResumeText);
    
    console.log('\n✅ 简历解析成功！');
    console.log('📊 解析结果:', JSON.stringify(result, null, 2));
    
    // 验证结果格式
    const hasProfile = result && result.profile;
    const hasWorkExperience = result && Array.isArray(result.workExperience);
    const hasEducation = result && Array.isArray(result.education);
    
    console.log('\n🔍 格式验证:');
    console.log(`- profile 字段: ${hasProfile ? '✅' : '❌'}`);
    console.log(`- workExperience 数组: ${hasWorkExperience ? '✅' : '❌'}`);
    console.log(`- education 数组: ${hasEducation ? '✅' : '❌'}`);
    
    if (hasProfile) {
      console.log(`- 姓名: ${result.profile.name || '未提取到'}`);
      console.log(`- 邮箱: ${result.profile.email || '未提取到'}`);
      console.log(`- 手机: ${result.profile.phone || '未提取到'}`);
    }
    
  } catch (error) {
    console.error('❌ 简历解析失败:', error.message);
    console.error(error.stack);
  }

  console.log('\n🎯 测试完成');
  process.exit(0);
}

testResumeParsingFunction(); 