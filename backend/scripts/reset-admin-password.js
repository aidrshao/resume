const bcrypt = require('bcrypt');
const { db: knex } = require('../config/database');

async function resetAdminPassword() {
  try {
    const adminEmail = 'admin@example.com';
    const newPassword = 'admin123456';
    
    console.log('🔄 开始重置管理员密码...');
    
    // 生成新密码的哈希值
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // 更新数据库中的密码
    const result = await knex('users')
      .where('email', adminEmail)
      .update({
        password_hash: passwordHash,
        updated_at: knex.fn.now()
      });
    
    if (result === 0) {
      console.log('❌ 未找到管理员账号');
      return;
    }
    
    console.log('✅ 管理员密码重置成功！');
    console.log('📧 管理员邮箱:', adminEmail);
    console.log('🔑 新密码:', newPassword);
    
  } catch (error) {
    console.error('❌ 重置密码失败:', error);
  } finally {
    await knex.destroy();
  }
}

// 执行重置
resetAdminPassword(); 