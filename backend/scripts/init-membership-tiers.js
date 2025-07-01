/**
 * 初始化会员套餐数据
 * 创建基础的会员套餐配置
 */

require('dotenv').config();
const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);

async function initMembershipTiers() {
  console.log('🚀 开始初始化会员套餐数据...');

  try {
    // 检查是否已有套餐数据
    const existingTiers = await knex('membership_tiers').select('*');
    if (existingTiers.length > 0) {
      console.log('⚠️ 发现已存在的套餐数据：');
      existingTiers.forEach(tier => {
        console.log(`   - ${tier.name}: ¥${tier.original_price}, AI配额: ${tier.ai_resume_quota}`);
      });
      console.log('如需重新初始化，请先清空 membership_tiers 表');
      return;
    }

    // 创建基础套餐数据
    const tiers = [
      {
        name: '免费版',
        description: '适合个人用户基础使用',
        original_price: 0.00,
        reduction_price: null,
        duration_days: 0, // 永久
        ai_resume_quota: 3, // 每月3次
        template_access_level: 'basic',
        is_active: true,
        sort_order: 1,
        features: JSON.stringify([
          '每月3次AI简历生成',
          '基础简历模板',
          '简历在线编辑',
          '简历导出PDF'
        ])
      },
      {
        name: '月度会员',
        description: '适合求职期用户',
        original_price: 39.00,
        reduction_price: 29.00,
        duration_days: 30,
        ai_resume_quota: 20, // 每月20次
        template_access_level: 'advanced',
        is_active: true,
        sort_order: 2,
        features: JSON.stringify([
          '每月20次AI简历生成',
          '高级简历模板',
          '岗位专属简历优化',
          'AI简历分析建议',
          '优先客服支持'
        ])
      },
      {
        name: '年度会员',
        description: '适合长期职业发展',
        original_price: 399.00,
        reduction_price: 299.00,
        duration_days: 365,
        ai_resume_quota: 50, // 每月50次
        template_access_level: 'all',
        is_active: true,
        sort_order: 3,
        features: JSON.stringify([
          '每月50次AI简历生成',
          '全部简历模板',
          '岗位专属简历优化',
          'AI简历分析建议',
          'AI面试指导',
          '职业规划咨询',
          '专属客服支持'
        ])
      },
      {
        name: '终身会员',
        description: '一次购买，终身享受',
        original_price: 999.00,
        reduction_price: 799.00,
        duration_days: 0, // 永久
        ai_resume_quota: 100, // 每月100次
        template_access_level: 'all',
        is_active: true,
        sort_order: 4,
        features: JSON.stringify([
          '每月100次AI简历生成',
          '全部简历模板',
          '岗位专属简历优化',
          'AI简历分析建议',
          'AI面试指导',
          '职业规划咨询',
          '专属VIP客服',
          '新功能优先体验'
        ])
      }
    ];

    // 插入套餐数据
    const insertedTiers = await knex('membership_tiers').insert(tiers).returning('*');
    
    console.log('✅ 会员套餐数据初始化完成：');
    insertedTiers.forEach(tier => {
      console.log(`   - ${tier.name}: ¥${tier.original_price}/${tier.reduction_price || tier.original_price}, AI配额: ${tier.ai_resume_quota}/月`);
    });

    // 创建AI提示词配置
    const promptConfigs = [
      {
        name: '基础简历生成',
        type: 'resume_generation',
        prompt_template: `请根据以下信息生成一份专业的中文简历：

用户信息：{{userInfo}}
目标岗位：{{targetPosition}}
公司信息：{{companyInfo}}

要求：
1. 简历结构清晰，内容专业
2. 突出与目标岗位相关的技能和经验
3. 使用适当的关键词优化
4. 保持内容真实可信
5. 字数控制在800-1200字

请以JSON格式返回，包含以下字段：
- title: 简历标题
- content: 简历正文内容
- keywords: 关键词列表`,
        variables: JSON.stringify({
          userInfo: '用户基本信息和工作经历',
          targetPosition: '目标职位名称',
          companyInfo: '目标公司信息'
        }),
        is_active: true,
        description: '用于生成基础简历的AI提示词模板'
      },
      {
        name: '简历优化',
        type: 'resume_optimization',
        prompt_template: `请优化以下简历内容，提升其专业性和竞争力：

原始简历：{{originalResume}}
目标岗位：{{targetPosition}}
优化要求：{{optimizationRequirements}}

优化方向：
1. 语言表达更加专业
2. 突出核心竞争力
3. 增加量化数据
4. 优化关键词匹配
5. 提升整体结构

请返回优化后的简历内容和改进建议。`,
        variables: JSON.stringify({
          originalResume: '原始简历内容',
          targetPosition: '目标职位',
          optimizationRequirements: '具体优化要求'
        }),
        is_active: true,
        description: '用于优化现有简历的AI提示词模板'
      }
    ];

    const insertedConfigs = await knex('ai_prompt_configs').insert(promptConfigs).returning('*');
    console.log(`✅ AI提示词配置初始化完成，共${insertedConfigs.length}个配置`);

    console.log('🎉 会员系统基础数据初始化完成！');

  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    throw error;
  } finally {
    await knex.destroy();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initMembershipTiers()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { initMembershipTiers }; 