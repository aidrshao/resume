/**
 * 测试岗位创建功能
 */

require('dotenv').config();
const JobPosition = require('./models/JobPosition');
const db = require('./config/database');

async function testJobCreate() {
  try {
    console.log('🧪 全面测试岗位创建功能...\n');
    
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const dbResult = await db.raw('SELECT NOW() as current_time');
    console.log('✅ 数据库连接正常');
    
    // 2. 查看现有岗位数量
    console.log('\n2️⃣ 查看现有岗位...');
    const currentJobs = await db('job_positions').where('user_id', 1);
    console.log(`📊 用户1现有岗位数量: ${currentJobs.length}`);
    
    // 3. 创建新岗位
    console.log('\n3️⃣ 创建新岗位...');
    const jobData = {
      user_id: 1,
      title: '产品经理',
      company: '互联网公司',
      description: '负责产品规划和设计',
      requirements: '有产品设计经验，熟悉用户研究',
      salary_range: '25K-40K',
      location: '广州市天河区',
      job_type: 'full-time',
      source_type: 'text',
      priority: 3,
      notes: '测试创建的产品经理岗位'
    };
    
    const result = await JobPosition.createJob(jobData);
    
    if (result.success) {
      console.log('✅ 岗位创建成功');
      console.log('📋 新创建的岗位:', result.data);
      
      // 4. 验证创建结果
      console.log('\n4️⃣ 验证创建结果...');
      const updatedJobs = await db('job_positions').where('user_id', 1);
      console.log(`📊 创建后岗位数量: ${updatedJobs.length}`);
      
      // 5. 测试获取岗位列表
      console.log('\n5️⃣ 测试获取岗位列表...');
      const jobsList = await JobPosition.getJobsByUserId(1);
      console.log('📋 岗位列表结果:', jobsList.success ? '成功' : '失败');
      if (jobsList.success) {
        console.log(`📊 列表中岗位数量: ${jobsList.data.jobs.length}`);
      }
      
      // 6. 测试获取统计
      console.log('\n6️⃣ 测试获取统计...');
      const stats = await JobPosition.getJobStats(1);
      console.log('📊 统计结果:', stats);
      
    } else {
      console.log('❌ 岗位创建失败:', result.message);
    }
    
    console.log('\n🎉 测试完成');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testJobCreate(); 