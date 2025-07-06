/**
 * V2简历解析端到端测试脚本
 * 验证使用agicto.cn AI服务的完整简历解析流程
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class V2ResumeParseE2ETest {
  constructor() {
    this.baseURL = 'http://localhost:8000';
    this.token = null;
    this.testResults = {
      tests: [],
      passed: 0,
      failed: 0,
      startTime: Date.now()
    };
  }

  /**
   * 记录测试结果
   */
  recordTest(name, passed, details = {}) {
    this.testResults.tests.push({
      name,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    if (passed) {
      this.testResults.passed++;
      console.log(`✅ [TEST] ${name}`);
    } else {
      this.testResults.failed++;
      console.log(`❌ [TEST] ${name}`);
      console.log(`❌ [ERROR] ${JSON.stringify(details, null, 2)}`);
    }
  }

  /**
   * 获取认证Token
   */
  async getAuthToken() {
    try {
      console.log('🔐 [AUTH] 获取测试用户Token...');
      
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });

      if (response.data.success && response.data.token) {
        this.token = response.data.token;
        console.log('✅ [AUTH] Token获取成功');
        return true;
      } else {
        console.log('❌ [AUTH] Token获取失败:', response.data);
        return false;
      }
    } catch (error) {
      console.log('❌ [AUTH] Token获取异常:', error.message);
      return false;
    }
  }

  /**
   * 创建测试简历文件
   */
  createTestResumeFile() {
    const testResumeContent = `
张三
邮箱：zhangsan@example.com
电话：13800138000
地址：北京市朝阳区

工作经验
2021年1月 - 至今  |  腾讯科技有限公司  |  软件工程师
• 负责微信小程序后端开发，使用Node.js和Express框架
• 优化系统架构，提升响应速度30%
• 参与多个重要项目的技术方案设计

2019年6月 - 2020年12月  |  阿里巴巴集团  |  实习生
• 参与电商平台开发，使用React和Java Spring
• 完成用户管理模块开发

教育背景
2017年9月 - 2021年6月  |  北京大学  |  计算机科学与技术  |  本科  |  GPA: 3.8

技能特长
编程语言：JavaScript, Python, Java, Go
前端技术：React, Vue, HTML, CSS
后端技术：Node.js, Spring Boot, Django
数据库：MySQL, MongoDB, Redis
工具：Git, Docker, Kubernetes

项目经验

电商管理系统 (2020年3月 - 2020年8月)
• 基于React和Node.js开发的电商后台管理系统
• 实现商品管理、订单处理、用户权限等功能
• 技术栈：React, Node.js, MongoDB

语言能力
中文：母语
英语：CET-6，流利的听说读写能力
    `.trim();

    const testFilePath = path.join(__dirname, 'test-resume.txt');
    fs.writeFileSync(testFilePath, testResumeContent, 'utf8');
    console.log('📄 [FILE] 测试简历文件已创建:', testFilePath);
    return testFilePath;
  }

  /**
   * 上传简历文件
   */
  async uploadResumeFile(filePath) {
    try {
      console.log('📤 [UPLOAD] 开始上传简历文件...');
      
      const form = new FormData();
      form.append('resume', fs.createReadStream(filePath));
      
      const response = await axios.post(
        `${this.baseURL}/api/v2/resumes/parse`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${this.token}`
          },
          timeout: 10000
        }
      );

      if (response.data.success && response.data.taskId) {
        console.log('✅ [UPLOAD] 文件上传成功, TaskID:', response.data.taskId);
        return response.data.taskId;
      } else {
        console.log('❌ [UPLOAD] 文件上传失败:', response.data);
        return null;
      }
    } catch (error) {
      console.log('❌ [UPLOAD] 文件上传异常:', error.message);
      return null;
    }
  }

  /**
   * 轮询任务状态
   */
  async pollTaskStatus(taskId, maxAttempts = 30, interval = 3000) {
    console.log(`🔄 [POLL] 开始轮询任务状态: ${taskId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 [POLL] 第${attempt}次查询任务状态...`);
        
        const response = await axios.get(
          `${this.baseURL}/api/v2/tasks/${taskId}/status`,
          {
            headers: {
              'Authorization': `Bearer ${this.token}`
            },
            timeout: 5000
          }
        );

        if (response.data.success) {
          const { status, progress, message } = response.data.data;
          console.log(`📊 [POLL] 状态: ${status}, 进度: ${progress}%, 消息: ${message}`);
          
          if (status === 'completed') {
            console.log('✅ [POLL] 任务已完成');
            return { success: true, status: 'completed', data: response.data.data };
          } else if (status === 'failed') {
            console.log('❌ [POLL] 任务失败:', response.data.data);
            return { success: false, status: 'failed', error: response.data.data };
          } else {
            // 继续轮询
            await new Promise(resolve => setTimeout(resolve, interval));
          }
        } else {
          console.log('⚠️ [POLL] 状态查询响应异常:', response.data);
        }
      } catch (error) {
        console.log(`⚠️ [POLL] 第${attempt}次查询失败:`, error.message);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    console.log('❌ [POLL] 轮询超时，任务未完成');
    return { success: false, status: 'timeout', error: '轮询超时' };
  }

  /**
   * 获取解析结果
   */
  async getParseResult(taskId) {
    try {
      console.log('📥 [RESULT] 获取解析结果...');
      
      const response = await axios.get(
        `${this.baseURL}/api/v2/tasks/${taskId}/result`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          },
          timeout: 5000
        }
      );

      if (response.data.success && response.data.data) {
        console.log('✅ [RESULT] 解析结果获取成功');
        return response.data.data;
      } else {
        console.log('❌ [RESULT] 解析结果获取失败:', response.data);
        return null;
      }
    } catch (error) {
      console.log('❌ [RESULT] 解析结果获取异常:', error.message);
      return null;
    }
  }

  /**
   * 验证解析结果
   */
  validateParseResult(result) {
    console.log('🔍 [VALIDATE] 开始验证解析结果...');
    
    const validation = {
      hasResumeData: !!result.resumeData,
      hasProfile: !!result.resumeData?.profile,
      hasValidName: !!result.resumeData?.profile?.name,
      hasValidEmail: !!result.resumeData?.profile?.email,
      hasValidPhone: !!result.resumeData?.profile?.phone,
      hasWorkExperience: Array.isArray(result.resumeData?.workExperience) && result.resumeData.workExperience.length > 0,
      hasEducation: Array.isArray(result.resumeData?.education) && result.resumeData.education.length > 0,
      hasSkills: Array.isArray(result.resumeData?.skills) && result.resumeData.skills.length > 0
    };

    console.log('🔍 [VALIDATE] 验证结果详情:');
    Object.entries(validation).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    });

    // 详细数据检查
    console.log('🔍 [VALIDATE] 解析数据详情:');
    console.log('  - 姓名:', result.resumeData?.profile?.name || '未提取');
    console.log('  - 邮箱:', result.resumeData?.profile?.email || '未提取');
    console.log('  - 电话:', result.resumeData?.profile?.phone || '未提取');
    console.log('  - 工作经验数量:', result.resumeData?.workExperience?.length || 0);
    console.log('  - 教育背景数量:', result.resumeData?.education?.length || 0);
    console.log('  - 技能数量:', result.resumeData?.skills?.length || 0);

    const passedCount = Object.values(validation).filter(v => v).length;
    const totalCount = Object.keys(validation).length;
    const successRate = (passedCount / totalCount * 100).toFixed(1);
    
    console.log(`📊 [VALIDATE] 验证通过率: ${successRate}% (${passedCount}/${totalCount})`);
    
    return {
      validation,
      passedCount,
      totalCount,
      successRate: parseFloat(successRate),
      isValid: passedCount >= 6 // 至少6项通过认为有效
    };
  }

  /**
   * 运行完整测试流程
   */
  async runFullTest() {
    console.log('🚀 [E2E_TEST] 开始V2简历解析端到端测试');
    console.log('🚀 [E2E_TEST] 目标: 验证agicto.cn AI服务集成');
    console.log('🚀 [E2E_TEST] 开始时间:', new Date().toISOString());
    
    let testFilePath = null;
    
    try {
      // 步骤1: 获取认证Token
      const hasToken = await this.getAuthToken();
      this.recordTest('获取认证Token', hasToken);
      if (!hasToken) return;

      // 步骤2: 创建测试文件
      testFilePath = this.createTestResumeFile();
      this.recordTest('创建测试简历文件', !!testFilePath);

      // 步骤3: 上传文件
      const taskId = await this.uploadResumeFile(testFilePath);
      this.recordTest('上传简历文件', !!taskId, { taskId });
      if (!taskId) return;

      // 步骤4: 轮询任务状态
      const pollResult = await this.pollTaskStatus(taskId);
      this.recordTest('任务处理完成', pollResult.success, pollResult);
      if (!pollResult.success) return;

      // 步骤5: 获取解析结果
      const parseResult = await this.getParseResult(taskId);
      this.recordTest('获取解析结果', !!parseResult, { hasResult: !!parseResult });
      if (!parseResult) return;

      // 步骤6: 验证解析结果
      const validation = this.validateParseResult(parseResult);
      this.recordTest('解析结果验证', validation.isValid, validation);

      console.log('🎯 [E2E_TEST] 完整测试流程结束');
      
    } catch (error) {
      console.error('❌ [E2E_TEST] 测试过程中发生异常:', error);
      this.recordTest('测试流程异常', false, { error: error.message });
    } finally {
      // 清理测试文件
      if (testFilePath && fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
        console.log('🧹 [CLEANUP] 测试文件已清理');
      }
    }

    // 生成测试报告
    this.generateTestReport();
  }

  /**
   * 生成测试报告
   */
  generateTestReport() {
    const endTime = Date.now();
    const totalTime = endTime - this.testResults.startTime;
    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? (this.testResults.passed / total * 100).toFixed(1) : 0;

    console.log('\n📊 [REPORT] V2简历解析E2E测试报告');
    console.log('==========================================');
    console.log(`✅ 通过测试: ${this.testResults.passed}`);
    console.log(`❌ 失败测试: ${this.testResults.failed}`);
    console.log(`📈 成功率: ${successRate}%`);
    console.log(`⏱️ 总耗时: ${totalTime}ms`);
    console.log(`🕐 结束时间: ${new Date().toISOString()}`);
    
    if (this.testResults.passed >= 5) {
      console.log('🎉 [REPORT] agicto.cn AI服务集成测试通过！');
    } else {
      console.log('⚠️ [REPORT] 测试存在问题，请检查相关服务');
    }
    
    console.log('\n📋 [REPORT] 详细测试结果:');
    this.testResults.tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.passed ? '✅' : '❌'} ${test.name}`);
      if (!test.passed && test.details) {
        console.log(`   错误详情: ${JSON.stringify(test.details)}`);
      }
    });
  }
}

// 主函数
async function main() {
  const tester = new V2ResumeParseE2ETest();
  await tester.runFullTest();
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = V2ResumeParseE2ETest; 