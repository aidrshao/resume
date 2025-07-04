/**
 * 数据转换器 - 统一简历数据格式处理
 * 只支持新的统一格式（UNIFIED_RESUME_SCHEMA）
 */

/**
 * 验证并补全新格式数据
 * @param {Object} inputData - 输入的简历数据
 * @returns {Object} 验证并补全后的数据
 */
function validateAndCompleteUnifiedFormat(inputData) {
  console.log('🔍 [DATA_TRANSFORMER] 开始验证统一格式数据...');
  
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

  const result = {
    profile: {
      name: inputData.profile?.name || '',
      email: inputData.profile?.email || '',
      phone: inputData.profile?.phone || '',
      location: inputData.profile?.location || '',
      portfolio: inputData.profile?.portfolio || '',
      linkedin: inputData.profile?.linkedin || '',
      summary: inputData.profile?.summary || ''
    },
    
    workExperience: Array.isArray(inputData.workExperience) ? 
      inputData.workExperience.map(exp => ({
        company: exp.company || '',
        position: exp.position || '',
        duration: exp.duration || '',
        description: exp.description || ''
      })) : [],
    
    projectExperience: Array.isArray(inputData.projectExperience) ? 
      inputData.projectExperience.map(proj => ({
        name: proj.name || '',
        role: proj.role || '',
        duration: proj.duration || '',
        description: proj.description || '',
        url: proj.url || ''
      })) : [],
    
    education: Array.isArray(inputData.education) ? 
      inputData.education.map(edu => ({
        school: edu.school || '',
        degree: edu.degree || '',
        major: edu.major || '',
        duration: edu.duration || ''
      })) : [],
    
    skills: Array.isArray(inputData.skills) ? 
      inputData.skills.map(skill => ({
        category: skill.category || '',
        details: skill.details || ''
      })) : [],
    
    customSections: Array.isArray(inputData.customSections) ? 
      inputData.customSections.map(section => ({
        title: section.title || '',
        content: section.content || ''
      })) : [],
    
    _metadata: {
      convertedAt: new Date().toISOString(),
      sourceFormat: 'unified_schema',
      schemaVersion: '2.1'
    }
  };

  console.log('✅ [DATA_TRANSFORMER] 统一格式验证完成:', {
    profileName: result.profile.name,
    workExperienceCount: result.workExperience.length,
    projectExperienceCount: result.projectExperience.length,
    educationCount: result.education.length,
    skillsCount: result.skills.length,
    customSectionsCount: result.customSections.length
  });

  return result;
}

/**
 * 创建默认的统一格式结构
 * @returns {Object} 默认的统一格式数据
 */
function createDefaultUnifiedSchema() {
  return {
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
      sourceFormat: 'default_empty',
      schemaVersion: '2.1'
    }
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