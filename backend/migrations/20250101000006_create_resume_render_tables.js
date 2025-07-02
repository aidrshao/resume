/**
 * 创建简历渲染记录表
 * resume_templates表已存在，只需要创建resume_renders表
 */

exports.up = function(knex) {
  return knex.schema
    // 只创建简历渲染记录表，因为resume_templates表已存在
    .createTable('resume_renders', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().comment('用户ID');
      table.integer('resume_id').unsigned().notNullable().comment('简历ID');
      table.integer('template_id').unsigned().notNullable().comment('模板ID');
      table.text('rendered_data').comment('渲染后的HTML内容');
      table.string('output_format', 20).defaultTo('html').comment('输出格式：html, pdf');
      table.string('file_path').comment('生成的文件路径（如PDF文件）');
      table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending').comment('渲染状态');
      table.text('error_message').comment('错误信息');
      table.timestamps(true, true);
      
      // 外键约束
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('resume_id').references('id').inTable('resumes').onDelete('CASCADE');
      table.foreign('template_id').references('id').inTable('resume_templates').onDelete('CASCADE');
      
      // 索引
      table.index(['user_id']);
      table.index(['resume_id']);
      table.index(['template_id']);
      table.index(['status']);
      table.index(['created_at']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('resume_renders');
}; 