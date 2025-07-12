// frontend/src/utils/featureInterpreter.js

// 定义所有权益的中文名称和展示逻辑
const FEATURE_MAP = {
  resume_optimizations: (value) => `${value}次简历优化`,
  mock_interviews: (value) => `${value}次AI模拟面试`,
  template_access_level: (value) => {
    if (value === 'basic') return '基础模板库 (10+)';
    if (value === 'premium') return '高级模板库 (50+)';
    if (value === 'all') return '所有模板库 (100+)';
    return '模板库使用权';
  },
  remove_watermark: (value) => value ? '去除导出水印' : null,
  data_retention_days: (value) => {
    if (value >= 99999) return '数据永久保存';
    if (value >= 365) return `数据保存${value / 365}年`;
    if (value >= 30) return `数据保存${value / 30}个月`;
    return `数据保存${value}天`;
  },
  priority_support: (value) => value ? '优先客服支持' : null,
  pioneer_badge: (value) => value ? '专属创始会员徽章' : null,
  future_feature_access: (value) => value ? '所有未来功能永久免费' : null,
};

export const interpretFeatures = (features) => {
  if (!features) return [];
  return Object.entries(features)
    .map(([key, value]) => {
      if (FEATURE_MAP[key]) {
        return FEATURE_MAP[key](value);
      }
      return null;
    })
    .filter(Boolean); // 过滤掉返回null的权益（例如值为false的布尔型权益）
}; 