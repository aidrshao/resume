/**
 * 简化的数据迁移脚本 - 版本 3.2
 * 不依赖schema_version字段，直接转换所有简历数据
 * 
 * 执行方式：node backend/scripts/run-migration-v3-simple.js
 */

const knex = require('knex');
const { convertToUnifiedSchema, validateUnifiedSchema } = require('../schemas/schema');

// 数据库配置
const dbConfig = require('../knexfile');
const db = knex(dbConfig.development);

/**
 * 执行迁移
 */
async function runMigration() {
  console.log('🚀 开始简化数据迁移到版本 3.2...\n');
  
  try {
    // 1. 检查数据库连接
    await db.raw('SELECT 1');
    console.log('✅ 数据库连接成功');
    
    // 2. 查询所有简历（不依赖schema_version字段）
    const resumes = await db('resumes')
      .select('id', 'resume_data', 'title', 'user_id')
      .whereNotNull('resume_data');
    
    console.log(`📊 找到 ${resumes.length} 条简历记录\n`);
    
    if (resumes.length === 0) {
      console.log('✅ 没有找到需要处理的简历数据');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // 3. 逐个迁移
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
        
        // 检查是否已经是新格式
        if (oldData && oldData.profile && 
            Array.isArray(oldData.workExperience) && 
            Array.isArray(oldData.projectExperience) &&
            Array.isArray(oldData.education) &&
            Array.isArray(oldData.skills) &&
            Array.isArray(oldData.customSections)) {
          console.log(`  ⏭️ 已是新格式，跳过`);
          skippedCount++;
          continue;
        }
        
        // 转换数据
        const newData = convertToUnifiedSchema(oldData);
        
        // 验证数据
        const validation = validateUnifiedSchema(newData);
        if (!validation.valid) {
          throw new Error(`数据验证失败: ${validation.error}`);
        }
        
        // 更新数据库
        await db('resumes')
          .where('id', resume.id)
          .update({
            resume_data: JSON.stringify(newData),
            updated_at: db.fn.now()
          });
        
        console.log(`  ✅ 成功迁移 (姓名: ${newData.profile.name || '未知'})`);
        successCount++;
        
      } catch (error) {
        console.log(`  ❌ 迁移失败: ${error.message}`);
        errorCount++;
      }
    }
    
    // 4. 显示结果
    console.log('\n=== 迁移完成 ===');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`⏭️ 跳过: ${skippedCount}`);
    console.log(`❌ 失败: ${errorCount}`);
    console.log(`📊 总计: ${resumes.length}`);
    
    // 5. 验证迁移结果 - 检查转换后的数据格式
    console.log(`\n📈 验证迁移结果:`);
    
    const sampleResume = await db('resumes')
      .select('resume_data')
      .whereNotNull('resume_data')
      .first();
    
    if (sampleResume) {
      const sampleData = typeof sampleResume.resume_data === 'string' 
        ? JSON.parse(sampleResume.resume_data)
        : sampleResume.resume_data;
      
      console.log(`  - 包含profile: ${!!sampleData.profile}`);
      console.log(`  - 包含workExperience: ${Array.isArray(sampleData.workExperience)}`);
      console.log(`  - 包含projectExperience: ${Array.isArray(sampleData.projectExperience)}`);
      console.log(`  - 包含education: ${Array.isArray(sampleData.education)}`);
      console.log(`  - 包含skills: ${Array.isArray(sampleData.skills)}`);
      console.log(`  - 包含customSections: ${Array.isArray(sampleData.customSections)}`);
    }
    
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