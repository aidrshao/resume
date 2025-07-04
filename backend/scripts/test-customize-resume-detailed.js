/**
 * 定制简历生成详细测试脚本
 * 用于测试和调试定制简历生成过程中的每个步骤
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const BASE_URL = 'http://localhost:8000/api';
const TEST_CONFIG = {
  email: '346935824@qq.com',
  password: 'test123456',
  baseResumeId: 26,  // 使用现有的基础简历ID
  targetJobId: 16,   // 使用现有的目标岗位ID
  timeout: 300000    // 5分钟超时
};

// 日志记录函数
function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`📋 ${title}`);
  console.log('='.repeat(60));
}

function logStep(step, message) {
  console.log(`\n🔹 [${step}] ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message, error = null) {
  console.error(`❌ ${message}`);
  if (error) {
    console.error('错误详情:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 登录获取token
async function login() {
  logStep('LOGIN', '开始登录获取token...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    });
    
    if (response.data.success) {
      logSuccess(`登录成功，用户: ${response.data.data.user.email}`);
      return response.data.data.token;
    } else {
      throw new Error(response.data.message || '登录失败');
    }
  } catch (error) {
    logError('登录失败', error);
    throw error;
  }
}

// 验证基础简历存在
async function validateBaseResume(token) {
  logStep('VALIDATE_RESUME', `验证基础简历 ID: ${TEST_CONFIG.baseResumeId}`);
  
  try {
    const response = await axios.get(`${BASE_URL}/resumes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      const resume = response.data.data.find(r => r.id === TEST_CONFIG.baseResumeId);
      if (resume) {
        logSuccess(`基础简历验证成功: ${resume.title}`);
        console.log('📄 简历信息:', {
          id: resume.id,
          title: resume.title,
          created_at: resume.created_at,
          hasUnifiedData: !!resume.unified_data
        });
        return resume;
      } else {
        throw new Error(`未找到ID为 ${TEST_CONFIG.baseResumeId} 的简历`);
      }
    } else {
      throw new Error(response.data.message || '获取简历列表失败');
    }
  } catch (error) {
    logError('验证基础简历失败', error);
    throw error;
  }
}

// 验证目标岗位存在
async function validateTargetJob(token) {
  logStep('VALIDATE_JOB', `验证目标岗位 ID: ${TEST_CONFIG.targetJobId}`);
  
  try {
    const response = await axios.get(`${BASE_URL}/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      const job = response.data.data.jobs.find(j => j.id === TEST_CONFIG.targetJobId);
      if (job) {
        logSuccess(`目标岗位验证成功: ${job.title} - ${job.company}`);
        console.log('💼 岗位信息:', {
          id: job.id,
          title: job.title,
          company: job.company,
          descriptionLength: job.description?.length || 0,
          requirementsLength: job.requirements?.length || 0,
          created_at: job.created_at
        });
        return job;
      } else {
        throw new Error(`未找到ID为 ${TEST_CONFIG.targetJobId} 的岗位`);
      }
    } else {
      throw new Error(response.data.message || '获取岗位列表失败');
    }
  } catch (error) {
    logError('验证目标岗位失败', error);
    throw error;
  }
}

// 检查是否已存在定制简历
async function checkExistingCustomizedResume(token) {
  logStep('CHECK_EXISTING', '检查是否已存在定制简历...');
  
  try {
    const response = await axios.get(`${BASE_URL}/resumes/customize/check`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        baseResumeId: TEST_CONFIG.baseResumeId,
        targetJobId: TEST_CONFIG.targetJobId
      }
    });
    
    if (response.data.success) {
      if (response.data.data.exists) {
        console.log('⚠️ 已存在定制简历:', {
          customizedResumeId: response.data.data.customizedResumeId,
          createdAt: response.data.data.createdAt
        });
        return response.data.data;
      } else {
        logSuccess('未找到已存在的定制简历，可以创建新的');
        return null;
      }
    } else {
      throw new Error(response.data.message || '检查失败');
    }
  } catch (error) {
    logError('检查定制简历失败', error);
    throw error;
  }
}

// 生成定制简历
async function generateCustomizedResume(token) {
  logStep('GENERATE', '开始生成定制简历...');
  
  const startTime = Date.now();
  const requestId = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  console.log('🚀 生成参数:', {
    requestId: requestId,
    baseResumeId: TEST_CONFIG.baseResumeId,
    targetJobId: TEST_CONFIG.targetJobId,
    forceOverwrite: false,
    timeout: TEST_CONFIG.timeout + 'ms'
  });
  
  // 进度监控
  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    console.log(`⏳ 生成进行中... 已耗时: ${elapsed}ms (${(elapsed/1000).toFixed(1)}秒)`);
  }, 15000); // 每15秒输出一次进度
  
  try {
    const response = await axios.post(`${BASE_URL}/resumes/customize`, {
      baseResumeId: TEST_CONFIG.baseResumeId,
      targetJobId: TEST_CONFIG.targetJobId,
      forceOverwrite: false
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Request-ID': requestId,
        'X-Test-Mode': 'true'
      },
      timeout: TEST_CONFIG.timeout
    });
    
    clearInterval(progressInterval);
    const duration = Date.now() - startTime;
    
    if (response.data.success) {
      logSuccess(`定制简历生成成功! 耗时: ${duration}ms (${(duration/1000).toFixed(1)}秒)`);
      
      console.log('✨ 生成结果:', {
        customizedResumeId: response.data.data.customizedResumeId,
        baseResumeTitle: response.data.data.baseResumeTitle,
        jobTitle: response.data.data.jobTitle,
        jobCompany: response.data.data.jobCompany,
        profileName: response.data.data.profileName,
        createdAt: response.data.data.createdAt
      });
      
      if (response.data.data.processingTime) {
        console.log('📊 处理时间统计:', response.data.data.processingTime);
      }
      
      return response.data.data;
    } else {
      throw new Error(response.data.message || '生成失败');
    }
  } catch (error) {
    clearInterval(progressInterval);
    const duration = Date.now() - startTime;
    
    logError(`定制简历生成失败 - 耗时: ${duration}ms (${(duration/1000).toFixed(1)}秒)`, error);
    
    // 详细的错误分析
    if (error.code === 'ECONNABORTED') {
      console.error('🔍 错误分析: 请求超时');
      console.error('   - 前端超时设置:', TEST_CONFIG.timeout + 'ms');
      console.error('   - 实际耗时:', duration + 'ms');
      console.error('   - 可能原因: AI服务响应时间过长');
    } else if (error.response) {
      console.error('🔍 错误分析: 服务器返回错误');
      console.error('   - 状态码:', error.response.status);
      console.error('   - 错误消息:', error.response.data?.message || '未知错误');
      if (error.response.data?.debug) {
        console.error('   - 调试信息:', error.response.data.debug);
      }
    } else {
      console.error('🔍 错误分析: 网络或其他错误');
      console.error('   - 错误类型:', error.constructor.name);
      console.error('   - 错误代码:', error.code);
    }
    
    throw error;
  }
}

// 验证生成的定制简历
async function validateGeneratedResume(token, customizedResumeId) {
  logStep('VALIDATE_GENERATED', `验证生成的定制简历 ID: ${customizedResumeId}`);
  
  try {
    const response = await axios.get(`${BASE_URL}/customized-resumes/${customizedResumeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      logSuccess('定制简历验证成功');
      
      const resume = response.data.data;
      console.log('📋 定制简历详情:', {
        id: resume.id,
        baseResumeId: resume.baseResumeId,
        targetJobId: resume.targetJobId,
        hasOptimizedData: !!resume.optimizedData,
        profileName: resume.optimizedData?.profile?.name || '未知',
        createdAt: resume.createdAt
      });
      
      return resume;
    } else {
      throw new Error(response.data.message || '验证失败');
    }
  } catch (error) {
    logError('验证定制简历失败', error);
    throw error;
  }
}

// 主测试流程
async function runDetailedTest() {
  logSection('定制简历生成详细测试');
  
  console.log('🎯 测试目标: 完整测试定制简历生成流程并输出详细日志');
  console.log('⏰ 开始时间:', new Date().toISOString());
  console.log('🔧 测试配置:', TEST_CONFIG);
  
  let token;
  let baseResume;
  let targetJob;
  let existingResume;
  let generatedResume;
  
  try {
    // 步骤1: 登录
    token = await login();
    
    // 步骤2: 验证基础简历
    baseResume = await validateBaseResume(token);
    
    // 步骤3: 验证目标岗位
    targetJob = await validateTargetJob(token);
    
    // 步骤4: 检查已存在的定制简历
    existingResume = await checkExistingCustomizedResume(token);
    
    // 步骤5: 生成定制简历
    generatedResume = await generateCustomizedResume(token);
    
    // 步骤6: 验证生成的定制简历
    await validateGeneratedResume(token, generatedResume.customizedResumeId);
    
    logSection('测试完成');
    logSuccess('所有测试步骤均成功完成!');
    
    console.log('🎉 测试总结:', {
      baseResume: baseResume.title,
      targetJob: `${targetJob.title} - ${targetJob.company}`,
      customizedResumeId: generatedResume.customizedResumeId,
      profileName: generatedResume.profileName,
      testDuration: '请查看各步骤的详细时间统计'
    });
    
  } catch (error) {
    logSection('测试失败');
    logError('测试过程中发生错误', error);
    
    console.log('\n🔍 故障排除建议:');
    console.log('1. 确保后端服务器正在运行 (http://localhost:8000)');
    console.log('2. 确认数据库连接正常');
    console.log('3. 检查测试用户是否存在');
    console.log('4. 验证指定的简历ID和岗位ID是否正确');
    console.log('5. 检查AI服务配置是否正确');
    console.log('6. 查看后端服务器日志获取更多信息');
    
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runDetailedTest().catch(error => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
}

module.exports = {
  runDetailedTest
}; 