/**
 * 检查数据库权限和表结构
 */

const knex = require('../config/database');

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库连接和权限...');
    
    // 检查连接
    await knex.raw('SELECT 1');
    console.log('✅ 数据库连接正常');
    
    // 检查当前用户
    const userResult = await knex.raw('SELECT CURRENT_USER');
    console.log('👤 当前数据库用户:', userResult.rows[0]?.current_user);
    
    // 检查resumes表是否存在
    const tableExists = await knex.schema.hasTable('resumes');
    console.log('📊 resumes表存在:', tableExists);
    
    if (tableExists) {
      // 检查表的所有者
      const ownerResult = await knex.raw(`
        SELECT schemaname, tablename, tableowner 
        FROM pg_tables 
        WHERE tablename = 'resumes'
      `);
      console.log('🔐 resumes表所有者:', ownerResult.rows[0]);
      
      // 检查现有字段
      const columns = await knex.raw(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'resumes'
        ORDER BY ordinal_position
      `);
      console.log('📋 现有字段:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // 检查是否已有新字段
      const hasUnifiedData = await knex.schema.hasColumn('resumes', 'unified_data');
      const hasSchemaVersion = await knex.schema.hasColumn('resumes', 'schema_version');
      
      console.log('🔍 字段检查结果:');
      console.log('  - unified_data存在:', hasUnifiedData);
      console.log('  - schema_version存在:', hasSchemaVersion);
      
      if (hasUnifiedData && hasSchemaVersion) {
        console.log('✅ 字段已存在，迁移可能已完成');
      } else {
        console.log('⚠️ 字段不存在，需要迁移');
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await knex.destroy();
  }
}

checkDatabase(); 