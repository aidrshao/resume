/**
 * 简历相关路由
 * 定义简历功能的所有API端点
 */

const express = require('express');
const router = express.Router();
const ResumeController = require('../controllers/resumeController');
const AIChatController = require('../controllers/aiChatController');
const { authenticateToken } = require('../middleware/auth');

// 健康检查端点（无需认证）
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    service: 'resume-api'
  });
});

// 演示API已删除 - 统一使用认证后的功能

// 应用认证中间件到需要登录的路由
router.use(authenticateToken);

// 简历CRUD路由
router.get('/resumes', ResumeController.getUserResumes);
router.get('/resumes/:id', ResumeController.getResumeById);
router.post('/resumes', ResumeController.createResume);
router.put('/resumes/:id', ResumeController.updateResume);
router.delete('/resumes/:id', ResumeController.deleteResume);

// 保存基础简历
router.post('/resumes/save-base', ResumeController.saveBaseResume);

// 简历生成路由
router.post('/resumes/:id/generate', ResumeController.generateResume);
router.post('/resumes/:id/generate-advanced', ResumeController.generateAdvancedResume);

// 简历上传和解析
router.post('/resumes/upload', ResumeController.uploadAndParseResume);

// 任务状态查询
router.get('/tasks/:taskId/status', ResumeController.getTaskStatus);
router.get('/tasks/:taskId/progress', ResumeController.getTaskProgress);

// 简历模板路由
router.get('/resume-templates', ResumeController.getResumeTemplates);

// 简历优化建议
router.post('/resumes/:id/suggestions', ResumeController.getResumeSuggestions);

// AI对话路由
router.post('/ai-chat/start', AIChatController.startInfoCollection);
router.post('/ai-chat/message', AIChatController.sendMessage);
router.get('/ai-chat/history/:sessionId', AIChatController.getChatHistory);
router.get('/ai-chat/sessions', AIChatController.getChatSessions);
router.post('/ai-chat/end', AIChatController.endConversation);

module.exports = router; 