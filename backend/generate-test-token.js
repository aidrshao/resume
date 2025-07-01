/**
 * 生成测试JWT token脚本
 * 不依赖数据库，直接生成token用于API测试
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

function generateTestToken() {
  try {
    // 创建模拟用户数据
    const testUser = {
      userId: 1,
      email: 'test@example.com',
      name: '测试用户'
    };
    
    // 生成JWT token
    const token = jwt.sign(
      testUser,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-please-change-this-in-production',
      { expiresIn: '24h' }
    );
    
    console.log('🔑 测试JWT Token:');
    console.log(token);
    
    console.log('\n📋 测试用户信息:');
    console.log('User ID:', testUser.userId);
    console.log('Email:', testUser.email);
    console.log('Name:', testUser.name);
    
    console.log('\n🧪 使用此token测试API:');
    console.log('curl -H "Authorization: Bearer ' + token + '" http://localhost:8000/api/jobs/stats');
    
    console.log('\n🧪 测试岗位创建:');
    console.log(`curl -X POST http://localhost:8000/api/jobs \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "前端工程师",
    "company": "测试公司",
    "description": "负责前端开发",
    "requirements": "熟悉React",
    "salary_range": "15K-25K",
    "location": "北京",
    "job_type": "full-time",
    "priority": 4
  }'`);
    
  } catch (error) {
    console.error('❌ 生成token失败:', error);
  }
}

generateTestToken(); 