/**
 * 测试岗位专属简历生成API
 */

const fetch = require('node-fetch');

const testJobSpecificResume = async () => {
  console.log('🎯 测试岗位专属简历生成API...');
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiLmtYvor5XnlKjmiLciLCJpYXQiOjE3NTEzNTAwMjAsImV4cCI6MTc1MTQzNjQyMH0.tDExrKPtNCOxkqSnks6nc1mfWSfTSB9V2_h8rr_jmK8';
  
  const requestData = {
    baseResumeId: 1,
    jobId: 1,
    targetCompany: "测试公司",
    targetPosition: "前端工程师",
    jobDescription: "负责前端开发工作，使用React技术栈",
    jobRequirements: "熟悉React、JavaScript、HTML/CSS，有3年以上工作经验"
  };

  try {
    console.log('📤 发送请求数据:', JSON.stringify(requestData, null, 2));
    
    const response = await fetch('http://localhost:8000/api/resumes/generate-for-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    console.log('📊 响应状态:', response.status);
    console.log('📊 响应头:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📤 响应内容:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ API测试成功!');
      console.log('📝 生成的简历ID:', data.data?.id);
      console.log('📝 状态:', data.data?.status);
    } else {
      console.error('❌ API测试失败');
      console.error('📝 错误响应:', responseText);
    }

  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
};

testJobSpecificResume(); 