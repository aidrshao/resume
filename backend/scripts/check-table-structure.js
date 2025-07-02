/**
 * 检查数据库表结构脚本
 */

require('dotenv').config();
const knex = require('knex');
const knexConfig = require('../knexfile');

// 获取当前环境的数据库配置
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];
const db = knex(config);

async function checkTableStructure() {
  try {
    console.log('🔍 检查resume_templates表结构...');
    
    // 检查表是否存在
    const hasTable = await db.schema.hasTable('resume_templates');
    console.log(`表是否存在: ${hasTable}`);
    
    if (hasTable) {
      // 获取表中的数据
      const data = await db('resume_templates').select('*').limit(3);
      console.log('\n📊 表中前3条数据:');
      console.log(JSON.stringify(data, null, 2));
      
      // 获取表的列信息
      const columns = await db('resume_templates').columnInfo();
      console.log('\n📋 表结构:');
      Object.keys(columns).forEach(column => {
        console.log(`- ${column}: ${columns[column].type} ${columns[column].nullable ? '(可空)' : '(不可空)'}`);
      });
      
      // 计算总数
      const count = await db('resume_templates').count('id as count').first();
      console.log(`\n📊 总记录数: ${count.count}`);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await db.destroy();
  }
}

checkTableStructure(); 