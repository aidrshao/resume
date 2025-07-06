/**
 * V2简历解析流程完整修复测试
 * 验证超时控制、错误处理和降级机制
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc1MTc2Mjg3MSwiZXhwIjoxNzUyMzY3NjcxfQ.y6Yyzo0bNSq9c6gsqpLVrJAjJUrcIHVXeK6BOl8fvS4';

/**
 * 创建测试简历文件
 */
function createTestResumeFile() {
  const testContent = `
张伟
高级软件工程师

联系方式：
电话：13800138001
邮箱：zhangwei@techcorp.com
地址：北京市海淀区中关村
LinkedIn: linkedin.com/in/zhangwei-dev

个人简介：
具有5年以上软件开发经验的高级工程师，专注于全栈开发和系统架构设计。擅长使用现代JavaScript技术栈和云原生技术，具备丰富的团队管理和项目交付经验。

工作经验：
2021.03 - 至今    TechCorp科技有限公司    高级软件工程师
• 负责公司核心产品的架构设计和开发工作
• 使用React、Node.js、TypeScript构建大型Web应用
• 带领6人团队完成了用户管理系统的重构，提升性能40%
• 设计并实现了微服务架构，支撑日活10万+用户

2019.07 - 2021.02    StartupXYZ创业公司    全栈开发工程师
• 从零搭建公司技术基础设施和开发流程
• 使用Vue.js + Python Django开发SaaS平台
• 实现了CI/CD流水线，将部署时间从2小时缩短至10分钟
• 参与产品需求设计和技术方案评审

教育背景：
2014.09 - 2018.06    清华大学    计算机科学与技术    本科    GPA: 3.8/4.0

核心技能：
编程语言：JavaScript, TypeScript, Python, Java, Go
前端技术：React, Vue.js, Angular, HTML5, CSS3, Sass, Webpack
后端技术：Node.js, Express, Django, Spring Boot, FastAPI
数据库：MySQL, PostgreSQL, MongoDB, Redis
云服务：AWS, 阿里云, Docker, Kubernetes
开发工具：Git, Jenkins, JIRA, VS Code, IntelliJ IDEA

项目经验：

1. 智能简历分析系统 (2023.01 - 2023.06)
项目描述：基于AI技术的简历解析和匹配系统
技术栈：React, Node.js, PostgreSQL, OpenAI API
主要成就：
• 设计了高效的简历解析算法，准确率达到95%
• 实现了实时简历匹配功能，响应时间<200ms
• 使用Redis缓存优化系统性能，并发处理能力提升3倍

2. 电商微服务平台 (2022.03 - 2022.12)
项目描述：大型电商平台的微服务化改造
技术栈：Spring Boot, Docker, Kubernetes, MySQL
主要成就：
• 将单体应用拆分为15个微服务，提升系统可维护性
• 实现了分布式事务处理，保证数据一致性
• 引入服务监控和链路追踪，系统可观测性大幅提升

认证证书：
• AWS Certified Solutions Architect (2022)
• 阿里云云计算专业认证 (2021)
• 项目管理PMP认证 (2023)

语言能力：
• 中文：母语
• 英语：专业熟练 (CET-6: 580分)
• 日语：日常交流 (JLPT N3)
  `;

  const uploadsDir = path.join(__dirname, 'uploads', 'v2', 'resumes');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `test-resume-${Date.now()}.txt`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, testContent, 'utf8');
  
  return { filePath, fileName };
}

/**
 * 上传并解析简历
 */
