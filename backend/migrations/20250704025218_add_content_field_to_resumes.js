/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('resumes', function(table) {
    table.text('content').nullable().comment('简历原始文本内容');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('resumes', function(table) {
    table.dropColumn('content');
  });
};
