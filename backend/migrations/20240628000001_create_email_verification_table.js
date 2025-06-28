/**
 * 创建邮箱验证码表迁移
 * 用于存储注册、登录、重置密码的验证码
 */

exports.up = function(knex) {
  return knex.schema.createTable('email_verifications', function(table) {
    table.increments('id').primary();
    table.string('email', 255).notNullable().index();
    table.string('code', 10).notNullable(); // 验证码
    table.enum('type', ['register', 'login', 'reset_password']).notNullable(); // 验证码类型
    table.boolean('is_used').defaultTo(false); // 是否已使用
    table.timestamp('expires_at').notNullable(); // 过期时间
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // 添加复合索引，提高查询性能
    table.index(['email', 'type', 'is_used']);
    table.index(['expires_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('email_verifications');
}; 