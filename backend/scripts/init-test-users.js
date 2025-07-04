/**
 * 初始化测试用户脚本
 * 用于在生产环境中创建测试用户，解决用户ID不匹配问题
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { db: knex } = require('../config/database');

/**
 * 测试用户配置
 */
const testUsers = [
  {
    id: 2, // 明确指定ID，与前端token匹配
    email: '346935824@qq.com',
    password: 'test123456',
    name: '测试用户',
    email_verified: true
  },
  {
    email: 'test@juncaishe.com',
    password: 'test123456',
    name: '俊才社测试用户',
    email_verified: true
  },
  {
    email: 'test_local@juncaishe.com',
    password: 'test123456',
    name: '本地测试用户',
    email_verified: true
  }
];

/**
 * 检查并创建测试用户
 */
async function initTestUsers() {
  console.log('🚀 [INIT_TEST_USERS] 开始初始化测试用户...');

  try {
    for (const userData of testUsers) {
      console.log(`\n👤 [INIT_TEST_USERS] 处理用户: ${userData.email}`);
      
      // 检查用户是否已存在
      const existingUser = await knex('users')
        .where('email', userData.email)
        .first();

      if (existingUser) {
        console.log(`✅ [INIT_TEST_USERS] 用户已存在: ${userData.email} (ID: ${existingUser.id})`);
        
        // 如果指定了ID且不匹配，则警告
        if (userData.id && existingUser.id !== userData.id) {
          console.log(`⚠️ [INIT_TEST_USERS] 警告: 用户ID不匹配，期望: ${userData.id}, 实际: ${existingUser.id}`);
        }
        continue;
      }

      // 创建新用户
      console.log(`📝 [INIT_TEST_USERS] 创建新用户: ${userData.email}`);
      
      // 加密密码
      const passwordHash = await bcrypt.hash(userData.password, 12);
      
      const insertData = {
        email: userData.email,
        password_hash: passwordHash,
        email_verified: userData.email_verified,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      };

      // 如果指定了ID，则使用指定的ID
      if (userData.id) {
        // 检查ID是否已被占用
        const existingById = await knex('users').where('id', userData.id).first();
        if (existingById) {
          console.log(`⚠️ [INIT_TEST_USERS] ID ${userData.id} 已被占用，使用自动分配ID`);
        } else {
          insertData.id = userData.id;
          console.log(`🆔 [INIT_TEST_USERS] 使用指定ID: ${userData.id}`);
        }
      }

      const [userId] = await knex('users')
        .insert(insertData)
        .returning('id');

      console.log(`✅ [INIT_TEST_USERS] 用户创建成功: ${userData.email} (ID: ${userId})`);
      console.log(`🔑 [INIT_TEST_USERS] 密码: ${userData.password}`);

      // 为用户创建免费版会员资格
      await ensureUserMembership(userId);
    }

    console.log('\n🎉 [INIT_TEST_USERS] 所有测试用户初始化完成！');
    return true;

  } catch (error) {
    console.error('❌ [INIT_TEST_USERS] 初始化测试用户失败:', error);
    throw error;
  }
}

/**
 * 确保用户有免费版会员资格
 */
async function ensureUserMembership(userId) {
  console.log(`👑 [MEMBERSHIP] 为用户 ${userId} 设置免费版会员...`);

  try {
    // 查找免费版套餐
    const freeTier = await knex('membership_tiers')
      .where('name', '免费版')
      .where('is_active', true)
      .first();

    if (!freeTier) {
      console.log('⚠️ [MEMBERSHIP] 免费版套餐不存在，跳过会员设置');
      return;
    }

    // 检查用户是否已有会员记录
    const existingMembership = await knex('user_memberships')
      .where('user_id', userId)
      .first();

    if (existingMembership) {
      console.log(`✅ [MEMBERSHIP] 用户 ${userId} 已有会员记录`);
      return;
    }

    // 创建免费版会员记录
    await knex('user_memberships').insert({
      user_id: userId,
      membership_tier_id: freeTier.id,
      status: 'active',
      start_date: knex.fn.now(),
      end_date: null, // 免费版永久有效
      remaining_ai_quota: freeTier.ai_resume_quota,
      quota_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后重置
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

    console.log(`✅ [MEMBERSHIP] 用户 ${userId} 免费版会员设置完成`);

  } catch (error) {
    console.error(`❌ [MEMBERSHIP] 为用户 ${userId} 设置会员失败:`, error);
    // 不抛出错误，因为这不是致命问题
  }
}

/**
 * 列出所有用户（调试用）
 */
async function listAllUsers() {
  console.log('👥 [LIST_USERS] 查看所有用户...');
  
  try {
    const users = await knex('users')
      .select('id', 'email', 'email_verified', 'created_at')
      .orderBy('id', 'asc');
    
    console.log(`📊 [LIST_USERS] 总用户数: ${users.length}`);
    
    if (users.length > 0) {
      console.log('👤 [LIST_USERS] 用户列表:');
      users.forEach((user, index) => {
        const isAdmin = user.email === 'admin@example.com';
        const isTest = testUsers.some(t => t.email === user.email);
        const userType = isAdmin ? '👑 管理员' : isTest ? '🧪 测试用户' : '👤 普通用户';
        console.log(`  ${index + 1}. ID: ${user.id}, 邮箱: ${user.email}, 验证: ${user.email_verified ? '✅' : '❌'}, ${userType}`);
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

/**
 * 测试用户登录
 */
async function testUserLogin() {
  console.log('🧪 [TEST_LOGIN] 测试用户登录...');

  for (const userData of testUsers) {
    try {
      console.log(`\n🔐 [TEST_LOGIN] 测试登录: ${userData.email}`);
      
      // 查找用户
      const user = await knex('users')
        .where('email', userData.email)
        .first();

      if (!user) {
        console.log(`❌ [TEST_LOGIN] 用户不存在: ${userData.email}`);
        continue;
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(userData.password, user.password_hash);
      
      if (isValidPassword) {
        console.log(`✅ [TEST_LOGIN] 登录成功: ${userData.email} (ID: ${user.id})`);
        
        // 生成测试token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );
        
        console.log(`🔑 [TEST_LOGIN] Token前缀: ${token.substring(0, 20)}...`);
      } else {
        console.log(`❌ [TEST_LOGIN] 密码错误: ${userData.email}`);
      }

    } catch (error) {
      console.error(`❌ [TEST_LOGIN] 测试登录失败: ${userData.email}`, error.message);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🎯 [MAIN] 开始测试用户初始化流程...');
  
  try {
    // 1. 列出现有用户
    await listAllUsers();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. 初始化测试用户
    await initTestUsers();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. 再次列出用户（验证结果）
    await listAllUsers();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. 测试用户登录
    await testUserLogin();
    
    console.log('\n✅ [MAIN] 测试用户初始化完成！');
    console.log('📝 [MAIN] 测试账号信息:');
    testUsers.forEach(user => {
      console.log(`   邮箱: ${user.email}`);
      console.log(`   密码: ${user.password}`);
      if (user.id) {
        console.log(`   指定ID: ${user.id}`);
      }
      console.log('');
    });
    
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
  initTestUsers,
  listAllUsers,
  testUserLogin,
  ensureUserMembership
}; 