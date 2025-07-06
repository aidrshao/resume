const axios = require('axios');

const taskId = '64c601b7-3abb-4d1a-b38f-c112432797a9'; // 从日志中看到的任务ID
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc1MTc2MjE4NCwiZXhwIjoxNzUyMzY2OTg0fQ.pbOaut-ikB3JIf1bpcFtaKNqiBSOQKtNoCOFdzN756U'; // 新生成的有效token

console.log('=== 测试任务结果获取API ===');
console.log('测试任务ID:', taskId);

axios.get(`http://localhost:8000/api/v2/tasks/${taskId}/result`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(response => {
  console.log('✅ API调用成功:', {
    success: response.data.success,
    message: response.data.message,
    hasResumeData: !!(response.data.data?.resume_data),
    dataKeys: response.data.data ? Object.keys(response.data.data) : []
  });
  
  if (response.data.data?.resume_data) {
    console.log('📊 简历数据结构:', Object.keys(response.data.data.resume_data));
    if (response.data.data.resume_data.profile) {
      console.log('👤 个人信息:', response.data.data.resume_data.profile);
    }
  }
}).catch(error => {
  console.error('❌ API调用失败，详细错误信息:');
  console.error('  - 错误类型:', error.name);
  console.error('  - 错误消息:', error.message);
  console.error('  - 错误代码:', error.code);
  
  if (error.response) {
    console.error('  - HTTP状态:', error.response.status);
    console.error('  - 响应数据:', error.response.data);
  } else if (error.request) {
    console.error('  - 请求已发送但无响应');
  } else {
    console.error('  - 设置请求时出错:', error.message);
  }
}); 