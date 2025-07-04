/**
 * 简单创建测试用户脚本
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }
});

async function createTestUser() {
  try {
    console.log('🛡️ 创建测试用户...');
    
    // 检查用户是否已存在
    const existingUser = await knex('users').where('email', 'test@test.com').first();
    
    if (existingUser) {
      console.log('✅ 用户已存在，尝试登录测试...');
      console.log('👤 用户信息:', {
        id: existingUser.id,
        email: existingUser.email,
        email_verified: existingUser.email_verified
      });
    } else {
      // 创建新用户
      const passwordHash = await bcrypt.hash('test123', 10);
      
      const [newUser] = await knex('users').insert({
        email: 'test@test.com',
        password_hash: passwordHash,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');
      
      console.log('✅ 测试用户创建成功:', {
        id: newUser.id,
        email: newUser.email
      });
    }
    
    // 测试登录
    console.log('\n🔐 测试登录...');
    const axios = require('axios');
    
    const loginResponse = await axios.post('http://localhost:8000/api/auth/login', {
      email: 'test@test.com',
      password: 'test123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 登录成功!');
      console.log('📝 Token:', loginResponse.data.data.token.substring(0, 20) + '...');
      
      // 保存token到文件供其他脚本使用
      const fs = require('fs');
      fs.writeFileSync('../test-token', loginResponse.data.data.token);
      console.log('💾 Token已保存到 test-token 文件');
      
      return loginResponse.data.data.token;
    } else {
      console.error('❌ 登录失败:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
    if (error.response) {
      console.error('📊 错误响应:', error.response.data);
    }
  } finally {
    await knex.destroy();
  }
}

createTestUser(); 