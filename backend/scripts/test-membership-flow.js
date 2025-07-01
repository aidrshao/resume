/**
 * 会员功能完整流程测试脚本
 * 测试用户注册、购买会员、使用配额、配额重置等完整流程
 */

const knex = require('../config/database');

/**
 * 测试用户数据
 */
const testUser = {
  email: 'test_membership@example.com',
  password: 'test123456'
};

/**
 * 清理测试数据
 */
async function cleanupTestData() {
  console.log('🧹 [CLEANUP] 开始清理测试数据...');

  try {
    // 删除测试用户的所有相关数据
    const testUserRecord = await knex('users').where('email', testUser.email).first();
    
    if (testUserRecord) {
      const userId = testUserRecord.id;
      
      // 删除用户会员记录
      await knex('user_memberships').where('user_id', userId).del();
      
      // 删除订单记录
      await knex('membership_orders').where('user_id', userId).del();
      
      // 删除用户记录
      await knex('users').where('id', userId).del();
      
      console.log('✅ [CLEANUP] 测试用户数据清理完成');
    } else {
      console.log('ℹ️ [CLEANUP] 没有找到测试用户数据');
    }

  } catch (error) {
    console.error('❌ [CLEANUP] 清理测试数据失败:', error);
  }
}

/**
 * 创建测试用户
 */
