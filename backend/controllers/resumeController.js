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
const { db: knex } = require('../config/database');
const MembershipController = require('./membershipController');

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
    fileSize: 50 * 1024 * 1024, // 50MB限制
  },
  fileFilter: function (req, file, cb) {
    // 允许的文件扩展名
    const allowedExtensions = /\.(pdf|docx|doc|txt)$/i;
    const extname = allowedExtensions.test(file.originalname);
    
    // 允许的MIME类型
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain' // .txt
    ];
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持PDF、Word文档和TXT文本格式'));
    }
  }
});

class ResumeController {
  /**
   * 获取用户的所有简历
   */
  static async getUserResumes(req, res) {
    try {
      console.log('🔄 [RESUME_CONTROLLER] 开始处理getUserResumes请求');
      console.log('🔄 [RESUME_CONTROLLER] 请求ID:', req.requestId);
      console.log('🔄 [RESUME_CONTROLLER] 用户信息:', {
        userId: req.user?.id,
        userObject: req.user,
        hasUser: !!req.user
      });
      
      const userId = req.user.id;
      console.log('🔍 [RESUME_CONTROLLER] 提取的用户ID:', userId);
      
      if (!userId) {
        console.error('❌ [RESUME_CONTROLLER] 用户ID为空');
        return res.status(400).json({
          success: false,
          message: '用户ID无效'
        });
      }

      console.log('🔄 [RESUME_CONTROLLER] 开始调用Resume.findListByUserId...');
      const startTime = Date.now();
      
      const resumes = await Resume.findListByUserId(userId);
      
      const duration = Date.now() - startTime;
      console.log('✅ [RESUME_CONTROLLER] Resume.findListByUserId调用成功');
      console.log('📊 [RESUME_CONTROLLER] 耗时:', duration + 'ms');
      console.log('📊 [RESUME_CONTROLLER] 返回记录数:', resumes?.length || 0);
      console.log('📊 [RESUME_CONTROLLER] 数据类型:', typeof resumes);
      console.log('📊 [RESUME_CONTROLLER] 是否为数组:', Array.isArray(resumes));
      
      if (resumes && resumes.length > 0) {
        console.log('📋 [RESUME_CONTROLLER] 第一条记录样本:', {
          id: resumes[0].id,
          title: resumes[0].title,
          status: resumes[0].status,
          created_at: resumes[0].created_at
        });
      }

      console.log('🔄 [RESUME_CONTROLLER] 开始构造响应...');
      const response = {
        success: true,
        data: resumes,
        message: '获取简历列表成功'
      };
      
      console.log('📊 [RESUME_CONTROLLER] 响应对象构造完成:', {
        success: response.success,
        dataLength: response.data?.length,
        message: response.message
      });

      console.log('🔄 [RESUME_CONTROLLER] 发送响应...');
      res.json(response);
      console.log('✅ [RESUME_CONTROLLER] 响应发送完成');
      
    } catch (error) {
      console.error('❌ [RESUME_CONTROLLER] getUserResumes失败');
      console.error('❌ [RESUME_CONTROLLER] 请求ID:', req.requestId);
      console.error('❌ [RESUME_CONTROLLER] 用户ID:', req.user?.id);
      console.error('❌ [RESUME_CONTROLLER] 错误类型:', error.constructor.name);
      console.error('❌ [RESUME_CONTROLLER] 错误消息:', error.message);
      console.error('❌ [RESUME_CONTROLLER] 错误堆栈:', error.stack);
      console.error('❌ [RESUME_CONTROLLER] 错误详情:', error);
      
      // 根据错误类型返回不同的错误信息
      let statusCode = 500;
      let message = '获取简历列表失败';
      
      if (error.code === 'ECONNREFUSED') {
        message = '数据库连接失败';
      } else if (error.message && error.message.includes('invalid input syntax')) {
        message = '数据查询参数错误';
        statusCode = 400;
      } else if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
        message = '数据表不存在';
      }
      
      console.error('❌ [RESUME_CONTROLLER] 最终错误响应:', {
        statusCode,
        message,
        timestamp: new Date().toISOString()
      });
      
      res.status(statusCode).json({
        success: false,
        message: message,
        error_code: 'RESUME_LIST_ERROR',
        request_id: req.requestId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 获取简历详情
   */
  static async getResumeById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const resume = await Resume.findByIdAndUser(id, userId);
      
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权访问'
        });
      }
      
