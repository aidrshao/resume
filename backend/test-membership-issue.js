/**
 * 测试会员系统问题诊断脚本
 */

require('dotenv').config();
const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
const bcrypt = require('bcrypt');

async function testMembershipIssue() {
  try {
    console.log('🔍 [诊断] 开始诊断会员系统问题...');
    
    // 1. 创建测试用户
    const email = 'test_local@juncaishe.com';
    const password = 'test123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('\n📝 [步骤1] 创建/检查测试用户...');
    
    // 检查用户是否已存在
    let user = await knex('users').where('email', email).first();
    
    if (!user) {
      const [newUser] = await knex('users').insert({
        email: email,
        password_hash: hashedPassword,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');
      user = newUser;
      console.log('✅ 创建用户成功:', user.id);
    } else {
      console.log('✅ 用户已存在:', user.id);
    }
    
    // 2. 检查会员套餐
    console.log('\n📋 [步骤2] 检查会员套餐...');
    const tiers = await knex('membership_tiers').select('*');
    console.log('可用套餐:', tiers.map(t => `${t.id}-${t.name}(${t.ai_resume_quota}配额)`));
    
    const freeTier = await knex('membership_tiers').where('name', '免费版').first();
    if (!freeTier) {
      throw new Error('免费版套餐不存在');
    }
    console.log('✅ 免费版套餐存在:', freeTier.id);
    
    // 3. 检查用户会员记录
    console.log('\n👑 [步骤3] 检查用户会员记录...');
    let membership = await knex('user_memberships').where('user_id', user.id).first();
    
    if (!membership) {
      console.log('⚠️ 用户没有会员记录，创建免费会员...');
      
      const quotaResetDate = new Date();
      quotaResetDate.setMonth(quotaResetDate.getMonth() + 1);
      quotaResetDate.setDate(1);
      quotaResetDate.setHours(0, 0, 0, 0);
      
      const [newMembership] = await knex('user_memberships').insert({
        user_id: user.id,
        membership_tier_id: freeTier.id,
        status: 'active',
        start_date: new Date(),
        end_date: null,
        remaining_ai_quota: freeTier.ai_resume_quota,
        quota_reset_date: quotaResetDate,
        payment_status: 'paid',
        paid_amount: 0,
        payment_method: 'free',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');
      membership = newMembership;
      console.log('✅ 创建免费会员成功');
    } else {
      console.log('✅ 用户已有会员记录');
    }
    
    console.log('会员信息:', {
      id: membership.id,
      user_id: membership.user_id,
      tier_id: membership.membership_tier_id,
      status: membership.status,
      remaining_quota: membership.remaining_ai_quota,
      reset_date: membership.quota_reset_date
    });
    
    // 4. 测试会员查询方法
    console.log('\n🔍 [步骤4] 测试会员查询方法...');
    
    // 使用UserMembership.getCurrentMembership方法
    const UserMembership = require('./models/UserMembership');
    const currentMembership = await UserMembership.getCurrentMembership(user.id);
    
    if (currentMembership) {
      console.log('✅ getCurrentMembership方法正常:', {
        tier_name: currentMembership.tier_name,
        status: currentMembership.status,
        remaining_quota: currentMembership.remaining_ai_quota
      });
    } else {
      console.log('❌ getCurrentMembership方法返回null');
    }
    
    // 5. 测试配额校验方法
    console.log('\n⚡ [步骤5] 测试配额校验方法...');
    
    const MembershipController = require('./controllers/membershipController');
    try {
      const quotaResult = await MembershipController.validateAIQuota(user.id);
      console.log('✅ validateAIQuota方法结果:', quotaResult);
    } catch (error) {
      console.log('❌ validateAIQuota方法失败:', error.message);
    }
    
    // 6. 测试配额消耗方法
    console.log('\n🎯 [步骤6] 测试配额消耗方法...');
    
    try {
      await MembershipController.consumeAIQuota(user.id, 'resume_generation');
      console.log('✅ consumeAIQuota方法成功');
      
      // 检查配额是否减少
      const updatedMembership = await knex('user_memberships').where('user_id', user.id).first();
      console.log('配额消耗后剩余:', updatedMembership.remaining_ai_quota);
      
    } catch (error) {
      console.log('❌ consumeAIQuota方法失败:', error.message);
    }
    
    console.log('\n🎉 [完成] 诊断完成！');
    console.log('\n📊 [测试账号信息]');
    console.log('邮箱:', email);
    console.log('密码:', password);
    console.log('用户ID:', user.id);
    
  } catch (error) {
    console.error('❌ [错误] 诊断失败:', error.message);
    console.error(error.stack);
  } finally {
    await knex.destroy();
  }
}

testMembershipIssue(); 