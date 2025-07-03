/**
 * 模板前端集成测试脚本
 * 功能：验证模板API和前端集成是否正常工作
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000';

// 测试配置
const tests = [
  {
    name: '获取模板列表',
    url: `${API_BASE}/api/templates`,
    method: 'GET',
    validate: (data) => {
      return data.success && Array.isArray(data.data) && data.data.length > 0;
    }
  },
  {
    name: '获取单面经典模板详情',
    url: `${API_BASE}/api/templates/9`,
    method: 'GET',
    validate: (data) => {
      return data.success && 
             data.data.html_content && 
             data.data.css_content && 
             data.data.name === '单面经典模板';
    }
  },
  {
    name: '获取经典商务模板详情',
    url: `${API_BASE}/api/templates/1`,
    method: 'GET',
    validate: (data) => {
      return data.success && 
             data.data.html_content && 
             data.data.css_content && 
             data.data.name === '经典商务模板';
    }
  }
];

/**
 * 运行单个测试
 */
async function runTest(test) {
  try {
    console.log(`\n🧪 [测试] ${test.name}`);
    console.log(`📡 请求: ${test.method} ${test.url}`);
    
    const response = await fetch(test.url, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // 验证响应
    if (test.validate(data)) {
      console.log(`✅ [成功] ${test.name}`);
      
      // 显示关键信息
      if (test.name.includes('列表')) {
        console.log(`   📊 模板数量: ${data.data.length}`);
        data.data.forEach((template, index) => {
          console.log(`   ${index + 1}. ${template.name} (ID: ${template.id}, 状态: ${template.is_premium ? '付费' : '免费'})`);
        });
      } else if (test.name.includes('详情')) {
        console.log(`   📄 模板名称: ${data.data.name}`);
        console.log(`   🎨 HTML内容: ${data.data.html_content ? '✅ 存在' : '❌ 缺失'}`);
        console.log(`   💄 CSS内容: ${data.data.css_content ? '✅ 存在' : '❌ 缺失'}`);
        console.log(`   🖼️ 缩略图: ${data.data.thumbnail_url || '无'}`);
        console.log(`   📂 分类: ${data.data.category}`);
      }
      
      return true;
    } else {
      console.log(`❌ [失败] ${test.name}`);
      console.log(`   响应: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
    
  } catch (error) {
    console.log(`💥 [错误] ${test.name}: ${error.message}`);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始模板前端集成测试...\n');
  console.log('=' * 50);
  
  let passCount = 0;
  let totalCount = tests.length;
  
  for (const test of tests) {
    const passed = await runTest(test);
    if (passed) passCount++;
  }
  
  console.log('\n' + '=' * 50);
  console.log('📊 测试结果汇总:');
  console.log(`   ✅ 通过: ${passCount}/${totalCount}`);
  console.log(`   ❌ 失败: ${totalCount - passCount}/${totalCount}`);
  console.log(`   📈 成功率: ${Math.round(passCount / totalCount * 100)}%`);
  
  if (passCount === totalCount) {
    console.log('\n🎉 所有测试通过！模板系统工作正常');
    console.log('\n📋 下一步操作:');
    console.log('   1. 访问 http://localhost:3016/resumes/new');
    console.log('   2. 查看是否能看到管理员配置的模板');
    console.log('   3. 选择模板查看是否能正确渲染');
    console.log('   4. 修改个人信息查看实时预览效果');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查后端服务器和数据库状态');
  }
  
  process.exit(passCount === totalCount ? 0 : 1);
}

// 运行测试
runAllTests().catch(console.error); 