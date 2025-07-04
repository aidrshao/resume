/**
 * 为测试用户创建专属简历
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

async function createTestCustomizedResume() {
  try {
    console.log('🛠️ 为测试用户创建专属简历...\n');
    
    // 获取测试用户信息
    const testUser = await knex('users').where('email', 'test@test.com').first();
    if (!testUser) {
      console.error('❌ 未找到测试用户');
      return;
    }
    
    console.log('👤 测试用户信息:', {
      id: testUser.id,
      email: testUser.email
    });
    
    // 检查是否有基础简历
    let baseResume = await knex('resumes').where('user_id', testUser.id).first();
    
    if (!baseResume) {
      // 为测试用户创建一个基础简历
      console.log('📝 为测试用户创建基础简历...');
      
      const basicResumeData = {
        profile: {
          name: "李四",
          email: "lisi@test.com",
          phone: "13900139000",
          location: "上海市",
          summary: "有3年前端开发经验的工程师"
        },
        workExperience: [
          {
            position: "前端开发工程师",
            company: "ABC科技公司",
            duration: "2021-2024",
            description: "负责Web应用开发，使用React、Vue.js等现代前端框架"
          }
        ],
        education: [
          {
            school: "上海交通大学",
            degree: "本科",
            major: "软件工程",
            duration: "2017-2021"
          }
        ],
        skills: [
          {
            category: "前端技术",
            details: "HTML, CSS, JavaScript, React, Vue.js"
          },
          {
            category: "后端技术",
            details: "Node.js, Express, MySQL"
          }
        ]
      };
      
      [baseResume] = await knex('resumes').insert({
        user_id: testUser.id,
        title: '测试基础简历',
        resume_data: JSON.stringify(basicResumeData),
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');
      
      console.log('✅ 基础简历创建成功:', {
        id: baseResume.id,
        title: baseResume.title
      });
    }
    
    // 检查是否有岗位
    let targetJob = await knex('job_positions').where('user_id', testUser.id).first();
    
    if (!targetJob) {
      // 为测试用户创建一个岗位
      console.log('💼 为测试用户创建目标岗位...');
      
      [targetJob] = await knex('job_positions').insert({
        user_id: testUser.id,
        title: '高级前端开发工程师',
        company: 'XYZ科技公司',
        description: '负责前端架构设计和开发，要求熟练掌握React、TypeScript等技术',
        requirements: 'React, TypeScript, Node.js, 3年以上工作经验',
        location: '北京',
        salary_range: '20000-30000',
        status: 'active',
        source_type: 'manual',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');
      
      console.log('✅ 目标岗位创建成功:', {
        id: targetJob.id,
        title: targetJob.title,
        company: targetJob.company
      });
    }
    
    // 创建优化的简历数据（针对目标岗位优化）
    const optimizedData = {
      profile: {
        name: "李四",
        email: "lisi@test.com",
        phone: "13900139000",
        location: "上海市",
        summary: "专注于前端技术的高级工程师，具有3年React开发经验，熟练掌握TypeScript和现代前端工具链"
      },
      workExperience: [
        {
          position: "高级前端开发工程师",
          company: "ABC科技公司",
          duration: "2021-2024",
          description: "• 负责大型React项目的架构设计和开发\n• 使用TypeScript构建类型安全的前端应用\n• 配合后端团队完成Node.js API开发\n• 指导初级开发人员进行技术提升"
        }
      ],
      education: [
        {
          school: "上海交通大学",
          degree: "本科",
          major: "软件工程",
          duration: "2017-2021",
          gpa: "3.8/4.0"
        }
      ],
      skills: [
        {
          category: "核心技术",
          details: "React, TypeScript, JavaScript ES6+, HTML5, CSS3"
        },
        {
          category: "开发工具",
          details: "Node.js, Webpack, Vite, Git, Docker"
        },
        {
          category: "其他技能",
          details: "团队协作, 项目管理, 技术文档撰写"
        }
      ],
      projectExperience: [
        {
          name: "企业级管理系统",
          duration: "2023-2024",
          role: "前端技术负责人",
          description: "基于React + TypeScript构建的大型企业管理系统，支持多租户架构",
          url: "https://github.com/lisi/enterprise-system"
        }
      ]
    };
    
    // 创建专属简历
    console.log('🎯 创建专属简历...');
    
    const [customizedResume] = await knex('customized_resumes').insert({
      user_id: testUser.id,
      base_resume_id: baseResume.id,
      target_job_id: targetJob.id,
      optimized_data: JSON.stringify(optimizedData),
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');
    
    console.log('✅ 专属简历创建成功:', {
      id: customizedResume.id,
      user_id: customizedResume.user_id,
      base_resume_id: customizedResume.base_resume_id,
      target_job_id: customizedResume.target_job_id,
      job_title: customizedResume.job_title,
      job_company: customizedResume.job_company
    });
    
    console.log('\n🎉 测试数据创建完成！');
    console.log(`可以使用以下URL测试: http://localhost:3016/resumes/customized/${customizedResume.id}`);
    
    return customizedResume;
    
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    console.error(error.stack);
  } finally {
    await knex.destroy();
  }
}

 createTestCustomizedResume();
