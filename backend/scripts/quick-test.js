/**
 * 快速性能测试脚本
 */

const path = require('path');
const fs = require('fs');

// 设置环境变量
process.env.NODE_ENV = 'development';

// 引入AI服务
const AIService = require('../services/aiService');

/**
 * 测试AI服务基本功能
 */
async function testAIBasic() {
  console.log('🤖 [AI_TEST] 开始AI服务基本测试...');
  
  try {
    const aiService = new AIService();
    
    // 测试简单调用
    console.log('\n📝 [AI_TEST] 测试简单调用...');
    const startTime = Date.now();
    
    const result = await aiService.generateText('请简单回复"AI测试成功"', 'deepseek');
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ [AI_TEST] 测试成功，耗时: ${duration}ms`);
    console.log(`📊 [AI_TEST] 响应长度: ${result.length} 字符`);
    console.log(`👀 [AI_TEST] 响应内容: ${result}`);
    
    // 测试复杂调用
    console.log('\n📝 [AI_TEST] 测试复杂调用...');
    const complexStartTime = Date.now();
    
    const complexPrompt = `
请分析以下简历信息并提取结构化数据：

张三
软件工程师
电话：138-0000-0000
邮箱：zhangsan@example.com

工作经历：
2020-2023 ABC科技公司 高级软件工程师
- 负责前端开发和架构设计
- 使用React、Node.js开发企业级应用

请返回JSON格式的结构化数据。
`;
    
    const complexResult = await aiService.generateText(complexPrompt, 'deepseek');
    
    const complexDuration = Date.now() - complexStartTime;
    
    console.log(`✅ [AI_TEST] 复杂测试成功，耗时: ${complexDuration}ms`);
    console.log(`📊 [AI_TEST] 输入长度: ${complexPrompt.length} 字符`);
    console.log(`📊 [AI_TEST] 输出长度: ${complexResult.length} 字符`);
    console.log(`📊 [AI_TEST] 处理速度: ${(complexResult.length / (complexDuration / 1000)).toFixed(1)} 字符/秒`);
    console.log(`👀 [AI_TEST] 结果预览: ${complexResult.substring(0, 200)}...`);
    
    // 性能评估
    console.log('\n🏆 [PERFORMANCE_EVALUATION] 性能评估:');
    if (complexDuration < 10000) {
      console.log(`  ✅ AI响应速度优秀：${complexDuration}ms`);
    } else if (complexDuration < 30000) {
      console.log(`  ⚠️ AI响应速度一般：${complexDuration}ms`);
    } else {
      console.log(`  ❌ AI响应速度偏慢：${complexDuration}ms，需要优化`);
    }
    
  } catch (error) {
    console.error('❌ [AI_TEST] AI服务测试失败:', error.message);
    console.error('❌ [AI_TEST] 详细错误:', error);
  }
}

/**
 * 测试简历解析服务
 */
async function testResumeParseService() {
  console.log('\n📄 [RESUME_TEST] 开始简历解析服务测试...');
  
  try {
    // 创建测试文件
    const testDir = path.join(__dirname, '../../test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const mockResume = `张三
软件工程师  
电话：138-0000-0000
邮箱：zhangsan@example.com

工作经历：
2020-2023 ABC科技公司 高级软件工程师
- 负责前端开发和架构设计
- 使用React、Node.js开发企业级应用
- 团队协作，提升项目交付效率30%

教育背景：
2014-2018 北京大学 计算机科学与技术 本科

技能：
- 编程语言：JavaScript, Python, Java
- 前端框架：React, Vue.js
- 后端技术：Node.js, Express`;
    
    const mockFilePath = path.join(testDir, 'test-resume.txt');
    fs.writeFileSync(mockFilePath, mockResume, 'utf8');
    
    console.log('✅ [RESUME_TEST] 创建测试文件:', mockFilePath);
    
    // 测试解析
    const ResumeParseService = require('../services/resumeParseService');
    
    const startTime = Date.now();
    const result = await ResumeParseService.parseResumeFile(mockFilePath, 'txt');
    const duration = Date.now() - startTime;
    
    console.log(`✅ [RESUME_TEST] 解析完成，耗时: ${duration}ms`);
    console.log(`📊 [RESUME_TEST] 解析结果: ${result.success ? '成功' : '失败'}`);
    
    if (result.success) {
      console.log(`📊 [RESUME_TEST] 提取文本长度: ${result.extractedText.length} 字符`);
      console.log(`📊 [RESUME_TEST] 结构化数据:`, {
        hasPersonalInfo: !!result.structuredData?.personalInfo,
        workCount: result.structuredData?.workExperiences?.length || 0,
        educationCount: result.structuredData?.educations?.length || 0,
        skillsCount: result.structuredData?.skills?.length || 0
      });
    } else {
      console.error(`❌ [RESUME_TEST] 解析失败: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ [RESUME_TEST] 简历解析测试失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🎯 [MAIN] 开始快速性能测试...');
    console.log('🎯 [MAIN] 测试时间:', new Date().toISOString());
    
    // 测试AI服务
    await testAIBasic();
    
    // 测试简历解析
    await testResumeParseService();
    
    console.log('\n🎉 [MAIN] 所有测试完成！');
    
  } catch (error) {
    console.error('❌ [MAIN] 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAIBasic, testResumeParseService }; 