/**
 * V2版本简历解析控制器
 * 处理简历文件上传，创建后台解析任务
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const TaskQueueService = require('../../services/v2/taskQueueService');

class ResumeParserController {
  constructor() {
    this.taskQueue = new TaskQueueService();
    this.setupMulter();
  }

  /**
   * 配置文件上传
   */
  setupMulter() {
    // 配置文件存储
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadDir = 'uploads/v2/resumes';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `resume-${uniqueSuffix}-${sanitizedOriginalName}`);
      }
    });

    // 配置文件过滤器
    const fileFilter = (req, file, cb) => {
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
        cb(new Error('只支持PDF、Word文档和TXT文本格式'), false);
      }
    };

    // 创建multer实例
    this.upload = multer({
      storage: storage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB限制
      },
      fileFilter: fileFilter
    });
  }

  /**
   * 处理简历解析请求
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async parseResume(req, res) {
    const requestId = req.requestId || `PARSE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      console.log('🚀 [RESUME_PARSER_V2] ==> 开始处理简历解析请求');
      console.log('🚀 [RESUME_PARSER_V2] 请求ID:', requestId);
      console.log('🚀 [RESUME_PARSER_V2] 用户ID:', req.user?.id);
      
      // 验证用户
      if (!req.user || !req.user.id) {
        console.error('❌ [RESUME_PARSER_V2] 用户认证失败');
        return res.status(401).json({
          success: false,
          message: '用户认证失败',
          error_code: 'UNAUTHORIZED',
          request_id: requestId
        });
      }

      // 验证文件
      if (!req.file) {
        console.error('❌ [RESUME_PARSER_V2] 未检测到上传文件');
        return res.status(400).json({
          success: false,
          message: '请选择要上传的简历文件',
          error_code: 'FILE_MISSING',
          request_id: requestId
        });
      }

      const { file, user } = req;
      console.log('📄 [RESUME_PARSER_V2] 文件信息:', {
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      });

      // 生成唯一任务ID
      const taskId = uuidv4();
      console.log('🆔 [RESUME_PARSER_V2] 生成任务ID:', taskId);

      // 创建任务数据
      const taskData = {
        taskId,
        userId: user.id,
        filePath: file.path,
        fileName: file.originalname,
        fileSize: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString(),
        status: 'queued',
        requestId
      };

      console.log('📝 [RESUME_PARSER_V2] 任务数据:', {
        taskId: taskData.taskId,
        userId: taskData.userId,
        fileName: taskData.fileName,
        fileSize: taskData.fileSize,
        status: taskData.status
      });

      // 将任务推送到队列
      await this.taskQueue.addTask('resume_parse', taskData);
      console.log('✅ [RESUME_PARSER_V2] 任务已添加到队列');

      // 初始化任务状态
      await this.taskQueue.setTaskStatus(taskId, {
        status: 'queued',
        progress: 0,
        message: '任务已加入队列，等待处理...',
        createdAt: new Date().toISOString()
      });

      console.log('🎯 [RESUME_PARSER_V2] 任务创建完成，返回响应');

      // 返回任务ID给前端
      res.json({
        success: true,
        data: {
          taskId,
          status: 'queued',
          message: '简历文件已上传，正在排队处理...',
          estimated_time: '90-120秒',
          polling_interval: 2000 // 建议轮询间隔2秒
        },
        request_id: requestId,
        timestamp: new Date().toISOString()
      });

      console.log('✅ [RESUME_PARSER_V2] 响应已发送，任务ID:', taskId);

    } catch (error) {
      console.error('❌ [RESUME_PARSER_V2] 处理失败:', error);
      console.error('❌ [RESUME_PARSER_V2] 错误堆栈:', error.stack);

      // 清理已上传的文件
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('🧹 [RESUME_PARSER_V2] 已清理上传文件:', req.file.path);
        } catch (cleanupError) {
          console.error('❌ [RESUME_PARSER_V2] 清理文件失败:', cleanupError);
        }
      }

      // 根据错误类型返回适当的状态码
      let statusCode = 500;
      let errorCode = 'INTERNAL_SERVER_ERROR';
      let message = '服务器内部错误';

      if (error.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        errorCode = 'FILE_TOO_LARGE';
        message = '文件大小超过限制（最大50MB）';
      } else if (error.message && error.message.includes('只支持')) {
        statusCode = 400;
        errorCode = 'INVALID_FILE_TYPE';
        message = error.message;
      }

      res.status(statusCode).json({
        success: false,
        message,
        error_code: errorCode,
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// 创建单例实例
const resumeParserController = new ResumeParserController();

module.exports = {
  upload: resumeParserController.upload,
  parseResume: resumeParserController.parseResume.bind(resumeParserController)
}; 