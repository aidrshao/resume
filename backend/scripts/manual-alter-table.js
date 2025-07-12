/**
 * 手动修复Knex迁移状态脚本
 * 
 * 背景：
 * 当前数据库状态与Knex迁移日志不一致。`knex_migrations` 表记录了
 * `20250712082935_add_soft_delete_to_users.js` 已运行，但实际上 `users` 表
 * 中并无 `status` 字段。这导致 `migrate:latest` 和 `migrate:rollback`
 * 双双失败。
 * 
 * 功能：
 * 此脚本将手动从 `knex_migrations` 表中删除指定的迁移记录，
 * 以允许 `knex migrate:latest` 重新运行该迁移，从而修复数据库结构。
 */
const { db: knex } = require('../config/database');

const MIGRATION_NAME = '20250712082935_add_soft_delete_to_users.js';

async function manualFixMigrationState() {
  console.log('🚀 [MANUAL_FIX] 开始手动修复迁移状态...');
  console.log(`🚀 [MANUAL_FIX] 目标迁移记录: ${MIGRATION_NAME}`);

  try {
    const record = await knex('knex_migrations')
      .where({ name: MIGRATION_NAME })
      .first();

    if (!record) {
      console.log('✅ [MANUAL_FIX] 无需修复，目标迁移记录不存在。可以尝试直接运行 `npm run migrate`。');
      return;
    }

    console.log(`🔍 [MANUAL_FIX] 发现需要删除的迁移记录:`, record);
    
    const deletedCount = await knex('knex_migrations')
      .where({ name: MIGRATION_NAME })
      .del();

    if (deletedCount > 0) {
      console.log(`✅ [MANUAL_FIX] 成功删除了 ${deletedCount} 条迁移记录。`);
      console.log('🎉 [MANUAL_FIX] 修复完成！现在可以安全地运行 `npm run migrate` 来应用缺失的迁移。');
    } else {
       console.log('🤔 [MANUAL_FIX] 操作完成，但没有记录被删除，可能已被其他进程处理。');
    }

  } catch (error) {
    console.error('❌ [MANUAL_FIX] 手动修复过程中发生错误:', error);
    process.exit(1);
  } finally {
    await knex.destroy();
    console.log('🚪 [MANUAL_FIX] 数据库连接已关闭。');
  }
}

manualFixMigrationState(); 