#!/usr/bin/env node

/**
 * 检查模板数据脚本
 * 功能：检查数据库中的模板数据
 */

require('dotenv').config();
const knex = require('knex')(require('../knexfile').development);

async function checkTemplates() {
  try {
    console.log('📊 检查模板数据...');
    
    // 检查模板表是否存在
    const hasTable = await knex.schema.hasTable('templates');
    console.log('✅ 模板表存在:', hasTable);
    
    if (hasTable) {
      // 获取模板数据
      const templates = await knex.select('*').from('templates');
      console.log('📋 模板数量:', templates.length);
      
      if (templates.length > 0) {
        console.log('📄 模板详情:');
        templates.forEach((template, index) => {
          console.log(`  ${index + 1}. ID: ${template.id}, 名称: ${template.name}, 状态: ${template.status}`);
        });
      } else {
        console.log('⚠️  模板表为空');
      }
    }
    
    await knex.destroy();
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}

checkTemplates(); 