/**
 * 统一数据范式迁移
 * 这个迁移将重构resumes表以支持新的统一数据格式
 */

exports.up = function(knex) {
  return knex.schema.hasColumn('resumes', 'unified_data').then(hasUnifiedData => {
    return knex.schema.hasColumn('resumes', 'schema_version').then(hasSchemaVersion => {
      if (!hasUnifiedData || !hasSchemaVersion) {
        return knex.schema.alterTable('resumes', function(table) {
          // 只添加不存在的字段
          if (!hasUnifiedData) {
            table.jsonb('unified_data').nullable().comment('统一格式的简历数据');
          }
          if (!hasSchemaVersion) {
            table.string('schema_version', 10).defaultTo('2.1').comment('数据结构版本');
          }
          
          console.log('✅ [MIGRATION] 添加了unified_data和schema_version字段');
        });
      } else {
        console.log('ℹ️ [MIGRATION] 字段already存在，跳过添加');
        return Promise.resolve();
      }
    });
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
      `).then(() => ({ hasResumeData, hasContent }));
    } else if (hasContent) {
      console.log('🔄 [MIGRATION] 从content复制数据到unified_data...');
      return knex.raw(`
        UPDATE resumes 
        SET unified_data = content::jsonb 
        WHERE content IS NOT NULL AND unified_data IS NULL
      `).then(() => ({ hasResumeData, hasContent }));
    }
    return Promise.resolve({ hasResumeData, hasContent });
  }).then(({ hasResumeData, hasContent }) => {
    // 为了向后兼容，保留 resume_data 字段，只删除 content 字段
    const promises = [];
    
    if (hasContent) {
      promises.push(
        knex.schema.alterTable('resumes', function(table) {
          table.dropColumn('content');
        }).then(() => {
          console.log('🗑️ [MIGRATION] 删除了content字段');
        })
      );
    }
    
    // 保留 resume_data 字段以确保向后兼容性
    if (hasResumeData) {
      console.log('ℹ️ [MIGRATION] 保留resume_data字段以确保向后兼容性');
    }
    
    return Promise.all(promises);
  }).then(() => {
    console.log('✅ [MIGRATION] 统一数据范式迁移完成');
  }).catch(error => {
    console.error('❌ [MIGRATION] 迁移失败:', error);
    throw error;
  });
};

exports.down = function(knex) {
  return knex.schema.hasColumn('resumes', 'resume_data').then(hasResumeData => {
    return knex.schema.hasColumn('resumes', 'content').then(hasContent => {
      const promises = [];
      
      // 如果 resume_data 不存在，则恢复它
      if (!hasResumeData) {
        promises.push(
          knex.schema.alterTable('resumes', function(table) {
            table.text('resume_data').nullable();
          }).then(() => {
            console.log('🔄 [ROLLBACK] 恢复了resume_data字段');
          })
        );
      }
      
      // 如果 content 不存在，则恢复它
      if (!hasContent) {
        promises.push(
          knex.schema.alterTable('resumes', function(table) {
            table.text('content').nullable();
          }).then(() => {
            console.log('🔄 [ROLLBACK] 恢复了content字段');
          })
        );
      }
      
      return Promise.all(promises);
    });
  }).then(() => {
    // 将数据从unified_data复制回resume_data（如果需要）
    return knex.raw(`
      UPDATE resumes 
      SET resume_data = unified_data::text 
      WHERE unified_data IS NOT NULL AND (resume_data IS NULL OR resume_data = '')
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