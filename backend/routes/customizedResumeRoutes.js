/**
 * 专属简历路由
 * 处理专属简历相关的API请求
 * 
 * 路由：
 * - POST /api/resumes/customize - 生成专属简历
 * - GET /api/customized-resumes - 获取专属简历列表
 * - GET /api/customized-resumes/:id - 获取专属简历详情
 * - DELETE /api/customized-resumes/:id - 删除专属简历
 */

const express = require('express');
const router = express.Router();

const CustomizedResumeController = require('../controllers/CustomizedResumeController');
const { authenticateToken } = require('../middleware/auth');

// 应用认证中间件到所有路由
router.use(authenticateToken);

/**
 * 检查专属简历是否存在
 * GET /api/resumes/customize/check
 * 
 * 查询参数：
 * - baseResumeId: 基础简历ID
 * - targetJobId: 目标岗位ID
 * 
 * 响应：
 * {
 *   "success": true,
 *   "data": {
 *     "exists": true,
 *     "customizedResumeId": 123,
 *     "baseResumeTitle": "我的基础简历",
 *     "jobTitle": "高级前端工程师",
 *     "jobCompany": "科技公司",
 *     "createdAt": "2025-07-04T06:00:00.000Z"
 *   },
 *   "message": "检查完成"
 * }
 */
router.get('/resumes/customize/check', CustomizedResumeController.checkCustomizedResumeExists);

/**
 * 生成专属简历 - MVP核心接口
 * POST /api/resumes/customize
 * 
 * 请求体：
 * {
 *   "baseResumeId": 1,
 *   "targetJobId": 2,
 *   "forceOverwrite": false // 可选，是否强制覆盖已存在的简历
 * }
 * 
 * 响应：
 * {
 *   "success": true,
 *   "data": {
 *     "customizedResumeId": 123,
 *     "baseResumeTitle": "我的基础简历",
 *     "jobTitle": "高级前端工程师",
 *     "jobCompany": "科技公司",
 *     "profileName": "张三",
 *     "createdAt": "2025-07-04T06:00:00.000Z"
 *   },
 *   "message": "专属简历生成成功"
 * }
 */
router.post('/resumes/customize', CustomizedResumeController.generateCustomizedResume);

/**
 * 获取用户专属简历列表
 * GET /api/customized-resumes
 * 
 * 查询参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20）
 * - baseResumeId: 基础简历ID（可选）
 * - targetJobId: 目标岗位ID（可选）
 * 
 * 响应：
 * {
 *   "success": true,
 *   "data": [...],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 5,
 *     "totalPages": 1
 *   },
 *   "message": "获取专属简历列表成功"
 * }
 */
router.get('/customized-resumes', CustomizedResumeController.getCustomizedResumeList);

/**
 * 获取专属简历详情
 * GET /api/customized-resumes/:id
 * 
 * 响应：
 * {
 *   "success": true,
 *   "data": {
 *     "id": 123,
 *     "userId": 2,
 *     "baseResumeId": 1,
 *     "targetJobId": 2,
 *     "optimizedData": { ... },
 *     "createdAt": "2025-07-04T06:00:00.000Z",
 *     "updatedAt": "2025-07-04T06:00:00.000Z",
 *     "baseResumeTitle": "我的基础简历",
 *     "jobTitle": "高级前端工程师",
 *     "jobCompany": "科技公司"
 *   },
 *   "message": "获取专属简历成功"
 * }
 */
router.get('/customized-resumes/:id', CustomizedResumeController.getCustomizedResume);

/**
 * 删除专属简历
 * DELETE /api/customized-resumes/:id
 * 
 * 响应：
 * {
 *   "success": true,
 *   "message": "专属简历删除成功"
 * }
 */
router.delete('/customized-resumes/:id', CustomizedResumeController.deleteCustomizedResume);

module.exports = router; 