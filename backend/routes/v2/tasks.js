/**
 * V2版本任务路由
 * 提供新的简历解析和任务状态查询API
 */

const express = require('express');
const router = express.Router();
const resumeParserController = require('../../controllers/v2/resumeParserController');
const taskStatusController = require('../../controllers/v2/taskStatusController');
const { authenticateToken } = require('../../middleware/auth');

// 应用认证中间件
router.use(authenticateToken);

/**
 * 简历解析端点
 * POST /api/v2/resumes/parse
 * 上传并解析简历文件
 */
router.post('/resumes/parse', 
  resumeParserController.upload.single('resume'), 
  resumeParserController.parseResume
);

/**
 * 任务状态查询端点
 * GET /api/v2/tasks/:taskId/status
 * 查询指定任务的执行状态
 */
router.get('/tasks/:taskId/status', taskStatusController.getTaskStatus);

/**
 * 任务结果获取端点
 * GET /api/v2/tasks/:taskId/result
 * 获取已完成任务的解析结果
 */
router.get('/tasks/:taskId/result', taskStatusController.getTaskResult);

module.exports = router; 