/**
 * 模板路由 - 简历模板管理API路由
 * 功能：定义模板相关的所有RESTful API端点
 * 创建时间：2025-07-02
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const templateController = require('../controllers/templateController');

/**
 * 公开路由 - 用户可访问
 */

// 获取所有已发布的模板（前端用）
// GET /api/templates
router.get('/', templateController.getPublishedTemplates);

// 获取模板分类列表
// GET /api/templates/categories
router.get('/categories', templateController.getTemplateCategories);

/**
 * 管理员专用路由 - 需要管理员权限
 * 注意：具体路径必须在参数化路径之前定义
 */

// 获取所有模板（管理员用）
// GET /api/templates/admin
router.get('/admin', adminAuth, templateController.getAllTemplatesForAdmin);

// 获取模板统计信息
// GET /api/templates/statistics
router.get('/statistics', adminAuth, templateController.getTemplateStatistics);

/**
 * 参数化路由 - 必须放在具体路径之后
 */

// 获取单个模板详情
// GET /api/templates/:id
router.get('/:id', templateController.getTemplateById);

// 创建新模板
// POST /api/templates
router.post('/', adminAuth, templateController.createTemplate);

// 更新模板
// PUT /api/templates/:id
router.put('/:id', adminAuth, templateController.updateTemplate);

// 删除模板
// DELETE /api/templates/:id
router.delete('/:id', adminAuth, templateController.deleteTemplate);

// 更新模板排序
// PUT /api/templates/:id/sort
router.put('/:id/sort', adminAuth, templateController.updateTemplateSortOrder);

// 批量更新模板状态
// PUT /api/templates/batch/status
router.put('/batch/status', adminAuth, templateController.batchUpdateTemplateStatus);

module.exports = router; 