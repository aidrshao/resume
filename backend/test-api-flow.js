/**
 * 测试API流程脚本
 */

const { validateJobData } = require('./utils/validation');
const JobPosition = require('./models/JobPosition');

async function testApiFlow() {
  try {
    console.log('🧪 模拟API调用流程...');
    
    // 模拟从req.body获取的数据（没有user_id和source_type）
    const reqBody = {
      title: '后端工程师',
      company: '科技有限公司',
      description: '负责后端API开发',
      requirements: '熟悉Node.js、Express框架',
      salary_range: '18K-30K',
      location: '上海市浦东新区',
      job_type: 'full-time',
      priority: 5,
      notes: '通过API创建的测试岗位'
    };
    
    // 模拟req.user
    const reqUser = { id: 1 };
    
    console.log('📋 客户端发送的数据:', JSON.stringify(reqBody, null, 2));
    
    // 模拟控制器的处理逻辑
    const jobData = {
      ...reqBody,
      user_id: reqUser.id,
      source_type: 'text'
    };
    
    console.log('\n🔧 控制器处理后的数据:', JSON.stringify(jobData, null, 2));
    
    // 验证数据
    const validation = validateJobData(jobData);
    console.log('\n🔍 验证结果:', validation.isValid);
    
    if (!validation.isValid) {
      console.log('❌ 验证错误:');
      validation.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      return;
    }
    
    // 调用模型创建岗位
    console.log('\n💾 调用JobPosition.createJob...');
    const result = await JobPosition.createJob(jobData);
    
    console.log('📊 创建结果:', result);
    
    if (result.success) {
      console.log('✅ 完整流程成功');
    } else {
      console.log('❌ 创建岗位失败');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testApiFlow(); 