/**
 * 创建任务队列相关表
 * 用于管理简历解析等异步任务
 */

exports.up = function(knex) {
  return Promise.all([
    // 任务队列表
    knex.schema.createTable('task_queue', function(table) {
      table.increments('id').primary();
      table.string('task_id', 100).unique().notNullable(); // 任务唯一标识
      table.integer('user_id').unsigned(); // 关联用户（可为空，支持匿名任务）
      table.enum('task_type', ['resume_parse', 'resume_generate', 'ai_optimize']).notNullable();
      table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
      table.integer('progress').defaultTo(0); // 进度百分比 0-100
      table.text('status_message'); // 状态描述信息
      table.json('task_data'); // 任务输入数据
      table.json('result_data'); // 任务结果数据
      table.text('error_message'); // 错误信息
      table.timestamp('started_at'); // 开始处理时间
      table.timestamp('completed_at'); // 完成时间
      table.timestamps(true, true); // created_at, updated_at
      
      table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.index('task_id');
      table.index('user_id');
      table.index('status');
      table.index('task_type');
      table.index('created_at');
    }),

    // 任务进度日志表
    knex.schema.createTable('task_progress_logs', function(table) {
      table.increments('id').primary();
      table.string('task_id', 100).notNullable();
      table.integer('progress').notNullable(); // 进度百分比
      table.text('message'); // 进度描述
      table.json('metadata'); // 额外的元数据
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.index('task_id');
      table.index('created_at');
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('task_progress_logs'),
    knex.schema.dropTableIfExists('task_queue')
  ]);
}; 