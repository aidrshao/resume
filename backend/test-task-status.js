/**
 * 测试任务状态更新改进
 * 验证后端任务状态更新是否按预期工作
 */

async function testTaskStatusUpdates() {
  console.log('🧪 [TEST_TASK] 测试任务状态更新...');
  
  try {
    // 1. 登录获取token
    console.log('🔐 [TEST_TASK] 步骤1: 用户登录...');
    
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
    console.log('✅ [TEST_TASK] 登录成功');
    const token = loginData.data.token;
    
    // 2. 查找最近的任务
    console.log('🔍 [TEST_TASK] 步骤2: 查找最近的任务...');
    
    // 这里我们需要查询数据库找到最近的任务
    const knex = require('./config/database');
    const recentTasks = await knex('task_queue')
      .where('user_id', 9) // 使用刚登录的用户ID
      .orderBy('created_at', 'desc')
      .limit(3);
    
    console.log('📋 [TEST_TASK] 最近的任务:', recentTasks.map(t => ({
      taskId: t.task_id,
      status: t.status,
      progress: t.progress,
      message: t.status_message,
      createdAt: t.created_at
    })));
    
    if (recentTasks.length === 0) {
      console.log('⚠️ [TEST_TASK] 没有找到最近的任务，跳过轮询测试');
      return;
    }
    
    // 3. 测试API轮询
    const taskId = recentTasks[0].task_id;
    console.log(`🔄 [TEST_TASK] 步骤3: 测试任务状态API - ${taskId}`);
    
    for (let i = 1; i <= 5; i++) {
      try {
        const statusResponse = await fetch(`http://localhost:8000/api/tasks/${taskId}/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!statusResponse.ok) {
          console.error(`❌ [TEST_TASK] 第${i}次查询失败: ${statusResponse.status}`);
          continue;
        }
        
        const statusData = await statusResponse.json();
        console.log(`📊 [TEST_TASK] 第${i}次查询结果:`, {
          success: statusData.success,
          status: statusData.data?.status,
          progress: statusData.data?.progress,
          message: statusData.data?.message,
          hasResult: !!statusData.data?.resultData
        });
        
      } catch (error) {
        console.error(`❌ [TEST_TASK] 第${i}次查询出错:`, error.message);
      }
      
      if (i < 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 4. 测试任务进度历史
    console.log('📜 [TEST_TASK] 步骤4: 查询任务进度历史...');
    
    try {
      const TaskQueueService = require('./services/taskQueueService');
      const taskService = new TaskQueueService();
      
      const progressHistory = await taskService.getTaskProgressHistory(taskId);
      console.log('📈 [TEST_TASK] 进度历史:', progressHistory.map(p => ({
        progress: p.progress,
        message: p.message,
        timestamp: p.timestamp
      })));
      
    } catch (error) {
      console.error('❌ [TEST_TASK] 查询进度历史失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ [TEST_TASK] 测试失败:', error.message);
  }
}

async function main() {
  console.log('🚀 [TEST_TASK] 开始测试任务状态更新改进...');
  
  await testTaskStatusUpdates();
  console.log('🏁 [TEST_TASK] 测试完成');
  process.exit(0);
}

if (require.main === module) {
  main();
} 