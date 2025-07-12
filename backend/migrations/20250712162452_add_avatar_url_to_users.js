/**
 * 添加avatar_url字段到users表
 */

exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.string('avatar_url').nullable().comment('用户头像URL');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('avatar_url');
  });
};
