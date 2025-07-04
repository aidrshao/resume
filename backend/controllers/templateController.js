/**
 * 模板控制器 - 简历模板管理API
 * 功能：处理模板相关的所有API请求
 * 创建时间：2025-07-02
 */

const Template = require('../models/Template');
const { validateTemplateData } = require('../utils/validation');

const templateModel = new Template();

/**
 * 获取所有已发布的模板（前端用）
 * GET /api/templates
 * @returns {Object} 返回格式：{success: boolean, data: Array, message: string}
 * @description 返回状态为'published'的模板列表，只包含id, name, thumbnail_url字段
 */
const getPublishedTemplates = async (req, res) => {
    try {
        const { category, isPremium } = req.query;
        
        const options = {};
        if (category) options.category = category;
        if (isPremium !== undefined) options.isPremium = isPremium === 'true';

        const templates = await templateModel.getPublishedTemplates(options);

        res.json({
            success: true,
            data: templates,
            message: '获取模板列表成功'
        });
    } catch (error) {
        console.error('获取已发布模板失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模板列表失败'
        });
    }
};

/**
 * 获取所有模板（管理员用）
 * GET /api/templates/admin
 */
const getAllTemplatesForAdmin = async (req, res) => {
    try {
        const { status, category, isPremium, page, limit } = req.query;
        
        const options = {};
        if (status) options.status = status;
        if (category) options.category = category;
        if (isPremium !== undefined) options.isPremium = isPremium === 'true';
        if (page) options.page = parseInt(page);
        if (limit) options.limit = parseInt(limit);

        const result = await templateModel.getAllTemplates(options);

        res.json({
            success: true,
            data: result.templates,
            pagination: result.pagination,
            message: '获取管理员模板列表成功'
        });
    } catch (error) {
        console.error('获取管理员模板列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模板列表失败'
        });
    }
};

/**
 * 获取单个模板详情
 * GET /api/templates/:id
 * @param {string} id - 模板ID
 * @returns {Object} 返回格式：{success: boolean, data: Object, message: string}
 * @description 返回指定模板的完整信息，包含html_content和css_content等所有字段
 */
const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的模板ID'
            });
        }

        const template = await templateModel.getTemplateById(parseInt(id));

        res.json({
            success: true,
            data: template,
            message: '获取模板详情成功'
        });
    } catch (error) {
        console.error('获取模板详情失败:', error);
        
        if (error.message === '模板不存在') {
            return res.status(404).json({
                success: false,
                message: '模板不存在'
            });
        }

        res.status(500).json({
            success: false,
            message: '获取模板详情失败'
        });
    }
};

/**
 * 创建新模板
 * POST /api/templates
 */
const createTemplate = async (req, res) => {
    try {
        const templateData = req.body;

        // 验证请求数据
        const validation = validateTemplateData(templateData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: '数据验证失败',
                errors: validation.errors
            });
        }

        const newTemplate = await templateModel.createTemplate(templateData);

        res.status(201).json({
            success: true,
            data: newTemplate,
            message: '模板创建成功'
        });
    } catch (error) {
        console.error('创建模板失败:', error);

        if (error.message.includes('必填字段')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: '创建模板失败'
        });
    }
};

/**
 * 更新模板
 * PUT /api/templates/:id
 */
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const templateData = req.body;

        console.log('🔍 [模板更新] 请求数据:', {
            id,
            templateData: JSON.stringify(templateData, null, 2)
        });

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的模板ID'
            });
        }

        // 验证请求数据（更新时某些字段可选）
        const validation = validateTemplateData(templateData, false);
        
        console.log('🔍 [模板更新] 验证结果:', {
            isValid: validation.isValid,
            errors: validation.errors
        });
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: '数据验证失败',
                errors: validation.errors
            });
        }

        const updatedTemplate = await templateModel.updateTemplate(parseInt(id), templateData);

        res.json({
            success: true,
            data: updatedTemplate,
            message: '模板更新成功'
        });
    } catch (error) {
        console.error('更新模板失败:', error);

        if (error.message === '模板不存在') {
            return res.status(404).json({
                success: false,
                message: '模板不存在'
            });
        }

        res.status(500).json({
            success: false,
            message: '更新模板失败'
        });
    }
};

/**
 * 删除模板
 * DELETE /api/templates/:id
 */
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的模板ID'
            });
        }

        const deleted = await templateModel.deleteTemplate(parseInt(id));

        if (deleted) {
            res.json({
                success: true,
                message: '模板删除成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '删除模板失败'
            });
        }
    } catch (error) {
        console.error('删除模板失败:', error);

        if (error.message === '模板不存在') {
            return res.status(404).json({
                success: false,
                message: '模板不存在'
            });
        }

        res.status(500).json({
            success: false,
            message: '删除模板失败'
        });
    }
};

/**
 * 更新模板排序
 * PUT /api/templates/:id/sort
 */
const updateTemplateSortOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { sortOrder } = req.body;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的模板ID'
            });
        }

        if (sortOrder === undefined || isNaN(parseInt(sortOrder))) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的排序值'
            });
        }

        const updatedTemplate = await templateModel.updateSortOrder(parseInt(id), parseInt(sortOrder));

        res.json({
            success: true,
            data: updatedTemplate,
            message: '模板排序更新成功'
        });
    } catch (error) {
        console.error('更新模板排序失败:', error);

        if (error.message === '模板不存在') {
            return res.status(404).json({
                success: false,
                message: '模板不存在'
            });
        }

        res.status(500).json({
            success: false,
            message: '更新模板排序失败'
        });
    }
};

/**
 * 批量更新模板状态
 * PUT /api/templates/batch/status
 */
const batchUpdateTemplateStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的模板ID数组'
            });
        }

        if (!['draft', 'published', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的状态值'
            });
        }

        const updatedCount = await templateModel.batchUpdateStatus(ids, status);

        res.json({
            success: true,
            data: { updatedCount },
            message: `成功更新 ${updatedCount} 个模板的状态`
        });
    } catch (error) {
        console.error('批量更新模板状态失败:', error);
        res.status(500).json({
            success: false,
            message: '批量更新模板状态失败'
        });
    }
};

/**
 * 获取模板分类列表
 * GET /api/templates/categories
 */
const getTemplateCategories = async (req, res) => {
    try {
        const categories = await templateModel.getCategories();

        res.json({
            success: true,
            data: categories,
            message: '获取模板分类成功'
        });
    } catch (error) {
        console.error('获取模板分类失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模板分类失败'
        });
    }
};

/**
 * 获取模板统计信息
 * GET /api/templates/statistics
 */
const getTemplateStatistics = async (req, res) => {
    try {
        const statistics = await templateModel.getStatistics();

        res.json({
            success: true,
            data: statistics,
            message: '获取模板统计信息成功'
        });
    } catch (error) {
        console.error('获取模板统计信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模板统计信息失败'
        });
    }
};

module.exports = {
    getPublishedTemplates,
    getAllTemplatesForAdmin,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateTemplateSortOrder,
    batchUpdateTemplateStatus,
    getTemplateCategories,
    getTemplateStatistics
}; 