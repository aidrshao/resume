/**
 * 任务队列服务
 * 管理异步任务的生命周期，包括创建、执行、状态更新等
 */

const knex = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class TaskQueueService extends EventEmitter {
  constructor() {
    super();
    this.processingTasks = new Map(); // 当前正在处理的任务
    this.isProcessing = false;
  }

  /**
   * 创建新任务
   * @param {string} taskType - 任务类型
   * @param {Object} taskData - 任务数据
   * @param {number} userId - 用户ID（可选）
   * @returns {Promise<string>} 任务ID
   */
  async createTask(taskType, taskData, userId = null) {
    const taskId = uuidv4();
    
    try {
      await knex('task_queue').insert({
        task_id: taskId,
        user_id: userId,
        task_type: taskType,
        status: 'pending',
        progress: 0,
        status_message: '任务已创建，等待处理',
        task_data: JSON.stringify(taskData),
        created_at: new Date(),
        updated_at: new Date()
      });

      console.log(`📋 创建任务: ${taskType}`, { taskId, userId });
      
      // 记录初始进度
      await this.logProgress(taskId, 0, '任务已创建，等待处理');
      
      // 触发任务处理
      setImmediate(() => this.processNextTask());
      
      return taskId;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw new Error('创建任务失败');
    }
  }

  /**
   * 更新任务状态
   * @param {string} taskId - 任务ID
   * @param {string} status - 状态
   * @param {number} progress - 进度（0-100）
   * @param {string} message - 状态消息
   * @param {Object} resultData - 结果数据（可选）
   * @param {string} errorMessage - 错误消息（可选）
   */
  async updateTask(taskId, status, progress = null, message = null, resultData = null, errorMessage = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date()
      };

      if (progress !== null) updateData.progress = progress;
      if (message !== null) updateData.status_message = message;
      if (resultData !== null) updateData.result_data = JSON.stringify(resultData);
      if (errorMessage !== null) updateData.error_message = errorMessage;

      if (status === 'processing' && !updateData.started_at) {
        updateData.started_at = new Date();
      }
      if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date();
      }

      await knex('task_queue')
        .where('task_id', taskId)
        .update(updateData);

      // 记录进度日志
      if (progress !== null && message !== null) {
        await this.logProgress(taskId, progress, message);
      }

      // 发送进度更新事件
      this.emit('taskUpdate', {
        taskId,
        status,
        progress,
        message,
        resultData,
        errorMessage
      });

      console.log(`🔄 任务状态更新: ${taskId}`, { status, progress, message });
    } catch (error) {
      console.error('更新任务状态失败:', error);
    }
  }

  /**
   * 记录任务进度
   * @param {string} taskId - 任务ID
   * @param {number} progress - 进度
   * @param {string} message - 消息
   * @param {Object} metadata - 元数据
   */
  async logProgress(taskId, progress, message, metadata = null) {
    try {
      await knex('task_progress_logs').insert({
        task_id: taskId,
        progress,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: new Date()
      });
    } catch (error) {
      console.error('记录进度日志失败:', error);
    }
  }

  /**
   * 获取任务状态
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 任务状态
   */
  async getTaskStatus(taskId) {
    try {
      const task = await knex('task_queue')
        .where('task_id', taskId)
        .first();

      if (!task) {
        throw new Error('任务不存在');
      }

      return {
        taskId: task.task_id,
        taskType: task.task_type,
        status: task.status,
        progress: task.progress,
        message: task.status_message,
        resultData: task.result_data ? JSON.parse(task.result_data) : null,
        errorMessage: task.error_message,
        createdAt: task.created_at,
        startedAt: task.started_at,
        completedAt: task.completed_at
      };
    } catch (error) {
      console.error('获取任务状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取任务进度历史
   * @param {string} taskId - 任务ID
   * @returns {Promise<Array>} 进度历史
   */
  async getTaskProgressHistory(taskId) {
    try {
      const logs = await knex('task_progress_logs')
        .where('task_id', taskId)
        .orderBy('created_at', 'asc');

      return logs.map(log => ({
        progress: log.progress,
        message: log.message,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        timestamp: log.created_at
      }));
    } catch (error) {
      console.error('获取进度历史失败:', error);
      throw error;
    }
  }

  /**
   * 处理下一个待处理任务
   */
  async processNextTask() {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      
      const pendingTask = await knex('task_queue')
        .where('status', 'pending')
        .orderBy('created_at', 'asc')
        .first();

      if (!pendingTask) {
        this.isProcessing = false;
        return;
      }

      const taskId = pendingTask.task_id;
      console.log(`🚀 开始处理任务: ${taskId}`);

      // 标记任务为处理中
      await this.updateTask(taskId, 'processing', 5, '开始处理任务');

      // 根据任务类型调用相应的处理器
      await this.executeTask(pendingTask);

    } catch (error) {
      console.error('处理任务失败:', error);
    } finally {
      this.isProcessing = false;
      // 继续处理下一个任务
      setImmediate(() => this.processNextTask());
    }
  }

  /**
   * 执行具体任务
   * @param {Object} task - 任务对象
   */
  async executeTask(task) {
    const { task_id: taskId, task_type: taskType, task_data: taskDataJson } = task;
    
    try {
      const taskData = JSON.parse(taskDataJson);

      switch (taskType) {
        case 'resume_parse':
          await this.executeResumeParseTask(taskId, taskData);
          break;
        case 'resume_generate':
          await this.executeResumeGenerateTask(taskId, taskData);
          break;
        case 'ai_optimize':
          await this.executeAIOptimizeTask(taskId, taskData);
          break;
        default:
          throw new Error(`不支持的任务类型: ${taskType}`);
      }

    } catch (error) {
      console.error(`任务执行失败: ${taskId}`, error);
      await this.updateTask(taskId, 'failed', 100, '任务执行失败', null, error.message);
    }
  }

  /**
   * 执行简历解析任务
   * @param {string} taskId - 任务ID
   * @param {Object} taskData - 任务数据
   */
  async executeResumeParseTask(taskId, taskData) {
    const ResumeParseService = require('./resumeParseService');
    
    try {
      const { filePath, fileType } = taskData;
      
      // 更新进度：开始文本提取
      await this.updateTask(taskId, 'processing', 15, '正在提取文件文本...');
      
      // 提取文本
      let extractedText = '';
      switch (fileType.toLowerCase()) {
        case 'pdf':
          extractedText = await ResumeParseService.extractTextFromPDF(filePath);
          break;
        case 'docx':
        case 'doc':
          extractedText = await ResumeParseService.extractTextFromWord(filePath);
          break;
        case 'txt':
          extractedText = await ResumeParseService.extractTextFromTXT(filePath);
          break;
        default:
          throw new Error(`不支持的文件类型: ${fileType}`);
      }

      // 更新进度：文本提取完成
      await this.updateTask(taskId, 'processing', 35, `文本提取完成，长度: ${extractedText.length} 字符`);

      // 更新进度：开始AI结构化
      await this.updateTask(taskId, 'processing', 50, '正在进行AI智能结构化分析...');

      // AI结构化
      const structuredData = await ResumeParseService.structureResumeText(extractedText);

      // 更新进度：AI分析完成
      await this.updateTask(taskId, 'processing', 80, 'AI分析完成，正在清理数据...');

      // 清理和验证数据
      const cleanedData = ResumeParseService.validateAndCleanData(structuredData);

      // 任务完成
      await this.updateTask(taskId, 'completed', 100, '简历解析完成', {
        extractedText,
        structuredData: cleanedData
      });

    } catch (error) {
      console.error('简历解析任务失败:', error);
      await this.updateTask(taskId, 'failed', 100, '简历解析失败', null, error.message);
    } finally {
      // 清理临时文件
      try {
        const fs = require('fs');
        if (taskData.filePath) {
          fs.unlink(taskData.filePath, (err) => {
            if (err) console.error('删除临时文件失败:', err);
            else console.log('✅ 临时文件已清理:', taskData.filePath);
          });
        }
      } catch (cleanupError) {
        console.error('文件清理过程中出错:', cleanupError);
      }
    }
  }

  /**
   * 执行简历生成任务
   * @param {string} taskId - 任务ID
   * @param {Object} taskData - 任务数据
   */
  async executeResumeGenerateTask(taskId, taskData) {
    try {
      await this.updateTask(taskId, 'processing', 20, '准备生成简历...');
      
      // TODO: 实现简历PDF生成逻辑
      await this.updateTask(taskId, 'processing', 60, '正在生成PDF...');
      
      // 模拟生成过程（稍后替换为真实逻辑）
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.updateTask(taskId, 'completed', 100, '简历生成完成', {
        pdfUrl: '/generated-resumes/placeholder.pdf'
      });

    } catch (error) {
      console.error('简历生成任务失败:', error);
      await this.updateTask(taskId, 'failed', 100, '简历生成失败', null, error.message);
    }
  }

  /**
   * 执行AI优化任务
   * @param {string} taskId - 任务ID
   * @param {Object} taskData - 任务数据
   */
  async executeAIOptimizeTask(taskId, taskData) {
    const { aiService } = require('./aiService');
    
    try {
      const { resumeData, targetCompany, targetPosition, jobDescription } = taskData;
      
      await this.updateTask(taskId, 'processing', 20, '开始AI优化分析...');
      
      const optimizedData = await aiService.optimizeResumeForJob(
        resumeData,
        targetCompany,
        targetPosition,
        jobDescription
      );
      
      await this.updateTask(taskId, 'processing', 80, 'AI优化完成，正在保存结果...');
      
      await this.updateTask(taskId, 'completed', 100, 'AI优化完成', {
        optimizedData
      });

    } catch (error) {
      console.error('AI优化任务失败:', error);
      await this.updateTask(taskId, 'failed', 100, 'AI优化失败', null, error.message);
    }
  }

  /**
   * 清理过期任务
   * @param {number} daysOld - 清理多少天前的任务
   */
  async cleanupOldTasks(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      await knex('task_progress_logs')
        .whereIn('task_id', 
          knex('task_queue')
            .select('task_id')
            .where('created_at', '<', cutoffDate)
        )
        .del();

      const deletedCount = await knex('task_queue')
        .where('created_at', '<', cutoffDate)
        .del();

      console.log(`🧹 清理了 ${deletedCount} 个过期任务`);
    } catch (error) {
      console.error('清理过期任务失败:', error);
    }
  }
}

// 创建单例实例
const taskQueueService = new TaskQueueService();

// 启动时处理待处理任务
setImmediate(() => taskQueueService.processNextTask());

module.exports = { taskQueueService, TaskQueueService }; 