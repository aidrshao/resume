/**
 * 权益字典配置文件
 * ------------------
 * 定义系统中所有可用权益的"唯一真相来源"
 */

const AVAILABLE_FEATURES = [
  {
    key: 'resume_optimizations',
    name: 'AI简历优化次数',
    type: 'numeric', // 类型：数字
    description: '用户可以使用的AI简历优化配额。'
  },
  {
    key: 'mock_interviews',
    name: 'AI模拟面试次数',
    type: 'numeric',
    description: '用户可以使用的AI模拟面试配额（未来功能）。'
  },
  {
    key: 'template_access_level',
    name: '模板库权限',
    type: 'enum', // 类型：枚举
    options: ['basic', 'premium', 'all'], // 可选值
    description: '可使用的模板级别 (基础/高级/全部)。'
  },
  {
    key: 'remove_watermark',
    name: '去除导出水印',
    type: 'boolean', // 类型：布尔
    description: '导出PDF时，是否去除"由俊才AI生成"的水印。'
  },
  {
    key: 'data_retention_days',
    name: '数据保存时长(天)',
    type: 'numeric',
    description: '简历数据的云端保存时长（填99999代表永久）。'
  },
  {
    key: 'priority_support',
    name: '优先客服支持',
    type: 'boolean',
    description: '是否享有优先的客户服务通道。'
  },
  {
    key: 'pioneer_badge',
    name: '授予创始会员徽章',
    type: 'boolean',
    description: '是否为用户授予专属的"创始会员"荣誉徽章。'
  }
];

module.exports = {
  AVAILABLE_FEATURES
}; 