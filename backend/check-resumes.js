/**
 * 检查简历数据
 */

require('dotenv').config();
const knexfile = require('./knexfile');
const knex = require('knex')(knexfile.development);

async function checkResumes() {
  try {
    console.log('🔍 开始查看所有简历数据...');
    
    // 查询用户ID=2的所有简历
    const resumes = await knex('resumes').select('id', 'title', 'user_id', 'resume_data').where('user_id', 2);
    
    console.log(`📄 找到 ${resumes.length} 个简历:`);
    
    for (const resume of resumes) {
      console.log(`\n=== 简历 ID: ${resume.id} ===`);
      console.log('- 标题:', resume.title);
      console.log('- 用户ID:', resume.user_id);
      console.log('- 数据类型:', typeof resume.resume_data);
      console.log('- 数据长度:', resume.resume_data ? JSON.stringify(resume.resume_data).length : 0);
      
      if (resume.resume_data) {
        console.log('✅ 这个简历有数据');
        
        try {
          const content = resume.resume_data; // 直接使用，因为已经是JSON对象
          
          // 正确的字段名称
          const name = content.personalInfo?.name || content.name || '无';
          const workExperiences = content.workExperiences || content.work_experience || [];
          const educations = content.educations || content.education || [];
          const projects = content.projects || [];
          
          // 处理技能数据
          let skillsCount = 0;
          if (content.skills) {
            if (Array.isArray(content.skills)) {
              skillsCount = content.skills.length;
            } else if (typeof content.skills === 'object') {
              // 技能是对象结构，需要计算各个类别的总数
              skillsCount = (content.skills.technical || []).length + 
                           (content.skills.professional || []).length + 
                           (content.skills.soft || []).length + 
                           (content.skills.certifications || []).length;
            }
          }
          
          console.log('- 姓名:', name);
          console.log('- 工作经历数量:', Array.isArray(workExperiences) ? workExperiences.length : 0);
          console.log('- 教育背景数量:', Array.isArray(educations) ? educations.length : 0);
          console.log('- 技能数量:', skillsCount);
          console.log('- 项目数量:', Array.isArray(projects) ? projects.length : 0);
          
          // 如果有内容，显示第一个工作经历的详情
          if (Array.isArray(workExperiences) && workExperiences.length > 0) {
            console.log('\n💼 第一个工作经历详情:');
            const first = workExperiences[0];
            console.log('  公司:', first.company || '无');
            console.log('  职位:', first.position || '无');
            console.log('  描述长度:', first.description ? first.description.length : 0);
          }
          
          // 如果有教育背景，显示第一个教育背景的详情
          if (Array.isArray(educations) && educations.length > 0) {
            console.log('\n🎓 第一个教育背景详情:');
            const first = educations[0];
            console.log('  学校:', first.school || '无');
            console.log('  学历:', first.degree || '无');
            console.log('  专业:', first.major || '无');
          }
          
        } catch (error) {
          console.error('❌ 数据处理失败:', error.message);
        }
      } else {
        console.log('⚠️ 这个简历没有数据');
      }
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await knex.destroy();
    process.exit(0);
  }
}

checkResumes(); 