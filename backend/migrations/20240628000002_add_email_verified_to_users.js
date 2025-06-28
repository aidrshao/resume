/**
 * 为用户表添加邮箱验证状态字段
 */

exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.boolean('email_verified').defaultTo(false); // 邮箱是否已验证
    table.timestamp('email_verified_at').nullable(); // 邮箱验证时间
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('email_verified');
    table.dropColumn('email_verified_at');
  });
}; 