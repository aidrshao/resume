/**
 * 测试hash格式和验证性能
 */

const bcrypt = require('bcryptjs');

const testPassword = 'SxdJui13';

async function testHashFormat() {
  console.log('🔐 测试不同saltRounds的hash格式...\n');
  
  // 生成saltRounds=10的hash
  const hash10 = await bcrypt.hash(testPassword, 10);
  console.log('saltRounds=10 hash:', hash10);
  console.log('hash长度:', hash10.length);
  console.log('hash前缀:', hash10.substring(0, 7));
  
  // 生成saltRounds=12的hash  
  const hash12 = await bcrypt.hash(testPassword, 12);
  console.log('\nsaltRounds=12 hash:', hash12);
  console.log('hash长度:', hash12.length);
  console.log('hash前缀:', hash12.substring(0, 7));
  
  // 测试验证性能
  console.log('\n🔍 验证性能测试:');
  
  const start10 = Date.now();
  const valid10 = await bcrypt.compare(testPassword, hash10);
  const time10 = Date.now() - start10;
  console.log(`saltRounds=10 验证时间: ${time10}ms 结果: ${valid10}`);
  
  const start12 = Date.now();
  const valid12 = await bcrypt.compare(testPassword, hash12);
  const time12 = Date.now() - start12;
  console.log(`saltRounds=12 验证时间: ${time12}ms 结果: ${valid12}`);
  
  console.log('\n💡 分析:');
  console.log('- bcrypt会从hash中自动检测saltRounds');
  console.log('- 即使代码改为saltRounds=10，验证旧用户(saltRounds=12)仍然慢');
  console.log('- 需要让现有用户重新设置密码，或者迁移密码hash');
}

testHashFormat().catch(console.error); 