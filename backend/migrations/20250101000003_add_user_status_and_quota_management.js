/**
 * 用户状态和配额管理扩展
 * 添加用户状态管理和配额管理相关字段
 */

exports.up = async function(knex) {
  // 1. 扩展用户表，添加状态管理字段
  await knex.schema.table('users', function(table) {
    table.enum('status', ['active', 'disabled', 'suspended']).defaultTo('active').comment('用户状态');
    table.string('name', 100).nullable().comment('用户姓名');
    table.text('admin_notes').nullable().comment('管理员备注');
    table.timestamp('last_active_at').nullable().comment('最后活跃时间');
    table.timestamp('disabled_at').nullable().comment('禁用时间');
    table.integer('disabled_by').unsigned().nullable().comment('禁用操作者ID');
  });

  // 2. 创建用户配额管理表
  await knex.schema.createTable('user_quotas', function(table) {
    table.increments('id').primary().comment('配额记录ID');
    table.integer('user_id').unsigned().notNullable().comment('用户ID');
    table.enum('quota_type', ['monthly_ai_resume', 'monthly_ai_chat', 'monthly_job_search', 'total_resumes']).notNullable().comment('配额类型');
    table.integer('quota_limit').defaultTo(0).comment('配额限制');
    table.integer('quota_used').defaultTo(0).comment('已使用配额');
    table.timestamp('reset_date').nullable().comment('配额重置日期');
    table.enum('reset_cycle', ['daily', 'weekly', 'monthly', 'yearly', 'never']).defaultTo('monthly').comment('重置周期');
    table.boolean('is_active').defaultTo(true).comment('是否启用');
    table.timestamp('last_reset_at').nullable().comment('上次重置时间');
    table.timestamps(true, true);

    // 外键约束
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // 索引
    table.index(['user_id', 'quota_type']);
    table.index(['reset_date', 'is_active']);
    table.unique(['user_id', 'quota_type']);
  });

  // 3. 创建配额使用历史表
  await knex.schema.createTable('quota_usage_logs', function(table) {
    table.increments('id').primary().comment('使用记录ID');
    table.integer('user_id').unsigned().notNullable().comment('用户ID');
    table.enum('quota_type', ['monthly_ai_resume', 'monthly_ai_chat', 'monthly_job_search', 'total_resumes']).notNullable().comment('配额类型');
    table.integer('amount_used').defaultTo(1).comment('使用数量');
    table.integer('remaining_quota').defaultTo(0).comment('剩余配额');
    table.string('action_type', 100).nullable().comment('操作类型');
    table.string('related_resource_type', 50).nullable().comment('关联资源类型');
    table.integer('related_resource_id').unsigned().nullable().comment('关联资源ID');
    table.text('notes').nullable().comment('备注');
    table.timestamps(true, true);

    // 外键约束
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // 索引
    table.index(['user_id', 'created_at']);
    table.index(['quota_type', 'created_at']);
  });

  // 4. 创建用户操作日志表
  await knex.schema.createTable('user_action_logs', function(table) {
    table.increments('id').primary().comment('操作日志ID');
    table.integer('user_id').unsigned().nullable().comment('被操作用户ID');
    table.integer('admin_user_id').unsigned().nullable().comment('操作管理员ID');
    table.enum('action_type', ['status_change', 'membership_change', 'quota_reset', 'data_update', 'login_attempt']).notNullable().comment('操作类型');
    table.string('action_description', 500).notNullable().comment('操作描述');
    table.json('old_values').nullable().comment('原始值');
    table.json('new_values').nullable().comment('新值');
    table.string('ip_address', 45).nullable().comment('IP地址');
    table.string('user_agent', 500).nullable().comment('用户代理');
    table.timestamps(true, true);

    // 外键约束
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('admin_user_id').references('id').inTable('users').onDelete('SET NULL');
    
    // 索引
    table.index(['user_id', 'created_at']);
    table.index(['admin_user_id', 'created_at']);
    table.index(['action_type', 'created_at']);
  });

  // 5. 为现有用户初始化默认配额
  const users = await knex('users').select('id');
  for (const user of users) {
    // 默认配额设置
    const defaultQuotas = [
      {
        user_id: user.id,
        quota_type: 'monthly_ai_resume',
        quota_limit: 5,
        quota_used: 0,
        reset_cycle: 'monthly',
        reset_date: knex.raw('DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\''),
        is_active: true
      },
      {
        user_id: user.id,
        quota_type: 'monthly_ai_chat',
        quota_limit: 50,
        quota_used: 0,
        reset_cycle: 'monthly',
        reset_date: knex.raw('DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\''),
        is_active: true
      },
      {
        user_id: user.id,
        quota_type: 'monthly_job_search',
        quota_limit: 100,
        quota_used: 0,
        reset_cycle: 'monthly',
        reset_date: knex.raw('DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\''),
        is_active: true
      }
    ];

    await knex('user_quotas').insert(defaultQuotas);
  }

  console.log('✅ 用户状态和配额管理扩展完成');
};

exports.down = async function(knex) {
  // 按照创建的逆序删除表
  await knex.schema.dropTableIfExists('user_action_logs');
  await knex.schema.dropTableIfExists('quota_usage_logs');
  await knex.schema.dropTableIfExists('user_quotas');

  // 回滚用户表的修改
  await knex.schema.table('users', function(table) {
    table.dropColumn('status');
    table.dropColumn('name');
    table.dropColumn('admin_notes');
    table.dropColumn('last_active_at');
    table.dropColumn('disabled_at');
    table.dropColumn('disabled_by');
  });

  console.log('✅ 用户状态和配额管理扩展回滚完成');
}; 