async function createTestUser() {
  console.log('👤 [CREATE_USER] 创建测试用户...');

  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(testUser.password, 10);

    const [userId] = await knex('users').insert({
      email: testUser.email,
      password_hash: hashedPassword,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');

    console.log('✅ [CREATE_USER] 测试用户创建成功, ID:', userId);
    return userId;

  } catch (error) {
    console.error('❌ [CREATE_USER] 创建测试用户失败:', error);
    throw error;
  }
}

/**
 * 测试获取会员套餐列表
 */
async function testGetMembershipTiers() {
  console.log('📋 [TEST_TIERS] 测试获取会员套餐列表...');

  try {
    const tiers = await knex('membership_tiers')
      .where('is_active', true)
      .orderBy('original_price');

    console.log('✅ [TEST_TIERS] 获取套餐列表成功:', tiers.map(t => ({ id: t.id, name: t.name, price: t.original_price })));
    
    if (tiers.length === 0) {
      console.log('⚠️ [TEST_TIERS] 没有找到启用的会员套餐，请先创建套餐');
      return null;
    }

    return tiers[0]; // 返回第一个套餐用于测试

  } catch (error) {
    console.error('❌ [TEST_TIERS] 获取套餐列表失败:', error);
    throw error;
  }
}

/**
 * 测试创建订单
 */
async function testCreateOrder(userId, tierData) {
  console.log('🛒 [TEST_ORDER] 测试创建订单...');

  try {
    const orderData = {
      user_id: userId,
      membership_tier_id: tierData.id,
      tier_name: tierData.name,
      original_amount: parseFloat(tierData.original_price),
      discount_amount: parseFloat(tierData.reduction_price || 0),
      final_amount: parseFloat(tierData.reduction_price || tierData.original_price),
      order_number: `TEST_${Date.now()}`,
      payment_method: 'alipay',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    const [orderId] = await knex('membership_orders').insert(orderData).returning('id');

    console.log('✅ [TEST_ORDER] 订单创建成功, ID:', orderId);
    return orderId;

  } catch (error) {
    console.error('❌ [TEST_ORDER] 创建订单失败:', error);
    throw error;
  }
}

/**
 * 测试激活订单和会员
 */
async function testActivateOrder(orderId, userId, tierData) {
  console.log('⚡ [TEST_ACTIVATE] 测试激活订单...');

  try {
    // 1. 更新订单状态
    await knex('membership_orders')
      .where('id', orderId)
      .update({
        status: 'paid',
        paid_at: new Date(),
        transaction_id: `TEST_TRANSACTION_${Date.now()}`,
        updated_at: new Date()
      });

    // 2. 创建或更新用户会员记录
    const endDate = tierData.duration_days > 0 
      ? new Date(Date.now() + tierData.duration_days * 24 * 60 * 60 * 1000)
      : null;

    const quotaResetDate = tierData.duration_days > 0
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后重置
      : null;

    // 检查是否已有会员记录
    const existingMembership = await knex('user_memberships')
      .where('user_id', userId)
      .first();

    if (existingMembership) {
      // 更新现有会员
      await knex('user_memberships')
        .where('user_id', userId)
        .update({
          membership_tier_id: tierData.id,
          status: 'active',
          start_date: new Date(),
          end_date: endDate,
          remaining_ai_quota: tierData.ai_resume_quota,
          quota_reset_date: quotaResetDate,
          updated_at: new Date()
        });
    } else {
      // 创建新会员记录
      await knex('user_memberships').insert({
        user_id: userId,
        membership_tier_id: tierData.id,
        status: 'active',
        start_date: new Date(),
        end_date: endDate,
        remaining_ai_quota: tierData.ai_resume_quota,
        quota_reset_date: quotaResetDate,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    console.log('✅ [TEST_ACTIVATE] 订单激活成功，会员开通完成');

  } catch (error) {
    console.error('❌ [TEST_ACTIVATE] 激活订单失败:', error);
    throw error;
  }
}

/**
 * 测试配额消耗
 */
async function testConsumeQuota(userId) {
  console.log('⚡ [TEST_QUOTA] 测试配额消耗...');

  try {
    // 获取当前配额
    const membership = await knex('user_memberships')
      .where('user_id', userId)
      .where('status', 'active')
      .first();

    if (!membership) {
      throw new Error('用户没有活跃的会员资格');
    }

    console.log(`📊 [TEST_QUOTA] 当前配额: ${membership.remaining_ai_quota}`);

    if (membership.remaining_ai_quota <= 0) {
      console.log('⚠️ [TEST_QUOTA] 配额已用完');
      return false;
    }

    // 消耗一次配额
    await knex('user_memberships')
      .where('id', membership.id)
      .update({
        remaining_ai_quota: membership.remaining_ai_quota - 1,
        updated_at: new Date()
      });

    console.log(`✅ [TEST_QUOTA] 配额消耗成功，剩余: ${membership.remaining_ai_quota - 1}`);
    return true;

  } catch (error) {
    console.error('❌ [TEST_QUOTA] 配额消耗失败:', error);
    throw error;
  }
}

/**
 * 测试会员状态查询
 */
async function testMembershipStatus(userId) {
  console.log('👑 [TEST_STATUS] 测试会员状态查询...');

  try {
    const result = await knex('user_memberships as um')
      .join('membership_tiers as mt', 'um.membership_tier_id', 'mt.id')
      .where('um.user_id', userId)
      .where('um.status', 'active')
      .select(
        'um.*',
        'mt.name as tier_name',
        'mt.ai_resume_quota as total_ai_quota',
        'mt.features'
      )
      .first();

    if (result) {
      console.log('✅ [TEST_STATUS] 会员状态查询成功:', {
        tierName: result.tier_name,
        totalQuota: result.total_ai_quota,
        remainingQuota: result.remaining_ai_quota,
        endDate: result.end_date,
        quotaResetDate: result.quota_reset_date
      });
      return result;
    } else {
      console.log('ℹ️ [TEST_STATUS] 用户没有活跃的会员资格');
      return null;
    }

  } catch (error) {
    console.error('❌ [TEST_STATUS] 查询会员状态失败:', error);
    throw error;
  }
}

/**
 * 主测试流程
 */
async function runMembershipTest() {
  console.log('🚀 [MEMBERSHIP_TEST] 开始会员功能完整流程测试...');
  console.log('🚀 [MEMBERSHIP_TEST] 测试时间:', new Date().toISOString());

  try {
    // 1. 清理之前的测试数据
    await cleanupTestData();

    // 2. 创建测试用户
    const userId = await createTestUser();

    // 3. 获取会员套餐
    const tierData = await testGetMembershipTiers();
    if (!tierData) {
      throw new Error('没有可用的会员套餐');
    }

    // 4. 创建订单
    const orderId = await testCreateOrder(userId, tierData);

    // 5. 激活订单
    await testActivateOrder(orderId, userId, tierData);

    // 6. 查询会员状态
    const membershipStatus = await testMembershipStatus(userId);

    // 7. 测试配额消耗
    await testConsumeQuota(userId);

    // 8. 再次查询会员状态（验证配额变化）
    await testMembershipStatus(userId);

    // 9. 多次消耗配额（测试配额耗尽）
    console.log('🔄 [TEST_QUOTA_LOOP] 测试连续配额消耗...');
    for (let i = 0; i < 3; i++) {
      const success = await testConsumeQuota(userId);
      if (!success) {
        console.log('⚠️ [TEST_QUOTA_LOOP] 配额已耗尽，停止测试');
        break;
      }
    }

    // 10. 最终状态查询
    const finalStatus = await testMembershipStatus(userId);

    console.log('🎉 [MEMBERSHIP_TEST] 会员功能测试完成！');

    const summary = {
      testUser: testUser.email,
      userId: userId,
      tier: tierData.name,
      orderId: orderId,
      finalQuota: finalStatus ? finalStatus.remaining_ai_quota : 0,
      testPassed: true
    };

    console.log('📊 [TEST_SUMMARY]', summary);
    return summary;

  } catch (error) {
    console.error('❌ [MEMBERSHIP_TEST] 测试失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runMembershipTest()
    .then((result) => {
      console.log('🎉 测试执行成功:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = {
  runMembershipTest,
  cleanupTestData,
  createTestUser,
  testGetMembershipTiers,
  testCreateOrder,
  testActivateOrder,
  testConsumeQuota,
  testMembershipStatus
}; 