/**
 * 独立的任务处理器启动脚本
 * 用于处理V2版本的简历解析任务
 */

require('dotenv').config();
const taskQueueService = require('./services/v2/taskQueueService');
const ResumeParseTaskHandler = require('./services/v2/resumeParseTaskHandler');

async function startTaskProcessor() {
  try {
    console.log('🚀 [TASK_PROCESSOR] 启动独立任务处理器...');
    console.log('🚀 [TASK_PROCESSOR] 时间:', new Date().toISOString());
    
    const taskQueue = taskQueueService; // 直接使用单例
    const taskHandler = new ResumeParseTaskHandler(taskQueue);
    
    // 测试连接
    console.log('🔍 [TASK_PROCESSOR] 测试Redis连接...');
    await taskQueue.checkRedisConnection();
    
    // 开始处理任务队列
    console.log('🔄 [TASK_PROCESSOR] 开始处理任务队列...');
    
    // 设置任务处理器回调
    taskQueue.taskCallbacks.set('resume_parse', async (taskId, taskData) => {
      return await taskHandler.process(taskId, taskData);
    });
    
    console.log('✅ [TASK_PROCESSOR] 任务处理器启动成功!');
    
    // 启动定期处理队列
    const processInterval = setInterval(async () => {
      try {
        await taskQueue.processQueue('resume_parse');
      } catch (error) {
        console.error('❌ [TASK_PROCESSOR] 队列处理出错:', error.message);
      }
    }, 2000); // 每2秒检查一次队列
    
    console.log('🔄 [TASK_PROCESSOR] 定期队列处理已启动（2秒间隔）');
    
    // 保持进程运行
    process.on('SIGINT', async () => {
      console.log('🛑 [TASK_PROCESSOR] 收到退出信号，正在关闭...');
      clearInterval(processInterval);
      await taskQueue.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ [TASK_PROCESSOR] 任务处理器启动失败:', error.message);
    console.error('❌ [TASK_PROCESSOR] 错误详情:', error.stack);
    process.exit(1);
  }
}

// 启动任务处理器
startTaskProcessor(); 