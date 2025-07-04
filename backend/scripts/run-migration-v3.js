/**
 * 执行数据迁移到版本 3.2
 * 简化版本，专注于实际迁移任务
 * 兼容当前数据库结构（使用resume_data字段）
 * 
 * 执行方式：node backend/scripts/run-migration-v3.js
 */

const knex = require('knex');
const { convertToUnifiedSchema, validateUnifiedSchema } = require('../schemas/schema');

// 数据库配置
const dbConfig = require('../knexfile');
const db = knex(dbConfig.development);

/**
 * 检查并添加schema_version字段
 */
async function ensureSchemaVersionColumn() {
  try {
    // 检查schema_version字段是否存在
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'resumes' AND column_name = 'schema_version'
    `);
    
    if (columns.rows.length === 0) {
      console.log('📝 添加schema_version字段...');
      await db.raw('ALTER TABLE resumes ADD COLUMN schema_version VARCHAR(10) DEFAULT NULL');
      console.log('✅ schema_version字段添加成功');
    } else {
      console.log('✅ schema_version字段已存在');
    }
  } catch (error) {
    console.log('⚠️ 添加schema_version字段失败:', error.message);
  }
}

/**
 * 执行迁移
 */
async function runMigration() {
  console.log('🚀 开始数据迁移到版本 3.2...\n');
  
  try {
    // 1. 检查数据库连接
    await db.raw('SELECT 1');
    console.log('✅ 数据库连接成功');
    
    // 2. 确保schema_version字段存在
    await ensureSchemaVersionColumn();
    
    // 3. 查询需要迁移的简历（使用resume_data字段）
    const resumes = await db('resumes')
      .select('id', 'resume_data', 'schema_version', 'title')
      .whereNull('schema_version')
      .orWhere('schema_version', '!=', '3.2');
    
    console.log(`📊 找到 ${resumes.length} 条需要迁移的简历记录\n`);
    
    if (resumes.length === 0) {
      console.log('✅ 所有简历已是最新版本，无需迁移');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // 4. 逐个迁移
    for (let i = 0; i < resumes.length; i++) {
      const resume = resumes[i];
      
      try {
        console.log(`🔄 处理简历 ${i + 1}/${resumes.length} (ID: ${resume.id})`);
        
        // 解析现有数据
        let oldData = null;
        if (resume.resume_data) {
          if (typeof resume.resume_data === 'string') {
            oldData = JSON.parse(resume.resume_data);
          } else {
            oldData = resume.resume_data;
          }
        }
        
        // 转换数据
        const newData = convertToUnifiedSchema(oldData);
        
        // 验证数据
        const validation = validateUnifiedSchema(newData);
        if (!validation.valid) {
          throw new Error(`数据验证失败: ${validation.error}`);
        }
        
        // 更新数据库（保持使用resume_data字段）
        await db('resumes')
          .where('id', resume.id)
          .update({
            resume_data: JSON.stringify(newData),
            schema_version: '3.2',
            updated_at: db.fn.now()
          });
        
        console.log(`  ✅ 成功迁移 (姓名: ${newData.profile.name || '未知'})`);
        successCount++;
        
      } catch (error) {
        console.log(`  ❌ 迁移失败: ${error.message}`);
        errorCount++;
      }
    }
    
    // 5. 显示结果
    console.log('\n=== 迁移完成 ===');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${errorCount}`);
    console.log(`📊 总计: ${resumes.length}`);
    
    // 6. 验证迁移结果
    const finalCheck = await db('resumes')
      .count('id as total')
      .count(db.raw('CASE WHEN schema_version = ? THEN 1 END as migrated', ['3.2']))
      .first();
    
    console.log(`\n📈 数据库状态:`);
    console.log(`  总简历数: ${finalCheck.total}`);
    console.log(`  已迁移: ${finalCheck.migrated}`);
    console.log(`  迁移率: ${((finalCheck.migrated / finalCheck.total) * 100).toFixed(1)}%`);
    
    if (errorCount === 0) {
      console.log('\n🎉 迁移全部成功！');
    } else {
      console.log(`\n⚠️ 有 ${errorCount} 条记录迁移失败，请检查日志`);
    }
    
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error.message);
    throw error;
  } finally {
    await db.destroy();
  }
}

// 直接执行
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✅ 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 迁移脚本执行失败:', error.message);
      process.exit(1);
    });
}

module.exports = { runMigration }; 