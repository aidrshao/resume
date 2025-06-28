/**
 * 简历系统相关数据库表迁移
 * 包含用户信息、简历、岗位定制等表
 */

exports.up = function(knex) {
  return Promise.all([
    // 用户详细信息表
    knex.schema.createTable('user_profiles', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('full_name', 100);
      table.string('phone', 20);
      table.string('location', 100);
      table.text('summary'); // 个人简介
      table.json('skills'); // 技能列表 JSON
      table.json('languages'); // 语言能力 JSON
      table.string('avatar_url', 500);
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.index('user_id');
    }),

    // 教育经历表
    knex.schema.createTable('educations', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('school', 200).notNullable();
      table.string('degree', 100);
      table.string('major', 100);
      table.date('start_date');
      table.date('end_date');
      table.boolean('is_current').defaultTo(false);
      table.text('description');
      table.decimal('gpa', 3, 2);
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.index('user_id');
    }),

    // 工作经历表
    knex.schema.createTable('work_experiences', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('company', 200).notNullable();
      table.string('position', 100).notNullable();
      table.string('location', 100);
      table.date('start_date');
      table.date('end_date');
      table.boolean('is_current').defaultTo(false);
      table.text('description');
      table.json('achievements'); // 工作成就 JSON数组
      table.json('technologies'); // 使用技术 JSON数组
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.index('user_id');
    }),

    // 项目经历表
    knex.schema.createTable('projects', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('name', 200).notNullable();
      table.string('role', 100);
      table.date('start_date');
      table.date('end_date');
      table.boolean('is_current').defaultTo(false);
      table.text('description');
      table.json('technologies'); // 技术栈 JSON数组
      table.string('demo_url', 500);
      table.string('github_url', 500);
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.index('user_id');
    }),

    // 简历模板表
    knex.schema.createTable('resume_templates', function(table) {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.text('description');
      table.string('preview_image', 500);
      table.json('template_config'); // 模板配置 JSON
      table.boolean('is_premium').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);
    }),

    // 生成的简历表
    knex.schema.createTable('resumes', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('template_id').unsigned();
      table.string('title', 200).notNullable();
      table.enum('generation_mode', ['normal', 'advanced']).defaultTo('normal');
      table.string('target_company', 200); // 目标公司（高级模式）
      table.string('target_position', 200); // 目标岗位（高级模式）
      table.text('job_description'); // 岗位描述（高级模式）
      table.json('resume_data'); // 简历数据 JSON
      table.json('ai_optimizations'); // AI优化建议 JSON
      table.string('pdf_url', 500); // 生成的PDF链接
      table.enum('status', ['draft', 'generating', 'completed', 'failed']).defaultTo('draft');
      table.boolean('is_base').defaultTo(false); // 是否为基础简历
      table.string('source', 50); // 来源：upload, chat, manual
      table.text('generation_log'); // 生成日志
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('template_id').references('id').inTable('resume_templates').onDelete('SET NULL');
      table.index('user_id');
      table.index('status');
      table.index('is_base');
    }),

    // 简历上传记录表
    knex.schema.createTable('resume_uploads', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('original_filename', 255).notNullable();
      table.string('file_path', 500).notNullable();
      table.string('file_type', 50).notNullable(); // pdf, docx, doc
      table.integer('file_size'); // 文件大小（字节）
      table.text('extracted_text'); // 提取的文本内容
      table.json('parsed_data'); // 解析后的结构化数据
      table.enum('parse_status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
      table.text('parse_error'); // 解析错误信息
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.index('user_id');
      table.index('parse_status');
    }),

    // AI对话记录表
    knex.schema.createTable('ai_conversations', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('session_id', 100).notNullable();
      table.enum('conversation_type', ['info_collection', 'resume_optimization']).notNullable();
      table.json('conversation_data'); // 对话内容和状态
      table.json('collected_info'); // 收集到的信息
      table.enum('status', ['active', 'completed', 'abandoned']).defaultTo('active');
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.index('user_id');
      table.index('session_id');
      table.index('status');
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('ai_conversations'),
    knex.schema.dropTableIfExists('resume_uploads'),
    knex.schema.dropTableIfExists('resumes'),
    knex.schema.dropTableIfExists('resume_templates'),
    knex.schema.dropTableIfExists('projects'),
    knex.schema.dropTableIfExists('work_experiences'),
    knex.schema.dropTableIfExists('educations'),
    knex.schema.dropTableIfExists('user_profiles')
  ]);
}; 