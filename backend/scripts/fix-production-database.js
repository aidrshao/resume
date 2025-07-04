#!/usr/bin/env node

/**
 * 生产环境数据库修复脚本
 * 修复简历上传功能中的数据库字段问题
 */

const knex = require('../config/database');

async function fixProductionDatabase() {
  console.log('🔧 开始修复生产环境数据库...');
  
  try {
    // 检查当前数据库状态
    console.log('📋 检查当前数据库状态...');
    
    // 检查 resumes 表的字段
    const hasResumeData = await knex.schema.hasColumn('resumes', 'resume_data');
    const hasUnifiedData = await knex.schema.hasColumn('resumes', 'unified_data');
    const hasSchemaVersion = await knex.schema.hasColumn('resumes', 'schema_version');
    
    console.log('📊 字段检查结果:');
    console.log(`  - resume_data: ${hasResumeData}`);
    console.log(`  - unified_data: ${hasUnifiedData}`);
    console.log(`  - schema_version: ${hasSchemaVersion}`);
    
    // 步骤1: 添加缺失的字段
    if (!hasUnifiedData) {
      console.log('➕ 添加 unified_data 字段...');
      await knex.schema.alterTable('resumes', function(table) {
        table.jsonb('unified_data').nullable().comment('统一格式的简历数据');
      });
      console.log('✅ unified_data 字段添加成功');
    }
    
    if (!hasSchemaVersion) {
      console.log('➕ 添加 schema_version 字段...');
      await knex.schema.alterTable('resumes', function(table) {
        table.string('schema_version', 10).defaultTo('2.1').comment('数据结构版本');
      });
      console.log('✅ schema_version 字段添加成功');
    }
    
    // 步骤2: 数据迁移
    if (hasResumeData) {
      console.log('🔄 从 resume_data 迁移数据到 unified_data...');
      
      // 统计需要迁移的数据
      const totalRecords = await knex('resumes')
        .whereNotNull('resume_data')
        .whereNull('unified_data')
        .count('id as count');
      
      console.log(`📊 找到 ${totalRecords[0].count} 条需要迁移的记录`);
      
      if (totalRecords[0].count > 0) {
        // 批量迁移数据
        await knex.raw(`
          UPDATE resumes 
          SET unified_data = CASE 
            WHEN resume_data IS NOT NULL AND resume_data != '' THEN 
              CASE 
                WHEN resume_data::text ~ '^\\{.*\\}$' THEN resume_data::jsonb
                ELSE jsonb_build_object('rawData', resume_data)
              END
            ELSE NULL
          END
          WHERE resume_data IS NOT NULL AND unified_data IS NULL
        `);
        
        console.log('✅ 数据迁移完成');
      }
    }
    
    // 步骤3: 检查是否可以安全删除 resume_data 字段
    if (hasResumeData) {
      const pendingMigration = await knex('resumes')
        .whereNotNull('resume_data')
        .whereNull('unified_data')
        .count('id as count');
      
      if (pendingMigration[0].count === 0) {
        console.log('🗑️ 删除旧的 resume_data 字段...');
        await knex.schema.alterTable('resumes', function(table) {
          table.dropColumn('resume_data');
        });
        console.log('✅ resume_data 字段删除成功');
      } else {
        console.log(`⚠️ 还有 ${pendingMigration[0].count} 条记录未迁移，保留 resume_data 字段`);
      }
    }
    
    // 步骤4: 验证修复结果
    console.log('🔍 验证修复结果...');
    const sampleData = await knex('resumes')
      .select('id', 'title', 'unified_data', 'schema_version')
      .whereNotNull('unified_data')
      .limit(3);
    
    if (sampleData.length > 0) {
      console.log('✅ 验证通过，样本数据:');
      sampleData.forEach(row => {
        console.log(`  - ID: ${row.id}, Title: ${row.title}, Schema: ${row.schema_version}`);
        console.log(`    Data: ${JSON.stringify(row.unified_data).substring(0, 100)}...`);
      });
    } else {
      console.log('⚠️ 没有找到 unified_data 数据，可能需要重新上传简历');
    }
    
    console.log('✅ 生产环境数据库修复完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await fixProductionDatabase();
    console.log('🎉 修复脚本执行成功！');
  } catch (error) {
    console.error('💥 修复脚本执行失败:', error);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  fixProductionDatabase
}; 