/**
 * 测试定制简历API功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// 生成测试Token
async function generateTestToken() {
  try {
    const response = await axios.post(`${BASE_URL}/generate-token`, {
      userId: 2,
      email: 'user@example.com'
    });
    
    if (response.data.success) {
      console.log('✅ Token生成成功');
      return response.data.token;
    } else {
      throw new Error('Token生成失败');
    }
  } catch (error) {
    console.error('❌ Token生成失败:', error.message);
    throw error;
  }
}

// 获取简历列表
async function getResumes(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/resumes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 获取简历列表成功');
    console.log('📋 简历数量:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      const baseResume = response.data.data.find(resume => resume.is_base);
      if (baseResume) {
        console.log('📄 找到基础简历:', baseResume.id, baseResume.title);
        return baseResume;
      } else {
        console.log('⚠️ 未找到基础简历');
        return response.data.data[0]; // 使用第一个简历作为基础简历
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ 获取简历列表失败:', error.response?.data || error.message);
    throw error;
  }
}

// 获取岗位列表
async function getJobs(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 获取岗位列表成功');
    console.log('💼 岗位数量:', response.data.data?.jobs?.length || 0);
    
    if (response.data.data?.jobs && response.data.data.jobs.length > 0) {
      const targetJob = response.data.data.jobs[0];
      console.log('🎯 选择目标岗位:', targetJob.id, targetJob.title, targetJob.company);
      return targetJob;
    }
    
    return null;
  } catch (error) {
    console.error('❌ 获取岗位列表失败:', error.response?.data || error.message);
    throw error;
  }
}

// 生成定制简历
async function generateCustomizedResume(token, baseResumeId, targetJobId) {
  try {
    console.log('🚀 开始生成定制简历...');
    console.log('📋 基础简历ID:', baseResumeId);
    console.log('🎯 目标岗位ID:', targetJobId);
    
    const response = await axios.post(`${BASE_URL}/api/resumes/customize`, {
      baseResumeId: baseResumeId,
      targetJobId: targetJobId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 定制简历生成成功');
    console.log('📄 定制简历ID:', response.data.data?.customizedResumeId);
    
    return response.data;
  } catch (error) {
    console.error('❌ 生成定制简历失败:', error.response?.data || error.message);
    throw error;
  }
}

// 获取定制简历详情
async function getCustomizedResumeById(token, customizedResumeId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/customized-resumes/${customizedResumeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 获取定制简历详情成功');
    console.log('📄 简历标题:', response.data.data?.baseResumeTitle);
    console.log('🎯 目标岗位:', response.data.data?.targetJobTitle);
    
    return response.data;
  } catch (error) {
    console.error('❌ 获取定制简历详情失败:', error.response?.data || error.message);
    throw error;
  }
}

// 主测试函数
async function runTest() {
  try {
    console.log('🧪 开始测试定制简历API...');
    
    // 1. 生成测试Token
    console.log('\n1️⃣ 生成测试Token...');
    const token = await generateTestToken();
    
    // 2. 获取基础简历
    console.log('\n2️⃣ 获取基础简历...');
    const baseResume = await getResumes(token);
    if (!baseResume) {
      throw new Error('没有找到可用的基础简历');
    }
    
    // 3. 获取目标岗位
    console.log('\n3️⃣ 获取目标岗位...');
    const targetJob = await getJobs(token);
    if (!targetJob) {
      throw new Error('没有找到可用的目标岗位');
    }
    
    // 4. 生成定制简历
    console.log('\n4️⃣ 生成定制简历...');
    const customizedResult = await generateCustomizedResume(token, baseResume.id, targetJob.id);
    
    // 5. 获取定制简历详情
    if (customizedResult.data?.customizedResumeId) {
      console.log('\n5️⃣ 获取定制简历详情...');
      await getCustomizedResumeById(token, customizedResult.data.customizedResumeId);
    }
    
    console.log('\n🎉 所有测试通过！');
    
  } catch (error) {
    console.error('\n💥 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTest();
}

module.exports = { runTest };
