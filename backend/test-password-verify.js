/**
 * 测试用户密码验证
 */

const bcrypt = require('bcryptjs');
const knex = require('./config/database');

async function testPasswordVerify() {
  try {
    console.log('🔍 测试用户密码验证...\n');
    
    const users = await knex('users')
      .select('id', 'email', 'password_hash')
      .whereIn('email', ['346935824@qq.com', 'test_optimized@juncaishe.com'])
      .orderBy('id');
    
    const testPassword = '123456';
    
    for (const user of users) {
      console.log(`👤 测试用户: ${user.email} (ID: ${user.id})`);
      console.log(`  🔑 Hash: ${user.password_hash}`);
      
      const startTime = Date.now();
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      const endTime = Date.now();
      
      console.log(`  ✅ 密码验证结果: ${isValid ? '✅ 正确' : '❌ 错误'}`);
      console.log(`  ⏱️ 验证耗时: ${endTime - startTime}ms`);
      
      // 如果密码错误，尝试其他常见密码
      if (!isValid) {
        const commonPasswords = ['password', 'admin', '123', '1234567890', 'test123'];
        console.log(`  🔍 尝试其他常见密码...`);
        
        for (const pwd of commonPasswords) {
          const isCommonValid = await bcrypt.compare(pwd, user.password_hash);
          if (isCommonValid) {
            console.log(`  ✅ 找到正确密码: ${pwd}`);
            break;
          }
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await knex.destroy();
  }
}

testPasswordVerify();
