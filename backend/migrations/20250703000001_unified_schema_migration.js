/**
 * 统一数据范式迁移
 * 这个迁移将重构resumes表以支持新的统一数据格式
 */

exports.up = function(knex) {
  return knex.schema.alterTable('resumes', function(table) {
    // 添加新字段
    table.jsonb('unified_data').nullable().comment('统一格式的简历数据');
    table.string('schema_version', 10).defaultTo('2.1').comment('数据结构版本');
    
    console.log('✅ [MIGRATION] 添加了unified_data和schema_version字段');
  }).then(() => {
    // 检查是否存在resume_data或content字段
    return knex.schema.hasColumn('resumes', 'resume_data').then(hasResumeData => {
      return knex.schema.hasColumn('resumes', 'content').then(hasContent => {
        console.log(`📊 [MIGRATION] 字段检查: resume_data=${hasResumeData}, content=${hasContent}`);
        return { hasResumeData, hasContent };
      });
    });
  }).then(({ hasResumeData, hasContent }) => {
    // 如果有旧数据，先复制到unified_data
    if (hasResumeData) {
      console.log('🔄 [MIGRATION] 从resume_data复制数据到unified_data...');
      return knex.raw(`
        UPDATE resumes 
        SET unified_data = resume_data::jsonb 
        WHERE resume_data IS NOT NULL AND unified_data IS NULL
      `);
    } else if (hasContent) {
      console.log('🔄 [MIGRATION] 从content复制数据到unified_data...');
      return knex.raw(`
        UPDATE resumes 
        SET unified_data = content::jsonb 
        WHERE content IS NOT NULL AND unified_data IS NULL
      `);
    }
    return Promise.resolve();
  }).then(() => {
    // 删除旧字段（如果存在）
    return knex.schema.alterTable('resumes', function(table) {
      if (knex.schema.hasColumn('resumes', 'content')) {
        table.dropColumn('content');
        console.log('🗑️ [MIGRATION] 删除了content字段');
      }
      if (knex.schema.hasColumn('resumes', 'resume_data')) {
        table.dropColumn('resume_data');
        console.log('🗑️ [MIGRATION] 删除了resume_data字段');
      }
    });
  }).then(() => {
    console.log('✅ [MIGRATION] 统一数据范式迁移完成');
  }).catch(error => {
    console.error('❌ [MIGRATION] 迁移失败:', error);
    throw error;
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('resumes', function(table) {
    // 恢复旧字段
    table.text('resume_data').nullable();
    table.text('content').nullable();
    
    console.log('🔄 [ROLLBACK] 恢复了resume_data和content字段');
  }).then(() => {
    // 将数据从unified_data复制回resume_data
    return knex.raw(`
      UPDATE resumes 
      SET resume_data = unified_data::text 
      WHERE unified_data IS NOT NULL
    `);
  }).then(() => {
    // 删除新字段
    return knex.schema.alterTable('resumes', function(table) {
      table.dropColumn('unified_data');
      table.dropColumn('schema_version');
      
      console.log('🗑️ [ROLLBACK] 删除了unified_data和schema_version字段');
    });
  }).then(() => {
    console.log('✅ [ROLLBACK] 回滚完成');
  }).catch(error => {
    console.error('❌ [ROLLBACK] 回滚失败:', error);
    throw error;
  });
}; 