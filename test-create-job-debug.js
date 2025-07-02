/**
 * 测试创建岗位的完整流程
 * 用于调试前端和后端的交互
 */

const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:8000/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc1MTQzNTIzNywiZXhwIjoxNzUyMDQwMDM3fQ.XUDa5PnoeBwVDNkHwV0gWWO-bFRFaoAuSkjsLIOfreM';

/**
 * 创建axios实例
 */
function createAuthenticatedAxios() {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * 测试创建岗位
 */
async function testCreateJob() {
  console.log('🧪 [测试] 开始测试创建岗位流程...\n');
  
  try {
    const api = createAuthenticatedAxios();
    
    // 模拟前端发送的数据
    const jobData = {
      title: 'AI产品经理',
      company: '某科技有限公司',
      description: '1. 主导AI软件产品全生命周期，涵盖需求分析、规划、开发、测试上线与运营维护，负责各阶段风险管理与问题解决，确保项目按计划推进\n2. 与内部各部门紧密协作，梳理业务痛点并转化为产品需求和功能特性，定期组织跨部门会议促进沟通，提升协作效率',
      requirements: '1. 自我驱动力：具有强烈的自我驱动力，能够在无监督的情况下主动完成任务，达成目标\n2. 主动性及持续学习：具有高度的主动性，愿意不断学习和提升自己，积极参与团队合作，持续接受培训，跟上技术发展的步伐'
    };
    
    console.log('📋 [测试] 发送的岗位数据:');
    console.log(JSON.stringify(jobData, null, 2));
    console.log('');
    
    console.log('🌐 [测试] 发送POST请求到 /jobs...');
    const startTime = Date.now();
    
    const response = await api.post('/jobs', jobData);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ [测试] 请求完成，耗时:', duration + 'ms');
    console.log('📊 [测试] 响应状态:', response.status);
    console.log('📊 [测试] 响应头:', response.headers);
    console.log('📊 [测试] 响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 验证响应格式
    if (response.data && response.data.success) {
      console.log('\n🎉 [测试] 创建岗位成功！');
      console.log('📋 [测试] 创建的岗位ID:', response.data.data?.id);
      console.log('📋 [测试] 岗位标题:', response.data.data?.title);
      console.log('📋 [测试] 公司名称:', response.data.data?.company);
      
      // 测试获取岗位列表
      await testGetJobs();
      
    } else {
      console.log('\n❌ [测试] 创建岗位失败');
      console.log('❌ [测试] 错误信息:', response.data?.message);
    }
    
  } catch (error) {
    console.error('\n💥 [测试] 请求失败:', error.message);
    
    if (error.response) {
      console.error('💥 [测试] 响应状态:', error.response.status);
      console.error('💥 [测试] 响应数据:', error.response.data);
    } else if (error.request) {
      console.error('💥 [测试] 请求超时或网络错误');
    }
  }
}

/**
 * 测试获取岗位列表
 */
async function testGetJobs() {
  console.log('\n📋 [测试] 测试获取岗位列表...');
  
  try {
    const api = createAuthenticatedAxios();
    
    const response = await api.get('/jobs', {
      params: {
        page: 1,
        limit: 12
      }
    });
    
    console.log('✅ [测试] 获取岗位列表成功');
    console.log('📊 [测试] 岗位总数:', response.data.data?.pagination?.total);
    console.log('📊 [测试] 当前页岗位数:', response.data.data?.jobs?.length);
    
    if (response.data.data?.jobs?.length > 0) {
      console.log('📋 [测试] 最新岗位:');
      const latestJob = response.data.data.jobs[0];
      console.log(`  - ID: ${latestJob.id}`);
      console.log(`  - 标题: ${latestJob.title}`);
      console.log(`  - 公司: ${latestJob.company}`);
      console.log(`  - 状态: ${latestJob.status}`);
      console.log(`  - 创建时间: ${latestJob.created_at}`);
    }
    
  } catch (error) {
    console.error('❌ [测试] 获取岗位列表失败:', error.message);
  }
}

/**
 * 测试获取统计信息
 */
async function testGetStats() {
  console.log('\n📊 [测试] 测试获取统计信息...');
  
  try {
    const api = createAuthenticatedAxios();
    
    const response = await api.get('/jobs/stats');
    
    console.log('✅ [测试] 获取统计信息成功');
    console.log('📊 [测试] 统计数据:', response.data.data);
    
  } catch (error) {
    console.error('❌ [测试] 获取统计信息失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始调试创建岗位流程\n');
  
  // 先获取当前统计
  await testGetStats();
  
  // 创建岗位
  await testCreateJob();
  
  // 再次获取统计
  await testGetStats();
  
  console.log('\n🎉 调试完成！');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
} 