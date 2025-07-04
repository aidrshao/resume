/**
 * 创建customized_resumes表的执行脚本
 * 
 * 执行方式：node backend/scripts/create-customized-resumes-table.js
 */

const knex = require('knex');
const fs = require('fs');
const path = require('path');

// 数据库配置
const dbConfig = require('../knexfile');
const db = knex(dbConfig.development);

/**
 * 执行SQL脚本创建表
 */
async function createCustomizedResumesTable() {
  try {
    console.log('🚀 开始创建customized_resumes表...\n');
    
    // 读取SQL文件
    const sqlPath = path.join(__dirname, '../migrations/create_customized_resumes_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL脚本内容长度:', sqlContent.length, '字符');
    
    // 执行SQL脚本
    console.log('⚡ 执行SQL脚本...');
    await db.raw(sqlContent);
    
    console.log('✅ customized_resumes表创建成功！');
    
    // 验证表是否创建成功
    console.log('\n🔍 验证表结构...');
    const tableInfo = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customized_resumes' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 表结构:');
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 检查索引
    console.log('\n🔍 验证索引...');
    const indexInfo = await db.raw(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'customized_resumes'
    `);
    
    console.log('📊 索引列表:');
    indexInfo.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    
    // 检查外键约束
    console.log('\n🔍 验证外键约束...');
    const constraintInfo = await db.raw(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'customized_resumes'
    `);
    
    console.log('🔗 约束列表:');
    constraintInfo.rows.forEach(constraint => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
    console.log('\n🎉 数据库表创建完成！');
    
  } catch (error) {
    console.error('❌ 创建表时发生错误:', error.message);
    throw error;
  } finally {
    await db.destroy();
  }
}

// 直接执行
if (require.main === module) {
  createCustomizedResumesTable()
    .then(() => {
      console.log('\n✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error.message);
      process.exit(1);
    });
}

module.exports = { createCustomizedResumesTable }; 