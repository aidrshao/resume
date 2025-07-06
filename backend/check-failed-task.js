/**
 * 检查失败任务的详细信息
 */

const TaskQueueService = require('./services/v2/taskQueueService');

async function checkFailedTask() {
  const failedTaskId = '23a35bba-d98b-4215-aab8-8e8305fe181f';
  const taskQueue = new TaskQueueService();

  try {
    console.log('🔍 [失败任务] 检查任务详细信息');
    console.log('🆔 [失败任务] 任务ID:', failedTaskId);
    
    // 检查任务状态
    const taskStatus = await taskQueue.getTaskStatus(failedTaskId);
    console.log('📊 [失败任务] 任务状态:', taskStatus);
    
    // 检查任务数据
    const taskData = await taskQueue.getTaskData(failedTaskId);
    console.log('📋 [失败任务] 任务数据存在:', !!taskData);
    if (taskData) {
      console.log('📄 [失败任务] 文件名:', taskData.fileName);
      console.log('📦 [失败任务] 文件大小:', taskData.fileSize);
      console.log('🕐 [失败任务] 创建时间:', taskData.createdAt);
    }
    
    // 检查错误信息
    const taskResult = await taskQueue.getTaskResult(failedTaskId);
    console.log('❌ [失败任务] 结果数据存在:', !!taskResult);
    if (taskResult) {
      console.log('❌ [失败任务] 错误类型:', taskResult.error?.type);
      console.log('❌ [失败任务] 错误消息:', taskResult.error?.message);
      console.log('❌ [失败任务] 错误堆栈:', taskResult.error?.stack?.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ [失败任务] 检查失败:', error);
  }
}

checkFailedTask(); 