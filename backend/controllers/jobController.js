/**
 * 岗位管理控制器
 * 处理岗位相关的HTTP请求
 */

const JobPosition = require('../models/JobPosition');
const { validateJobData, validateJobUpdate } = require('../utils/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/jobs');
    
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：timestamp_userid_original_filename
    const timestamp = Date.now();
    const userId = req.user.id;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${timestamp}_${userId}_${basename}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
  fileFilter: function (req, file, cb) {
    // 允许的文件类型
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', // 图片
      'application/pdf', // PDF
      'application/msword', // DOC
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'text/plain' // TXT
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

class JobController {
  /**
   * 获取岗位列表
   * GET /api/jobs
   */
  static async getJobs(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        search
      } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (priority) filters.priority = parseInt(priority);
      if (search) filters.search = search;

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await JobPosition.getJobsByUserId(userId, filters, pagination);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('获取岗位列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取岗位列表失败'
      });
    }
  }

  /**
   * 获取岗位详情
   * GET /api/jobs/:id
   */
  static async getJobById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: '无效的岗位ID'
        });
      }

      const result = await JobPosition.getJobById(parseInt(id), userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('获取岗位详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取岗位详情失败'
      });
    }
  }

  /**
   * 创建新岗位（文本输入）
   * POST /api/jobs
   */
  static async createJob(req, res) {
    try {
      console.log('🆕 [CREATE_JOB] 开始创建岗位');
      console.log('🆕 [CREATE_JOB] 用户ID:', req.user.id);
      console.log('🆕 [CREATE_JOB] 请求数据:', JSON.stringify(req.body, null, 2));
      
      const userId = req.user.id;
      const jobData = {
        ...req.body,
        user_id: userId,
        source_type: 'text'
      };

      console.log('🆕 [CREATE_JOB] 完整岗位数据:', JSON.stringify(jobData, null, 2));

      // 数据验证
      const validation = validateJobData(jobData);
      console.log('🆕 [CREATE_JOB] 验证结果:', { isValid: validation.isValid, errors: validation.errors });
      
      if (!validation.isValid) {
        console.log('❌ [CREATE_JOB] 数据验证失败:', validation.errors);
        return res.status(400).json({
          success: false,
          message: validation.errors.join(', ')
        });
      }

      console.log('🆕 [CREATE_JOB] 开始调用数据库创建岗位...');
      const result = await JobPosition.createJob(jobData);
      console.log('🆕 [CREATE_JOB] 数据库操作结果:', { success: result.success, hasData: !!result.data });

      if (result.success) {
        console.log('✅ [CREATE_JOB] 岗位创建成功');
        res.status(201).json(result);
      } else {
        console.log('❌ [CREATE_JOB] 岗位创建失败:', result.message);
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('❌ [CREATE_JOB] 创建岗位失败:', error);
      res.status(500).json({
        success: false,
        message: '创建岗位失败'
      });
    }
  }

  /**
   * 上传文件创建岗位
   * POST /api/jobs/upload
   */
  static async uploadJobFile(req, res) {
    try {
      // 使用multer处理文件上传
      upload.single('file')(req, res, async (err) => {
        if (err) {
          console.error('文件上传失败:', err);
          return res.status(400).json({
            success: false,
            message: err.message || '文件上传失败'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: '请选择要上传的文件'
          });
        }

        const userId = req.user.id;
        const { title, company, notes } = req.body;

        // 基本验证
        if (!title || !company) {
          return res.status(400).json({
            success: false,
            message: '请填写职位名称和公司名称'
          });
        }

        const jobData = {
          user_id: userId,
          title,
          company,
          source_type: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
          source_file_path: req.file.path,
          original_content: `文件上传：${req.file.originalname}`,
          notes: notes || '',
          status: 'active',
          priority: 1
        };

        const result = await JobPosition.createJob(jobData);

        if (result.success) {
          res.status(201).json(result);
        } else {
          // 创建失败时删除已上传的文件
          try {
            fs.unlinkSync(req.file.path);
          } catch (deleteError) {
            console.error('删除上传文件失败:', deleteError);
          }
          res.status(400).json(result);
        }
      });
    } catch (error) {
      console.error('上传岗位文件失败:', error);
      res.status(500).json({
        success: false,
        message: '上传岗位文件失败'
      });
    }
  }

  /**
   * 更新岗位信息
   * PUT /api/jobs/:id
   */
  static async updateJob(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: '无效的岗位ID'
        });
      }

      // 数据验证
      const validation = validateJobUpdate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(', ')
        });
      }

      const result = await JobPosition.updateJob(parseInt(id), userId, req.body);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('更新岗位失败:', error);
      res.status(500).json({
        success: false,
        message: '更新岗位失败'
      });
    }
  }

  /**
   * 删除岗位
   * DELETE /api/jobs/:id
   */
  static async deleteJob(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: '无效的岗位ID'
        });
      }

      const result = await JobPosition.deleteJob(parseInt(id), userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('删除岗位失败:', error);
      res.status(500).json({
        success: false,
        message: '删除岗位失败'
      });
    }
  }

  /**
   * 批量更新岗位状态
   * PUT /api/jobs/batch/status
   */
  static async batchUpdateStatus(req, res) {
    try {
      const userId = req.user.id;
      const { ids, status } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请选择要更新的岗位'
        });
      }

      if (!['active', 'applied', 'archived'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态值'
        });
      }

      const result = await JobPosition.batchUpdateStatus(ids, userId, status);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('批量更新岗位状态失败:', error);
      res.status(500).json({
        success: false,
        message: '批量更新岗位状态失败'
      });
    }
  }

  /**
   * 获取岗位统计信息
   * GET /api/jobs/stats
   */
  static async getJobStats(req, res) {
    try {
      const userId = req.user.id;
      const result = await JobPosition.getJobStats(userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('获取岗位统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取岗位统计失败'
      });
    }
  }
}

module.exports = JobController; 