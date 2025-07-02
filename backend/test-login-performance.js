/**
 * 登录性能测试
 * 测试优化后的登录API性能
 */

const axios = require('axios');

const testUser = {
  email: '346935824@qq.com',
  password: 'SxdJui13'
};

async function testLoginPerformance() {
  console.log('🚀 登录性能测试开始...\n');
  
  const baseURL = 'http://localhost:8000/api';
  const testCount = 5;
  const results = [];
  
  for (let i = 1; i <= testCount; i++) {
    console.log(`📊 第 ${i} 次测试`);
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${baseURL}/auth/login`, testUser, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push(duration);
      
      const status = response.status === 200 ? '✅ 成功' : '❌ 失败';
      const responseSize = JSON.stringify(response.data).length;
      
      console.log(`  ${status} 状态码: ${response.status}`);
      console.log(`  ⏱️  响应时间: ${duration}ms`);
      console.log(`  📦 响应大小: ${responseSize} bytes`);
      
      // 性能评级
      let rating = '';
      if (duration < 50) rating = '🟢 极快';
      else if (duration < 100) rating = '🟡 快';
      else if (duration < 200) rating = '🟠 中等';
      else if (duration < 500) rating = '🔴 慢';
      else rating = '❌ 很慢';
      
      console.log(`  📈 性能评级: ${rating}\n`);
      
    } catch (error) {
      console.error(`  ❌ 请求失败: ${error.message}\n`);
      results.push(null);
    }
    
    // 避免请求过于频繁
    if (i < testCount) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // 计算统计数据
  const validResults = results.filter(r => r !== null);
  if (validResults.length > 0) {
    const avgTime = validResults.reduce((a, b) => a + b, 0) / validResults.length;
    const minTime = Math.min(...validResults);
    const maxTime = Math.max(...validResults);
    
    console.log('📊 性能统计:');
    console.log(`  🎯 平均响应时间: ${Math.round(avgTime)}ms`);
    console.log(`  ⚡ 最快响应时间: ${minTime}ms`);
    console.log(`  🐌 最慢响应时间: ${maxTime}ms`);
    console.log(`  ✅ 成功率: ${validResults.length}/${testCount} (${Math.round(validResults.length/testCount*100)}%)`);
    
    // 总体评级
    let overallRating = '';
    if (avgTime < 80) overallRating = '🟢 优秀';
    else if (avgTime < 150) overallRating = '🟡 良好';
    else if (avgTime < 300) overallRating = '🟠 需优化';
    else overallRating = '🔴 较差';
    
    console.log(`  🏆 总体评级: ${overallRating}`);
    
    console.log('\n💡 优化效果:');
    console.log('  - saltRounds从12优化到10');
    console.log('  - 理论提升: 302ms → 65ms (约5倍)');
    console.log(`  - 实际测试: 平均${Math.round(avgTime)}ms`);
  } else {
    console.log('❌ 所有测试都失败了');
  }
}

// 等待服务器启动后开始测试
setTimeout(() => {
  testLoginPerformance().catch(console.error);
}, 3000); 