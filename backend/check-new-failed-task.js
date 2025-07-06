/**
 * 检查最新失败任务的详细信息
 */

const TaskQueueService = require('./services/v2/taskQueueService');

async function checkNewFailedTask() {
  const failedTaskId = '89f4c34f-4c9f-45e2-bcef-abe925afae7c';
  const taskQueue = new TaskQueueService();

  try {
    console.log('🔍 [新失败任务] 检查任务详细信息');
    console.log('🆔 [新失败任务] 任务ID:', failedTaskId);
    
    // 检查任务数据
    const taskData = await taskQueue.getTaskData(failedTaskId);
    console.log('📋 [新失败任务] 任务数据存在:', !!taskData);
    if (taskData) {
      console.log('📄 [新失败任务] 文件名:', taskData.fileName);
      console.log('📦 [新失败任务] 文件大小:', taskData.fileSize);
      console.log('🕐 [新失败任务] 创建时间:', taskData.createdAt);
    }
    
    // 检查任务结果和错误
    const taskResult = await taskQueue.getTaskResult(failedTaskId);
    console.log('❌ [新失败任务] 结果数据存在:', !!taskResult);
    if (taskResult) {
      console.log('❌ [新失败任务] 错误消息:', taskResult.error?.message);
      console.log('❌ [新失败任务] 错误类型:', taskResult.error?.type);
      if (taskResult.error?.stack) {
        console.log('❌ [新失败任务] 错误堆栈:', taskResult.error.stack.substring(0, 800));
      }
    }
    
  } catch (error) {
    console.error('❌ [新失败任务] 检查失败:', error);
  }
}

checkNewFailedTask(); 