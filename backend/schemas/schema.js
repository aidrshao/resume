/**
 * 统一简历数据格式定义
 * 定义了统一的简历数据结构和转换函数
 */

/**
 * 统一简历数据格式定义
 * 这是系统中所有简历数据的标准格式
 */
const UNIFIED_RESUME_SCHEMA = {
  // 个人信息
  profile: {
    name: '',
    email: '',
    phone: '',
    location: '',
    portfolio: '',
    linkedin: '',
    summary: ''
  },
  
  // 工作经历
  workExperience: [],
  
  // 项目经历
  projectExperience: [],
  
  // 教育背景
  education: [],
  
  // 技能
  skills: [],
  
  // 自定义模块
  customSections: [],
  
  // 元数据
  _metadata: {
    convertedAt: new Date().toISOString(),
    sourceFormat: 'default',
    schemaVersion: '2.1'
  }
};

/**
 * 空的统一简历数据模板
 * 用于创建新简历时的默认数据
 */
const EMPTY_UNIFIED_RESUME = {
  profile: {
    name: '',
    email: '',
    phone: '',
    location: '',
    portfolio: '',
    linkedin: '',
    summary: ''
  },
  workExperience: [],
  projectExperience: [],
  education: [],
  skills: [],
  customSections: [],
  _metadata: {
    convertedAt: new Date().toISOString(),
    sourceFormat: 'empty_template',
    schemaVersion: '2.1'
  }
};

/**
 * 验证统一格式数据的完整性
 * @param {Object} data - 要验证的数据
 * @returns {Object} 验证结果 { valid: boolean, error: string }
 */
function validateUnifiedSchema(data) {
  try {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: '数据必须是对象类型' };
    }

    // 验证必需字段
    const requiredFields = ['profile', 'workExperience', 'projectExperience', 'education', 'skills'];
    for (const field of requiredFields) {
      if (!data.hasOwnProperty(field)) {
        return { valid: false, error: `缺少必需字段: ${field}` };
      }
    }

    // 验证profile字段
    if (data.profile && typeof data.profile !== 'object') {
      return { valid: false, error: 'profile字段必须是对象类型' };
    }

    // 验证数组字段
    const arrayFields = ['workExperience', 'projectExperience', 'education', 'skills'];
    for (const field of arrayFields) {
      if (data[field] && !Array.isArray(data[field])) {
        return { valid: false, error: `${field}字段必须是数组类型` };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

module.exports = {
  UNIFIED_RESUME_SCHEMA,
  EMPTY_UNIFIED_RESUME,
  validateUnifiedSchema
}; 