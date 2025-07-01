/**
 * 测试数据验证脚本
 */

const { validateJobData } = require('./utils/validation');

function testValidation() {
  const testData = {
    user_id: 1,
    title: '后端工程师',
    company: '科技有限公司',
    description: '负责后端API开发',
    requirements: '熟悉Node.js、Express框架',
    salary_range: '18K-30K',
    location: '上海市浦东新区',
    job_type: 'full-time',
    priority: 5,
    notes: '通过API创建的测试岗位',
    source_type: 'text'
  };
  
  console.log('🧪 测试数据验证...');
  console.log('📋 输入数据:', JSON.stringify(testData, null, 2));
  
  const validation = validateJobData(testData);
  
  console.log('\n🔍 验证结果:');
  console.log('isValid:', validation.isValid);
  
  if (!validation.isValid) {
    console.log('❌ 验证错误:');
    validation.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  } else {
    console.log('✅ 验证通过');
    console.log('✅ 验证后的数据:', JSON.stringify(validation.data, null, 2));
  }
}

testValidation(); 