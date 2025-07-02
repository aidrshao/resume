/**
 * 创建使用优化后saltRounds=10的测试用户
 */

const bcrypt = require('bcryptjs');
const knex = require('./config/database');

async function createOptimizedTestUser() {
  try {
    console.log('🚀 创建优化后的测试用户...\n');
    
    const testUser = {
      email: 'test_optimized@juncaishe.com',
      password: 'SxdJui13'
    };
    
    // 检查用户是否已存在
    const existingUser = await knex('users').where('email', testUser.email).first();
    if (existingUser) {
      console.log('⚠️  用户已存在，删除后重新创建...');
      await knex('users').where('email', testUser.email).del();
    }
    
    // 使用优化后的saltRounds=10生成密码hash
    console.log('🔐 使用saltRounds=10生成密码hash...');
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    console.log('Hash前缀:', passwordHash.substring(0, 7));
    
    // 创建用户
    const [newUser] = await knex('users').insert({
      email: testUser.email,
      password_hash: passwordHash,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');
    
    console.log('✅ 测试用户创建成功:');
    console.log('  📧 邮箱:', newUser.email);
    console.log('  🆔 ID:', newUser.id);
    console.log('  🔐 密码:', testUser.password);
    console.log('  🔑 Hash前缀:', passwordHash.substring(0, 7));
    
    // 测试登录性能
    console.log('\n🔍 测试登录性能...');
    const startTime = Date.now();
    const isValid = await bcrypt.compare(testUser.password, passwordHash);
    const verifyTime = Date.now() - startTime;
    
    console.log('  ⏱️  验证时间:', verifyTime + 'ms');
    console.log('  ✅ 验证结果:', isValid);
    
    let rating = '';
    if (verifyTime < 80) rating = '🟢 优秀';
    else if (verifyTime < 150) rating = '🟡 良好';
    else rating = '🔴 需优化';
    
    console.log('  📈 性能评级:', rating);
    
    console.log('\n💡 测试命令:');
    console.log(`curl -w "时间: %{time_total}s\\n" -H "Content-Type: application/json" -d '{"email":"${testUser.email}","password":"${testUser.password}"}' http://localhost:8000/api/auth/login`);
    
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
  } finally {
    await knex.destroy();
  }
}

createOptimizedTestUser(); 