/**
 * 会员管理系统数据库迁移 - 仅创建新表
 * 不修改现有的users表，避免权限问题
 */

exports.up = async function(knex) {
  console.log('开始创建会员系统数据库表...');

  // 1. 创建会员套餐配置表
  if (!(await knex.schema.hasTable('membership_tiers'))) {
    await knex.schema.createTable('membership_tiers', function(table) {
      table.increments('id').primary().comment('套餐ID');
      table.string('name', 100).notNullable().comment('套餐名称');
      table.text('description').nullable().comment('套餐描述');
      table.decimal('original_price', 10, 2).notNullable().comment('原价');
      table.decimal('reduction_price', 10, 2).nullable().comment('折扣价格');
      table.integer('duration_days').notNullable().default(0).comment('有效期天数，0表示永久');
      table.integer('ai_resume_quota').notNullable().default(0).comment('每月AI简历生成次数');
      table.enum('template_access_level', ['basic', 'advanced', 'all']).notNullable().default('basic').comment('模板访问级别');
      table.boolean('is_active').defaultTo(true).comment('是否启用');
      table.integer('sort_order').defaultTo(0).comment('排序顺序');
      table.json('features').nullable().comment('套餐特色功能列表');
      table.timestamps(true, true);
    });
    console.log('✅ membership_tiers 表创建完成');
  }

  // 2. 创建用户会员状态表
  if (!(await knex.schema.hasTable('user_memberships'))) {
    await knex.schema.createTable('user_memberships', function(table) {
      table.increments('id').primary().comment('用户会员记录ID');
      table.integer('user_id').unsigned().notNullable().comment('用户ID');
      table.integer('membership_tier_id').unsigned().nullable().comment('会员套餐ID');
      table.enum('status', ['active', 'expired', 'cancelled', 'pending']).notNullable().default('pending').comment('会员状态');
      table.timestamp('start_date').nullable().comment('开始时间');
      table.timestamp('end_date').nullable().comment('结束时间');
      table.integer('remaining_ai_quota').defaultTo(0).comment('剩余AI简历生成次数');
      table.timestamp('quota_reset_date').nullable().comment('配额重置时间');
      table.enum('payment_status', ['pending', 'paid', 'failed', 'refunded']).defaultTo('pending').comment('支付状态');
      table.decimal('paid_amount', 10, 2).nullable().comment('实际支付金额');
      table.string('payment_method', 50).nullable().comment('支付方式');
      table.text('admin_notes').nullable().comment('管理员备注');
      table.timestamps(true, true);

      // 外键约束
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('membership_tier_id').references('id').inTable('membership_tiers').onDelete('SET NULL');
      
      // 索引
      table.index(['user_id', 'status']);
      table.index('end_date');
    });
    console.log('✅ user_memberships 表创建完成');
  }

  // 3. 创建会员订单表
  if (!(await knex.schema.hasTable('membership_orders'))) {
    await knex.schema.createTable('membership_orders', function(table) {
      table.increments('id').primary().comment('订单ID');
      table.string('order_number', 100).unique().notNullable().comment('订单编号');
      table.integer('user_id').unsigned().notNullable().comment('用户ID');
      table.integer('membership_tier_id').unsigned().notNullable().comment('会员套餐ID');
      table.decimal('original_amount', 10, 2).notNullable().comment('原价金额');
      table.decimal('discount_amount', 10, 2).defaultTo(0).comment('折扣金额');
      table.decimal('final_amount', 10, 2).notNullable().comment('最终金额');
      table.enum('status', ['pending', 'paid', 'cancelled', 'refunded']).notNullable().default('pending').comment('订单状态');
      table.enum('payment_method', ['alipay', 'wechat', 'manual', 'free']).nullable().comment('支付方式');
      table.string('payment_transaction_id', 200).nullable().comment('支付交易ID');
      table.timestamp('paid_at').nullable().comment('支付时间');
      table.json('payment_details').nullable().comment('支付详情');
      table.text('admin_notes').nullable().comment('管理员备注');
      table.timestamps(true, true);

      // 外键约束
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('membership_tier_id').references('id').inTable('membership_tiers').onDelete('RESTRICT');
      
      // 索引
      table.index(['user_id', 'status']);
      table.index('order_number');
      table.index('status');
      table.index('created_at');
    });
    console.log('✅ membership_orders 表创建完成');
  }

  // 4. 创建AI提示词配置表
  if (!(await knex.schema.hasTable('ai_prompt_configs'))) {
    await knex.schema.createTable('ai_prompt_configs', function(table) {
      table.increments('id').primary().comment('配置ID');
      table.string('name', 100).notNullable().comment('配置名称');
      table.string('type', 50).notNullable().comment('提示词类型：resume_optimization, resume_generation');
      table.text('prompt_template').notNullable().comment('提示词模板');
      table.json('variables').nullable().comment('可用变量说明');
      table.boolean('is_active').defaultTo(true).comment('是否启用');
      table.text('description').nullable().comment('配置说明');
      table.integer('created_by').unsigned().nullable().comment('创建者ID');
      table.integer('updated_by').unsigned().nullable().comment('更新者ID');
      table.timestamps(true, true);

      // 外键约束
      table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.foreign('updated_by').references('id').inTable('users').onDelete('SET NULL');
      
      // 索引
      table.index(['type', 'is_active']);
    });
    console.log('✅ ai_prompt_configs 表创建完成');
  }

  // 5. 创建用户AI使用记录表
  if (!(await knex.schema.hasTable('user_ai_usage_logs'))) {
    await knex.schema.createTable('user_ai_usage_logs', function(table) {
      table.increments('id').primary().comment('使用记录ID');
      table.integer('user_id').unsigned().notNullable().comment('用户ID');
      table.enum('usage_type', ['resume_generation', 'resume_optimization', 'resume_parse']).notNullable().comment('使用类型');
      table.integer('resume_id').unsigned().nullable().comment('关联简历ID');
      table.integer('job_id').unsigned().nullable().comment('关联岗位ID');
      table.boolean('is_success').defaultTo(true).comment('是否成功');
      table.text('error_message').nullable().comment('错误信息');
      table.integer('tokens_used').nullable().comment('消耗token数');
      table.decimal('cost', 10, 4).nullable().comment('成本费用');
      table.timestamp('used_at').defaultTo(knex.fn.now()).comment('使用时间');
      table.timestamps(true, true);

      // 外键约束
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('resume_id').references('id').inTable('resumes').onDelete('SET NULL');
      table.foreign('job_id').references('id').inTable('job_positions').onDelete('SET NULL');
      
      // 索引
      table.index(['user_id', 'used_at']);
      table.index(['usage_type', 'used_at']);
    });
    console.log('✅ user_ai_usage_logs 表创建完成');
  }

  console.log('✅ 会员管理系统数据库表创建完成');
};

exports.down = async function(knex) {
  // 按照创建的逆序删除表
  await knex.schema.dropTableIfExists('user_ai_usage_logs');
  await knex.schema.dropTableIfExists('ai_prompt_configs');
  await knex.schema.dropTableIfExists('membership_orders');
  await knex.schema.dropTableIfExists('user_memberships');
  await knex.schema.dropTableIfExists('membership_tiers');

  console.log('✅ 会员管理系统数据库表删除完成');
}; 