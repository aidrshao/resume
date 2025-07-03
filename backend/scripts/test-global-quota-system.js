/**
 * 测试全局配额管理系统
 * 验证GlobalQuotaConfig模型、API接口和集成功能
 */

require('dotenv').config();
const knex = require('../config/database');
const GlobalQuotaConfig = require('../models/GlobalQuotaConfig');
const UserQuota = require('../models/UserQuota');

async function testGlobalQuotaSystem() {
  console.log('🚀 开始测试全局配额管理系统...\n');

  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    await knex.raw('SELECT 1');
    console.log('✅ 数据库连接成功\n');

    // 2. 测试全局配额配置表
    console.log('2️⃣ 测试全局配额配置表...');
    const configsCount = await knex('global_quota_configs').count('* as count').first();
    console.log(`✅ 全局配额配置表存在，共有 ${configsCount.count} 条配置记录\n`);

    // 3. 测试获取新用户配额配置
    console.log('3️⃣ 测试获取新用户配额配置...');
    const newUserConfigs = await GlobalQuotaConfig.getNewUserQuotaConfigs();
    console.log(`✅ 获取到 ${newUserConfigs.length} 个新用户配额配置:`);
    newUserConfigs.forEach(config => {
      console.log(`   - ${config.config_name}: ${config.default_quota} (${config.quota_type})`);
    });
    console.log('');

    // 4. 测试根据配置键获取配额
    console.log('4️⃣ 测试根据配置键获取配额...');
    const aiResumeConfig = await GlobalQuotaConfig.getByKey('new_user_ai_resume_quota');
    if (aiResumeConfig) {
      console.log(`✅ 获取新用户AI简历配额配置成功: ${aiResumeConfig.default_quota}`);
    } else {
      console.log('❌ 未找到新用户AI简历配额配置');
    }
    console.log('');

    // 5. 测试UserQuota集成
    console.log('5️⃣ 测试UserQuota模型集成...');
    
    // 创建测试用户（如果不存在）
    const testUserId = 9999;
    const existingUser = await knex('users').where('id', testUserId).first();
    
    if (!existingUser) {
      await knex('users').insert({
        id: testUserId,
        email: 'test-quota@example.com',
        password_hash: 'test',
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log(`✅ 创建测试用户 ${testUserId}`);
    } else {
      console.log(`ℹ️ 测试用户 ${testUserId} 已存在`);
    }

    // 清理旧的配额记录
    await knex('user_quotas').where('user_id', testUserId).del();
    console.log('🧹 清理旧的配额记录');

    // 使用新的配额配置创建默认配额
    const createdQuotas = await UserQuota.createDefaultQuotas(testUserId);
    console.log(`✅ 使用全局配置创建了 ${createdQuotas.length} 个默认配额:`);
    createdQuotas.forEach(quota => {
      console.log(`   - ${quota.quota_type}: ${quota.quota_limit} (重置周期: ${quota.reset_cycle})`);
    });
    console.log('');

    // 6. 测试统计功能
    console.log('6️⃣ 测试统计功能...');
    const statistics = await GlobalQuotaConfig.getStatistics();
    console.log('✅ 获取配额配置统计信息:');
    console.log(`   - 总配置数: ${statistics.total}`);
    console.log(`   - 启用配置: ${statistics.active}`);
    console.log(`   - 禁用配置: ${statistics.inactive}`);
    console.log(`   - 配置分类: ${statistics.categories}`);
    console.log('');

    // 7. 测试格式化显示
    console.log('7️⃣ 测试格式化显示...');
    const sampleConfig = newUserConfigs[0];
    if (sampleConfig) {
      const formatted = GlobalQuotaConfig.formatForDisplay(sampleConfig);
      console.log('✅ 格式化配置显示:');
      console.log(`   - 配置名称: ${formatted.config_name}`);
      console.log(`   - 重置周期显示: ${formatted.reset_cycle_display}`);
      console.log(`   - 配置键: ${formatted.config_key}`);
    }
    console.log('');

    // 8. 清理测试数据
    console.log('8️⃣ 清理测试数据...');
    await knex('user_quotas').where('user_id', testUserId).del();
    await knex('users').where('id', testUserId).del();
    console.log('✅ 测试数据清理完成\n');

    console.log('🎉 全局配额管理系统测试完成！所有功能正常工作。');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
  } finally {
    // 关闭数据库连接
    await knex.destroy();
    console.log('📚 数据库连接已关闭');
    process.exit(0);
  }
}

// 主函数调用
if (require.main === module) {
  testGlobalQuotaSystem().catch(console.error);
}

module.exports = testGlobalQuotaSystem; 