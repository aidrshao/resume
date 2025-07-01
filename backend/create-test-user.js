/**
 * 创建测试用户脚本
 * 直接在数据库中创建测试用户并生成JWT token
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('./models/User');

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'test123456';
    
    // 检查用户是否已存在
    let user = await User.findByEmail(email);
    
    if (user) {
      console.log('✅ 测试用户已存在:', user.email);
    } else {
      // 创建新用户，使用简单的password hash
      const hashedPassword = 'test_hash_' + password;
      
      user = await User.create({
        email: email,
        password_hash: hashedPassword,
        name: '测试用户',
        email_verified: true
      });
      
      console.log('✅ 测试用户创建成功:', user.email);
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-please-change-this-in-production',
      { expiresIn: '24h' }
    );
    
    console.log('\n🔑 JWT Token:');
    console.log(token);
    
    console.log('\n📋 测试用户信息:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name || '测试用户');
    
    console.log('\n🧪 使用此token测试API:');
    console.log('curl -H "Authorization: Bearer ' + token + '" http://localhost:8000/api/jobs/stats');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
    process.exit(1);
  }
}

createTestUser(); 