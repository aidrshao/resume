/**
 * 数据转换器 - 统一简历数据格式处理
 * 只支持新的统一格式（UNIFIED_RESUME_SCHEMA）
 */

/**
 * 保留有值的数据，避免用空值覆盖
 * @param {any} newValue - 新值
 * @param {any} defaultValue - 默认值
 * @returns {any} 最终值
 */
function preserveValue(newValue, defaultValue = '') {
  // 如果新值有效且不为空，使用新值
  if (newValue !== null && newValue !== undefined && newValue !== '') {
    // 对于字符串，检查是否只是空白字符
    if (typeof newValue === 'string' && newValue.trim() === '') {
      return defaultValue;
    }
    // 对于数组，检查是否为空数组
    if (Array.isArray(newValue) && newValue.length === 0) {
      return defaultValue;
    }
    return newValue;
  }
  return defaultValue;
}

/**
 * 智能合并对象，保留有效数据
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
function smartMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      
      // 如果源值是有效值，且目标值为空或无效，则使用源值
      if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
        if (typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
          // 递归合并对象
          result[key] = smartMerge(targetValue || {}, sourceValue);
        } else {
          result[key] = sourceValue;
        }
      }
    }
  }
  
  return result;
}

/**
 * 验证并补全新格式数据
 * @param {Object} inputData - 输入的简历数据
 * @returns {Object} 验证并补全后的数据
 */
function validateAndCompleteUnifiedFormat(inputData) {
  console.log('🔍 [DATA_TRANSFORMER] 开始验证统一格式数据...');
  console.log('🔍 [DATA_TRANSFORMER] 输入数据完整结构:', JSON.stringify(inputData, null, 2));
  
  if (!inputData || typeof inputData !== 'object') {
    console.warn('⚠️ [DATA_TRANSFORMER] 输入数据无效，返回默认结构');
    return createDefaultUnifiedSchema();
  }

  console.log('🔍 [DATA_TRANSFORMER] 数据字段检查:', {
    hasProfile: !!inputData.profile,
    hasWorkExperience: !!inputData.workExperience,
    hasProjectExperience: !!inputData.projectExperience,
    hasEducation: !!inputData.education,
    hasSkills: !!inputData.skills,
    hasCustomSections: !!inputData.customSections
  });

  // 🔧 改进：保持原始数据，只补全缺失字段
  const defaultSchema = createDefaultUnifiedSchema();
  const result = smartMerge(defaultSchema, inputData);

  // 特殊处理个人信息
  if (inputData.profile) {
    console.log('🔍 [DATA_TRANSFORMER] 处理个人信息:', inputData.profile);
    result.profile = {
      name: preserveValue(inputData.profile.name, ''),
      email: preserveValue(inputData.profile.email, ''),
      phone: preserveValue(inputData.profile.phone, ''),
      location: preserveValue(inputData.profile.location, ''),
      title: preserveValue(inputData.profile.title, ''),
      summary: preserveValue(inputData.profile.summary, ''),
      avatar: preserveValue(inputData.profile.avatar, ''),
      website: preserveValue(inputData.profile.website, ''),
      linkedin: preserveValue(inputData.profile.linkedin, ''),
      github: preserveValue(inputData.profile.github, '')
    };
  }

  // 特殊处理工作经验
  if (inputData.workExperience && Array.isArray(inputData.workExperience)) {
    console.log('🔍 [DATA_TRANSFORMER] 处理工作经验，数量:', inputData.workExperience.length);
    result.workExperience = inputData.workExperience.map(exp => ({
      company: preserveValue(exp.company, ''),
      position: preserveValue(exp.position, ''),
      startDate: preserveValue(exp.startDate, ''),
      endDate: preserveValue(exp.endDate, ''),
      current: preserveValue(exp.current, false),
      description: preserveValue(exp.description, ''),
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
      location: preserveValue(exp.location, ''),
      industry: preserveValue(exp.industry, ''),
      companySize: preserveValue(exp.companySize, ''),
      salary: preserveValue(exp.salary, '')
    }));
  }

  // 特殊处理教育背景
  if (inputData.education && Array.isArray(inputData.education)) {
    console.log('🔍 [DATA_TRANSFORMER] 处理教育背景，数量:', inputData.education.length);
    result.education = inputData.education.map(edu => ({
      institution: preserveValue(edu.institution, ''),
      degree: preserveValue(edu.degree, ''),
      major: preserveValue(edu.major, ''),
      startDate: preserveValue(edu.startDate, ''),
      endDate: preserveValue(edu.endDate, ''),
      current: preserveValue(edu.current, false),
      gpa: preserveValue(edu.gpa, ''),
      achievements: Array.isArray(edu.achievements) ? edu.achievements : [],
      location: preserveValue(edu.location, ''),
      description: preserveValue(edu.description, '')
    }));
  }

  // 特殊处理技能
  if (inputData.skills && Array.isArray(inputData.skills)) {
    console.log('🔍 [DATA_TRANSFORMER] 处理技能，数量:', inputData.skills.length);
    result.skills = inputData.skills.map(skill => ({
      category: preserveValue(skill.category, ''),
      items: Array.isArray(skill.items) ? skill.items : [],
      level: preserveValue(skill.level, ''),
      years: preserveValue(skill.years, '')
    }));
  }

  // 特殊处理项目经验
  if (inputData.projects && Array.isArray(inputData.projects)) {
    console.log('🔍 [DATA_TRANSFORMER] 处理项目经验，数量:', inputData.projects.length);
    result.projects = inputData.projects.map(project => ({
      name: preserveValue(project.name, ''),
      description: preserveValue(project.description, ''),
      startDate: preserveValue(project.startDate, ''),
      endDate: preserveValue(project.endDate, ''),
      current: preserveValue(project.current, false),
      technologies: Array.isArray(project.technologies) ? project.technologies : [],
      achievements: Array.isArray(project.achievements) ? project.achievements : [],
      url: preserveValue(project.url, ''),
      github: preserveValue(project.github, ''),
      role: preserveValue(project.role, ''),
      teamSize: preserveValue(project.teamSize, '')
    }));
  }

  // 处理其他字段
  result.certifications = Array.isArray(inputData.certifications) ? inputData.certifications : [];
  result.languages = Array.isArray(inputData.languages) ? inputData.languages : [];
  result.customSections = Array.isArray(inputData.customSections) ? inputData.customSections : [];

  console.log('✅ [DATA_TRANSFORMER] 数据验证和补全完成');
  console.log('🔍 [DATA_TRANSFORMER] 最终结果统计:', {
    profileFields: Object.keys(result.profile || {}).length,
    workExperienceCount: result.workExperience?.length || 0,
    educationCount: result.education?.length || 0,
    skillsCount: result.skills?.length || 0,
    projectsCount: result.projects?.length || 0,
    certificationsCount: result.certifications?.length || 0,
    languagesCount: result.languages?.length || 0,
    customSectionsCount: result.customSections?.length || 0
  });

  // 🔧 输出最终数据的详细信息用于调试
  console.log('🔍 [DATA_TRANSFORMER] 最终个人信息:', {
    name: result.profile?.name || '未设置',
    email: result.profile?.email || '未设置',
    phone: result.profile?.phone || '未设置',
    location: result.profile?.location || '未设置'
  });

  return result;
}

