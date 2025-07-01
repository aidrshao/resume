/**
 * 测试上传超时改进
 * 验证前端轮询超时设置和后端状态更新是否有效
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUploadWithImprovedTimeout() {
  console.log('🧪 [TEST_TIMEOUT] 测试上传超时改进...');
  
  try {
    // 1. 登录获取token
    console.log('🔐 [TEST_TIMEOUT] 步骤1: 用户登录...');
    
    const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123456'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ [TEST_TIMEOUT] 登录成功');
    const token = loginData.data.token;
    
    // 2. 创建测试文件
    const testContent = `
简历测试文档

个人信息：
姓名：测试用户
邮箱：test@example.com
电话：138-0000-0000

工作经历：
2020-2023 前端开发工程师
- 负责React项目开发
- 优化页面性能，提升加载速度30%
- 参与微前端架构设计

教育经历：
2016-2020 计算机科学与技术 本科
主要课程：数据结构、算法、软件工程

技能清单：
- 前端：React, Vue, JavaScript, TypeScript
- 后端：Node.js, Python, Java
- 数据库：MySQL, MongoDB
- 工具：Git, Docker, Linux
    `;
    
    const testFilePath = path.join(__dirname, 'test-resume-timeout.txt');
    fs.writeFileSync(testFilePath, testContent, 'utf8');
    console.log('✅ [TEST_TIMEOUT] 测试文件创建成功');
    
    // 3. 上传文件
    const formData = new FormData();
    formData.append('resume', fs.createReadStream(testFilePath));
    
    console.log('📤 [TEST_TIMEOUT] 步骤2: 上传文件...');
    const uploadResponse = await fetch('http://localhost:8000/api/resumes/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`上传失败: ${uploadResponse.status}`);
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ [TEST_TIMEOUT] 上传成功，任务ID:', uploadData.data.taskId);
    
    // 4. 模拟前端改进后的轮询逻辑
    const taskId = uploadData.data.taskId;
    console.log('🔄 [TEST_TIMEOUT] 步骤3: 开始改进后的轮询...');
    
    let pollCount = 0;
    let currentInterval = 1000;
    const maxInterval = 15000;
    const maxPollCount = 120; // 8分钟内最多轮询120次
    let aiAnalysisStartTime = null;
    
    const pollWithImprovedLogic = async () => {
      while (pollCount < maxPollCount) {
        pollCount++;
        
        try {
          const statusResponse = await fetch(`http://localhost:8000/api/tasks/${taskId}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const statusData = await statusResponse.json();
          const task = statusData.data;
          
          const shouldLog = pollCount <= 10 || pollCount % 5 === 0;
          if (shouldLog) {
            console.log(`🔄 [TEST_TIMEOUT] 第${pollCount}次轮询:`, {
              status: task.status,
              progress: task.progress,
              message: task.message
            });
          }
          
          // 检测AI分析阶段
          const isAIAnalysisStage = task.message && task.message.includes('AI智能');
          if (isAIAnalysisStage && !aiAnalysisStartTime) {
            aiAnalysisStartTime = Date.now();
            console.log('🤖 [TEST_TIMEOUT] 进入AI分析阶段，开始计时...');
          }
          
          // 任务完成
          if (task.status === 'completed') {
            console.log('✅ [TEST_TIMEOUT] 任务完成！');
            const totalTime = aiAnalysisStartTime ? 
              Math.round((Date.now() - aiAnalysisStartTime) / 1000) : 'N/A';
            console.log(`📊 [TEST_TIMEOUT] AI分析耗时: ${totalTime}秒`);
            break;
          }
          
          // 任务失败
          if (task.status === 'failed') {
            console.error('❌ [TEST_TIMEOUT] 任务失败:', task.errorMessage);
            break;
          }
          
          // 调整轮询间隔
          if (isAIAnalysisStage) {
            currentInterval = Math.min(5000 + (pollCount * 500), maxInterval);
          } else if (pollCount > 5) {
            currentInterval = Math.min(currentInterval + 1000, 8000);
          }
          
          if (shouldLog) {
            console.log(`⏱️ [TEST_TIMEOUT] ${currentInterval/1000}秒后继续轮询...`);
          }
          
          // 等待下次轮询
          await new Promise(resolve => setTimeout(resolve, currentInterval));
          
        } catch (error) {
          console.error(`❌ [TEST_TIMEOUT] 第${pollCount}次轮询失败:`, error.message);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (pollCount >= maxPollCount) {
        console.error('⏰ [TEST_TIMEOUT] 达到最大轮询次数，任务可能仍在后台处理...');
      }
    };
    
    await pollWithImprovedLogic();
    
    // 5. 清理测试文件
    fs.unlinkSync(testFilePath);
    console.log('🧹 [TEST_TIMEOUT] 清理测试文件完成');
    
  } catch (error) {
    console.error('❌ [TEST_TIMEOUT] 测试失败:', error.message);
  }
}

// 检查服务器可用性
async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test', password: 'test' })
    });
    return response.status !== 0; // 服务器响应就算可用
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 [TEST_TIMEOUT] 开始测试上传超时改进...');
  
  const serverAvailable = await checkServerHealth();
  if (!serverAvailable) {
    console.error('❌ [TEST_TIMEOUT] 后端服务器不可用，请先启动服务器');
    return;
  }
  
  await testUploadWithImprovedTimeout();
  console.log('🏁 [TEST_TIMEOUT] 测试完成');
}

if (require.main === module) {
  main();
}

module.exports = { testUploadWithImprovedTimeout }; 