/**
 * 简历解析性能测试脚本
 * 用于测试和监控简历解析流程的性能表现
 */

const path = require('path');
const fs = require('fs');

// 设置环境变量
process.env.NODE_ENV = 'development';

// 引入服务
const ResumeParseService = require('../services/resumeParseService');
const TaskQueueService = require('../services/taskQueueService');
const AIService = require('../services/aiService');

/**
 * 性能测试主函数
 */
async function runPerformanceTest() {
  console.log('🚀 [PERFORMANCE_TEST] ==> 开始简历解析性能测试');
  console.log('🚀 [PERFORMANCE_TEST] 测试时间:', new Date().toISOString());
  
  // 测试用例文件路径
  const testFiles = [
    {
      name: 'Test PDF Resume',
      path: path.join(__dirname, '../../test-files/sample-resume.pdf'),
      type: 'pdf'
    },
    {
      name: 'Test Word Resume',
      path: path.join(__dirname, '../../test-files/sample-resume.docx'),
      type: 'docx'
    }
  ];
  
  console.log('📋 [PERFORMANCE_TEST] 测试用例:', testFiles.map(f => ({ name: f.name, exists: fs.existsSync(f.path) })));
  
  // 找到可用的测试文件
  const availableFiles = testFiles.filter(f => fs.existsSync(f.path));
  
  if (availableFiles.length === 0) {
    console.warn('⚠️ [PERFORMANCE_TEST] 没有找到测试文件，创建模拟文件...');
    
    // 创建测试目录
    const testDir = path.join(__dirname, '../../test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // 创建模拟文本文件
    const mockResume = `
张三
软件工程师
电话：138-0000-0000
邮箱：zhangsan@example.com

工作经历：
2020-2023 ABC科技公司 高级软件工程师
- 负责前端开发和架构设计
- 使用React、Node.js开发企业级应用
- 团队协作，提升项目交付效率30%

2018-2020 XYZ公司 软件工程师
- 参与多个项目的开发和维护
- 掌握Java、Python等编程语言

教育背景：
2014-2018 北京大学 计算机科学与技术 本科

技能：
- 编程语言：JavaScript, Python, Java
- 前端框架：React, Vue.js
- 后端技术：Node.js, Express
- 数据库：MySQL, MongoDB
`;
    
    const mockFilePath = path.join(testDir, 'mock-resume.txt');
    fs.writeFileSync(mockFilePath, mockResume, 'utf8');
    
    availableFiles.push({
      name: 'Mock Text Resume',
      path: mockFilePath,
      type: 'txt'
    });
    
    console.log('✅ [PERFORMANCE_TEST] 已创建模拟测试文件:', mockFilePath);
  }
  
  // 运行测试
  for (const testFile of availableFiles) {
    console.log(`\n🎯 [PERFORMANCE_TEST] 开始测试: ${testFile.name}`);
    await testSingleFile(testFile);
  }
  
  console.log('\n🎉 [PERFORMANCE_TEST] 所有测试完成！');
}

/**
 * 测试单个文件的解析性能
 */
async function testSingleFile(testFile) {
  const startTime = Date.now();
  
  try {
    console.log(`📄 [FILE_TEST] 文件: ${testFile.name}`);
    console.log(`📄 [FILE_TEST] 路径: ${testFile.path}`);
    console.log(`📄 [FILE_TEST] 类型: ${testFile.type}`);
    
    // 检查文件大小
    const stats = fs.statSync(testFile.path);
    console.log(`📄 [FILE_TEST] 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // 测试文本提取
    console.log(`\n🔍 [STAGE_1] 开始文本提取测试...`);
    const extractStartTime = Date.now();
    
    const extractedText = await ResumeParseService.extractTextFromFile(testFile.path, testFile.type);
    
    const extractDuration = Date.now() - extractStartTime;
    console.log(`✅ [STAGE_1] 文本提取完成，耗时: ${extractDuration}ms`);
    console.log(`📊 [STAGE_1] 提取文本长度: ${extractedText.length} 字符`);
    console.log(`📊 [STAGE_1] 提取速度: ${(extractedText.length / (extractDuration / 1000)).toFixed(1)} 字符/秒`);
    
    // 显示文本预览
    const preview = extractedText.substring(0, 200);
    console.log(`👀 [STAGE_1] 文本预览: ${preview}${extractedText.length > 200 ? '...' : ''}`);
    
    // 测试AI解析
    console.log(`\n🤖 [STAGE_2] 开始AI解析测试...`);
    const aiStartTime = Date.now();
    
    const aiService = new AIService();
    const structuredData = await aiService.parseResumeWithAI(extractedText);
    
    const aiDuration = Date.now() - aiStartTime;
    console.log(`✅ [STAGE_2] AI解析完成，耗时: ${aiDuration}ms`);
    console.log(`📊 [STAGE_2] AI处理速度: ${(extractedText.length / (aiDuration / 1000)).toFixed(1)} 字符/秒`);
    
    // 显示解析结果预览
    console.log(`🧠 [STAGE_2] 解析结果预览:`, {
      hasPersonalInfo: !!structuredData.personalInfo,
      workExperienceCount: structuredData.workExperience?.length || 0,
      educationCount: structuredData.education?.length || 0,
      skillsCount: structuredData.skills?.length || 0,
      projectsCount: structuredData.projects?.length || 0
    });
    
    // 测试完整流程
    console.log(`\n🔄 [STAGE_3] 开始完整流程测试...`);
    const fullStartTime = Date.now();
    
    const fullResult = await ResumeParseService.parseResumeFile(testFile.path, testFile.type, 'test-user-1');
    
    const fullDuration = Date.now() - fullStartTime;
    console.log(`✅ [STAGE_3] 完整流程完成，耗时: ${fullDuration}ms`);
    
    // 总体性能统计
    const totalDuration = Date.now() - startTime;
    console.log(`\n📊 [PERFORMANCE_SUMMARY] 性能统计:`);
    console.log(`  - 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`  - 文本提取: ${extractDuration}ms (${((extractDuration / totalDuration) * 100).toFixed(1)}%)`);
    console.log(`  - AI解析: ${aiDuration}ms (${((aiDuration / totalDuration) * 100).toFixed(1)}%)`);
    console.log(`  - 完整流程: ${fullDuration}ms`);
    console.log(`  - 总测试时间: ${totalDuration}ms`);
    console.log(`  - 平均处理速度: ${(extractedText.length / (totalDuration / 1000)).toFixed(1)} 字符/秒`);
    
    // 性能评估
    console.log(`\n🏆 [PERFORMANCE_EVALUATION] 性能评估:`);
    if (totalDuration < 30000) {
      console.log(`  ✅ 性能优秀：总耗时 ${(totalDuration/1000).toFixed(1)}秒`);
    } else if (totalDuration < 60000) {
      console.log(`  ⚠️ 性能一般：总耗时 ${(totalDuration/1000).toFixed(1)}秒`);
    } else {
      console.log(`  ❌ 性能需要优化：总耗时 ${(totalDuration/1000).toFixed(1)}秒`);
    }
    
    // 瓶颈分析
    if (aiDuration > totalDuration * 0.7) {
      console.log(`  🔍 瓶颈分析：AI解析耗时占比${((aiDuration / totalDuration) * 100).toFixed(1)}%，可能需要优化AI调用`);
    } else if (extractDuration > totalDuration * 0.3) {
      console.log(`  🔍 瓶颈分析：文本提取耗时占比${((extractDuration / totalDuration) * 100).toFixed(1)}%，可能需要优化文本提取`);
    } else {
      console.log(`  ✅ 瓶颈分析：各阶段耗时均衡，性能表现良好`);
    }
    
  } catch (error) {
    const errorDuration = Date.now() - startTime;
    console.error(`❌ [FILE_TEST] 文件测试失败，耗时: ${errorDuration}ms`);
    console.error(`❌ [FILE_TEST] 错误信息:`, error.message);
    console.error(`❌ [FILE_TEST] 详细错误:`, error);
  }
}

/**
 * 测试AI服务性能
 */
async function testAIService() {
  console.log('\n🤖 [AI_SERVICE_TEST] 开始AI服务性能测试...');
  
  const testPrompts = [
    {
      name: '简单提示',
      prompt: '请说"你好"',
      expectedLength: 10
    },
    {
      name: '中等提示',
      prompt: '请分析这个简历的优缺点：张三，软件工程师，5年经验，熟悉Java、Python、React',
      expectedLength: 200
    },
    {
      name: '复杂提示',
      prompt: `请详细分析以下简历并提供改进建议：
姓名：李四
职位：高级前端开发工程师
经验：8年
技能：JavaScript, React, Vue.js, Node.js, TypeScript
工作经历：
1. 2020-2023 ABC公司 高级前端工程师
2. 2018-2020 XYZ公司 前端开发工程师
3. 2016-2018 DEF公司 初级前端工程师
教育背景：2012-2016 清华大学 计算机科学与技术`,
      expectedLength: 500
    }
  ];
  
  const aiService = new AIService();
  
  for (const testCase of testPrompts) {
    console.log(`\n📝 [AI_TEST] 测试: ${testCase.name}`);
    const startTime = Date.now();
    
    try {
      const result = await aiService.generateText(testCase.prompt, 'deepseek');
      const duration = Date.now() - startTime;
      
      console.log(`✅ [AI_TEST] 成功，耗时: ${duration}ms`);
      console.log(`📊 [AI_TEST] 输入长度: ${testCase.prompt.length} 字符`);
      console.log(`📊 [AI_TEST] 输出长度: ${result.length} 字符`);
      console.log(`📊 [AI_TEST] 处理速度: ${(result.length / (duration / 1000)).toFixed(1)} 字符/秒`);
      console.log(`👀 [AI_TEST] 结果预览: ${result.substring(0, 100)}...`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [AI_TEST] 失败，耗时: ${duration}ms`);
      console.error(`❌ [AI_TEST] 错误: ${error.message}`);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🎯 [MAIN] 开始性能测试套件...');
    
    // 测试1: 简历解析性能
    await runPerformanceTest();
    
    // 测试2: AI服务性能
    await testAIService();
    
    console.log('\n🎉 [MAIN] 所有性能测试完成！');
    
  } catch (error) {
    console.error('❌ [MAIN] 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runPerformanceTest,
  testSingleFile,
  testAIService
}; 