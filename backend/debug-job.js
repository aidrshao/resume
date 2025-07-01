/**
 * 调试岗位创建功能
 */

require('dotenv').config();
const JobPosition = require('./models/JobPosition');

async function debugJob() {
  try {
    console.log('🔍 调试岗位创建功能...');
    
    const jobData = {
      user_id: 1,
      title: '前端工程师',
      company: '测试公司',
      description: '负责前端开发工作',
      requirements: '熟悉React',
      salary_range: '15K-25K',
      location: '北京',
      job_type: 'full-time',
      source_type: 'text',
      priority: 4,
      notes: '测试岗位'
    };
    
    console.log('📋 岗位数据:', jobData);
    
    const result = await JobPosition.createJob(jobData);
    console.log('创建结果:', result);
    
    if (result.success) {
      console.log('✅ 岗位创建成功');
      
      // 测试统计
      const stats = await JobPosition.getJobStats(1);
      console.log('📊 统计数据:', stats);
    } else {
      console.log('❌ 岗位创建失败');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 调试失败:', error);
    process.exit(1);
  }
}

debugJob(); 