/**
 * 迁移：为 users 表添加管理员相关字段
 * - is_admin   BOOLEAN   默认 false
 * - admin_role VARCHAR(50) 可选（如: admin, super_admin）
 *
 * 若字段已存在则跳过。
 */

exports.up = async function(knex) {
  const hasIsAdmin = await knex.schema.hasColumn('users', 'is_admin');
  const hasAdminRole = await knex.schema.hasColumn('users', 'admin_role');

  return knex.schema.alterTable('users', function(table) {
    if (!hasIsAdmin) {
      table.boolean('is_admin').defaultTo(false);
    }
    if (!hasAdminRole) {
      table.string('admin_role', 50).nullable();
    }
  });
};

exports.down = async function(knex) {
  const hasIsAdmin = await knex.schema.hasColumn('users', 'is_admin');
  const hasAdminRole = await knex.schema.hasColumn('users', 'admin_role');

  return knex.schema.alterTable('users', function(table) {
    if (hasIsAdmin) {
      table.dropColumn('is_admin');
    }
    if (hasAdminRole) {
      table.dropColumn('admin_role');
    }
  });
}; 