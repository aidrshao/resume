/**
 * 全局配额配置种子数据
 * 初始化新用户注册时的默认配额分配
 */

exports.seed = async function(knex) {
  // 幂等处理：不再删除全部数据，按需插入

  // 定义默认配额配置
  const configs = [
    {
      config_key: 'new_user_ai_resume_quota',
      config_name: '新用户AI简历生成配额',
      description: '新注册用户的每月AI简历生成次数',
      quota_type: 'monthly_ai_resume',
      default_quota: 5,
      reset_cycle: 'monthly',
      category: 'user_registration',
      is_active: true,
      sort_order: 1,
      extra_config: JSON.stringify({
        applies_to: 'free_tier',
        renewable: true,
        description_detail: '免费用户每月可生成5份AI简历'
      })
    },
    {
      config_key: 'new_user_ai_chat_quota',
      config_name: '新用户AI对话配额',
      description: '新注册用户的每月AI对话次数',
      quota_type: 'monthly_ai_chat',
      default_quota: 50,
      reset_cycle: 'monthly',
      category: 'user_registration',
      is_active: true,
      sort_order: 2,
      extra_config: JSON.stringify({
        applies_to: 'free_tier',
        renewable: true,
        description_detail: '免费用户每月可进行50次AI对话'
      })
    },
    {
      config_key: 'new_user_job_search_quota',
      config_name: '新用户岗位搜索配额',
      description: '新注册用户的每月岗位搜索次数',
      quota_type: 'monthly_job_search',
      default_quota: 100,
      reset_cycle: 'monthly',
      category: 'user_registration',
      is_active: true,
      sort_order: 3,
      extra_config: JSON.stringify({
        applies_to: 'free_tier',
        renewable: true,
        description_detail: '免费用户每月可搜索100个岗位'
      })
    },
    {
      config_key: 'new_user_resume_upload_quota',
      config_name: '新用户简历上传配额',
      description: '新注册用户的每月简历上传次数',
      quota_type: 'monthly_resume_upload',
      default_quota: 10,
      reset_cycle: 'monthly',
      category: 'user_registration',
      is_active: true,
      sort_order: 4,
      extra_config: JSON.stringify({
        applies_to: 'free_tier',
        renewable: true,
        description_detail: '免费用户每月可上传10份简历进行解析'
      })
    },
    {
      config_key: 'premium_user_ai_resume_quota',
      config_name: '付费用户AI简历生成配额',
      description: '付费用户的每月AI简历生成次数',
      quota_type: 'monthly_ai_resume',
      default_quota: 50,
      reset_cycle: 'monthly',
      category: 'premium_membership',
      is_active: true,
      sort_order: 5,
      extra_config: JSON.stringify({
        applies_to: 'premium_tier',
        renewable: true,
        description_detail: '付费用户每月可生成50份AI简历'
      })
    },
    {
      config_key: 'premium_user_ai_chat_quota',
      config_name: '付费用户AI对话配额',
      description: '付费用户的每月AI对话次数',
      quota_type: 'monthly_ai_chat',
      default_quota: 500,
      reset_cycle: 'monthly',
      category: 'premium_membership',
      is_active: true,
      sort_order: 6,
      extra_config: JSON.stringify({
        applies_to: 'premium_tier',
        renewable: true,
        description_detail: '付费用户每月可进行500次AI对话'
      })
    },
    {
      config_key: 'daily_ai_resume_quota',
      config_name: '每日AI简历生成限制',
      description: '用户每天的AI简历生成次数限制',
      quota_type: 'daily_ai_resume',
      default_quota: 3,
      reset_cycle: 'daily',
      category: 'rate_limiting',
      is_active: true,
      sort_order: 7,
      extra_config: JSON.stringify({
        applies_to: 'all_users',
        renewable: true,
        description_detail: '所有用户每天最多生成3份AI简历'
      })
    },
    {
      config_key: 'guest_user_trial_quota',
      config_name: '游客体验配额',
      description: '未注册用户的试用配额',
      quota_type: 'trial_ai_resume',
      default_quota: 1,
      reset_cycle: 'never',
      category: 'guest_access',
      is_active: true,
      sort_order: 8,
      extra_config: JSON.stringify({
        applies_to: 'guest_users',
        renewable: false,
        description_detail: '游客用户可免费体验1次AI简历生成'
      })
    }
  ];

  // 幂等插入：根据 config_key 唯一检查
  for (const cfg of configs) {
    const exists = await knex('global_quota_configs').where({ config_key: cfg.config_key }).first();
    if (!exists) {
      await knex('global_quota_configs').insert(cfg);
    }
  }

  console.log('✅ [SEED] global_quota_configs 已同步 (幂等)');
}; 