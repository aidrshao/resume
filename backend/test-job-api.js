/**
 * 岗位管理API测试脚本
 * 测试岗位相关的所有API端点
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

// 测试用户凭据（请根据实际情况修改）
const TEST_USER = {
  email: 'test@example.com',
  password: 'test123456'
};

let authToken = '';

/**
 * 登录获取token
 */
async function login() {
  try {
    console.log('🔐 正在登录...');
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ 登录成功，获取到token');
      return true;
    } else {
      console.error('❌ 登录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return false;
  }
}

/**
 * 创建axios实例
 */
function createAuthenticatedAxios() {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * 测试获取岗位统计
 */
async function testGetJobStats() {
  try {
    console.log('\n📊 测试获取岗位统计...');
    const api = createAuthenticatedAxios();
    const response = await api.get('/jobs/stats');
    
    console.log('✅ 岗位统计:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 获取岗位统计失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试创建岗位
 */
async function testCreateJob() {
  try {
    console.log('\n➕ 测试创建岗位...');
    const api = createAuthenticatedAxios();
    
    const jobData = {
      title: '前端开发工程师',
      company: '测试科技有限公司',
      description: '负责前端页面开发和用户交互体验优化',
      requirements: '熟悉React、Vue等前端框架，有3年以上工作经验',
      salary_range: '15K-25K',
      location: '北京市朝阳区',
      job_type: 'full-time',
      priority: 4,
      application_deadline: '2024-07-31',
      notes: '这是一个测试岗位'
    };
    
    const response = await api.post('/jobs', jobData);
    
    console.log('✅ 岗位创建成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ 创建岗位失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试获取岗位列表
 */
async function testGetJobs() {
  try {
    console.log('\n📋 测试获取岗位列表...');
    const api = createAuthenticatedAxios();
    
    const response = await api.get('/jobs', {
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('✅ 岗位列表:', {
      总数: response.data.data.pagination.total,
      当前页: response.data.data.pagination.page,
      岗位数量: response.data.data.jobs.length
    });
    
    return response.data.data.jobs;
  } catch (error) {
    console.error('❌ 获取岗位列表失败:', error.response?.data || error.message);
    return [];
  }
}

/**
 * 测试更新岗位
 */
async function testUpdateJob(jobId) {
  try {
    console.log(`\n✏️ 测试更新岗位 (ID: ${jobId})...`);
    const api = createAuthenticatedAxios();
    
    const updateData = {
      status: 'applied',
      notes: '已投递简历，等待回复'
    };
    
    const response = await api.put(`/jobs/${jobId}`, updateData);
    
    console.log('✅ 岗位更新成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ 更新岗位失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试批量更新岗位状态
 */
async function testBatchUpdateStatus(jobIds) {
  try {
    console.log(`\n🔄 测试批量更新岗位状态...`);
    const api = createAuthenticatedAxios();
    
    const response = await api.put('/jobs/batch/status', {
      ids: jobIds,
      status: 'archived'
    });
    
    console.log('✅ 批量更新成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 批量更新失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试删除岗位
 */
async function testDeleteJob(jobId) {
  try {
    console.log(`\n🗑️ 测试删除岗位 (ID: ${jobId})...`);
    const api = createAuthenticatedAxios();
    
    const response = await api.delete(`/jobs/${jobId}`);
    
    console.log('✅ 岗位删除成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 删除岗位失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🧪 开始岗位管理API测试\n');
  
  // 1. 登录获取token
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ 无法继续测试，登录失败');
    return;
  }
  
  // 2. 获取初始统计
  await testGetJobStats();
  
  // 3. 创建测试岗位
  const createdJob = await testCreateJob();
  if (!createdJob) {
    console.log('\n❌ 无法继续测试，创建岗位失败');
    return;
  }
  
  // 4. 获取岗位列表
  const jobs = await testGetJobs();
  
  // 5. 更新岗位信息
  await testUpdateJob(createdJob.id);
  
  // 6. 批量更新状态（如果有多个岗位）
  if (jobs.length > 0) {
    const jobIds = jobs.slice(0, 2).map(job => job.id); // 取前两个岗位
    await testBatchUpdateStatus(jobIds);
  }
  
  // 7. 获取更新后的统计
  await testGetJobStats();
  
  // 8. 清理：删除测试岗位
  if (createdJob) {
    await testDeleteJob(createdJob.id);
  }
  
  console.log('\n🎉 岗位管理API测试完成！');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 测试过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  login,
  testCreateJob,
  testGetJobs,
  testUpdateJob,
  testDeleteJob
}; 