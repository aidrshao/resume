/**
 * 检查数据库表结构
 */

require('dotenv').config();
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }
});

async function checkTableStructure() {
  try {
    console.log('🔍 检查数据库表结构...\n');
    
    // 检查resumes表结构
    console.log('📋 resumes表结构:');
    const resumesColumns = await knex.raw(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'resumes' 
      ORDER BY ordinal_position
    `);
    
    resumesColumns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 检查customized_resumes表结构
    console.log('\n📋 customized_resumes表结构:');
    const customizedResumesColumns = await knex.raw(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'customized_resumes' 
      ORDER BY ordinal_position
    `);
    
    customizedResumesColumns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 检查现有数据
    console.log('\n📊 现有resumes数据:');
    const resumes = await knex('resumes').select('id', 'user_id', 'title').limit(3);
    resumes.forEach(resume => {
      console.log(`- ID: ${resume.id}, 用户ID: ${resume.user_id}, 标题: ${resume.title}`);
    });
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await knex.destroy();
  }
}

checkTableStructure();
