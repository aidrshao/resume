/**
 * 修复用户状态脚本
 * 
 * 背景：
 * `20250712082935_add_soft_delete_to_users.js` 迁移为 `users` 表添加了
 * 一个 `status` 字段，默认为 'active'。但此默认值不适用于已存在的用户，
 * 导致他们的 `status` 为 NULL，从而在登录或访问受保护路由时因
 * `user.status !== 'active'` 检查而失败。
 * 
 * 功能：
 * 此脚本会查找所有 `status` 不为 'active' 的用户，并将其设置为 'active'，
 * 以确保现有用户能够正常使用系统。
 */
const { db: knex } = require('../config/database');

async function fixUserStatus() {
  console.log('🚀 [FIX_USER_STATUS] 开始修复用户状态...');

  try {
    const usersToUpdate = await knex('users')
      .whereNot('status', 'active')
      .orWhereNull('status');

    if (usersToUpdate.length === 0) {
      console.log('✅ [FIX_USER_STATUS] 无需修复，所有用户状态均正常。');
      return;
    }

    console.log(`🔍 [FIX_USER_STATUS] 发现 ${usersToUpdate.length} 个需要修复状态的用户。`);
    
    const updatedCount = await knex('users')
      .whereNot('status', 'active')
      .orWhereNull('status')
      .update({
        status: 'active',
        updated_at: new Date()
      });

    console.log(`✅ [FIX_USER_STATUS] 成功更新了 ${updatedCount} 名用户的状态为 'active'。`);
    console.log('🎉 [FIX_USER_STATUS] 用户状态修复完成！');

  } catch (error) {
    console.error('❌ [FIX_USER_STATUS] 修复过程中发生错误:', error);
    process.exit(1);
  } finally {
    await knex.destroy();
    console.log('🚪 [FIX_USER_STATUS] 数据库连接已关闭。');
  }
}

fixUserStatus(); 