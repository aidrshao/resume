/**
 * 任务队列服务
 * 管理异步任务的生命周期，包括创建、执行、状态更新等
 */

const knex = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const { validateAndCompleteUnifiedFormat } = require('../utils/dataTransformer');

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

      // 安全解析 JSON 数据
      let resultData = null;
      if (task.result_data) {
        if (typeof task.result_data === 'string') {
          resultData = JSON.parse(task.result_data);
        } else if (typeof task.result_data === 'object') {
          resultData = task.result_data;
        }
      }

      return {
        taskId: task.task_id,
        taskType: task.task_type,
        status: task.status,
        progress: task.progress,
        message: task.status_message,
        resultData: resultData,
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

      return logs.map(log => {
        // 安全解析 metadata JSON
        let metadata = null;
        if (log.metadata) {
          if (typeof log.metadata === 'string') {
            metadata = JSON.parse(log.metadata);
          } else if (typeof log.metadata === 'object') {
            metadata = log.metadata;
          }
        }

        return {
          progress: log.progress,
          message: log.message,
          metadata: metadata,
          timestamp: log.created_at
        };
      });
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
      // 处理 knex 自动解析 JSON 列的情况
      let taskData;
      if (typeof taskDataJson === 'string') {
        taskData = JSON.parse(taskDataJson);
      } else if (typeof taskDataJson === 'object' && taskDataJson !== null) {
        taskData = taskDataJson;
      } else {
        throw new Error('无效的任务数据格式');
      }

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
    const startTime = Date.now();
    console.log('🔧 [RESUME_PARSE_TASK] ==> 开始执行简历解析任务');
    console.log('🔧 [RESUME_PARSE_TASK] 开始时间:', new Date().toISOString());
    console.log('🔧 [RESUME_PARSE_TASK] 任务参数:', {
      taskId: taskId,
      taskData: {
        filePath: taskData.filePath,
        fileType: taskData.fileType,
        originalName: taskData.originalName,
        userId: taskData.userId
      }
    });
    
    const ResumeParseService = require('./resumeParseService');
    let stageStartTime = Date.now();
    
    // 状态文本轮换数组
    const progressMessages = {
      init: [
        '🚀 正在初始化解析引擎...',
        '📋 正在验证文件完整性...',
        '🔍 正在检查文件格式...'
      ],
      extract: [
        '📄 正在提取文档内容...',
        '🔤 正在识别文本信息...',
        '📝 正在整理文档结构...',
        '⚡ 正在优化文本质量...'
      ],
      ai_analysis: [
        '🤖 AI正在理解简历结构...',
        '🧠 AI正在识别个人信息...',
        '💼 AI正在分析工作经历...',
        '🎓 AI正在解析教育背景...',
        '⚙️ AI正在提取技能信息...',
        '🏆 AI正在识别项目经验...',
        '🔍 AI正在验证数据准确性...',
        '✨ AI正在优化数据结构...'
      ],
      cleanup: [
        '🧹 正在清理和验证数据...',
        '📊 正在格式化输出结果...',
        '✅ 正在完成最后检查...'
      ]
    };
    
    try {
      const { filePath, fileType } = taskData;
      
      // === 阶段1: 初始化验证 (0%-10%) ===
      console.log('⏱️ [PERFORMANCE] 阶段1-初始化验证 开始');
      await this.updateTask(taskId, 'processing', 2, progressMessages.init[0]);
      
      console.log('🔧 [RESUME_PARSE_TASK] 验证文件存在性...');
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }
      
      await this.updateTask(taskId, 'processing', 5, progressMessages.init[1]);
      
      // 获取文件信息
      const fileStats = fs.statSync(filePath);
      console.log('📄 [RESUME_PARSE_TASK] 文件信息:', {
        size: fileStats.size,
        sizeHuman: (fileStats.size / 1024).toFixed(2) + 'KB',
        modified: fileStats.mtime
      });
      
      await this.updateTask(taskId, 'processing', 8, progressMessages.init[2]);
      
      const stage1Duration = Date.now() - stageStartTime;
      console.log(`⏱️ [PERFORMANCE] 阶段1完成，耗时: ${stage1Duration}ms`);
      
      // === 阶段2: 文本提取 (10%-30%) ===
      stageStartTime = Date.now();
      console.log('⏱️ [PERFORMANCE] 阶段2-文本提取 开始');
      await this.updateTask(taskId, 'processing', 12, progressMessages.extract[0]);
      
      let extractedText = '';
      const extractStartTime = Date.now();
      
      switch (fileType.toLowerCase()) {
        case 'pdf':
          console.log('🔧 [RESUME_PARSE_TASK] 提取PDF文本...');
          await this.updateTask(taskId, 'processing', 15, '📄 正在解析PDF文档...');
          extractedText = await ResumeParseService.extractTextFromPDF(filePath);
          break;
        case 'docx':
        case 'doc':
          console.log('🔧 [RESUME_PARSE_TASK] 提取Word文本...');
          await this.updateTask(taskId, 'processing', 15, '📄 正在解析Word文档...');
          extractedText = await ResumeParseService.extractTextFromWord(filePath);
          break;
        case 'txt':
          console.log('🔧 [RESUME_PARSE_TASK] 读取TXT文本...');
          await this.updateTask(taskId, 'processing', 15, '📄 正在读取文本文件...');
          extractedText = await ResumeParseService.extractTextFromTXT(filePath);
          break;
        default:
          throw new Error(`不支持的文件类型: ${fileType}`);
      }

      const extractDuration = Date.now() - extractStartTime;
      console.log(`⏱️ [PERFORMANCE] 文本提取耗时: ${extractDuration}ms`);
      console.log('🔧 [RESUME_PARSE_TASK] 文本提取完成:', {
        textLength: extractedText.length,
        extractTime: extractDuration + 'ms',
        preview: extractedText.substring(0, 100) + '...'
      });

      await this.updateTask(taskId, 'processing', 25, progressMessages.extract[2]);
      await this.updateTask(taskId, 'processing', 30, `✅ 文本提取完成 (${extractedText.length}字符, ${extractDuration}ms)`);

      const stage2Duration = Date.now() - stageStartTime;
      console.log(`⏱️ [PERFORMANCE] 阶段2完成，耗时: ${stage2Duration}ms`);

      // === 阶段3: AI智能分析 (30%-85%) ===
      stageStartTime = Date.now();
      console.log('⏱️ [PERFORMANCE] 阶段3-AI分析 开始');
      console.log('🔧 [RESUME_PARSE_TASK] 开始AI结构化分析...');
      
      let currentProgress = 32;
      let messageIndex = 0;
      
      // 启动AI分析
      await this.updateTask(taskId, 'processing', currentProgress, progressMessages.ai_analysis[0]);

      // 创建动态进度更新定时器
      const progressInterval = setInterval(async () => {
        try {
          // 渐进式增加进度 (每次1-3%)
          const increment = Math.random() * 2 + 1;
          currentProgress = Math.min(currentProgress + increment, 82);
          
          // 轮换状态文本
          messageIndex = (messageIndex + 1) % progressMessages.ai_analysis.length;
          const currentMessage = progressMessages.ai_analysis[messageIndex];
          
          const elapsedTime = Math.round((Date.now() - stageStartTime) / 1000);
          const statusMessage = `${currentMessage} (${elapsedTime}s)`;
          
          await this.updateTask(taskId, 'processing', Math.round(currentProgress), statusMessage);
          
          console.log(`🤖 [AI_PROGRESS] 进度: ${Math.round(currentProgress)}%, 耗时: ${elapsedTime}s, 消息: ${currentMessage}`);
        } catch (err) {
          console.warn('AI进度更新失败:', err.message);
        }
      }, 3000); // 每3秒更新一次

      try {
        // 实际AI调用 - 增加超时控制
        console.log('🤖 [AI_CALL] 开始调用AI服务...');
        const aiCallStartTime = Date.now();
        
        // 设置AI调用超时 (5分钟)
        const AI_TIMEOUT = 5 * 60 * 1000;
        const aiCallPromise = ResumeParseService.structureResumeText(extractedText);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AI调用超时 (5分钟)')), AI_TIMEOUT);
        });
        
        const structuredData = await Promise.race([aiCallPromise, timeoutPromise]);
        
        const aiCallDuration = Date.now() - aiCallStartTime;
        console.log(`⏱️ [PERFORMANCE] AI调用耗时: ${aiCallDuration}ms (${(aiCallDuration/1000).toFixed(1)}s)`);
        
        // 清除进度定时器
        clearInterval(progressInterval);
        
        console.log('🔧 [RESUME_PARSE_TASK] AI结构化完成:', {
          hasProfile: !!(structuredData && structuredData.profile),
          hasWorkExperience: !!(structuredData && structuredData.workExperience),
          hasEducation: !!(structuredData && structuredData.education),
          aiCallTime: aiCallDuration + 'ms'
        });

        // AI分析完成
        await this.updateTask(taskId, 'processing', 85, `✅ AI分析完成 (耗时${(aiCallDuration/1000).toFixed(1)}s)`);
        
        const stage3Duration = Date.now() - stageStartTime;
        console.log(`⏱️ [PERFORMANCE] 阶段3完成，总耗时: ${stage3Duration}ms`);
        
        // === 阶段4: 数据清理验证 (85%-100%) ===
        stageStartTime = Date.now();
        console.log('⏱️ [PERFORMANCE] 阶段4-数据清理 开始');
        
        await this.updateTask(taskId, 'processing', 88, progressMessages.cleanup[0]);
        
        console.log('🔧 [RESUME_PARSE_TASK] 开始数据清理验证...');
        const cleanupStartTime = Date.now();
        
        console.log('✅ [TASK_QUEUE] AI解析完成!');
        console.log('📊 [TASK_QUEUE] 原始AI返回数据:', JSON.stringify(structuredData, null, 2));

        // 记录解析结果统计
        const stats = {
          hasProfile: !!(structuredData && structuredData.profile),
          hasWorkExperience: !!(structuredData && structuredData.workExperience),
          hasEducation: !!(structuredData && structuredData.education),
          hasSkills: !!(structuredData && structuredData.skills),
          hasProjectExperience: !!(structuredData && structuredData.projectExperience)
        };

        console.log('📊 [TASK_QUEUE] 解析结果统计:', stats);

        // 转换为统一格式
        const unifiedData = validateAndCompleteUnifiedFormat(structuredData);

        console.log('✅ [TASK_QUEUE] 数据转换完成, 保存简历...');

        const cleanupDuration = Date.now() - cleanupStartTime;
        
        console.log(`⏱️ [PERFORMANCE] 数据清理耗时: ${cleanupDuration}ms`);
        
        await this.updateTask(taskId, 'processing', 95, progressMessages.cleanup[1]);

        // 直接使用统一格式保存，不需要兼容性处理
        const resumeId = await ResumeParseService.saveBaseResume(
          taskData.userId,
          extractedText,
          unifiedData  // 直接使用统一格式
        );

        await this.updateTask(taskId, 'processing', 98, progressMessages.cleanup[2]);
        
        const stage4Duration = Date.now() - stageStartTime;
        console.log(`⏱️ [PERFORMANCE] 阶段4完成，耗时: ${stage4Duration}ms`);
        
        // === 任务完成统计 ===
        const totalDuration = Date.now() - startTime;
        console.log('✅ [RESUME_PARSE_TASK] 简历解析完成');
        console.log(`⏱️ [PERFORMANCE] 总耗时统计:`);
        console.log(`  - 阶段1(初始化): ${stage1Duration}ms`);
        console.log(`  - 阶段2(文本提取): ${stage2Duration}ms (${((stage2Duration/totalDuration)*100).toFixed(1)}%)`);
        console.log(`  - 阶段3(AI分析): ${stage3Duration}ms (${((stage3Duration/totalDuration)*100).toFixed(1)}%)`);
        console.log(`  - 阶段4(数据清理): ${stage4Duration}ms`);
        console.log(`  - 总计: ${totalDuration}ms (${(totalDuration/1000).toFixed(1)}s)`);

        // 完成任务
        await this.updateTask(taskId, 'completed', 100, `🎉 解析完成！总耗时${(totalDuration/1000).toFixed(1)}秒`, {
          extractedText,
          structuredData: unifiedData,  // 使用统一格式数据
          performance: {
            totalDuration,
            stages: {
              initialization: stage1Duration,
              textExtraction: stage2Duration,
              aiAnalysis: stage3Duration,
              dataCleanup: stage4Duration
            }
          }
        });

      } catch (aiError) {
        // 清除进度定时器
        clearInterval(progressInterval);
        
        const aiErrorDuration = Date.now() - stageStartTime;
        console.error(`❌ [AI_ERROR] AI分析失败，耗时: ${aiErrorDuration}ms`);
        console.error('❌ [AI_ERROR] 错误详情:', aiError.message);
        
        throw aiError;
      }

    } catch (error) {
      const errorDuration = Date.now() - startTime;
      console.error('❌ [RESUME_PARSE_TASK] 简历解析任务失败:', {
        taskId: taskId,
        error: error.message,
        totalDuration: errorDuration + 'ms',
        stack: error.stack,
        taskData: taskData
      });
      
      let errorMessage = error.message;
      if (error.message.includes('超时')) {
        errorMessage = `处理超时: ${error.message}。建议简化简历内容或稍后重试。`;
      }
      
      await this.updateTask(taskId, 'failed', 100, '❌ 解析失败', null, errorMessage);
    } finally {
      // 清理临时文件
      try {
        console.log('🗑️ [RESUME_PARSE_TASK] 开始清理临时文件...');
        const fs = require('fs');
        if (taskData.filePath) {
          fs.unlink(taskData.filePath, (err) => {
            if (err) {
              console.error('❌ [RESUME_PARSE_TASK] 删除临时文件失败:', err);
            } else {
              console.log('✅ [RESUME_PARSE_TASK] 临时文件已清理:', taskData.filePath);
            }
          });
        }
      } catch (cleanupError) {
        console.error('❌ [RESUME_PARSE_TASK] 文件清理过程中出错:', cleanupError);
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