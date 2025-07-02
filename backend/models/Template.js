/**
 * Template模型 - 简历模板管理
 * 功能：模板的数据库操作方法
 * 创建时间：2025-07-02
 */

const knex = require('../config/database');

/**
 * Template模型类
 */
class Template {
    constructor() {
        this.tableName = 'templates';
    }

    /**
     * 获取所有已发布的模板（前端用）
     * @param {Object} options - 查询选项
     * @returns {Promise<Array>} 模板列表
     */
    async getPublishedTemplates(options = {}) {
        const { category, isPremium } = options;
        
        let query = knex(this.tableName)
            .select('id', 'name', 'thumbnail_url', 'is_premium', 'category', 'description', 'sort_order')
            .where('status', 'published')
            .orderBy('sort_order', 'asc')
            .orderBy('created_at', 'desc');

        // 添加分类筛选
        if (category) {
            query = query.where('category', category);
        }

        // 添加付费筛选
        if (isPremium !== undefined) {
            query = query.where('is_premium', isPremium);
        }

        return await query;
    }

    /**
     * 获取所有模板（管理员用）
     * @param {Object} options - 查询选项
     * @returns {Promise<Array>} 模板列表
     */
    async getAllTemplates(options = {}) {
        const { status, category, isPremium, page = 1, limit = 10 } = options;
        
        let query = knex(this.tableName)
            .select('id', 'name', 'thumbnail_url', 'is_premium', 'status', 'category', 'description', 'sort_order', 'created_at', 'updated_at');

        // 添加状态筛选
        if (status) {
            query = query.where('status', status);
        }

        // 添加分类筛选
        if (category) {
            query = query.where('category', category);
        }

        // 添加付费筛选
        if (isPremium !== undefined) {
            query = query.where('is_premium', isPremium);
        }

        // 分页
        const offset = (page - 1) * limit;
        query = query.offset(offset).limit(limit);

        // 排序
        query = query.orderBy('sort_order', 'asc').orderBy('created_at', 'desc');

        // 获取总数
        const countQuery = knex(this.tableName).count('id as count');
        if (status) countQuery.where('status', status);
        if (category) countQuery.where('category', category);
        if (isPremium !== undefined) countQuery.where('is_premium', isPremium);

        const [templates, countResult] = await Promise.all([
            query,
            countQuery
        ]);

        const total = parseInt(countResult[0].count);
        const totalPages = Math.ceil(total / limit);

        return {
            templates,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages
            }
        };
    }

    /**
     * 根据ID获取单个模板完整信息
     * @param {number} id - 模板ID
     * @returns {Promise<Object>} 模板详情
     */
    async getTemplateById(id) {
        const template = await knex(this.tableName)
            .where('id', id)
            .first();

        if (!template) {
            throw new Error('模板不存在');
        }

        return template;
    }

    /**
     * 创建新模板
     * @param {Object} templateData - 模板数据
     * @returns {Promise<Object>} 创建的模板
     */
    async createTemplate(templateData) {
        const {
            name,
            html_content,
            css_content,
            thumbnail_url,
            is_premium = false,
            status = 'draft',
            category = 'general',
            description,
            sort_order = 0
        } = templateData;

        // 验证必填字段
        if (!name || !html_content || !css_content) {
            throw new Error('模板名称、HTML内容和CSS内容为必填字段');
        }

        const [templateId] = await knex(this.tableName)
            .insert({
                name,
                html_content,
                css_content,
                thumbnail_url,
                is_premium,
                status,
                category,
                description,
                sort_order,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now()
            })
            .returning('id');

        return await this.getTemplateById(templateId);
    }

    /**
     * 更新模板
     * @param {number} id - 模板ID
     * @param {Object} templateData - 更新数据
     * @returns {Promise<Object>} 更新后的模板
     */
    async updateTemplate(id, templateData) {
        const existingTemplate = await this.getTemplateById(id);

        const updateData = {
            ...templateData,
            updated_at: knex.fn.now()
        };

        // 移除不应该更新的字段
        delete updateData.id;
        delete updateData.created_at;

        await knex(this.tableName)
            .where('id', id)
            .update(updateData);

        return await this.getTemplateById(id);
    }

    /**
     * 删除模板
     * @param {number} id - 模板ID
     * @returns {Promise<boolean>} 删除结果
     */
    async deleteTemplate(id) {
        const existingTemplate = await this.getTemplateById(id);

        const deletedRows = await knex(this.tableName)
            .where('id', id)
            .del();

        return deletedRows > 0;
    }

    /**
     * 更新模板排序
     * @param {number} id - 模板ID
     * @param {number} sortOrder - 新的排序值
     * @returns {Promise<Object>} 更新后的模板
     */
    async updateSortOrder(id, sortOrder) {
        await knex(this.tableName)
            .where('id', id)
            .update({
                sort_order: sortOrder,
                updated_at: knex.fn.now()
            });

        return await this.getTemplateById(id);
    }

    /**
     * 批量更新模板状态
     * @param {Array} ids - 模板ID数组
     * @param {string} status - 新状态
     * @returns {Promise<number>} 更新的数量
     */
    async batchUpdateStatus(ids, status) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('请提供有效的模板ID数组');
        }

        if (!['draft', 'published', 'archived'].includes(status)) {
            throw new Error('无效的状态值');
        }

        const updatedRows = await knex(this.tableName)
            .whereIn('id', ids)
            .update({
                status,
                updated_at: knex.fn.now()
            });

        return updatedRows;
    }

    /**
     * 获取模板分类列表
     * @returns {Promise<Array>} 分类列表
     */
    async getCategories() {
        const result = await knex(this.tableName)
            .distinct('category')
            .select('category')
            .whereNotNull('category')
            .orderBy('category');

        return result.map(row => row.category);
    }

    /**
     * 获取模板统计信息
     * @returns {Promise<Object>} 统计信息
     */
    async getStatistics() {
        const stats = await knex(this.tableName)
            .select(
                knex.raw('COUNT(*) as total'),
                knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as published', ['published']),
                knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as draft', ['draft']),
                knex.raw('COUNT(CASE WHEN is_premium = true THEN 1 END) as premium'),
                knex.raw('COUNT(CASE WHEN is_premium = false THEN 1 END) as free')
            )
            .first();

        return {
            total: parseInt(stats.total),
            published: parseInt(stats.published),
            draft: parseInt(stats.draft),
            premium: parseInt(stats.premium),
            free: parseInt(stats.free)
        };
    }
}

module.exports = Template; 