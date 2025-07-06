/**
 * 检查当前Redis中的任务数据
 */

const TaskQueueService = require('./services/v2/taskQueueService');

async function checkCurrentRedis() {
  const latestTaskId = '33f64d0f-778e-4552-ac05-25b200321dc3';
  const taskQueue = new TaskQueueService();

  try {
    console.log('🔍 检查当前Redis任务数据');
    console.log('🆔 检查任务ID:', latestTaskId);
    
    // 检查任务结果
    const taskResult = await taskQueue.getTaskResult(latestTaskId);
    console.log('🎯 任务结果存在:', !!taskResult);
    
    if (taskResult) {
      console.log('📊 结果数据结构:', Object.keys(taskResult));
      if (taskResult.resumeData && taskResult.resumeData.profile) {
        console.log('👤 解析的姓名:', taskResult.resumeData.profile.name);
        console.log('📧 解析的邮箱:', taskResult.resumeData.profile.email);
        
        if (taskResult.resumeData.profile.name === '张三') {
          console.log('❌ 发现"张三"模拟数据！');
          console.log('🗑️ 删除此任务的Redis数据...');
          
          // 删除任务结果
          await taskQueue.redis.del(`task_result_${latestTaskId}`);
          await taskQueue.redis.del(`backup_result_${latestTaskId}`);
          await taskQueue.redis.del(`task_status_${latestTaskId}`);
          await taskQueue.redis.del(`task_data_${latestTaskId}`);
          
          console.log('✅ 已删除"张三"模拟数据');
        } else {
          console.log('✅ 数据正常，姓名不是"张三"');
        }
      }
      
      // 显示metadata原始文本
      if (taskResult.metadata && taskResult.metadata.originalText) {
        const originalText = taskResult.metadata.originalText;
        console.log('📄 原始文本前100字符:', originalText.substring(0, 100));
        if (originalText.includes('邵俊')) {
          console.log('✅ 原始文本包含"邵俊"');
        } else {
          console.log('❌ 原始文本不包含"邵俊"');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await taskQueue.close();
    process.exit(0);
  }
}

checkCurrentRedis(); 