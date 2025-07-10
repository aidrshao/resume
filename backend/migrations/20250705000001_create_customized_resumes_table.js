/**
 * 创建 customized_resumes 表
 * 用于保存用户针对特定岗位生成的专属简历数据
 *
 * 字段说明：
 * - id: 主键，自增
 * - user_id: 所属用户，外键 -> users.id
 * - base_resume_id: 作为基础的简历ID，外键 -> resumes.id
 * - target_job_id: 目标岗位ID，外键 -> job_positions.id
 * - optimized_data: JSONB，存储AI优化后的简历数据
 * - created_at / updated_at: 时间戳
 *
 * 约束和索引：
 * - 唯一约束 (user_id, base_resume_id, target_job_id) 防止重复生成
 * - 常用字段索引 user_id、base_resume_id、target_job_id、created_at
 */

exports.up = function (knex) {
  return knex.schema.hasTable('customized_resumes').then((exists) => {
    if (exists) {
      console.log('ℹ️ [MIGRATION] customized_resumes 表已存在，跳过创建');
      return null;
    }

    return knex.schema.createTable('customized_resumes', function (table) {
      table.increments('id').primary();

      // 关联字段
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table
        .integer('base_resume_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('resumes')
        .onDelete('CASCADE');

      table
        .integer('target_job_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('job_positions')
        .onDelete('CASCADE');

      // 数据字段
      table.jsonb('optimized_data').notNullable().comment('AI 优化后的简历数据');

      // 时间戳
      table.timestamps(true, true);

      // 唯一约束 & 索引
      table.unique(['user_id', 'base_resume_id', 'target_job_id'], 'uq_customized_resume_user_base_job');
      table.index('user_id', 'idx_customized_resume_user');
      table.index('base_resume_id', 'idx_customized_resume_base');
      table.index('target_job_id', 'idx_customized_resume_job');
      table.index('created_at', 'idx_customized_resume_created');
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customized_resumes');
}; 