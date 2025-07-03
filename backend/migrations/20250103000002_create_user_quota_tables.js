/**
 * 创建用户配额系统数据库表
 * 支持多种配额类型的管理和追踪
 */

exports.up = async function(knex) {
  console.log('开始创建用户配额系统数据库表...');

  // 1. 创建用户配额表
  if (!(await knex.schema.hasTable('user_quotas'))) {
    await knex.schema.createTable('user_quotas', function(table) {
      table.increments('id').primary().comment('配额记录ID');
      table.integer('user_id').unsigned().notNullable().comment('用户ID');
      table.string('quota_type', 50).notNullable().comment('配额类型');
      table.integer('quota_limit').notNullable().default(0).comment('配额限制');
      table.integer('quota_used').notNullable().default(0).comment('已使用配额');
      table.timestamp('reset_date').nullable().comment('下次重置时间');
      table.enum('reset_cycle', ['daily', 'weekly', 'monthly', 'yearly', 'never']).defaultTo('monthly').comment('重置周期');
      table.boolean('is_active').defaultTo(true).comment('是否启用');
      table.text('notes').nullable().comment('备注信息');
      table.timestamps(true, true);

      // 外键约束
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      // 索引
      table.unique(['user_id', 'quota_type'], 'unique_user_quota_type');
      table.index(['quota_type', 'is_active']);
      table.index('reset_date');
    });
    console.log('✅ user_quotas 表创建完成');
  }

  // 2. 创建配额使用日志表
  if (!(await knex.schema.hasTable('quota_usage_logs'))) {
    await knex.schema.createTable('quota_usage_logs', function(table) {
      table.increments('id').primary().comment('使用记录ID');
      table.integer('user_id').unsigned().notNullable().comment('用户ID');
      table.string('quota_type', 50).notNullable().comment('配额类型');
      table.integer('amount_used').notNullable().default(1).comment('使用数量');
      table.integer('remaining_quota').nullable().comment('剩余配额');
      table.enum('action_type', ['usage', 'grant', 'reset', 'deduct']).defaultTo('usage').comment('操作类型');
      table.string('related_resource_type', 50).nullable().comment('关联资源类型');
      table.integer('related_resource_id').nullable().comment('关联资源ID');
      table.text('notes').nullable().comment('操作备注');
      table.json('metadata').nullable().comment('附加元数据');
      table.timestamps(true, true);

      // 外键约束
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      // 索引
      table.index(['user_id', 'quota_type', 'created_at']);
      table.index(['quota_type', 'action_type']);
      table.index('created_at');
    });
    console.log('✅ quota_usage_logs 表创建完成');
  }

  // 3. 创建配额重置历史表（可选，用于审计）
  if (!(await knex.schema.hasTable('quota_reset_history'))) {
    await knex.schema.createTable('quota_reset_history', function(table) {
      table.increments('id').primary().comment('重置记录ID');
      table.integer('user_id').unsigned().notNullable().comment('用户ID');
      table.string('quota_type', 50).notNullable().comment('配额类型');
      table.integer('old_quota_used').notNullable().comment('重置前已使用数量');
      table.integer('quota_limit').notNullable().comment('配额限制');
      table.timestamp('reset_time').defaultTo(knex.fn.now()).comment('重置时间');
      table.enum('reset_reason', ['scheduled', 'manual', 'admin', 'system']).defaultTo('scheduled').comment('重置原因');
      table.integer('reset_by').unsigned().nullable().comment('重置操作人ID');
      table.text('notes').nullable().comment('重置备注');
      table.timestamps(true, true);

      // 外键约束
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('reset_by').references('id').inTable('users').onDelete('SET NULL');
      
      // 索引
      table.index(['user_id', 'quota_type']);
      table.index('reset_time');
    });
    console.log('✅ quota_reset_history 表创建完成');
  }

  console.log('✅ 用户配额系统数据库表创建完成');
};

exports.down = async function(knex) {
  // 按照创建的逆序删除表
  await knex.schema.dropTableIfExists('quota_reset_history');
  await knex.schema.dropTableIfExists('quota_usage_logs');
  await knex.schema.dropTableIfExists('user_quotas');

  console.log('✅ 用户配额系统数据库表删除完成');
}; 