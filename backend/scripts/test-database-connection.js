/**
 * 测试数据库连接
 */

require('dotenv').config();

async function testDatabaseConnection() {
  try {
    console.log('🔍 开始测试数据库连接...');
    
    // 1. 测试knex配置
    console.log('\n1️⃣ 测试knex配置...');
    const knexConfig = require('../knexfile');
    console.log('✅ knexfile.js加载成功');
    console.log('📊 环境配置:', knexConfig.development);
    
    // 2. 测试knex实例创建
    console.log('\n2️⃣ 测试knex实例创建...');
    const knex = require('knex');
    const db = knex(knexConfig.development);
    console.log('✅ knex实例创建成功');
    
    // 3. 测试数据库连接
    console.log('\n3️⃣ 测试数据库连接...');
    await db.raw('SELECT 1 as test');
    console.log('✅ 数据库连接成功');
    
    // 4. 测试表是否存在
    console.log('\n4️⃣ 测试表结构...');
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 数据库表列表:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 5. 测试customized_resumes表
    if (tables.rows.some(row => row.table_name === 'customized_resumes')) {
      console.log('\n5️⃣ 测试customized_resumes表...');
      const count = await db('customized_resumes').count('* as count').first();
      console.log(`✅ customized_resumes表存在，记录数: ${count.count}`);
    } else {
      console.log('\n⚠️ customized_resumes表不存在');
    }
    
    // 6. 关闭连接
    await db.destroy();
    console.log('\n✅ 数据库连接测试完成');
    
  } catch (error) {
    console.error('\n❌ 数据库连接测试失败:', error.message);
    console.error('📊 错误详情:', error);
  }
}

if (require.main === module) {
  testDatabaseConnection();
} 