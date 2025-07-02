/**
 * bcrypt性能测试
 * 测试不同saltRounds对登录性能的影响
 */

const bcrypt = require('bcryptjs');

const testPassword = 'SxdJui13';

async function testBcryptPerformance() {
  console.log('🔐 bcrypt性能测试开始...\n');
  
  const saltRounds = [8, 9, 10, 11, 12, 13];
  
  for (const rounds of saltRounds) {
    console.log(`📊 测试 saltRounds = ${rounds}`);
    
    // 测试hash性能
    const hashStart = Date.now();
    const hash = await bcrypt.hash(testPassword, rounds);
    const hashTime = Date.now() - hashStart;
    
    // 测试compare性能（登录时使用）
    const compareStart = Date.now();
    const isValid = await bcrypt.compare(testPassword, hash);
    const compareTime = Date.now() - compareStart;
    
    console.log(`  ✅ Hash时间: ${hashTime}ms`);
    console.log(`  🔍 Compare时间: ${compareTime}ms (登录关键指标)`);
    console.log(`  ✅ 验证结果: ${isValid}`);
    
    // 性能评级
    let rating = '';
    if (compareTime < 50) rating = '🟢 极快';
    else if (compareTime < 100) rating = '🟡 快';
    else if (compareTime < 200) rating = '🟠 中等';
    else if (compareTime < 500) rating = '🔴 慢';
    else rating = '❌ 很慢';
    
    console.log(`  📈 性能评级: ${rating}\n`);
  }
  
  console.log('💡 建议:');
  console.log('  - Web应用推荐使用 saltRounds = 10 或 11');
  console.log('  - 高安全需求可使用 saltRounds = 12');
  console.log('  - 当前使用的 12 导致登录较慢');
  console.log('  - 建议改为 10 或 11 以提升用户体验');
}

testBcryptPerformance().catch(console.error); 