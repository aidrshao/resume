/**
 * 检查最新任务 27a8a468-7cc5-4bf1-b654-6e40ce0103dd 的详细数据
 */

const TaskQueueService = require('./services/v2/taskQueueService');

async function checkTask() {
  const taskId = '27a8a468-7cc5-4bf1-b654-6e40ce0103dd';
  const taskQueue = new TaskQueueService();

  try {
    console.log('🔍 [检查] 任务详细数据检查');
    console.log('🆔 [检查] 任务ID:', taskId);
    
    // 1. 检查任务原始数据
    console.log('\n📋 [检查] === 步骤1：检查任务原始数据 ===');
    const taskData = await taskQueue.getTaskData(taskId);
    if (taskData) {
      console.log('✅ [检查] 任务原始数据存在');
      console.log('📄 [检查] 文件名:', taskData.fileName);
      console.log('📦 [检查] 文件大小:', taskData.fileSize);
      console.log('🗂️ [检查] 文件路径:', taskData.filePath);
    } else {
      console.log('❌ [检查] 任务原始数据不存在');
    }
    
    // 2. 检查任务状态
    console.log('\n📊 [检查] === 步骤2：检查任务状态 ===');
    const taskStatus = await taskQueue.getTaskStatus(taskId);
    if (taskStatus) {
      console.log('✅ [检查] 任务状态存在');
      console.log('📈 [检查] 状态:', taskStatus.status);
      console.log('📊 [检查] 进度:', taskStatus.progress);
      console.log('💬 [检查] 消息:', taskStatus.message);
      console.log('⏰ [检查] 更新时间:', taskStatus.updatedAt);
    } else {
      console.log('❌ [检查] 任务状态不存在');
    }
    
    // 3. 检查任务结果
    console.log('\n🎯 [检查] === 步骤3：检查任务结果 ===');
    const taskResult = await taskQueue.getTaskResult(taskId);
    if (taskResult) {
      console.log('✅ [检查] 任务结果存在');
      console.log('📊 [检查] 结果结构:', Object.keys(taskResult));
      
      if (taskResult.resumeData) {
        console.log('📋 [检查] 简历数据存在');
        console.log('👤 [检查] 个人信息:', taskResult.resumeData.profile || '无');
        console.log('💼 [检查] 工作经验数量:', taskResult.resumeData.workExperience?.length || 0);
        console.log('🎓 [检查] 教育背景数量:', taskResult.resumeData.education?.length || 0);
      } else {
        console.log('❌ [检查] 简历数据不存在');
      }
      
      if (taskResult.metadata) {
        console.log('📖 [检查] 元数据存在');
        console.log('🤖 [检查] AI模型:', taskResult.metadata.aiModel || '未知');
        console.log('⏱️ [检查] 处理时间:', taskResult.metadata.processingTime || '未知');
        
        if (taskResult.metadata.originalText) {
          const text = taskResult.metadata.originalText;
          console.log('📄 [检查] 原始文本长度:', text.length);
          console.log('📄 [检查] 原始文本前200字符:');
          console.log(text.substring(0, 200));
          console.log('🔍 [检查] 包含"邵俊":', text.includes('邵俊') ? '✅ 是' : '❌ 否');
        } else {
          console.log('❌ [检查] 原始文本不存在');
        }
        
        if (taskResult.metadata.error) {
          console.log('❌ [检查] 发现错误信息:', taskResult.metadata.error);
        }
      } else {
        console.log('❌ [检查] 元数据不存在');
      }
    } else {
      console.log('❌ [检查] 任务结果不存在');
    }
    
    // 4. 检查Redis键
    console.log('\n🔑 [检查] === 步骤4：检查Redis键 ===');
    const keys = [
      `task_status_${taskId}`,
      `task_data_${taskId}`,
      `task_result_${taskId}`,
      `backup_result_${taskId}`
    ];
    
    for (const key of keys) {
      const exists = await taskQueue.redis.exists(key);
      console.log(`🔑 [检查] ${key}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
    }
    
    console.log('\n✅ [检查] 检查完成');
    
  } catch (error) {
    console.error('❌ [检查] 检查失败:', error);
    console.error('❌ [检查] 错误堆栈:', error.stack);
  } finally {
    await taskQueue.close();
    process.exit(0);
  }
}

checkTask(); 