      // 将resume_data映射为content字段
      const resumeWithContent = {
        ...resume,
        content: resume.resume_data || resume.content || ''
      };

      res.json({
        success: true,
        data: resumeWithContent,
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
   */
  static async createResume(req, res) {
    try {
      const { title, content, template_id } = req.body;
      const userId = req.user.id;

      const resumeData = {
        user_id: userId,
        title: title || '新简历',
        resume_data: content || {},
        template_id: template_id || null,
        status: 'draft'
      };

      const resumeId = await Resume.create(resumeData);
      const resume = await Resume.findById(resumeId);

      res.status(201).json({
        success: true,
        data: resume,
        message: '简历创建成功'
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
   */
  static async updateResume(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const updated = await Resume.updateByIdAndUser(id, userId, updateData);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权限修改'
        });
      }

      res.json({
        success: true,
        message: '简历更新成功'
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
   */
  static async deleteResume(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await Resume.deleteByIdAndUser(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权限删除'
        });
      }

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
   * 上传并解析简历
   */
  static async uploadAndParseResume(req, res) {
    try {
      console.log('📤 [UPLOAD_DEBUG] 开始处理文件上传');
      console.log('📤 [UPLOAD_DEBUG] req.file:', req.file);
      console.log('📤 [UPLOAD_DEBUG] req.files:', req.files);
      console.log('📤 [UPLOAD_DEBUG] req.body:', req.body);
      console.log('📤 [UPLOAD_DEBUG] Content-Type:', req.get('content-type'));
      
      if (!req.file) {
        console.error('❌ [UPLOAD_DEBUG] req.file 不存在');
        return res.status(400).json({
          success: false,
          message: '请选择要上传的文件'
        });
      }

      const userId = req.user.id;
      const filePath = req.file.path;
      
      // 从文件扩展名获取文件类型
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let fileType;
      
      switch (fileExtension) {
        case '.pdf':
          fileType = 'pdf';
          break;
        case '.docx':
          fileType = 'docx';
          break;
        case '.doc':
          fileType = 'doc';
          break;
        case '.txt':
          fileType = 'txt';
          break;
        default:
          console.error('❌ [UPLOAD_DEBUG] 不支持的文件类型:', fileExtension);
          return res.status(400).json({
            success: false,
            message: `不支持的文件类型: ${fileExtension}`
          });
      }
      
      console.log('📄 [UPLOAD_DEBUG] 检测到文件类型:', fileType);

      // 解析简历内容 - 修复参数传递错误
      const parseResult = await ResumeParseService.parseResumeFile(filePath, fileType);
      
      // 清理临时文件
      fs.unlink(filePath, (err) => {
        if (err) console.error('删除临时文件失败:', err);
      });

      if (!parseResult.success) {
        return res.status(500).json(parseResult);
      }
      
      console.log('✅ [UPLOAD_DEBUG] 文件解析成功，开始保存到数据库');

      // 保存解析结果到数据库
      try {
        const savedResume = await ResumeParseService.saveBaseResume(
          userId, 
          parseResult.extractedText, 
          parseResult.structuredData
        );
        
        console.log('✅ [UPLOAD_DEBUG] 简历保存成功，ID:', savedResume.id);

        // 返回前端期望的格式
        res.json({
          success: true,
          data: {
            taskId: savedResume.id.toString(), // 使用简历ID作为taskId
            resumeId: savedResume.id,
            extractedText: parseResult.extractedText,
            structuredData: parseResult.structuredData
          },
          message: '简历解析并保存成功'
        });

      } catch (saveError) {
        console.error('❌ [UPLOAD_DEBUG] 保存简历失败:', saveError);
        return res.status(500).json({
          success: false,
          error: `保存简历失败: ${saveError.message}`,
          extractedText: parseResult.extractedText,
          structuredData: parseResult.structuredData
        });
      }

    } catch (error) {
      console.error('上传解析简历失败:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: '简历解析失败'
      });
    }
  }

  /**
   * 生成针对特定职位的简历
   */
  static async generateJobSpecificResume(req, res) {
    try {
      const { job_id, generation_mode = 'advanced' } = req.body;
      const userId = req.user.id;

      // 检查配额
      const quotaCheck = await MembershipController.checkAndConsumeQuota(userId, 'ai_generation');
      if (!quotaCheck.success) {
        return res.status(403).json(quotaCheck);
      }

      // 获取基础简历
      const baseResume = await Resume.findBaseResumeByUserId(userId);
      if (!baseResume) {
        return res.status(404).json({
          success: false,
          message: '请先上传基础简历'
        });
      }

      // 获取职位信息
      const job = await knex('job_positions').where({ id: job_id, user_id: userId }).first();
      if (!job) {
        return res.status(404).json({
          success: false,
          message: '职位不存在'
        });
      }

      // 生成简历
      const result = await aiService.generateJobSpecificResume(baseResume, job, generation_mode);
      
      if (!result.success) {
        return res.status(500).json(result);
      }

      // 保存生成的简历
      const resumeData = {
        user_id: userId,
        title: `${job.title} - ${job.company}`,
        resume_data: result.data,
        generation_mode,
        target_company: job.company,
        target_position: job.title,
        status: 'completed',
        source: 'job_specific_generation'
      };

      const resumeId = await Resume.create(resumeData);
      const savedResume = await Resume.findById(resumeId);

      res.json({
        success: true,
        data: savedResume,
        message: '简历生成成功'
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
   * 保存基础简历
   */
  static async saveBaseResume(req, res) {
    try {
      const { content } = req.body;
      const userId = req.user.id;

      // 验证content是否为统一格式数据
      if (!content || !content.profile) {
        return res.status(400).json({
          success: false,
          message: '简历数据格式无效：必须包含profile字段'
        });
      }

      // 调用服务层保存基础简历，参数顺序：userId, originalText, unifiedData
      const savedResume = await ResumeParseService.saveBaseResume(
        userId, 
        '', // originalText - 这里为空，因为是用户编辑后的数据
        content // unifiedData - 统一格式的简历数据
      );

      res.json({
        success: true,
        data: {
          resumeId: savedResume.id,
          title: savedResume.title
        },
        message: '基础简历保存成功'
      });
    } catch (error) {
      console.error('保存基础简历失败:', error);
      res.status(500).json({
        success: false,
        message: '保存基础简历失败'
      });
    }
  }

  /**
   * 生成简历
   */
  static async generateResume(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 检查配额
      const quotaCheck = await MembershipController.checkAndConsumeQuota(userId, 'ai_generation');
      if (!quotaCheck.success) {
        return res.status(403).json(quotaCheck);
      }

      const resume = await Resume.findByIdAndUser(id, userId);
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: '简历不存在'
        });
      }

      // 生成简历逻辑
      const result = await aiService.generateResume(resume);
      
      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: '简历生成成功'
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
   * 获取任务状态
   */
  static async getTaskStatus(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;

      // 🆕 兼容逻辑：如果 taskId 是纯数字，说明前端直接把简历ID当作 taskId 传递过来。
      // 此时直接查询简历表并返回 "已完成" 状态，避免 500 错误。
      if (/^\d+$/.test(taskId)) {
        try {
          const { Resume } = require('../models/Resume');
          const numericId = parseInt(taskId, 10);
          const resume = await Resume.findByIdAndUser(numericId, userId);

          if (resume) {
            // 🔧 使用enrichResumeData处理后的数据，确保unified_data正确解析
            const unifiedData = resume.unified_data;
            console.log(`🔍 [TASK_STATUS] 简历ID: ${numericId}, 数据存在: ${!!unifiedData}`);
            console.log(`🔍 [TASK_STATUS] unifiedData类型: ${typeof unifiedData}`);
            console.log(`🔍 [TASK_STATUS] unifiedData内容预览: ${JSON.stringify(unifiedData).substring(0, 200)}...`);
            
            if (unifiedData) {
              console.log(`✅ [TASK_STATUS] 找到结构化数据，用户: ${unifiedData.profile?.name || '未知'}`);
            }

            const responseData = {
              taskId: taskId.toString(),
              status: 'completed',
              progress: 100,
              stage: 'cleanup',
              message: '解析完成',
              hasResultData: !!unifiedData,
              resultData: {
                structuredData: unifiedData
              }
            };

            console.log(`📤 [TASK_STATUS] 准备返回的数据结构:`);
            console.log(`📤 [TASK_STATUS] - taskId: ${responseData.taskId}`);
            console.log(`📤 [TASK_STATUS] - status: ${responseData.status}`);
            console.log(`📤 [TASK_STATUS] - hasResultData: ${responseData.hasResultData}`);
            console.log(`📤 [TASK_STATUS] - resultData存在: ${!!responseData.resultData}`);
            console.log(`📤 [TASK_STATUS] - structuredData存在: ${!!responseData.resultData?.structuredData}`);

            return res.json({
              success: true,
              data: responseData,
              message: '获取任务状态成功'
            });
          }
        } catch (resumeErr) {
          console.error('数字任务ID兼容查询简历失败:', resumeErr);
          // 若查询简历失败，则继续按任务队列逻辑处理
        }
      }

      // 导入任务队列服务
      const { taskQueueService } = require('../services/taskQueueService');
      
      // 获取任务状态
      const task = await taskQueueService.getTaskStatus(taskId);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      // 验证任务是否属于当前用户
      if (task.user_id !== userId && task.user_id !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: '无权查看此任务'
        });
      }

      res.json({
        success: true,
        data: {
          taskId: task.task_id,
          status: task.status,
          progress: task.progress || 0,
          message: task.current_step || '处理中...',
          hasResultData: task.status === 'completed' && task.result_data !== null
        },
        message: '获取任务状态成功'
      });
    } catch (error) {
      console.error('获取任务状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取任务状态失败'
      });
    }
  }

  /**
   * 获取任务进度
   */
  static async getTaskProgress(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;

      // 导入任务队列服务
      const { taskQueueService } = require('../services/taskQueueService');
      
      // 获取任务进度日志
      const progressLogs = await taskQueueService.getTaskProgressLogs(taskId);
      
      if (!progressLogs || progressLogs.length === 0) {
        return res.status(404).json({
          success: false,
          message: '任务不存在或无进度信息'
        });
      }

      // 获取最新的进度
      const latestProgress = progressLogs[progressLogs.length - 1];
      const task = await taskQueueService.getTaskStatus(taskId);
      
      // 验证任务是否属于当前用户
      if (task && task.user_id !== userId && task.user_id !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: '无权查看此任务'
        });
      }

      res.json({
        success: true,
        data: {
          taskId,
          progress: latestProgress.progress || 0,
          status: latestProgress.step_name || 'processing',
          message: latestProgress.details || '处理中...',
          logs: progressLogs.map(log => ({
            timestamp: log.timestamp,
            step: log.step_name,
            progress: log.progress,
            details: log.details
          }))
        },
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
   * 获取简历模板
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
   */
  static async getResumeSuggestions(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const resume = await Resume.findByIdAndUser(id, userId);
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: '简历不存在'
        });
      }

      // 简单的建议返回，实际应该调用AI服务
      res.json({
        success: true,
        data: {
          suggestions: [
            '建议增加更多项目经验',
            '技能描述可以更具体',
            '教育背景部分可以简化'
          ]
        },
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
}

module.exports = ResumeController;
// 单独导出upload中间件，但不覆盖主导出
ResumeController.upload = upload; 