/**
 * 验证迁移后的数据格式 - PostgreSQL兼容版本
 * 
 * 执行方式：node backend/scripts/verify-migration-fixed.js
 */

const knex = require('knex');
const dbConfig = require('../knexfile');
const db = knex(dbConfig.development);

async function verifyMigration() {
  try {
    console.log('🔍 验证迁移后的数据格式...\n');
    
    // 获取样本数据
    const sample = await db('resumes').select('id', 'resume_data', 'title').first();
    
    if (!sample) {
      console.log('❌ 没有找到简历数据');
      return;
    }
    
    console.log('📊 样本简历:');
    console.log('- ID:', sample.id);
    console.log('- 标题:', sample.title || '(无标题)');
    
    // 解析数据
    const data = typeof sample.resume_data === 'string' 
      ? JSON.parse(sample.resume_data) 
      : sample.resume_data;
    
    console.log('\n📋 数据结构验证:');
    console.log('- profile:', !!data.profile ? '✅' : '❌');
    console.log('- workExperience:', Array.isArray(data.workExperience) ? '✅' : '❌', `(${data.workExperience?.length || 0} 项)`);
    console.log('- projectExperience:', Array.isArray(data.projectExperience) ? '✅' : '❌', `(${data.projectExperience?.length || 0} 项)`);
    console.log('- education:', Array.isArray(data.education) ? '✅' : '❌', `(${data.education?.length || 0} 项)`);
    console.log('- skills:', Array.isArray(data.skills) ? '✅' : '❌', `(${data.skills?.length || 0} 项)`);
    console.log('- customSections:', Array.isArray(data.customSections) ? '✅' : '❌', `(${data.customSections?.length || 0} 项)`);
    
    // 检查个人信息
    if (data.profile) {
      console.log('\n👤 个人信息:');
      console.log('- 姓名:', data.profile.name || '(空)');
      console.log('- 邮箱:', data.profile.email || '(空)');
      console.log('- 电话:', data.profile.phone || '(空)');
      console.log('- 地址:', data.profile.location || '(空)');
      console.log('- 作品集:', data.profile.portfolio || '(空)');
      console.log('- LinkedIn:', data.profile.linkedin || '(空)');
      console.log('- 简介:', data.profile.summary || '(空)');
    }
    
    // 检查技能格式
    if (data.skills && data.skills.length > 0) {
      console.log('\n🛠️ 技能格式验证:');
      data.skills.slice(0, 3).forEach((skill, index) => {
        console.log(`- 技能 ${index + 1}:`, {
          category: skill.category || '(无分类)',
          details: skill.details || '(无详情)'
        });
      });
    }
    
    // 统计所有简历的迁移状态
    console.log('\n📈 全体简历迁移状态:');
    const totalCount = await db('resumes').count('id as count').first();
    console.log('- 总简历数:', totalCount.count);
    
    // 检查是否都符合新格式 - 使用PostgreSQL兼容语法
    const migratedCount = await db('resumes')
      .whereRaw("resume_data ? 'profile'")
      .andWhereRaw("resume_data ? 'workExperience'")
      .count('id as count')
      .first();
    
    console.log('- 已迁移数:', migratedCount.count);
    console.log('- 迁移率:', `${((migratedCount.count / totalCount.count) * 100).toFixed(1)}%`);
    
    if (migratedCount.count === totalCount.count) {
      console.log('\n🎉 所有简历都已成功迁移到新格式！');
    } else {
      console.log('\n⚠️ 部分简历尚未迁移，请检查');
    }
    
    // 显示一些实际的数据内容
    console.log('\n📄 数据内容示例:');
    console.log('Resume Data Sample:');
    console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
  } finally {
    await db.destroy();
  }
}

// 直接执行
if (require.main === module) {
  verifyMigration();
}

module.exports = { verifyMigration }; 