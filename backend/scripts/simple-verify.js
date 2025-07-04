/**
 * 简单验证迁移后的数据格式
 * 
 * 执行方式：node backend/scripts/simple-verify.js
 */

const knex = require('knex');
const dbConfig = require('../knexfile');
const db = knex(dbConfig.development);

async function simpleVerify() {
  try {
    console.log('🔍 简单验证迁移后的数据格式...\n');
    
    // 获取所有简历
    const resumes = await db('resumes').select('id', 'resume_data', 'title');
    
    console.log(`📊 总共 ${resumes.length} 条简历记录\n`);
    
    let validCount = 0;
    let invalidCount = 0;
    
    // 逐个检查
    for (const resume of resumes) {
      try {
        const data = typeof resume.resume_data === 'string' 
          ? JSON.parse(resume.resume_data) 
          : resume.resume_data;
        
        // 检查是否符合新格式
        const isValid = data && 
          typeof data.profile === 'object' &&
          Array.isArray(data.workExperience) &&
          Array.isArray(data.projectExperience) &&
          Array.isArray(data.education) &&
          Array.isArray(data.skills) &&
          Array.isArray(data.customSections);
        
        if (isValid) {
          validCount++;
          console.log(`✅ 简历 ${resume.id}: ${resume.title || '(无标题)'} - 格式正确`);
        } else {
          invalidCount++;
          console.log(`❌ 简历 ${resume.id}: ${resume.title || '(无标题)'} - 格式不正确`);
        }
        
      } catch (error) {
        invalidCount++;
        console.log(`❌ 简历 ${resume.id}: ${resume.title || '(无标题)'} - 解析失败: ${error.message}`);
      }
    }
    
    console.log('\n=== 验证结果 ===');
    console.log(`✅ 有效: ${validCount}`);
    console.log(`❌ 无效: ${invalidCount}`);
    console.log(`📊 总计: ${resumes.length}`);
    console.log(`📈 有效率: ${((validCount / resumes.length) * 100).toFixed(1)}%`);
    
    // 显示一个样本数据
    if (resumes.length > 0) {
      console.log('\n📄 样本数据结构:');
      const sampleData = typeof resumes[0].resume_data === 'string' 
        ? JSON.parse(resumes[0].resume_data) 
        : resumes[0].resume_data;
      
      console.log('数据键:', Object.keys(sampleData));
      if (sampleData.profile) {
        console.log('profile键:', Object.keys(sampleData.profile));
      }
      if (sampleData.workExperience) {
        console.log('workExperience长度:', sampleData.workExperience.length);
      }
    }
    
    if (validCount === resumes.length) {
      console.log('\n🎉 所有简历都已成功迁移到新格式！');
    } else {
      console.log(`\n⚠️ 有 ${invalidCount} 条简历格式不正确`);
    }
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
  } finally {
    await db.destroy();
  }
}

// 直接执行
if (require.main === module) {
  simpleVerify();
}

module.exports = { simpleVerify }; 