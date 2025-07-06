/**
 * V2版本任务队列服务
 * 使用Redis管理任务状态、队列和结果缓存
 */

const Redis = require('ioredis');

class TaskQueueService {
  constructor() {
    this.setupRedis();
    this.queues = new Map(); // 内存队列作为备用
    this.taskCallbacks = new Map(); // 任务处理回调
    this.processingQueues = new Set(); // 正在处理的队列，避免重复处理
  }

  /**
   * 初始化Redis连接
   */
  setupRedis() {
    try {
      // Redis配置
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 1000,
        retryDelayOnClusterDown: 300,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      };

      this.redis = new Redis(redisConfig);
      this.redisSubscriber = new Redis(redisConfig);

      // Redis连接事件处理
      this.redis.on('connect', () => {
        console.log('✅ [TASK_QUEUE_V2] Redis连接成功');
        this.isRedisConnected = true;
      });

      this.redis.on('error', (error) => {
        console.error('❌ [TASK_QUEUE_V2] Redis连接错误:', error.message);
        this.isRedisConnected = false;
      });

      this.redis.on('close', () => {
        console.warn('⚠️ [TASK_QUEUE_V2] Redis连接关闭');
        this.isRedisConnected = false;
      });

      // 初始检查连接
      this.checkRedisConnection();

    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] Redis初始化失败:', error);
      this.isRedisConnected = false;
    }
  }

  /**
   * 检查Redis连接状态
   */
  async checkRedisConnection() {
    try {
      await this.redis.ping();
      this.isRedisConnected = true;
      console.log('✅ [TASK_QUEUE_V2] Redis健康检查通过');
    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] Redis健康检查失败:', error.message);
      this.isRedisConnected = false;
    }
  }

  /**
   * 添加任务到队列
   * @param {string} queueName - 队列名称
   * @param {Object} taskData - 任务数据
   * @returns {Promise<boolean>} 是否添加成功
   */
  async addTask(queueName, taskData) {
    const { taskId } = taskData;
    
    try {
      console.log(`📋 [TASK_QUEUE_V2] 添加任务到队列: ${queueName}`, {
        taskId,
        userId: taskData.userId,
        fileName: taskData.fileName
      });

      if (this.isRedisConnected) {
        // 使用Redis队列
        console.log(`📋 [TASK_QUEUE_V2] 使用Redis队列存储任务`);
        const pipeline = this.redis.pipeline();
        
        // 1. 将任务数据存储到hash
        pipeline.hset(`task:${taskId}`, {
          data: JSON.stringify(taskData),
          created_at: new Date().toISOString(),
          status: 'queued'
        });

        // 2. 将任务ID推入队列
        pipeline.lpush(`queue:${queueName}`, taskId);

        // 3. 设置任务数据过期时间（24小时）
        pipeline.expire(`task:${taskId}`, 24 * 60 * 60);

        const results = await pipeline.exec();
        console.log(`✅ [TASK_QUEUE_V2] 任务已添加到Redis队列，Pipeline结果:`, results.map(r => r[1]));

        // 立即触发任务处理（如果该队列没有正在处理）
        if (!this.processingQueues.has(queueName)) {
          setImmediate(() => this.processQueue(queueName));
        }
        
        return true;
      } else {
        // 使用内存队列作为备用
        console.warn('⚠️ [TASK_QUEUE_V2] Redis不可用，使用内存队列');
        
        if (!this.queues.has(queueName)) {
          this.queues.set(queueName, []);
        }
        
        this.queues.get(queueName).push({
          taskId,
          data: taskData,
          createdAt: new Date().toISOString(),
          status: 'queued'
        });

        console.log(`✅ [TASK_QUEUE_V2] 任务已添加到内存队列，队列长度: ${this.queues.get(queueName).length}`);

        // 立即触发任务处理（如果该队列没有正在处理）
        if (!this.processingQueues.has(queueName)) {
          setImmediate(() => this.processQueue(queueName));
        }
        
        return true;
      }
    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] 添加任务失败:', error);
      console.error('❌ [TASK_QUEUE_V2] 错误详情:', {
        taskId,
        queueName,
        redisConnected: this.isRedisConnected,
        error: error.message,
        stack: error.stack.split('\n').slice(0, 5).join('\n')
      });
      return false;
    }
  }

  /**
   * 处理队列中的任务
   * @param {string} queueName - 队列名称
   */
  async processQueue(queueName) {
    // 检查是否已经有相同队列在处理
    if (this.processingQueues.has(queueName)) {
      console.log(`⚠️ [TASK_QUEUE_V2] 队列 ${queueName} 已在处理中，跳过`);
      return;
    }

    // 标记队列为正在处理
    this.processingQueues.add(queueName);

    try {
      console.log(`🔄 [TASK_QUEUE_V2] 开始处理队列: ${queueName}`);
      console.log(`🔄 [TASK_QUEUE_V2] Redis连接状态: ${this.isRedisConnected}`);

      if (this.isRedisConnected) {
        // 从Redis队列获取任务
        console.log(`🔄 [TASK_QUEUE_V2] 从Redis队列获取任务: queue:${queueName}`);
        const taskId = await this.redis.brpop(`queue:${queueName}`, 1);
        
        if (taskId && taskId[1]) {
          const actualTaskId = taskId[1];
          console.log(`🎯 [TASK_QUEUE_V2] 获取到任务: ${actualTaskId}`);
          
          const taskDataString = await this.redis.hget(`task:${actualTaskId}`, 'data');
          if (taskDataString) {
            console.log(`🎯 [TASK_QUEUE_V2] 任务数据获取成功，长度: ${taskDataString.length}`);
            const taskData = JSON.parse(taskDataString);
            await this.executeTask(queueName, actualTaskId, taskData);
          } else {
            console.warn(`⚠️ [TASK_QUEUE_V2] 任务数据不存在: ${actualTaskId}`);
          }
        } else {
          console.log(`🔄 [TASK_QUEUE_V2] 队列中暂无任务: ${queueName}`);
        }
      } else {
        // 使用内存队列
        console.log(`🔄 [TASK_QUEUE_V2] 使用内存队列处理任务`);
        const queue = this.queues.get(queueName);
        if (queue && queue.length > 0) {
          const task = queue.shift();
          console.log(`🎯 [TASK_QUEUE_V2] 内存队列获取到任务: ${task.taskId}`);
          await this.executeTask(queueName, task.taskId, task.data);
        } else {
          console.log(`🔄 [TASK_QUEUE_V2] 内存队列中暂无任务`);
        }
      }

      // 继续处理下一个任务
      setTimeout(() => {
        this.processingQueues.delete(queueName); // 移除标记
        this.processQueue(queueName);
      }, 1000);

    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] 处理队列失败:', error);
      console.error('❌ [TASK_QUEUE_V2] 错误详情:', {
        queueName,
        redisConnected: this.isRedisConnected,
        error: error.message,
        stack: error.stack.split('\n').slice(0, 5).join('\n')
      });
      // 出错后延迟重试
      setTimeout(() => {
        this.processingQueues.delete(queueName); // 移除标记
        this.processQueue(queueName);
      }, 5000);
    }
  }

  /**
   * 执行任务
   * @param {string} queueName - 队列名称
   * @param {string} taskId - 任务ID
   * @param {Object} taskData - 任务数据
   */
  async executeTask(queueName, taskId, taskData) {
    try {
      console.log(`⚡ [TASK_QUEUE_V2] 开始执行任务: ${taskId}`);
      console.log(`⚡ [TASK_QUEUE_V2] 队列名称: ${queueName}`);
      console.log(`⚡ [TASK_QUEUE_V2] 任务数据:`, {
        taskId,
        userId: taskData.userId,
        fileName: taskData.fileName,
        fileSize: taskData.fileSize,
        mimetype: taskData.mimetype,
        filePath: taskData.filePath
      });
      
      // 更新任务状态为处理中
      await this.setTaskStatus(taskId, {
        status: 'processing',
        progress: 0,
        message: '开始处理任务...',
        startedAt: new Date().toISOString()
      });

      // 根据队列名称选择处理器
      if (queueName === 'resume_parse') {
        const ResumeParseTaskHandler = require('./resumeParseTaskHandler');
        // 传入当前的TaskQueueService实例，确保使用同一个Redis连接和状态管理
        const handler = new ResumeParseTaskHandler(this);
        await handler.process(taskId, taskData);
      } else {
        throw new Error(`未知的队列类型: ${queueName}`);
      }

      console.log(`✅ [TASK_QUEUE_V2] 任务执行完成: ${taskId}`);

    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] 任务执行失败:', error);
      console.error('❌ [TASK_QUEUE_V2] 错误详情:', {
        taskId,
        queueName,
        error: error.message,
        stack: error.stack.split('\n').slice(0, 10).join('\n')
      });
      
      // 更新任务状态为失败
      await this.setTaskStatus(taskId, {
        status: 'failed',
        progress: 0,
        message: '任务处理失败',
        error: error.message,
        failedAt: new Date().toISOString()
      });
    }
  }

  /**
   * 设置任务状态
   * @param {string} taskId - 任务ID
   * @param {Object} status - 状态对象
   */
  async setTaskStatus(taskId, status) {
    try {
      const statusData = {
        ...status,
        updatedAt: new Date().toISOString()
      };

      if (this.isRedisConnected) {
        await this.redis.hset(`task:${taskId}:status`, statusData);
        await this.redis.expire(`task:${taskId}:status`, 24 * 60 * 60);
      } else {
        // 内存存储备用
        if (!this.taskStatuses) {
          this.taskStatuses = new Map();
        }
        this.taskStatuses.set(taskId, statusData);
      }

      console.log(`📊 [TASK_QUEUE_V2] 任务状态更新: ${taskId}`, {
        status: status.status,
        progress: status.progress
      });

    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] 设置任务状态失败:', error);
    }
  }

  /**
   * 获取任务状态
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object|null>} 任务状态
   */
  async getTaskStatus(taskId) {
    try {
      if (this.isRedisConnected) {
        const status = await this.redis.hgetall(`task:${taskId}:status`);
        return Object.keys(status).length > 0 ? status : null;
      } else {
        // 内存存储备用
        return this.taskStatuses?.get(taskId) || null;
      }
    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] 获取任务状态失败:', error);
      return null;
    }
  }

  /**
   * 获取任务数据
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object|null>} 任务数据
   */
  async getTaskData(taskId) {
    try {
      if (this.isRedisConnected) {
        const taskDataString = await this.redis.hget(`task:${taskId}`, 'data');
        return taskDataString ? JSON.parse(taskDataString) : null;
      } else {
        // 内存存储备用
        const queue = Array.from(this.queues.values()).flat();
        const task = queue.find(t => t.taskId === taskId);
        return task ? task.data : null;
      }
    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] 获取任务数据失败:', error);
      return null;
    }
  }

  /**
   * 设置任务结果
   * @param {string} taskId - 任务ID
   * @param {Object} result - 任务结果
   */
  async setTaskResult(taskId, result) {
    try {
      const key = `task_result_${taskId}`;
      const resultJson = JSON.stringify(result);
      
      // 🔧 优化1: 延长保存时间到24小时
      const ttl = 24 * 60 * 60; // 24小时而不是1小时
      
      await this.redis.setex(key, ttl, resultJson);
      
      // 🔧 优化2: 添加备份存储（用于重要数据）
      const backupKey = `backup_result_${taskId}`;
      await this.redis.setex(backupKey, ttl * 2, resultJson); // 备份保存48小时
      
      console.log(`✅ [TASK_QUEUE_V2] 任务结果已保存: ${key}, TTL: ${ttl}秒, 备份: ${backupKey}`);
      
    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] 保存任务结果失败:', error);
      throw error;
    }
  }

  /**
   * 获取任务结果（增强版）
   * @param {string} taskId - 任务ID
   * @returns {Object|null} 任务结果
   */
  async getTaskResult(taskId) {
    try {
      const key = `task_result_${taskId}`;
      let resultJson = await this.redis.get(key);
      
      // 🔧 优化3: 如果主存储过期，尝试从备份恢复
      if (!resultJson) {
        console.log(`⚠️ [TASK_QUEUE_V2] 主结果已过期，尝试从备份恢复: ${taskId}`);
        const backupKey = `backup_result_${taskId}`;
        resultJson = await this.redis.get(backupKey);
        
        if (resultJson) {
          console.log(`✅ [TASK_QUEUE_V2] 从备份恢复成功: ${taskId}`);
          // 恢复到主存储
          await this.redis.setex(key, 3600, resultJson);
        }
      }
      
      return resultJson ? JSON.parse(resultJson) : null;
      
    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] 获取任务结果失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期任务
   * @param {number} maxAge - 最大年龄（毫秒）
   */
  async cleanupExpiredTasks(maxAge = 24 * 60 * 60 * 1000) {
    try {
      console.log('🧹 [TASK_QUEUE_V2] 开始清理过期任务');
      
      if (this.isRedisConnected) {
        // Redis的过期机制会自动清理
        console.log('✅ [TASK_QUEUE_V2] Redis自动过期机制已启用');
      } else {
        // 手动清理内存中的过期任务
        const now = Date.now();
        let cleanedCount = 0;

        if (this.taskStatuses) {
          for (const [taskId, status] of this.taskStatuses.entries()) {
            const createdAt = new Date(status.createdAt || status.updatedAt).getTime();
            if (now - createdAt > maxAge) {
              this.taskStatuses.delete(taskId);
              cleanedCount++;
            }
          }
        }

        console.log(`✅ [TASK_QUEUE_V2] 清理了 ${cleanedCount} 个过期任务`);
      }
    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] 清理任务失败:', error);
    }
  }

  /**
   * 关闭连接
   */
  async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      if (this.redisSubscriber) {
        await this.redisSubscriber.quit();
      }
      console.log('✅ [TASK_QUEUE_V2] 连接已关闭');
    } catch (error) {
      console.error('❌ [TASK_QUEUE_V2] 关闭连接失败:', error);
    }
  }
}

module.exports = TaskQueueService; 