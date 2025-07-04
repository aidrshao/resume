/**
 * 初始化管理员账号脚本
 * 用于在生产环境中创建默认管理员账号
 */

const bcrypt = require('bcrypt');
const { db: knex } = require('../config/database');

async function initAdmin() {
  console.log('🚀 [INIT_ADMIN] 开始初始化管理员账号...');
  
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123456';
    
    // 检查管理员账号是否已存在
    console.log('🔍 [INIT_ADMIN] 检查管理员账号是否存在...');
    const existingAdmin = await knex('users')
      .where('email', adminEmail)
      .first();
    
    if (existingAdmin) {
      console.log('✅ [INIT_ADMIN] 管理员账号已存在');
      console.log('📧 [INIT_ADMIN] 邮箱:', existingAdmin.email);
      console.log('🆔 [INIT_ADMIN] 用户ID:', existingAdmin.id);
      console.log('📅 [INIT_ADMIN] 创建时间:', existingAdmin.created_at);
      
      // 验证密码是否正确
      const isValidPassword = await bcrypt.compare(adminPassword, existingAdmin.password_hash);
      if (isValidPassword) {
        console.log('✅ [INIT_ADMIN] 管理员密码验证成功');
      } else {
        console.log('⚠️ [INIT_ADMIN] 管理员密码可能已被修改');
        console.log('💡 [INIT_ADMIN] 如需重置密码，请删除现有账号后重新运行此脚本');
      }
      
      return {
        success: true,
        message: '管理员账号已存在',
        admin: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          created_at: existingAdmin.created_at
        }
      };
    }
    
    // 创建管理员账号
    console.log('📝 [INIT_ADMIN] 创建新的管理员账号...');
    
    // 加密密码
    console.log('🔐 [INIT_ADMIN] 加密管理员密码...');
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    // 插入管理员用户
    const [adminId] = await knex('users')
      .insert({
        email: adminEmail,
        password_hash: passwordHash,
        email_verified: true,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('id');
    
    console.log('✅ [INIT_ADMIN] 管理员账号创建成功！');
    console.log('📧 [INIT_ADMIN] 邮箱:', adminEmail);
    console.log('🔑 [INIT_ADMIN] 密码:', adminPassword);
    console.log('🆔 [INIT_ADMIN] 用户ID:', adminId);
    
    return {
      success: true,
      message: '管理员账号创建成功',
      admin: {
        id: adminId,
        email: adminEmail,
        password: adminPassword
      }
    };
    
  } catch (error) {
    console.error('❌ [INIT_ADMIN] 初始化管理员账号失败:', error);
    throw error;
  }
}

// 查看所有用户（调试用）
async function listAllUsers() {
  console.log('👥 [LIST_USERS] 查看所有用户...');
  
  try {
    const users = await knex('users')
      .select('id', 'email', 'email_verified', 'created_at')
      .orderBy('created_at', 'desc');
    
    console.log(`📊 [LIST_USERS] 总用户数: ${users.length}`);
    
    if (users.length > 0) {
      console.log('👤 [LIST_USERS] 用户列表:');
      users.forEach((user, index) => {
        const isAdmin = user.email === 'admin@example.com';
        console.log(`  ${index + 1}. ID: ${user.id}, 邮箱: ${user.email}, 验证: ${user.email_verified ? '✅' : '❌'}, ${isAdmin ? '👑 管理员' : '👤 普通用户'}`);
      });
    } else {
      console.log('⚠️ [LIST_USERS] 数据库中没有用户');
    }
    
    return users;
  } catch (error) {
    console.error('❌ [LIST_USERS] 查询用户失败:', error);
    throw error;
  }
}

// 测试管理员登录
async function testAdminLogin() {
  console.log('🧪 [TEST_LOGIN] 测试管理员登录...');
  
  try {
    const { adminLogin } = require('../middleware/adminAuth');
    
    const result = await adminLogin('admin@example.com', 'admin123456');
    console.log('✅ [TEST_LOGIN] 管理员登录测试成功');
    console.log('🔑 [TEST_LOGIN] Token长度:', result.token.length);
    console.log('👤 [TEST_LOGIN] 管理员信息:', result.admin);
    
    return result;
  } catch (error) {
    console.error('❌ [TEST_LOGIN] 管理员登录测试失败:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🎯 [MAIN] 开始管理员账号初始化流程...');
  
  try {
    // 1. 列出现有用户
    await listAllUsers();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. 初始化管理员账号
    const initResult = await initAdmin();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. 测试管理员登录
    await testAdminLogin();
    
    console.log('\n✅ [MAIN] 管理员账号初始化完成！');
    console.log('📝 [MAIN] 登录信息:');
    console.log('   邮箱: admin@example.com');
    console.log('   密码: admin123456');
    console.log('🌐 [MAIN] 现在可以使用这些凭据登录管理后台');
    
  } catch (error) {
    console.error('❌ [MAIN] 初始化流程失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await knex.destroy();
    console.log('🔌 [MAIN] 数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  initAdmin,
  listAllUsers,
  testAdminLogin
}; 