/**
 * 20250706000001_create_plans_and_quotas.js
 * -----------------------------------------
 * 使用Knex创建 plans 与 user_quotas 表，以及唯一索引。
 */

exports.up = async function(knex) {
  // plans 表
  const hasPlans = await knex.schema.hasTable('plans');
  if (!hasPlans) {
    await knex.schema.createTable('plans', table => {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.integer('duration_days').notNullable(); // 30=月度,365=年度,99999=终生
      table.jsonb('features');
      table.string('status', 50).defaultTo('active');
      table.boolean('is_default').defaultTo(false);
      table.integer('sort_order').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // 部分唯一索引：确保只有一个默认套餐
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS one_default_plan ON plans (is_default) WHERE is_default = true');
  }

  // user_quotas 表
  const hasUserQuotas = await knex.schema.hasTable('user_quotas');
  if (!hasUserQuotas) {
    await knex.schema.createTable('user_quotas', table => {
      table.increments('id').primary();
      table.integer('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
      table.integer('plan_id').references('id').inTable('plans').onDelete('SET NULL');
      table.integer('subscription_quota').defaultTo(0);
      table.integer('permanent_quota').defaultTo(0);
      table.timestamp('subscription_expires_at');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  // 回滚顺序：先删除引用表
  await knex.schema.dropTableIfExists('user_quotas');
  await knex.schema.dropTableIfExists('plans');
}; 