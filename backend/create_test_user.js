const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // 检查是否已存在用户
    let user = await User.findByEmail('346935824@qq.com');
    if (user) {
      console.log('✅ 用户已存在:', {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        hasPassword: !!user.password_hash
      });
      process.exit(0);
      return;
    }
    
    // 创建测试用户
    console.log('🔄 创建测试用户...');
    const passwordHash = await bcrypt.hash('test123456', 10);
    user = await User.create({
      email: '346935824@qq.com',
      password_hash: passwordHash,
      email_verified: true
    });
    
    console.log('✅ 测试用户创建成功:', {
      id: user.id,
      email: user.email,
      email_verified: user.email_verified
    });
  } catch (error) {
    console.error('❌ 创建用户失败:', error.message);
    console.error('❌ 错误详情:', error);
  }
  process.exit(0);
}

createTestUser(); 