/**
 * 创建岗位管理表
 * 支持用户管理意向岗位信息
 */

exports.up = function(knex) {
  return knex.schema.createTable('job_positions', function(table) {
    // 基础字段
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    
    // 岗位基本信息
    table.string('title', 255).notNullable().comment('职位名称');
    table.string('company', 255).notNullable().comment('公司名称');
    table.text('description').comment('职位描述');
    table.text('requirements').comment('岗位要求');
    table.string('salary_range', 100).comment('薪资范围');
    table.string('location', 255).comment('工作地点');
    table.string('job_type', 50).defaultTo('full-time').comment('工作类型: full-time, part-time, contract, remote');
    
    // 数据来源信息
    table.string('source_type', 50).notNullable().comment('来源类型: text, file, image');
    table.string('source_file_path', 500).comment('源文件路径（图片或文档）');
    table.text('original_content').comment('原始内容（截图或文件提取的文本）');
    
    // 管理信息
    table.string('status', 50).defaultTo('active').comment('状态: active, applied, archived');
    table.integer('priority').defaultTo(1).comment('优先级 1-5');
    table.date('application_deadline').comment('申请截止日期');
    table.text('notes').comment('用户备注');
    
    // 时间戳
    table.timestamps(true, true);
    
    // 索引
    table.index(['user_id', 'status'], 'idx_job_positions_user_status');
    table.index(['user_id', 'created_at'], 'idx_job_positions_user_created');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('job_positions');
}; 