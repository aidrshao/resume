/**
 * 手动添加content字段到resumes表
 */

const knex = require('../config/database');

async function addContentField() {
  console.log('🔧 [修复] 开始添加content字段到resumes表...\n');
  
  try {
    // 检查字段是否已存在
    console.log('🔍 [检查] 检查content字段是否已存在...');
    const tableInfo = await knex.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'resumes' 
      AND column_name = 'content'
    `);
    
    if (tableInfo.rows && tableInfo.rows.length > 0) {
      console.log('✅ [检查] content字段已存在，无需添加');
      return;
    }
    
    console.log('❌ [检查] content字段不存在，开始添加...');
    
    // 添加content字段
    console.log('➕ [添加] 执行ALTER TABLE添加content字段...');
    await knex.raw('ALTER TABLE resumes ADD COLUMN content TEXT');
    
    console.log('✅ [成功] content字段添加成功！');
    
    // 验证添加结果
    console.log('🔍 [验证] 验证字段添加结果...');
    const verifyInfo = await knex.raw(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'resumes' 
      AND column_name = 'content'
    `);
    
    if (verifyInfo.rows && verifyInfo.rows.length > 0) {
      const field = verifyInfo.rows[0];
      console.log('✅ [验证] 字段信息:');
      console.log(`   - 字段名: ${field.column_name}`);
      console.log(`   - 数据类型: ${field.data_type}`);
      console.log(`   - 可为空: ${field.is_nullable}`);
    }
    
  } catch (error) {
    console.error('❌ [错误] 添加content字段失败:', error.message);
    
    // 如果是权限问题，尝试其他方案
    if (error.message.includes('must be owner')) {
      console.log('\n💡 [提示] 检测到权限问题，请联系数据库管理员添加以下字段:');
      console.log('   ALTER TABLE resumes ADD COLUMN content TEXT;');
    }
  } finally {
    process.exit(0);
  }
}

addContentField(); 