/**
 * 创建默认的统一格式数据结构
 * @returns {Object} 默认数据结构
 */
function createDefaultUnifiedSchema() {
  return {
    profile: {
      name: '',
      email: '',
      phone: '',
      location: '',
      title: '',
      summary: '',
      avatar: '',
      website: '',
      linkedin: '',
      github: ''
    },
    workExperience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    customSections: []
  };
}

/**
 * 验证统一格式数据的完整性
 * @param {Object} data - 要验证的数据
 * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
 */
function validateUnifiedSchema(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('数据必须是对象类型');
    return { valid: false, errors };
  }

  // 验证必需字段
  const requiredFields = ['profile', 'workExperience', 'projectExperience', 'education', 'skills', 'customSections'];
  for (const field of requiredFields) {
    if (!data.hasOwnProperty(field)) {
      errors.push(`缺少必需字段: ${field}`);
    }
  }

  // 验证profile字段
  if (data.profile && typeof data.profile !== 'object') {
    errors.push('profile字段必须是对象类型');
  }

  // 验证数组字段
  const arrayFields = ['workExperience', 'projectExperience', 'education', 'skills', 'customSections'];
  for (const field of arrayFields) {
    if (data[field] && !Array.isArray(data[field])) {
      errors.push(`${field}字段必须是数组类型`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateAndCompleteUnifiedFormat,
  createDefaultUnifiedSchema,
  validateUnifiedSchema
}; 