/**
 * 简历控制器
 * 处理简历相关的所有API请求
 */

const { Resume, UserProfile, ResumeTemplate } = require('../models/Resume');
const { aiService } = require('../services/aiService');
const ResumeParseService = require('../services/resumeParseService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const knex = require('../config/database');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/resumes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB限制，与Nginx保持一致
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|docx|doc/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持PDF和Word文档格式'));
    }
  }
});

// 删除演示模式配置

class ResumeController {
  /**
   * 获取用户的所有简历
   * GET /api/resumes
   */
  static async getUserResumes(req, res) {
    try {
      const userId = req.user.id;
      const resumes = await Resume.findByUserId(userId);
      
      res.json({
        success: true,
        data: resumes,
        message: '获取简历列表成功'
      });
    } catch (error) {
      console.error('获取简历列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取简历列表失败'
      });
    }
  }

  /**
   * 获取简历详情
   * GET /api/resumes/:id
   */
  static async getResumeById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const resume = await Resume.findById(id);
      
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: '简历不存在'
        });
      }
      
      // 检查权限
      if (resume.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问此简历'
        });
      }
      
      res.json({
        success: true,
        data: resume,
        message: '获取简历详情成功'
      });
    } catch (error) {
      console.error('获取简历详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取简历详情失败'
      });
    }
  }

  /**
   * 创建新简历
   * POST /api/resumes
   */
  static async createResume(req, res) {
    try {
      const userId = req.user.id;
      const { title, templateId, generationMode, targetCompany, targetPosition, jobDescription } = req.body;
      
      // 获取用户完整信息
      const userCompleteProfile = await UserProfile.getCompleteProfile(userId);
      
      const resumeData = {
        user_id: userId,
        template_id: templateId || null,
        title,
        generation_mode: generationMode || 'normal',
        target_company: targetCompany || null,
        target_position: targetPosition || null,
        job_description: jobDescription || null,
        resume_data: userCompleteProfile,
        status: 'draft'
      };
      
      const resume = await Resume.create(resumeData);
      
      res.json({
        success: true,
        data: resume,
        message: '创建简历成功'
      });
    } catch (error) {
      console.error('创建简历失败:', error);
      res.status(500).json({
        success: false,
        message: '创建简历失败'
      });
    }
  }

  /**
   * 更新简历
   * PUT /api/resumes/:id
   */
  static async updateResume(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;
      
      // 检查简历是否存在且属于当前用户
      const existingResume = await Resume.findById(id);
      if (!existingResume || existingResume.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权访问'
        });
      }
      
      const resume = await Resume.update(id, updateData);
      
      res.json({
        success: true,
        data: resume,
        message: '更新简历成功'
      });
    } catch (error) {
      console.error('更新简历失败:', error);
      res.status(500).json({
        success: false,
        message: '更新简历失败'
      });
    }
  }

  /**
   * 删除简历
   * DELETE /api/resumes/:id
   */
  static async deleteResume(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // 检查简历是否存在且属于当前用户
      const resume = await Resume.findById(id);
      if (!resume || resume.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权限访问'
        });
      }
      
      // 删除简历
      await Resume.delete(id);
      
      res.json({
        success: true,
        message: '简历删除成功'
      });
    } catch (error) {
      console.error('删除简历失败:', error);
      res.status(500).json({
        success: false,
        message: '删除简历失败'
      });
    }
  }

  /**
   * 生成简历（普通模式）
   * POST /api/resumes/:id/generate
   */
  static async generateResume(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const resume = await Resume.findById(id);
      if (!resume || resume.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权访问'
        });
      }
      
      // 更新状态为生成中
      await Resume.updateStatus(id, 'generating', '开始生成简历');
      
      // 异步执行简历生成
      setImmediate(async () => {
        try {
          console.log('🚀 开始生成简历PDF');
          
          // TODO: 这里应该调用实际的PDF生成服务
          // 例如使用 puppeteer 或其他PDF生成库
          // const pdfUrl = await generateResumePDF(resume.resume_data, resume.template_id);
          
          // 暂时标记为完成，等待PDF生成功能实现
          await Resume.updateStatus(id, 'completed', '简历生成完成');
          console.log('✅ 简历生成完成');
          
        } catch (error) {
          console.error('❌ 简历生成失败:', error);
          await Resume.updateStatus(id, 'failed', `生成失败: ${error.message}`);
        }
      });
      
      res.json({
        success: true,
        message: '简历生成任务已启动'
      });
    } catch (error) {
      console.error('生成简历失败:', error);
      res.status(500).json({
        success: false,
        message: '生成简历失败'
      });
    }
  }

  /**
   * 高级模式生成简历（AI优化）
   * POST /api/resumes/:id/generate-advanced
   */
  static async generateAdvancedResume(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // 校验AI配额
      const MembershipController = require('./membershipController');
      try {
        await MembershipController.consumeAIQuota(userId, 'resume_optimization', parseInt(id));
        console.log('✅ [AI配额] 配额校验通过并已消耗');
      } catch (quotaError) {
        console.log('❌ [AI配额] 配额校验失败:', quotaError.message);
        return res.status(403).json({
          success: false,
          message: quotaError.message,
          error_code: 'QUOTA_EXCEEDED'
        });
      }
      
      const resume = await Resume.findById(id);
      if (!resume || resume.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权访问'
        });
      }
      
      if (!resume.target_company || !resume.target_position) {
        return res.status(400).json({
          success: false,
          message: '高级模式需要提供目标公司和岗位信息'
        });
      }
      
      // 更新状态为生成中
      await Resume.updateStatus(id, 'generating', '开始AI优化简历');
      
      // 异步执行AI优化
      setImmediate(async () => {
        try {
          console.log('🚀 开始AI优化简历');
          
          // 使用AI优化简历内容
          const optimizedData = await aiService.optimizeResumeForJob(
            resume.resume_data,
            resume.target_company,
            resume.target_position,
            resume.job_description
          );
          
          console.log('✅ AI优化完成');
          
          // 更新简历数据
          await Resume.update(id, {
            resume_data: optimizedData,
            ai_optimizations: optimizedData.optimizations || [],
            status: 'completed'
          });
          
          await Resume.updateStatus(id, 'completed', 'AI优化简历生成完成');
          
        } catch (error) {
          console.error('❌ AI优化失败:', error);
          await Resume.updateStatus(id, 'failed', `AI优化失败: ${error.message}`);
        }
      });
      
      res.json({
        success: true,
        message: 'AI优化简历生成任务已启动'
      });
    } catch (error) {
      console.error('高级生成简历失败:', error);
      res.status(500).json({
        success: false,
        message: '高级生成简历失败'
      });
    }
  }

  /**
   * 上传简历文件进行解析（异步任务）
   * POST /api/resumes/upload
   */
  static async uploadAndParseResume(req, res) {
    const startTime = Date.now();
    const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    console.log('🚀 [UPLOAD_RESUME] ==> 开始处理简历上传请求');
    console.log('🚀 [UPLOAD_RESUME] 请求ID:', requestId);
    console.log('🚀 [UPLOAD_RESUME] 时间戳:', new Date().toISOString());
    console.log('🚀 [UPLOAD_RESUME] 请求方法:', req.method);
    console.log('🚀 [UPLOAD_RESUME] 请求URL:', req.url);
    console.log('🚀 [UPLOAD_RESUME] 请求IP:', req.ip || req.connection.remoteAddress);
    
    console.log('📋 [UPLOAD_RESUME] 请求头详情:', {
      authorization: req.headers.authorization ? 'Bearer ***' : '无',
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      userAgent: req.headers['user-agent'],
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer
    });
    
    console.log('👤 [UPLOAD_RESUME] 用户认证信息:', req.user ? { 
      id: req.user.id, 
      userId: req.user.userId,
      type: typeof req.user.id,
      userType: typeof req.user.userId 
    } : '无用户信息');
    
    const { taskQueueService } = require('../services/taskQueueService');
    
    console.log('📦 [UPLOAD_RESUME] 开始Multer文件上传中间件处理...');
    const uploadMiddleware = upload.single('resume');
    
    uploadMiddleware(req, res, async function (err) {
      console.log('📦 [UPLOAD_RESUME] Multer中间件回调触发');
      
      if (err) {
        console.error('❌ [UPLOAD_RESUME] 文件上传中间件错误类型:', err.constructor.name);
        console.error('❌ [UPLOAD_RESUME] 文件上传中间件错误代码:', err.code);
        console.error('❌ [UPLOAD_RESUME] 文件上传中间件错误:', err.message);
        console.error('❌ [UPLOAD_RESUME] 文件上传中间件错误堆栈:', err.stack);
        
        return res.status(400).json({
          success: false,
          message: err.message,
          error_code: 'FILE_UPLOAD_ERROR',
          request_id: requestId
        });
      }
      
      console.log('✅ [UPLOAD_RESUME] 文件上传中间件处理完成');
      console.log('📄 [UPLOAD_RESUME] 检查上传的文件...');
      
      if (req.file) {
        console.log('📄 [UPLOAD_RESUME] 上传文件详情:', {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          encoding: req.file.encoding,
          mimetype: req.file.mimetype,
          destination: req.file.destination,
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          sizeHuman: (req.file.size / 1024 / 1024).toFixed(2) + 'MB'
        });
      } else {
        console.log('📄 [UPLOAD_RESUME] 无文件信息');
      }
      
      if (!req.file) {
        console.error('❌ [UPLOAD_RESUME] 未检测到上传文件');
        console.error('❌ [UPLOAD_RESUME] req.body:', req.body);
        console.error('❌ [UPLOAD_RESUME] req.files:', req.files);
        
        return res.status(400).json({
          success: false,
          message: '请选择要上传的简历文件',
          error_code: 'NO_FILE_UPLOADED',
          request_id: requestId
        });
      }
      
      try {
        console.log('✅ [UPLOAD_RESUME] 文件上传成功，开始处理...');
        
        // 获取用户ID
        const userId = req.user.id;
        const file = req.file;
        
        console.log('👤 [UPLOAD_RESUME] 处理用户ID:', {
          userId: userId,
          userIdType: typeof userId,
          userObject: req.user
        });
        
        // 文件路径和类型验证
        const fileExtension = path.extname(file.originalname).substring(1).toLowerCase();
        console.log('📄 [UPLOAD_RESUME] 文件扩展名:', fileExtension);
        
        const allowedTypes = ['pdf', 'doc', 'docx'];
        if (!allowedTypes.includes(fileExtension)) {
          console.error('❌ [UPLOAD_RESUME] 不支持的文件类型:', fileExtension);
          return res.status(400).json({
            success: false,
            message: `不支持的文件类型：${fileExtension}。支持的类型：${allowedTypes.join(', ')}`,
            error_code: 'UNSUPPORTED_FILE_TYPE',
            request_id: requestId
          });
        }
        
        console.log('🔧 [UPLOAD_RESUME] 准备创建解析任务...');
        console.log('🔧 [UPLOAD_RESUME] 任务参数:', {
          userId: userId,
          filename: file.originalname,
          fileSize: file.size,
          fileType: fileExtension,
          filePath: file.path
        });
        
        // 校验AI配额
        const MembershipController = require('./membershipController');
        try {
          await MembershipController.consumeAIQuota(userId, 'resume_parse');
          console.log('✅ [AI配额] 简历解析配额校验通过并已消耗');
        } catch (quotaError) {
          console.log('❌ [AI配额] 简历解析配额校验失败:', quotaError.message);
          
          // 清理上传的文件
          if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
              if (err) console.error('❌ [CLEANUP] 删除临时文件失败:', err);
              else console.log('✅ [CLEANUP] 临时文件已清理:', req.file.path);
            });
          }
          
          return res.status(403).json({
            success: false,
            message: quotaError.message,
            error_code: 'QUOTA_EXCEEDED',
            request_id: requestId
          });
        }
        
        // 创建异步解析任务
        console.log('📋 [UPLOAD_RESUME] 调用taskQueueService.createTask...');
        const taskId = await taskQueueService.createTask('resume_parse', {
          filePath: file.path,
          fileType: fileExtension,
          originalName: file.originalname,
          userId: userId
        }, userId);
        
        console.log('✅ [UPLOAD_RESUME] 任务创建成功！');
        console.log('✅ [UPLOAD_RESUME] 任务详情:', { 
          taskId: taskId,
          taskIdType: typeof taskId
        });
        
        const duration = Date.now() - startTime;
        console.log(`🏁 [UPLOAD_RESUME] 请求处理完成，总耗时: ${duration}ms`);
        
        // 立即返回任务ID
        console.log('📤 [UPLOAD_RESUME] 准备发送成功响应...');
        const responseData = {
          success: true,
          data: {
            taskId: taskId,
            status: 'processing',
            message: '简历上传成功，正在后台解析中...',
            file_info: {
              name: file.originalname,
              size: file.size,
              type: fileExtension
            }
          },
          message: '简历解析任务已创建',
          request_id: requestId,
          timestamp: new Date().toISOString()
        };
        
        console.log('📤 [UPLOAD_RESUME] 响应数据:', JSON.stringify(responseData, null, 2));
        
        res.json(responseData);
        
        console.log('✅ [UPLOAD_RESUME] 成功响应已发送');
        
      } catch (error) {
        console.error('❌ [UPLOAD_RESUME] ==> 发生异常错误');
        console.error('❌ [UPLOAD_RESUME] 错误名称:', error.name);
        console.error('❌ [UPLOAD_RESUME] 错误消息:', error.message);
        console.error('❌ [UPLOAD_RESUME] 错误堆栈:', error.stack);
        console.error('❌ [UPLOAD_RESUME] 错误详情:', error);
        
        // 清理上传的临时文件
        if (req.file) {
          console.log('🗑️ [UPLOAD_RESUME] 清理临时文件:', req.file.path);
          fs.unlink(req.file.path, (err) => {
            if (err) {
              console.error('❌ [UPLOAD_RESUME] 删除临时文件失败:', err);
            } else {
              console.log('✅ [UPLOAD_RESUME] 临时文件已清理:', req.file.path);
            }
          });
        }
        
        const errorResponse = {
          success: false,
          message: '创建简历解析任务失败: ' + error.message,
          error_code: 'TASK_CREATION_FAILED',
          request_id: requestId,
          timestamp: new Date().toISOString()
        };
        
        console.log('📤 [UPLOAD_RESUME] 发送错误响应:', JSON.stringify(errorResponse, null, 2));
        
        res.status(500).json(errorResponse);
        
        console.log('❌ [UPLOAD_RESUME] 错误响应已发送');
      }
    });
  }

  /**
   * 获取简历模板列表
   * GET /api/resume-templates
   */
  static async getResumeTemplates(req, res) {
    try {
      const templates = await ResumeTemplate.findAll();
      
      res.json({
        success: true,
        data: templates,
        message: '获取模板列表成功'
      });
    } catch (error) {
      console.error('获取模板列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取模板列表失败'
      });
    }
  }

  /**
   * 获取简历优化建议
   * POST /api/resumes/:id/suggestions
   */
  static async getResumeSuggestions(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const resume = await Resume.findById(id);
      if (!resume || resume.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权访问'
        });
      }
      
      const suggestions = await aiService.generateResumeSuggestions(resume.resume_data);
      
      res.json({
        success: true,
        data: suggestions,
        message: '获取优化建议成功'
      });
    } catch (error) {
      console.error('获取优化建议失败:', error);
      res.status(500).json({
        success: false,
        message: '获取优化建议失败'
      });
    }
  }

  /**
   * 获取任务状态
   * GET /api/tasks/:taskId/status
   */
  static async getTaskStatus(req, res) {
    console.log('📊 [TASK_STATUS] ==> 开始查询任务状态');
    
    try {
      const { taskId } = req.params;
      const userId = req.user.id;
      
      console.log('📊 [TASK_STATUS] 查询参数:', {
        taskId: taskId,
        userId: userId,
        userAgent: req.headers['user-agent']
      });
   
      const { taskQueueService } = require('../services/taskQueueService');
      
      // 验证任务是否属于当前用户
      console.log('📊 [TASK_STATUS] 开始获取任务状态...');
      const task = await taskQueueService.getTaskStatus(taskId);
      console.log('📊 [TASK_STATUS] 任务状态获取成功:', {
        taskId: task.taskId,
        status: task.status,
        progress: task.progress,
        message: task.message
      });
      
      // 检查任务权限（只有任务创建者可以查看）
      console.log('📊 [TASK_STATUS] 开始验证任务权限...');
      const taskRecord = await knex('task_queue')
        .where('task_id', taskId)
        .first();
        
      if (taskRecord && taskRecord.user_id !== userId) {
        console.error('❌ [TASK_STATUS] 权限验证失败:', {
          taskUserId: taskRecord.user_id,
          requestUserId: userId
        });
        return res.status(403).json({
          success: false,
          message: '无权访问此任务'
        });
      }
      
      console.log('✅ [TASK_STATUS] 权限验证通过');
      console.log('📤 [TASK_STATUS] 返回任务状态:', {
        status: task.status,
        progress: task.progress,
        hasResultData: !!task.resultData
      });
      
      res.json({
        success: true,
        data: task,
        message: '获取任务状态成功'
      });
      
    } catch (error) {
      console.error('❌ [TASK_STATUS] 获取任务状态失败:', {
        error: error.message,
        stack: error.stack,
        taskId: req.params.taskId
      });
      
      res.status(500).json({
        success: false,
        message: error.message.includes('任务不存在') ? '任务不存在' : '获取任务状态失败'
      });
    }
  }

  /**
   * 获取任务进度历史
   * GET /api/tasks/:taskId/progress
   */
  static async getTaskProgress(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;
      const { taskQueueService } = require('../services/taskQueueService');
      
      // 验证任务权限
      const taskRecord = await knex('task_queue')
        .where('task_id', taskId)
        .first();
        
      if (!taskRecord) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }
        
      if (taskRecord.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问此任务'
        });
      }
      
      const progressHistory = await taskQueueService.getTaskProgressHistory(taskId);
      
      res.json({
        success: true,
        data: progressHistory,
        message: '获取任务进度成功'
      });
      
    } catch (error) {
      console.error('获取任务进度失败:', error);
      res.status(500).json({
        success: false,
        message: '获取任务进度失败'
      });
    }
  }

  /**
   * 保存基础简历
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async saveBaseResume(req, res) {
    const startTime = Date.now();
    console.log('🚀 [SAVE_BASE_RESUME] 开始处理保存基础简历请求');
    
    try {
      // 1. 验证用户认证
      if (!req.user || (!req.user.id && !req.user.userId)) {
        console.error('❌ [SAVE_BASE_RESUME] 用户未认证或用户ID缺失');
        console.error('❌ [SAVE_BASE_RESUME] req.user:', req.user);
        return res.status(401).json({
          success: false,
          message: '用户未认证',
          error_code: 'USER_NOT_AUTHENTICATED'
        });
      }
      
      // 兼容性处理：支持 req.user.id 和 req.user.userId
      const userId = parseInt(req.user.id || req.user.userId, 10);
      console.log('👤 [SAVE_BASE_RESUME] 原始用户信息:', {
        'req.user.id': req.user.id,
        'req.user.userId': req.user.userId,
        'typeof req.user.id': typeof req.user.id,
        'typeof req.user.userId': typeof req.user.userId
      });
      console.log('👤 [SAVE_BASE_RESUME] 处理后用户ID:', userId, '(类型:', typeof userId, ')');
      
      // 验证用户ID是否为有效数字
      if (!userId || isNaN(userId)) {
        console.error('❌ [SAVE_BASE_RESUME] 用户ID无效:', { userId, originalId: req.user.id || req.user.userId });
        return res.status(400).json({
          success: false,
          message: '用户ID无效',
          error_code: 'INVALID_USER_ID'
        });
      }
      
      // 2. 验证请求数据
      const { resumeData, source, forceOverwrite = false } = req.body;
      console.log('📋 [SAVE_BASE_RESUME] 请求数据验证:');
      console.log('  - source:', source);
      console.log('  - forceOverwrite:', forceOverwrite);
      console.log('  - resumeData 类型:', typeof resumeData);
      console.log('  - resumeData 是否存在:', !!resumeData);
      console.log('  - personalInfo 是否存在:', !!(resumeData && resumeData.personalInfo));
      
      if (!resumeData || !resumeData.personalInfo) {
        console.error('❌ [SAVE_BASE_RESUME] 简历数据不完整');
        return res.status(400).json({
          success: false,
          message: '简历数据不完整',
          error_code: 'RESUME_DATA_INCOMPLETE'
        });
      }

      // 3. 验证用户是否存在（避免外键约束错误）
      console.log('🔍 [SAVE_BASE_RESUME] 验证用户是否存在...');
      const userExists = await knex('users').where('id', userId).first();
      if (!userExists) {
        console.error('❌ [SAVE_BASE_RESUME] 用户不存在:', userId);
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          error_code: 'USER_NOT_FOUND'
        });
      }
      console.log('✅ [SAVE_BASE_RESUME] 用户存在验证通过:', { userId, email: userExists.email });

      // 4. 查询现有基础简历
      console.log('🔍 [SAVE_BASE_RESUME] 查询用户现有基础简历...');
      const existingBaseResume = await Resume.findBaseResumeByUserId(userId);
      console.log('📊 [SAVE_BASE_RESUME] 现有基础简历查询结果:', existingBaseResume ? `ID: ${existingBaseResume.id}` : '无');
      
      // 4. 如果存在现有简历且未强制覆盖，返回确认请求
      if (existingBaseResume && !forceOverwrite) {
        console.log('⚠️ [SAVE_BASE_RESUME] 检测到现有简历，需要用户确认覆盖');
        return res.status(409).json({
          success: false,
          message: '检测到您已有一份基础简历，是否要覆盖现有简历？',
          error_code: 'RESUME_EXISTS_NEED_CONFIRMATION',
          data: {
            existingResume: {
              id: existingBaseResume.id,
              title: existingBaseResume.title,
              created_at: existingBaseResume.created_at,
              updated_at: existingBaseResume.updated_at
            },
            needConfirmation: true
          }
        });
      }
      
      let savedResume;
      if (existingBaseResume && forceOverwrite) {
        // 5. 覆盖现有基础简历
        console.log('🔄 [SAVE_BASE_RESUME] 覆盖现有基础简历...');
        const updateData = {
          title: `${resumeData.personalInfo.name || '我'}的基础简历`,
          resume_data: resumeData,
          source: source,
          updated_at: new Date()
        };
        
        console.log('📝 [SAVE_BASE_RESUME] 覆盖数据:', {
          title: updateData.title,
          source: updateData.source,
          updated_at: updateData.updated_at,
          resume_data_size: JSON.stringify(updateData.resume_data).length
        });
        
        await Resume.update(existingBaseResume.id, updateData);
        savedResume = await Resume.findById(existingBaseResume.id);
        console.log('✅ [SAVE_BASE_RESUME] 基础简历覆盖成功，ID:', existingBaseResume.id);
      } else {
        // 6. 创建新的基础简历
        console.log('➕ [SAVE_BASE_RESUME] 创建新的基础简历...');
        const resumeInfo = {
          user_id: userId,
          title: `${resumeData.personalInfo.name || '我'}的基础简历`,
          resume_data: resumeData,
          template_id: 1, // 默认模板
          source: source,
          is_base: true, // 标记为基础简历
          status: 'draft'
        };

        console.log('📝 [SAVE_BASE_RESUME] 准备插入的数据结构:');
        console.log('  - user_id:', resumeInfo.user_id, '(类型:', typeof resumeInfo.user_id, ')');
        console.log('  - title:', resumeInfo.title);
        console.log('  - template_id:', resumeInfo.template_id);
        console.log('  - source:', resumeInfo.source);
        console.log('  - is_base:', resumeInfo.is_base);
        console.log('  - status:', resumeInfo.status);
        console.log('  - resume_data size:', JSON.stringify(resumeInfo.resume_data).length, 'bytes');

        savedResume = await Resume.create(resumeInfo);
        console.log('✅ [SAVE_BASE_RESUME] 基础简历创建成功，ID:', savedResume.id);
      }

      // 7. 保存用户详细信息
      console.log('👤 [SAVE_BASE_RESUME] 保存用户详细信息...');
      await ResumeController.saveUserProfile(userId, resumeData);
      console.log('✅ [SAVE_BASE_RESUME] 用户详细信息保存成功');

      const duration = Date.now() - startTime;
      console.log(`⏱️ [SAVE_BASE_RESUME] 处理完成，耗时: ${duration}ms`);

      res.json({
        success: true,
        data: savedResume,
        message: existingBaseResume && forceOverwrite ? '基础简历覆盖成功' : '基础简历保存成功',
        debug_info: {
          action: existingBaseResume && forceOverwrite ? 'overwritten' : (existingBaseResume ? 'updated' : 'created'),
          duration: duration
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [SAVE_BASE_RESUME] 保存基础简历失败:');
      console.error('  - 错误类型:', error.constructor.name);
      console.error('  - 错误消息:', error.message);
      console.error('  - 错误堆栈:', error.stack);
      console.error('  - 处理耗时:', duration + 'ms');
      
      // 根据错误类型返回不同的错误信息
      let errorMessage = '保存基础简历失败';
      let errorCode = 'UNKNOWN_ERROR';
      let statusCode = 500;
      
      if (error.message.includes('user_id')) {
        errorMessage = '用户ID字段错误';
        errorCode = 'USER_ID_ERROR';
      } else if (error.message.includes('connection')) {
        errorMessage = '数据库连接失败';
        errorCode = 'DATABASE_CONNECTION_ERROR';
      } else if (error.message.includes('duplicate')) {
        errorMessage = '重复数据错误';
        errorCode = 'DUPLICATE_DATA_ERROR';
      } else if (error.message.includes('validation')) {
        errorMessage = '数据验证失败';
        errorCode = 'VALIDATION_ERROR';
        statusCode = 400;
      }
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error_code: errorCode,
        debug_info: {
          original_error: error.message,
          duration: duration
        }
      });
    }
  }

  /**
   * 保存用户详细信息到user_profiles表
   * @param {number} userId - 用户ID
   * @param {Object} resumeData - 简历数据
   */
  static async saveUserProfile(userId, resumeData) {
    try {
      const { UserProfile } = require('../models/Resume');
      
      const profileData = {
        full_name: resumeData.personalInfo?.name,
        phone: resumeData.personalInfo?.phone,
        location: resumeData.personalInfo?.location,
        summary: resumeData.personalInfo?.summary,
        skills: resumeData.skills ? JSON.stringify(resumeData.skills) : null,
        languages: resumeData.languages ? JSON.stringify(resumeData.languages) : null
      };

      // 使用upsert方法创建或更新用户档案
      await UserProfile.upsert(userId, profileData);

    } catch (error) {
      console.error('保存用户档案失败:', error);
      // 这里不抛出错误，因为主要的简历保存已经成功
    }
  }

  /**
   * 为指定岗位生成专属简历
   * POST /api/resumes/generate-for-job
   */
  static async generateJobSpecificResume(req, res) {
    try {
      const userId = req.user.id;
      const { 
        baseResumeId, 
        jobId, 
        targetCompany, 
        targetPosition, 
        jobDescription, 
        jobRequirements,
        userRequirements 
      } = req.body;

      console.log('🎯 [生成岗位专属简历] 开始生成:', {
        userId,
        baseResumeId,
        jobId,
        targetCompany,
        targetPosition
      });

      // 校验AI配额
      const MembershipController = require('./membershipController');
      try {
        // 确保参数为有效的整数或null，避免NaN
        const validResumeId = baseResumeId ? parseInt(baseResumeId) : null;
        const validJobId = jobId ? parseInt(jobId) : null;
        
        await MembershipController.consumeAIQuota(userId, 'resume_generation', validResumeId, validJobId);
        console.log('✅ [AI配额] 配额校验通过并已消耗');
      } catch (quotaError) {
        console.log('❌ [AI配额] 配额校验失败:', quotaError.message);
        return res.status(403).json({
          success: false,
          message: quotaError.message,
          error_code: 'QUOTA_EXCEEDED'
        });
      }

      // 1. 验证必要参数
      if (!baseResumeId || !targetCompany || !targetPosition) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：基础简历ID、目标公司、目标岗位'
        });
      }

      // 2. 获取基础简历
      const baseResume = await Resume.findById(baseResumeId);
      if (!baseResume || baseResume.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: '基础简历不存在或无权访问'
        });
      }

      console.log('📄 [生成岗位专属简历] 获取基础简历成功:', {
        id: baseResume.id,
        title: baseResume.title
      });

      // 3. 检查是否已存在相同岗位的专属简历
      const existingJobResume = await knex('resumes')
        .where({
          user_id: userId,
          target_company: targetCompany,
          target_position: targetPosition
        })
        .first();

      if (existingJobResume) {
        console.log('⚠️ [生成岗位专属简历] 已存在相同岗位的专属简历');
        return res.status(409).json({
          success: false,
          message: `已存在针对${targetCompany}的${targetPosition}岗位的专属简历`,
          data: { existingResumeId: existingJobResume.id }
        });
      }

      // 4. 构建完整的岗位描述
      const fullJobDescription = [
        jobDescription,
        jobRequirements && `岗位要求：${jobRequirements}`
      ].filter(Boolean).join('\n\n');

      // 5. 创建新的岗位专属简历记录
      const jobSpecificResumeData = {
        user_id: userId,
        template_id: baseResume.template_id,
        title: `${targetPosition} - ${targetCompany}`,
        generation_mode: 'advanced', // 使用高级模式
        target_company: targetCompany,
        target_position: targetPosition,
        job_description: fullJobDescription,
        resume_data: baseResume.resume_data, // 先用基础简历数据
        status: 'generating',
        source: 'job_specific_generation'
      };

      const newResume = await Resume.create(jobSpecificResumeData);
      
      console.log('✅ [生成岗位专属简历] 创建新简历记录成功:', {
        id: newResume.id,
        title: newResume.title
      });

      // 6. 异步进行AI优化
      setImmediate(async () => {
        try {
          console.log('🤖 [生成岗位专属简历] 开始AI优化...');
          
          // 使用AI优化简历内容
          const optimizedData = await aiService.optimizeResumeForJob(
            baseResume.resume_data,
            targetCompany,
            targetPosition,
            fullJobDescription,
            userRequirements
          );
          
          console.log('✅ [生成岗位专属简历] AI优化完成');
          
          // 更新简历数据，确保JSON格式正确
          const updateData = {
            resume_data: JSON.stringify(optimizedData),  // 确保转换为JSON字符串
            ai_optimizations: JSON.stringify(optimizedData.optimizations || []),  // 确保数组也转为JSON
            status: 'completed'
          };
          
          console.log('📝 [生成岗位专属简历] 准备更新数据库...');
          await Resume.update(newResume.id, updateData);
          
          console.log('🎊 [生成岗位专属简历] 岗位专属简历生成完成:', newResume.id);
          
        } catch (error) {
          console.error('❌ [生成岗位专属简历] AI优化失败:', error);
          await Resume.update(newResume.id, {
            status: 'failed',
            generation_log: `AI优化失败: ${error.message}`
          });
        }
      });

      // 7. 立即返回成功响应
      res.json({
        success: true,
        data: {
          id: newResume.id,
          title: newResume.title,
          target_company: targetCompany,
          target_position: targetPosition,
          status: 'generating'
        },
        message: '岗位专属简历生成任务已启动，请稍后查看结果'
      });

    } catch (error) {
      console.error('❌ [生成岗位专属简历] 生成失败:', error);
      res.status(500).json({
        success: false,
        message: '生成岗位专属简历失败',
        error: error.message
      });
    }
  }
}

module.exports = ResumeController; 