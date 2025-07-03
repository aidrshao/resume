/**
 * 创建全局配额配置表
 * 用于管理新注册用户的初始配额分配
 */

exports.up = function(knex) {
  return knex.schema.createTable('global_quota_configs', function(table) {
    table.increments('id').primary();
    table.string('config_key', 100).notNullable().unique().comment('配置键名');
    table.string('config_name', 200).notNullable().comment('配置名称');
    table.text('description').comment('配置描述');
    table.string('quota_type', 50).notNullable().comment('配额类型');
    table.integer('default_quota').notNullable().default(0).comment('默认配额数量');
    table.string('reset_cycle', 20).defaultTo('monthly').comment('重置周期: daily, weekly, monthly, yearly, never');
    table.string('category', 50).defaultTo('user_registration').comment('配置分类');
    table.boolean('is_active').defaultTo(true).comment('是否启用');
    table.integer('sort_order').defaultTo(0).comment('排序顺序');
    table.json('extra_config').comment('额外配置信息');
    table.timestamps(true, true);
    
    // 创建索引
    table.index(['category', 'is_active']);
    table.index('config_key');
    table.index(['quota_type', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('global_quota_configs');
}; 