/**
 * HardDeleteUsers.js
 * ------------------
 * 该脚本负责永久删除被标记为待删除且已过宽限期的用户数据。
 *
 * 运行周期：每日凌晨3点
 *
 * 核心逻辑：
 * 1. 查找所有 status = 'to_be_deleted' 且 deletion_scheduled_at 早于30天前的用户。
 * 2. 对每个用户，执行级联删除，清理所有关联数据。
 *    - user_quotas
 *    - customized_resumes
 *    - job_positions
 *    - resumes
 *    - (未来可能还有其他关联表)
 * 3. 删除用户在 'users' 表中的主记录。
 * 4. 详细记录操作日志。
 */

const cron = require('node-cron');
const { db: knex } = require('../config/database');
const User = require('../models/User');

const GRACE_PERIOD_DAYS = 30;

/**
 * 执行硬删除操作
 */
async function performHardDelete() {
  console.log(`[HARD_DELETE_CRON] 任务开始于 ${new Date().toISOString()}`);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - GRACE_PERIOD_DAYS);

  let usersToDelete;
  try {
    usersToDelete = await knex('users')
      .where('status', 'to_be_deleted')
      .andWhere('deletion_scheduled_at', '<', thirtyDaysAgo);
  } catch (error) {
    console.error('[HARD_DELETE_CRON] 查找待删除用户失败:', error);
    return;
  }

  if (usersToDelete.length === 0) {
    console.log('[HARD_DELETE_CRON] 没有需要删除的用户。任务结束。');
    return;
  }

  console.log(`[HARD_DELETE_CRON] 发现 ${usersToDelete.length} 个用户待永久删除。`);

  for (const user of usersToDelete) {
    const userId = user.id;
    console.log(`[HARD_DELETE_CRON] 开始处理用户 ID: ${userId}`);
    const trx = await knex.transaction();
    try {
      // 在事务中执行级联删除
      // 注意：删除顺序很重要，从子表开始，到父表结束。
      
      // 1. 删除 user_quotas
      await trx('user_quotas').where('user_id', userId).del();
      console.log(`  - [OK] 已删除 user_quotas for user ${userId}`);

      // 2. 删除 customized_resumes
      await trx('customized_resumes').where('user_id', userId).del();
      console.log(`  - [OK] 已删除 customized_resumes for user ${userId}`);

      // 3. 删除 job_positions
      await trx('job_positions').where('user_id', userId).del();
      console.log(`  - [OK] 已删除 job_positions for user ${userId}`);
      
      // 4. 删除 resumes
      await trx('resumes').where('user_id', userId).del();
      console.log(`  - [OK] 已删除 resumes for user ${userId}`);

      // 5. (未来在这里添加其他关联表的删除逻辑)

      // 6. 最后删除用户主记录
      await trx('users').where('id', userId).del();
      console.log(`  - [OK] 已从 users 表删除 user ${userId}`);

      // 7. TODO: 删除对象存储中的文件
      // 在实际生产中，这里需要调用云服务（如S3, OSS）的API来删除用户的上传文件。
      // 例如：await deleteUserFilesFromStorage(userId);
      console.log(`  - [INFO] 文件删除逻辑待实现 (对象存储)。`);

      await trx.commit();
      console.log(`[HARD_DELETE_CRON] 成功永久删除用户 ID: ${userId}`);

    } catch (error) {
      await trx.rollback();
      console.error(`[HARD_DELETE_CRON] 删除用户 ID: ${userId} 失败。事务已回滚。`, error);
    }
  }

  console.log(`[HARD_DELETE_CRON] 任务完成于 ${new Date().toISOString()}`);
}

/**
 * 初始化并启动定时任务
 * 每天凌晨3点执行: '0 3 * * *'
 */
function scheduleHardDelete() {
  // 为方便测试，可以设置为每分钟运行: '* * * * *'
  cron.schedule('0 3 * * *', performHardDelete, {
    scheduled: true,
    timezone: "Asia/Shanghai"
  });

  console.log('[CRON_SERVICE] "永久删除用户" 定时任务已启动，将在每天凌晨3点运行。');
}

module.exports = { scheduleHardDelete, performHardDelete }; 