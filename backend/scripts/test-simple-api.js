/**
 * 简单的API测试脚本
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testAPI() {
  try {
    console.log('🧪 开始简单API测试...');
    
    // 1. 测试健康检查
    console.log('\n1️⃣ 测试健康检查...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查成功:', healthResponse.data.message);
    
    // 2. 生成测试Token
    console.log('\n2️⃣ 生成测试Token...');
    const tokenResponse = await axios.post(`${BASE_URL}/generate-token`, {
      userId: 2,
      email: 'user@example.com'
    });
    
    if (!tokenResponse.data.success) {
      throw new Error('Token生成失败');
    }
    
    const token = tokenResponse.data.token;
    console.log('✅ Token生成成功，长度:', token.length);
    
    // 3. 测试认证
    console.log('\n3️⃣ 测试认证...');
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 测试简历列表API
    try {
      const resumeResponse = await axios.get(`${BASE_URL}/api/resumes`, {
        headers: authHeaders
      });
      console.log('✅ 简历列表API正常，简历数量:', resumeResponse.data.data?.length || 0);
    } catch (error) {
      console.log('⚠️ 简历列表API错误:', error.response?.data?.message || error.message);
    }
    
    // 测试岗位列表API
    try {
      const jobResponse = await axios.get(`${BASE_URL}/api/jobs`, {
        headers: authHeaders
      });
      console.log('✅ 岗位列表API正常，岗位数量:', jobResponse.data.data?.jobs?.length || 0);
    } catch (error) {
      console.log('⚠️ 岗位列表API错误:', error.response?.data?.message || error.message);
    }
    
    // 4. 测试定制简历API（如果有数据）
    console.log('\n4️⃣ 测试定制简历API...');
    try {
      const customizedResponse = await axios.post(`${BASE_URL}/api/resumes/customize`, {
        baseResumeId: 1,  // 假设的ID
        targetJobId: 1    // 假设的ID
      }, {
        headers: authHeaders
      });
      console.log('✅ 定制简历API正常');
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      
      if (status === 404) {
        console.log('⚠️ 定制简历API: 基础简历或岗位不存在 (正常)');
      } else if (status === 409) {
        console.log('⚠️ 定制简历API: 已存在相同定制简历 (正常)');
      } else {
        console.log('⚠️ 定制简历API错误:', message);
      }
    }
    
    console.log('\n🎉 API测试完成！');
    
  } catch (error) {
    console.error('\n💥 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误详情:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

if (require.main === module) {
  testAPI();
} 