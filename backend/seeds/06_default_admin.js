/**
 * Seed: 06_default_admin
 * ----------------------
 * 目的：确保在开发 / 测试环境中始终存在一个可登录的管理员账号。
 *
 * 账号信息（仅开发环境）：
 *   email: admin@example.com
 *   password: admin123456
 *
 * 生产环境请在部署后立即修改或删除该账号。
 */

const DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'admin123456',
  name: '系统管理员',
  admin_role: 'super_admin',
  is_admin: true,
  email_verified: true
};

exports.seed = async function(knex) {
  const bcrypt = require('bcrypt');

  // 动态检测列
  const hasIsAdmin = await knex.schema.hasColumn('users', 'is_admin');
  const hasAdminRole = await knex.schema.hasColumn('users', 'admin_role');

  // 检查是否已有此邮箱的用户
  const existing = await knex('users').where({ email: DEFAULT_ADMIN.email }).first();

  if (existing) {
    console.log(`ℹ️  [SEED] 管理员账号已存在 (ID: ${existing.id})，跳过创建`);
    return;
  }

  // 插入默认管理员
  const hashed = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

  const insertData = {
    email: DEFAULT_ADMIN.email,
    password_hash: hashed,
    email_verified: true,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  };

  if (hasIsAdmin) insertData.is_admin = true;
  if (hasAdminRole) insertData.admin_role = DEFAULT_ADMIN.admin_role;

  await knex('users').insert(insertData);

  console.log('✅ [SEED] 默认管理员账号已创建 (email: admin@example.com / admin123456)');
}; 