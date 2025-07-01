/**
 * 检查数据库表结构脚本
 */

require('dotenv').config();
const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

async function checkSchema() {
  try {
    console.log('🔍 检查 user_memberships 表结构...');
    
    const columns = await knex.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_memberships' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 user_memberships 表字段:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n🔍 检查 membership_tiers 表结构...');
    const tierColumns = await knex.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'membership_tiers' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 membership_tiers 表字段:');
    tierColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await knex.destroy();
  }
}

checkSchema(); 