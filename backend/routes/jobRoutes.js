/**
 * 岗位管理路由
 * 处理岗位相关的API路由
 */

const express = require('express');
const router = express.Router();
const JobController = require('../controllers/jobController');
const { authenticateToken } = require('../middleware/auth');

// 所有岗位相关的路由都需要登录验证
router.use(authenticateToken);

/**
 * 获取岗位统计信息
 * GET /api/jobs/stats
 * 必须在 /api/jobs/:id 之前定义，避免路由冲突
 */
router.get('/stats', JobController.getJobStats);

/**
 * 批量更新岗位状态
 * PUT /api/jobs/batch/status
 * 必须在 /api/jobs/:id 之前定义，避免路由冲突
 */
router.put('/batch/status', JobController.batchUpdateStatus);

/**
 * 上传文件创建岗位
 * POST /api/jobs/upload
 * 必须在 /api/jobs/:id 之前定义，避免路由冲突
 */
router.post('/upload', JobController.uploadJobFile);

/**
 * 获取岗位列表
 * GET /api/jobs
 * 支持分页、过滤、搜索
 * 
 * 查询参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20）
 * - status: 状态过滤（active/applied/archived）
 * - priority: 优先级过滤（1-5）
 * - search: 搜索关键词（职位名称、公司名称、描述）
 */
router.get('/', JobController.getJobs);

/**
 * 创建新岗位（文本输入）
 * POST /api/jobs
 * 
 * 请求体：
 * {
 *   "title": "职位名称",
 *   "company": "公司名称",
 *   "description": "职位描述",
 *   "requirements": "岗位要求",
 *   "salary_range": "薪资范围",
 *   "location": "工作地点",
 *   "job_type": "工作类型",
 *   "priority": 优先级,
 *   "application_deadline": "申请截止日期",
 *   "notes": "备注"
 * }
 */
router.post('/', JobController.createJob);

/**
 * 获取岗位详情
 * GET /api/jobs/:id
 */
router.get('/:id', JobController.getJobById);

/**
 * 更新岗位信息
 * PUT /api/jobs/:id
 * 
 * 请求体：支持部分更新，只需要提供要更新的字段
 */
router.put('/:id', JobController.updateJob);

/**
 * 删除岗位
 * DELETE /api/jobs/:id
 */
router.delete('/:id', JobController.deleteJob);

module.exports = router; 