/**
 * 创建templates表 - 简历模板管理
 * 迁移文件：20250702130000_create_templates_table.js
 */

exports.up = function(knex) {
    return knex.schema.createTable('templates', function(table) {
        // 主键
        table.increments('id').primary();
        
        // 基础信息
        table.string('name', 100).notNullable().comment('模板名称');
        table.text('html_content').notNullable().comment('HTML模板内容');
        table.text('css_content').notNullable().comment('CSS样式内容');
        table.string('thumbnail_url', 500).nullable().comment('缩略图URL');
        
        // 状态字段
        table.boolean('is_premium').defaultTo(false).comment('是否为付费模板');
        table.enu('status', ['draft', 'published', 'archived']).defaultTo('draft').comment('模板状态');
        
        // 排序和分类
        table.integer('sort_order').defaultTo(0).comment('排序权重');
        table.string('category', 50).defaultTo('general').comment('模板分类');
        table.text('description').nullable().comment('模板描述');
        
        // 时间戳
        table.timestamps(true, true);
        
        // 索引
        table.index(['status', 'is_premium'], 'idx_templates_status_premium');
        table.index(['category', 'status'], 'idx_templates_category_status');
        table.index('sort_order', 'idx_templates_sort_order');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('templates');
}; 