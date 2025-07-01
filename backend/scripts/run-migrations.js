/**
 * 运行数据库迁移脚本
 * 用于初始化管理员和会员管理系统的数据库表
 */

require('dotenv').config();
const knex = require('../config/database');

async function runMigrations() {
  try {
    console.log('🚀 [MIGRATION] 开始运行数据库迁移...');
    
    // 运行所有迁移
    const migration = require('../migrations/20250101000002_create_membership_system');
    
    console.log('📊 [MIGRATION] 执行会员系统迁移...');
    await migration.up(knex);
    
    console.log('✅ [MIGRATION] 迁移完成！');
    
    // 创建默认管理员账号
    const bcrypt = require('bcrypt');
    const defaultAdminEmail = 'admin@example.com';
    const defaultAdminPassword = 'admin123456';
    
    console.log('👤 [ADMIN] 检查默认管理员账号...');
    
    const existingAdmin = await knex('users')
      .where({ email: defaultAdminEmail })
      .first();
    
    if (!existingAdmin) {
      console.log('👤 [ADMIN] 创建默认管理员账号...');
      
      const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
      
      await knex('users').insert({
        email: defaultAdminEmail,
        password_hash: hashedPassword,
        name: '系统管理员',
        email_verified: true,
        is_admin: true,
        admin_role: 'super_admin',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log('✅ [ADMIN] 默认管理员账号创建成功');
      console.log('📧 邮箱:', defaultAdminEmail);
      console.log('🔐 密码:', defaultAdminPassword);
      console.log('⚠️  请在生产环境中修改默认密码！');
    } else {
      console.log('ℹ️  [ADMIN] 管理员账号已存在，跳过创建');
    }
    
    // 创建示例会员套餐
    console.log('📦 [TIERS] 检查默认会员套餐...');
    
    const existingTiers = await knex('membership_tiers').count('* as count').first();
    
    if (parseInt(existingTiers.count) === 0) {
      console.log('📦 [TIERS] 创建默认会员套餐...');
      
      const defaultTiers = [
        {
          name: '月度会员',
          description: '享受基础AI简历优化服务',
          original_price: 29.99,
          reduction_price: 19.99,
          duration_days: 30,
          ai_resume_quota: 10,
          template_access_level: 'basic',
          sort_order: 1,
          is_active: true,
          features: JSON.stringify(['基础模板', '10次AI优化', '邮件支持']),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '年度会员',
          description: '全年享受高级AI简历优化服务',
          original_price: 299.99,
          reduction_price: 199.99,
          duration_days: 365,
          ai_resume_quota: 50,
          template_access_level: 'advanced',
          sort_order: 2,
          is_active: true,
          features: JSON.stringify(['高级模板', '50次AI优化', '优先支持', '行业定制']),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: '终身会员',
          description: '一次付费，终身享受所有服务',
          original_price: 999.99,
          reduction_price: 699.99,
          duration_days: 0,
          ai_resume_quota: 100,
          template_access_level: 'all',
          sort_order: 3,
          is_active: true,
          features: JSON.stringify(['所有模板', '100次AI优化', '专属客服', '终身更新']),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await knex('membership_tiers').insert(defaultTiers);
      
      console.log('✅ [TIERS] 默认会员套餐创建成功');
    } else {
      console.log('ℹ️  [TIERS] 会员套餐已存在，跳过创建');
    }
    
    console.log('🎉 [SUCCESS] 所有初始化任务完成！');
    
  } catch (error) {
    console.error('❌ [ERROR] 迁移失败:', error);
    throw error;
  } finally {
    await knex.destroy();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations }; 