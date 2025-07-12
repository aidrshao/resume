/**
 * 岗位管理控制器 (v2.0 - Refactored)
 * 使用纯对象导出，避免循环依赖和'this'上下文问题
 */
const JobPosition = require('../models/JobPosition');
const { validateJobData, validateJobUpdate } = require('../utils/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传 (保持在顶层，因为它不依赖于控制器实例)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/jobs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const userId = req.user.userId;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${timestamp}_${userId}_${basename}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});


const JobController = {
  /**
   * 获取岗位列表
   */
  async getJobs(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, status, priority, search } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (priority) filters.priority = parseInt(priority);
      if (search) filters.search = search;
      const pagination = { page: parseInt(page), limit: parseInt(limit) };
      const result = await JobPosition.getJobsByUserId(userId, filters, pagination);
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('获取岗位列表失败:', error);
      res.status(500).json({ success: false, message: '获取岗位列表失败' });
    }
  },

  /**
   * 获取岗位详情
   */
  async getJobById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, message: '无效的岗位ID' });
      }
      const result = await JobPosition.getJobById(parseInt(id), userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('获取岗位详情失败:', error);
      res.status(500).json({ success: false, message: '获取岗位详情失败' });
    }
  },

  /**
   * 创建新岗位（文本输入）
   */
  async createJob(req, res) {
    try {
      const userId = req.user.userId;
      const jobData = { ...req.body, user_id: userId, source_type: 'text' };
      const validation = validateJobData(jobData);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: validation.errors.join(', ') });
      }
      const result = await JobPosition.createJob(jobData);
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('创建岗位失败:', error);
      res.status(500).json({ success: false, message: '创建岗位失败' });
    }
  },

  /**
   * 上传文件创建岗位
   */
  async uploadJobFile(req, res) {
    try {
      upload.single('file')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message || '文件上传失败' });
        }
        if (!req.file) {
          return res.status(400).json({ success: false, message: '请选择要上传的文件' });
        }
        const userId = req.user.userId;
        const { title, company, notes } = req.body;
        if (!title || !company) {
          return res.status(400).json({ success: false, message: '请填写职位名称和公司名称' });
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
          try { fs.unlinkSync(req.file.path); } catch (deleteError) { console.error('删除上传文件失败:', deleteError); }
          res.status(400).json(result);
        }
      });
    } catch (error) {
      console.error('上传岗位文件失败:', error);
      res.status(500).json({ success: false, message: '上传岗位文件失败' });
    }
  },

  /**
   * 更新岗位信息
   */
  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, message: '无效的岗位ID' });
      }
      const validation = validateJobUpdate(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: validation.errors.join(', ') });
      }
      const result = await JobPosition.updateJob(parseInt(id), userId, req.body);
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('更新岗位失败:', error);
      res.status(500).json({ success: false, message: '更新岗位失败' });
    }
  },

  /**
   * 删除岗位
   */
  async deleteJob(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, message: '无效的岗位ID' });
      }
      const result = await JobPosition.deleteJob(parseInt(id), userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('删除岗位失败:', error);
      res.status(500).json({ success: false, message: '删除岗位失败' });
    }
  },

  /**
   * 批量更新岗位状态
   */
  async batchUpdateStatus(req, res) {
    try {
      const userId = req.user.userId;
      const { ids, status } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: '请选择要更新的岗位' });
      }
      if (!['active', 'applied', 'archived'].includes(status)) {
        return res.status(400).json({ success: false, message: '无效的状态值' });
      }
      const result = await JobPosition.batchUpdateStatus(ids, userId, status);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('批量更新岗位状态失败:', error);
      res.status(500).json({ success: false, message: '批量更新岗位状态失败' });
    }
  },

  /**
   * 获取岗位统计信息
   */
  async getJobStats(req, res) {
    try {
      const userId = req.user.userId;
      const result = await JobPosition.getJobStats(userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('获取岗位统计失败:', error);
      res.status(500).json({ success: false, message: '获取岗位统计失败' });
    }
  }
};

module.exports = JobController;