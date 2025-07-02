/**
 * 检查用户密码hash格式
 */

const knex = require('./config/database');

async function checkUserHash() {
  try {
    console.log('🔍 检查用户密码hash格式...\n');
    
    const users = await knex('users')
      .select('id', 'email', 'password_hash')
      .whereIn('email', ['346935824@qq.com', 'test_optimized@juncaishe.com'])
      .orderBy('id');
    
    for (const user of users) {
      console.log(`👤 用户: ${user.email} (ID: ${user.id})`);
      console.log(`  🔑 Hash前缀: ${user.password_hash.substring(0, 7)}`);
      
      // 检测saltRounds
      if (user.password_hash.startsWith('$2a$10$') || user.password_hash.startsWith('$2b$10$')) {
        console.log(`  📈 saltRounds: 10 🟢 优化后`);
      } else if (user.password_hash.startsWith('$2a$12$') || user.password_hash.startsWith('$2b$12$')) {
        console.log(`  📈 saltRounds: 12 🔴 需迁移`);
      } else {
        console.log(`  📈 saltRounds: 未知格式`);
      }
      
      console.log(`  🔗 完整Hash: ${user.password_hash}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await knex.destroy();
  }
}

checkUserHash();
