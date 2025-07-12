/**
 * V2版本任务状态控制器
 * 处理任务状态查询和结果获取
 */

const taskQueueService = require('../../services/v2/taskQueueService');

class TaskStatusController {
  constructor() {
    this.taskQueue = taskQueueService; // 直接使用导入的单例
  }

  /**
   * 获取任务状态
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getTaskStatus(req, res) {
    const requestId = req.requestId || `STATUS_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      const { taskId } = req.params;
      const userId = req.user.id;

      console.log('🔍 [TASK_STATUS_V2] ==> 查询任务状态');
      console.log('🔍 [TASK_STATUS_V2] 请求ID:', requestId);
      console.log('🔍 [TASK_STATUS_V2] 任务ID:', taskId);
      console.log('🔍 [TASK_STATUS_V2] 用户ID:', userId);

      // 验证任务ID格式
      if (!taskId || typeof taskId !== 'string' || taskId.length < 10) {
        console.error('❌ [TASK_STATUS_V2] 无效的任务ID格式');
        return res.status(400).json({
          success: false,
          message: '无效的任务ID格式',
          error_code: 'INVALID_TASK_ID',
          request_id: requestId
        });
      }

      // 获取任务状态
      const taskStatus = await this.taskQueue.getTaskStatus(taskId);
      
      if (!taskStatus) {
        console.error('❌ [TASK_STATUS_V2] 任务不存在:', taskId);
        return res.status(404).json({
          success: false,
          message: '任务不存在或已过期',
          error_code: 'TASK_NOT_FOUND',
          request_id: requestId
        });
      }

      // 验证任务所有权（确保用户只能查询自己的任务）
      const taskData = await this.taskQueue.getTaskData(taskId);
      if (taskData && taskData.userId !== userId) {
        console.error('❌ [TASK_STATUS_V2] 任务所有权验证失败:', {
          taskUserId: taskData.userId,
          requestUserId: userId
        });
        return res.status(403).json({
          success: false,
          message: '无权访问此任务',
          error_code: 'ACCESS_DENIED',
          request_id: requestId
        });
      }

      console.log('✅ [TASK_STATUS_V2] 任务状态查询成功:', {
        taskId,
        status: taskStatus.status,
        progress: taskStatus.progress
      });

      // 构建响应数据
      const response = {
        success: true,
        data: {
          taskId,
          status: taskStatus.status,
          progress: taskStatus.progress || 0,
          message: taskStatus.message || '',
          estimated_remaining_time: this.calculateEstimatedTime(taskStatus),
          updated_at: taskStatus.updatedAt || taskStatus.createdAt
        },
        request_id: requestId,
        timestamp: new Date().toISOString()
      };

      // 如果任务完成，添加下一步建议
      if (taskStatus.status === 'completed') {
        response.data.next_action = {
          endpoint: `/api/v2/tasks/${taskId}/result`,
          method: 'GET',
          description: '获取解析结果'
        };
      }

      // 如果任务失败，添加错误信息
      if (taskStatus.status === 'failed') {
        response.data.error = taskStatus.error || '处理过程中发生未知错误';
        response.data.retry_suggestion = '您可以重新上传文件进行解析';
      }

      res.json(response);

    } catch (error) {
      console.error('❌ [TASK_STATUS_V2] 查询失败:', error);
      console.error('❌ [TASK_STATUS_V2] 错误堆栈:', error.stack);

      res.status(500).json({
        success: false,
        message: '查询任务状态失败',
        error_code: 'QUERY_FAILED',
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 获取任务结果
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getTaskResult(req, res) {
    const requestId = req.requestId || `RESULT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      const { taskId } = req.params;
      const userId = req.user.id;

      // [API_DEBUG] 请求开始日志
      console.log(`[API_DEBUG] Received request to get result for taskId: ${taskId}`);
      console.log('📊 [TASK_RESULT_V2] ==> 获取任务结果');
      console.log('📊 [TASK_RESULT_V2] 请求ID:', requestId);
      console.log('📊 [TASK_RESULT_V2] 任务ID:', taskId);
      console.log('📊 [TASK_RESULT_V2] 用户ID:', userId);

      // 验证任务ID格式
      if (!taskId || typeof taskId !== 'string' || taskId.length < 10) {
        console.error('❌ [TASK_RESULT_V2] 无效的任务ID格式');
        return res.status(400).json({
          success: false,
          message: '无效的任务ID格式',
          error_code: 'INVALID_TASK_ID',
          request_id: requestId
        });
      }

      // 验证任务所有权
      const taskData = await this.taskQueue.getTaskData(taskId);
      console.log(`[API_DEBUG] Retrieved task data for taskId ${taskId}:`, {
        exists: !!taskData,
        userId: taskData?.userId,
        fileName: taskData?.fileName,
        status: taskData?.status
      });

      if (!taskData) {
        console.error('❌ [TASK_RESULT_V2] 任务不存在:', taskId);
        return res.status(404).json({
          success: false,
          message: '任务不存在或已过期',
          error_code: 'TASK_NOT_FOUND',
          request_id: requestId
        });
      }

      if (taskData.userId !== userId) {
        console.error('❌ [TASK_RESULT_V2] 任务所有权验证失败');
        return res.status(403).json({
          success: false,
          message: '无权访问此任务',
          error_code: 'ACCESS_DENIED',
          request_id: requestId
        });
      }

      // 检查任务状态
      const taskStatus = await this.taskQueue.getTaskStatus(taskId);
      console.log(`[API_DEBUG] Retrieved task status for taskId ${taskId}:`, {
        status: taskStatus?.status,
        progress: taskStatus?.progress,
        message: taskStatus?.message
      });

      if (!taskStatus || taskStatus.status !== 'completed') {
        console.error('❌ [TASK_RESULT_V2] 任务未完成:', taskStatus?.status);
        return res.status(400).json({
          success: false,
          message: taskStatus?.status === 'failed' ? '任务处理失败' : '任务尚未完成',
          error_code: taskStatus?.status === 'failed' ? 'TASK_FAILED' : 'TASK_NOT_COMPLETED',
          data: {
            current_status: taskStatus?.status || 'unknown',
            progress: taskStatus?.progress || 0
          },
          request_id: requestId
        });
      }

      // 获取解析结果
      const result = await this.taskQueue.getTaskResult(taskId);
      
      // [API_DEBUG] 数据获取后日志
      console.log(`[API_DEBUG] Fetched data from temp storage for taskId ${taskId}:`, {
        exists: !!result,
        hasResumeData: !!(result?.resumeData),
        dataSize: result ? JSON.stringify(result).length : 0,
        dataKeys: result ? Object.keys(result) : [],
        resumeDataKeys: result?.resumeData ? Object.keys(result.resumeData) : []
      });

      if (!result) {
        console.error('❌ [TASK_RESULT_V2] 结果数据不存在');
        return res.status(404).json({
          success: false,
          message: '结果数据不存在或已过期',
          error_code: 'RESULT_NOT_FOUND',
          request_id: requestId
        });
      }

      console.log('✅ [TASK_RESULT_V2] 结果获取成功:', {
        taskId,
        dataSize: JSON.stringify(result).length
      });

      // 构建最终响应数据
      const finalResponseData = {
        success: true,
        data: {
          taskId,
          resume_data: result.resumeData,
          original_filename: taskData.fileName,
          processed_at: result.processedAt,
          schema_version: result.schemaVersion || '2.1',
          metadata: {
            file_size: taskData.fileSize,
            file_type: taskData.mimetype,
            processing_time: result.processingTime
          }
        },
        message: '简历解析结果获取成功',
        request_id: requestId,
        timestamp: new Date().toISOString()
      };

      // [API_DEBUG] 响应发送前日志
      console.log(`[API_DEBUG] Sending response to frontend for taskId ${taskId}:`, {
        success: finalResponseData.success,
        message: finalResponseData.message,
        hasResumeData: !!(finalResponseData.data?.resume_data),
        resumeDataStructure: finalResponseData.data?.resume_data ? Object.keys(finalResponseData.data.resume_data) : [],
        dataSize: JSON.stringify(finalResponseData).length
      });

      // 返回解析结果
      res.json(finalResponseData);

    } catch (error) {
      console.error('❌ [TASK_RESULT_V2] 获取失败:', error);
      console.error('❌ [TASK_RESULT_V2] 错误堆栈:', error.stack);
      console.error(`[API_DEBUG] Error occurred while getting result for taskId ${req.params.taskId}:`, error.message);

      res.status(500).json({
        success: false,
        message: '获取任务结果失败',
        error_code: 'RESULT_FETCH_FAILED',
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 计算预估剩余时间
   * @param {Object} taskStatus - 任务状态对象
   * @returns {string|null} 预估剩余时间描述
   */
  calculateEstimatedTime(taskStatus) {
    if (!taskStatus || taskStatus.status === 'completed' || taskStatus.status === 'failed') {
      return null;
    }

    const progress = taskStatus.progress || 0;
    
    if (taskStatus.status === 'queued') {
      return '等待处理，预计2-3分钟开始';
    }

    if (taskStatus.status === 'processing') {
      if (progress < 30) {
        return '60-90秒';
      } else if (progress < 70) {
        return '30-60秒';
      } else {
        return '10-30秒';
      }
    }

    return '即将完成';
  }
}

// 创建单例实例
const taskStatusController = new TaskStatusController();

module.exports = {
  getTaskStatus: taskStatusController.getTaskStatus.bind(taskStatusController),
  getTaskResult: taskStatusController.getTaskResult.bind(taskStatusController)
}; 