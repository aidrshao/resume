/**
 * 简历渲染路由
 * 处理简历模板选择、预览和PDF生成相关的API路由
 */

const express = require('express');
const router = express.Router();
const ResumeRenderController = require('../controllers/resumeRenderController');
const { verifyToken } = require('../middleware/auth');

// 所有简历渲染相关的路由都需要登录验证
router.use(verifyToken);

/**
 * 获取所有可用的简历模板
 * GET /api/resume-render/templates
 */
router.get('/templates', ResumeRenderController.getTemplates);

/**
 * 获取单个模板详情
 * GET /api/resume-render/templates/:id
 */
router.get('/templates/:id', ResumeRenderController.getTemplateById);

/**
 * 预览简历渲染效果
 * POST /api/resume-render/preview
 * Body: { resumeId, templateId }
 */
router.post('/preview', ResumeRenderController.previewResume);

/**
 * 渲染并保存简历
 * POST /api/resume-render/render
 * Body: { resumeId, templateId, format? }
 */
router.post('/render', ResumeRenderController.renderResume);

/**
 * 生成PDF格式简历
 * POST /api/resume-render/pdf
 * Body: { resumeId, templateId, options? }
 */
router.post('/pdf', ResumeRenderController.generatePDF);

/**
 * 下载PDF文件
 * GET /api/resume-render/download/:filename
 */
router.get('/download/:filename', ResumeRenderController.downloadPDF);

/**
 * 获取用户的渲染历史
 * GET /api/resume-render/history
 */
router.get('/history', ResumeRenderController.getRenderHistory);

module.exports = router; 