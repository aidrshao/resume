/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('ai_prompts', function(table) {
    table.increments('id').primary();
    table.string('name', 100).notNullable().comment('提示词名称');
    table.string('key', 50).notNullable().unique().comment('提示词唯一标识');
    table.text('prompt_template', 'longtext').notNullable().comment('提示词模板内容');
    table.text('description').comment('提示词描述');
    table.string('category', 50).defaultTo('general').comment('提示词分类');
    table.string('model_type', 20).defaultTo('gpt').comment('推荐模型类型 (gpt|deepseek)');
    table.json('model_config').comment('模型配置参数');
    table.json('variables').comment('提示词变量定义');
    table.boolean('is_active').defaultTo(true).comment('是否启用');
    table.timestamps(true, true);
    
    // 创建索引
    table.index(['category', 'is_active']);
    table.index('key');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ai_prompts');
}; 