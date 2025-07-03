/**
 * 快速创建测试用户脚本
 * 用于生产环境快速修复测试用户问题
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const knex = require('../config/database');

async function quickCreateTestUsers() {
  console.log('🚀 开始快速创建测试用户...');
  
  try {
    // 测试用户1: 346935824@qq.com (ID=2)
    const user1Email = '346935824@qq.com';
    const user1 = await knex('users').where('email', user1Email).first();
    
    if (!user1) {
      console.log(`📝 创建用户: ${user1Email}`);
      const passwordHash1 = await bcrypt.hash('test123456', 10);
      
      // 先尝试使用ID=2
      try {
        await knex('users').insert({
          id: 2,
          email: user1Email,
          password_hash: passwordHash1,
          email_verified: true,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
        console.log(`✅ 用户创建成功: ${user1Email} (ID=2)`);
      } catch (error) {
        // 如果ID=2已被占用，则使用自动ID
        console.log(`⚠️ ID=2已被占用，使用自动ID`);
        const [result] = await knex('users').insert({
          email: user1Email,
          password_hash: passwordHash1,
          email_verified: true,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }).returning('id');
        console.log(`✅ 用户创建成功: ${user1Email} (ID=${result.id || result})`);
      }
    } else {
      console.log(`✅ 用户已存在: ${user1Email} (ID=${user1.id})`);
    }
    
    // 测试用户2: test@juncaishe.com
    const user2Email = 'test@juncaishe.com';
    const user2 = await knex('users').where('email', user2Email).first();
    
    if (!user2) {
      console.log(`📝 创建用户: ${user2Email}`);
      const passwordHash2 = await bcrypt.hash('test123456', 10);
      const [result] = await knex('users').insert({
        email: user2Email,
        password_hash: passwordHash2,
        email_verified: true,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }).returning('id');
      console.log(`✅ 用户创建成功: ${user2Email} (ID=${result.id || result})`);
    } else {
      console.log(`✅ 用户已存在: ${user2Email} (ID=${user2.id})`);
    }
    
    // 测试用户3: test_local@juncaishe.com
    const user3Email = 'test_local@juncaishe.com';
    const user3 = await knex('users').where('email', user3Email).first();
    
    if (!user3) {
      console.log(`📝 创建用户: ${user3Email}`);
      const passwordHash3 = await bcrypt.hash('test123456', 10);
      const [result] = await knex('users').insert({
        email: user3Email,
        password_hash: passwordHash3,
        email_verified: true,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }).returning('id');
      console.log(`✅ 用户创建成功: ${user3Email} (ID=${result.id || result})`);
    } else {
      console.log(`✅ 用户已存在: ${user3Email} (ID=${user3.id})`);
    }
    
    // 列出所有用户
    console.log('\n📊 当前所有用户:');
    const allUsers = await knex('users').select('id', 'email', 'email_verified', 'created_at').orderBy('id');
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ID=${user.id}, Email=${user.email}, Verified=${user.email_verified ? '✅' : '❌'}`);
    });
    
    console.log('\n✅ 测试用户创建完成！');
    console.log('\n📝 测试账号信息:');
    console.log('  邮箱: 346935824@qq.com');
    console.log('  邮箱: test@juncaishe.com');
    console.log('  邮箱: test_local@juncaishe.com');
    console.log('  密码: test123456 (所有账号相同)');
    
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
    process.exit(1);
  } finally {
    await knex.destroy();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 执行脚本
quickCreateTestUsers(); 