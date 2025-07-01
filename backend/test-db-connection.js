/**
 * 测试数据库连接脚本
 */

require('dotenv').config();
const db = require('./config/database');

async function testDatabaseConnection() {
  try {
    console.log('🔗 测试数据库连接...');
    
    // 测试基本连接
    const result = await db.raw('SELECT NOW() as current_time');
    console.log('✅ 数据库连接成功');
    console.log('📅 数据库时间:', result.rows[0].current_time);
    
    // 测试表是否存在
    console.log('\n🔍 检查数据库表...');
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log('📋 数据库表列表:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // 检查job_positions表
    const jobPositionsExists = tables.rows.some(table => table.table_name === 'job_positions');
    if (jobPositionsExists) {
      console.log('\n✅ job_positions表存在');
      
      // 获取表结构
      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'job_positions'
        ORDER BY ordinal_position
      `);
      
      console.log('📊 job_positions表结构:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // 测试查询
      console.log('\n🧪 测试查询...');
      const count = await db('job_positions').count('* as count').first();
      console.log('📈 job_positions表记录数:', count.count);
      
    } else {
      console.log('❌ job_positions表不存在');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

testDatabaseConnection(); 