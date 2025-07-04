/**
 * 检查专属简历数据
 */

require('dotenv').config();
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }
});

async function checkCustomizedResumesData() {
  try {
    console.log('🔍 检查专属简历数据...\n');
    
    // 检查所有专属简历
    const allCustomizedResumes = await knex('customized_resumes').select('*');
    
    console.log('📊 所有专属简历数量:', allCustomizedResumes.length);
    
    if (allCustomizedResumes.length > 0) {
      console.log('\n📋 专属简历列表:');
      allCustomizedResumes.forEach((resume, index) => {
        console.log(`${index + 1}. ID: ${resume.id}, 用户ID: ${resume.user_id}, 基础简历ID: ${resume.base_resume_id}, 岗位ID: ${resume.target_job_id}`);
        console.log(`   创建时间: ${resume.created_at}, 有优化数据: ${!!resume.optimized_data}`);
        if (resume.optimized_data) {
          console.log(`   优化数据长度: ${JSON.stringify(resume.optimized_data).length} 字符`);
        }
        console.log('');
      });
      
      // 特别检查ID为6的简历
      const resume6 = allCustomizedResumes.find(r => r.id === 6);
      if (resume6) {
        console.log('🎯 专属简历ID 6 详情:');
        console.log('用户ID:', resume6.user_id);
        console.log('基础简历ID:', resume6.base_resume_id);
        console.log('目标岗位ID:', resume6.target_job_id);
        console.log('有优化数据:', !!resume6.optimized_data);
        
        if (resume6.optimized_data) {
          console.log('优化数据结构:');
          console.log('- 类型:', typeof resume6.optimized_data);
          console.log('- 键:', Object.keys(resume6.optimized_data));
          
          if (resume6.optimized_data.profile) {
            console.log('- 个人信息:', resume6.optimized_data.profile.name || 'N/A');
          }
        }
      } else {
        console.log('❌ 未找到ID为6的专属简历');
      }
      
    } else {
      console.log('⚠️ 没有专属简历数据');
      
      // 创建测试数据
      console.log('\n🛠️ 创建测试专属简历...');
      
      // 首先检查是否有基础简历和岗位
      const resumes = await knex('resumes').select('id', 'user_id', 'title').limit(1);
      const jobs = await knex('job_positions').select('id', 'user_id', 'title').limit(1);
      
      if (resumes.length > 0 && jobs.length > 0) {
        const testOptimizedData = {
          profile: {
            name: "张三",
            email: "zhangsan@test.com",
            phone: "13800138000",
            location: "北京市"
          },
          workExperience: [
            {
              position: "前端开发工程师",
              company: "测试公司",
              duration: "2022-2024",
              description: "负责前端开发工作，使用React、Vue等技术栈"
            }
          ],
          education: [
            {
              school: "北京大学",
              degree: "本科",
              major: "计算机科学与技术",
              duration: "2018-2022"
            }
          ],
          skills: [
            {
              category: "编程语言",
              details: "JavaScript, TypeScript, Python"
            },
            {
              category: "框架技术",
              details: "React, Vue, Node.js"
            }
          ]
        };
        
        const [newCustomizedResume] = await knex('customized_resumes').insert({
          user_id: resumes[0].user_id,
          base_resume_id: resumes[0].id,
          target_job_id: jobs[0].id,
          optimized_data: JSON.stringify(testOptimizedData),
          base_resume_title: resumes[0].title,
          job_title: jobs[0].title,
          job_company: '测试公司',
          created_at: new Date(),
          updated_at: new Date()
        }).returning('*');
        
        console.log('✅ 测试专属简历创建成功:', {
          id: newCustomizedResume.id,
          user_id: newCustomizedResume.user_id
        });
        
      } else {
        console.log('❌ 缺少基础简历或岗位数据，无法创建测试专属简历');
        console.log('基础简历数量:', resumes.length);
        console.log('岗位数量:', jobs.length);
      }
    }
    
    // 检查用户信息
    console.log('\n👥 用户信息:');
    const users = await knex('users').select('id', 'email').limit(5);
    users.forEach(user => {
      console.log(`用户ID: ${user.id}, 邮箱: ${user.email}`);
    });
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error(error.stack);
  } finally {
    await knex.destroy();
  }
}

checkCustomizedResumesData(); 