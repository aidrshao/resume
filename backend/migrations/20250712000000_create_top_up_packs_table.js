/**
 * 20250712000000_create_top_up_packs_table.js
 * -------------------------------------------
 * 创建 "加油包" (top_up_packs) 表
 */

exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('top_up_packs');
  if (!hasTable) {
    await knex.schema.createTable('top_up_packs', table => {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.jsonb('features').comment('存储增加的永久配额，例如 {"resume_optimizations": 10}');
      table.string('status', 50).defaultTo('active').index();
      table.integer('sort_order').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('top_up_packs');
}; 