async function testResumeParseFlow() {
  try {
    console.log('🚀 [TEST] ==> 开始V2简历解析流程测试');
    console.log('🚀 [TEST] 目标: 验证超时控制和错误处理修复');
    console.log('🚀 [TEST] 时间:', new Date().toISOString());
    
    const startTime = Date.now();
    
    // 步骤1：创建测试文件
    console.log('\n📄 [TEST] 步骤1: 创建测试简历文件');
    const { filePath, fileName } = createTestResumeFile();
    console.log('✅ [TEST] 测试文件创建成功:', fileName);
    console.log('📍 [TEST] 文件路径:', filePath);
    console.log('📏 [TEST] 文件大小:', fs.statSync(filePath).size, 'bytes');
    
    // 步骤2：准备表单数据
    console.log('\n📤 [TEST] 步骤2: 准备上传数据');
    const formData = new FormData();
    formData.append('resume', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'text/plain'
    });
    formData.append('userId', '2');
    
    // 步骤3：上传文件
    console.log('\n🚀 [TEST] 步骤3: 发起解析请求');
    console.log('🎯 [TEST] API地址: POST /api/v2/resumes/parse');
    
    const uploadResponse = await axios.post(`${BASE_URL}/api/v2/resumes/parse`, formData, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        ...formData.getHeaders()
      },
      timeout: 10000
    });

    console.log('✅ [TEST] 解析请求发送成功');
    console.log('📊 [TEST] 响应状态:', uploadResponse.status);
    console.log('📊 [TEST] 响应数据:', JSON.stringify(uploadResponse.data, null, 2));
    
    if (!uploadResponse.data.success) {
      throw new Error('上传失败: ' + uploadResponse.data.message);
    }
    
    const taskId = uploadResponse.data.data.taskId;
    console.log('🆔 [TEST] 任务ID:', taskId);
    
    // 步骤4：轮询任务状态
    console.log('\n🔄 [TEST] 步骤4: 监控任务进度');
    let taskResult = null;
    let pollCount = 0;
    const maxPolls = 30; // 最多轮询30次 (150秒)
    const pollInterval = 5000; // 5秒间隔
    
    while (pollCount < maxPolls) {
      pollCount++;
      console.log(`\n🔍 [TEST] 第${pollCount}次状态查询 (${new Date().toLocaleTimeString()})`);
      
      try {
        const statusResponse = await axios.get(
          `${BASE_URL}/api/v2/tasks/${taskId}/status`,
          {
            headers: { 'Authorization': `Bearer ${TOKEN}` },
            timeout: 8000
          }
        );
        
        const statusData = statusResponse.data.data;
        console.log('📊 [TEST] 任务状态:', {
          status: statusData.status,
          progress: statusData.progress,
          message: statusData.message,
          updated_at: statusData.updated_at
        });
        
        if (statusData.status === 'completed') {
          console.log('✅ [TEST] 任务完成！正在获取结果...');
          
          // 获取解析结果
          const resultResponse = await axios.get(
            `${BASE_URL}/api/v2/tasks/${taskId}/result`,
            {
              headers: { 'Authorization': `Bearer ${TOKEN}` },
              timeout: 8000
            }
          );
          
          taskResult = resultResponse.data;
          break;
          
        } else if (statusData.status === 'failed') {
          console.log('❌ [TEST] 任务失败:', statusData.error || '未知错误');
          break;
          
        } else if (statusData.status === 'processing') {
          const progress = statusData.progress || '0';
          console.log(`⏳ [TEST] 任务进行中... 进度: ${progress}%`);
          
          // 检查是否在60%卡住超过30秒
          if (progress === '60' && pollCount > 6) {
            console.log('⚠️ [TEST] 检测到任务可能卡在60%，但继续等待...');
          }
        }
        
      } catch (pollError) {
        console.error('❌ [TEST] 状态查询失败:', pollError.message);
      }
      
      // 等待下次轮询
      if (pollCount < maxPolls) {
        console.log(`⏳ [TEST] 等待${pollInterval/1000}秒后继续查询...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    // 步骤5：分析结果
    const totalTime = Date.now() - startTime;
    console.log('\n📊 [TEST] ===== 测试结果分析 =====');
    console.log('⏱️ [TEST] 总耗时:', totalTime, 'ms');
    console.log('🔢 [TEST] 轮询次数:', pollCount);
    
    if (taskResult) {
      console.log('✅ [TEST] 🎉 测试成功！任务正常完成');
      console.log('📄 [TEST] 解析结果摘要:');
      
      if (taskResult.data && taskResult.data.resume_data) {
        const resumeData = taskResult.data.resume_data;
        console.log('  - 姓名:', resumeData.personalInfo?.name || '未提取');
        console.log('  - 邮箱:', resumeData.personalInfo?.email || '未提取');
        console.log('  - 电话:', resumeData.personalInfo?.phone || '未提取');
        console.log('  - 工作经验条数:', resumeData.workExperience?.length || 0);
        console.log('  - 教育背景条数:', resumeData.education?.length || 0);
        console.log('  - 技能数量:', resumeData.skills?.length || 0);
        console.log('  - 项目数量:', resumeData.projects?.length || 0);
      }
      
    } else if (pollCount >= maxPolls) {
      console.log('⏰ [TEST] ❌ 测试超时！任务未能在150秒内完成');
      console.log('🔍 [TEST] 这可能表示：');
      console.log('  1. 任务仍在60%卡死（修复未生效）');
      console.log('  2. 任务处理时间过长');
      console.log('  3. 网络或服务器问题');
      
    } else {
      console.log('❌ [TEST] ❌ 测试失败！任务执行失败');
    }
    
    // 步骤6：清理测试文件
    console.log('\n🧹 [TEST] 步骤6: 清理测试文件');
    try {
      fs.unlinkSync(filePath);
      console.log('✅ [TEST] 测试文件清理完成');
    } catch (cleanupError) {
      console.warn('⚠️ [TEST] 清理测试文件失败:', cleanupError.message);
    }
    
    console.log('\n🏁 [TEST] 测试流程完成');
    console.log('='.repeat(60));
    
    return {
      success: !!taskResult,
      duration: totalTime,
      pollCount,
      taskResult
    };
    
  } catch (error) {
    console.error('❌ [TEST] 测试过程中发生错误:', error);
    console.error('❌ [TEST] 错误堆栈:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 多次测试以验证稳定性
 */
async function runMultipleTests(count = 2) {
  console.log(`🧪 [MULTI_TEST] 开始执行${count}次测试以验证稳定性`);
  console.log('🧪 [MULTI_TEST] 目标：验证修复后的稳定性和一致性\n');
  
  const results = [];
  
  for (let i = 1; i <= count; i++) {
    console.log(`\n🔄 [MULTI_TEST] ========== 第 ${i}/${count} 次测试 ==========`);
    
    const testResult = await testResumeParseFlow();
    results.push({
      testNumber: i,
      ...testResult
    });
    
    // 测试间间隔
    if (i < count) {
      console.log('\n⏳ [MULTI_TEST] 等待10秒后开始下一次测试...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // 汇总分析
  console.log('\n📊 [MULTI_TEST] ========== 汇总分析 ==========');
  const successCount = results.filter(r => r.success).length;
  const averageDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log('✅ [MULTI_TEST] 成功次数:', `${successCount}/${count}`);
  console.log('📈 [MULTI_TEST] 成功率:', `${(successCount/count*100).toFixed(1)}%`);
  console.log('⏱️ [MULTI_TEST] 平均耗时:', `${averageDuration.toFixed(0)}ms`);
  
  if (successCount === count) {
    console.log('🎉 [MULTI_TEST] 🎉 完美！所有测试都成功，修复生效！');
  } else if (successCount > 0) {
    console.log('⚠️ [MULTI_TEST] 部分成功，可能仍存在间歇性问题');
  } else {
    console.log('❌ [MULTI_TEST] 全部失败，修复可能未生效');
  }
  
  console.log('\n📋 [MULTI_TEST] 详细结果:');
  results.forEach(result => {
    console.log(`  测试${result.testNumber}: ${result.success ? '✅ 成功' : '❌ 失败'} ` +
                `${result.duration ? `(${result.duration}ms)` : ''} ` +
                `${result.error ? `错误: ${result.error}` : ''}`);
  });
}

// 主函数
async function main() {
  console.log('🚀 V2简历解析流程完整修复测试');
  console.log('💡 目标：验证超时控制、错误处理和降级机制的修复效果');
  console.log('🕐 开始时间:', new Date().toLocaleString());
  console.log('='.repeat(60));
  
  // 检查服务是否可用
  try {
    console.log('🔍 检查后端服务状态...');
    const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ 后端服务正常:', healthResponse.data);
  } catch (healthError) {
    console.error('❌ 后端服务不可用:', healthError.message);
    console.error('💡 请确保后端服务已启动 (npm start)');
    process.exit(1);
  }
  
  // 执行多次测试
  await runMultipleTests(2);
  
  console.log('\n🏁 所有测试完成');
  console.log('🕐 结束时间:', new Date().toLocaleString());
}

// 启动测试
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 主程序执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testResumeParseFlow,
  runMultipleTests
}; 