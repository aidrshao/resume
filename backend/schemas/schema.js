/**
 * 统一简历数据格式定义
 * 定义了统一的简历数据结构和转换函数
 * 版本：3.2
 */

/**
 * 新的统一简历数据范式
 * 这是系统中所有简历数据的标准格式
 */
const UNIFIED_RESUME_SCHEMA = {
  profile: {
    name: "string",
    email: "string",
    phone: "string",
    location: "string",
    portfolio: "string",
    linkedin: "string",
    summary: "string"
  },
  workExperience: [
    {
      company: "string",
      position: "string",
      duration: "string",
      description: "string"
    }
  ],
  projectExperience: [
    {
      name: "string",
      role: "string",
      duration: "string",
      description: "string",
      url: "string"
    }
  ],
  education: [
    {
      school: "string",
      degree: "string",
      major: "string",
      duration: "string"
    }
  ],
  skills: [
    {
      category: "string", // 例如: "前端技术", "后端技术"
      details: "string"  // 例如: "HTML, CSS, JavaScript"
    }
  ],
  customSections: [
    {
      title: "string",   // 例如: "获奖经历", "发表论文"
      content: "string"
    }
  ]
};

/**
 * 空的统一简历数据模板
 * 用于创建新简历时的默认数据
 */
const EMPTY_UNIFIED_RESUME = {
  profile: {
    name: "",
    email: "",
    phone: "",
    location: "",
    portfolio: "",
    linkedin: "",
    summary: ""
  },
  workExperience: [],
  projectExperience: [],
  education: [],
  skills: [],
  customSections: []
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
    const requiredFields = ['profile', 'workExperience', 'projectExperience', 'education', 'skills', 'customSections'];
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
    const arrayFields = ['workExperience', 'projectExperience', 'education', 'skills', 'customSections'];
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

/**
 * 转换旧格式数据到新的统一格式
 * @param {Object} oldData - 旧格式的简历数据
 * @returns {Object} 转换后的统一格式数据
 */
function convertToUnifiedSchema(oldData) {
  if (!oldData || typeof oldData !== 'object') {
    return EMPTY_UNIFIED_RESUME;
  }

  const unifiedData = {
    profile: {
      name: "",
      email: "",
      phone: "",
      location: "",
      portfolio: "",
      linkedin: "",
      summary: ""
    },
    workExperience: [],
    projectExperience: [],
    education: [],
    skills: [],
    customSections: []
  };

  // 处理个人信息 - 支持多种旧格式
  if (oldData.profile) {
    unifiedData.profile = {
      name: oldData.profile.name || "",
      email: oldData.profile.email || "",
      phone: oldData.profile.phone || "",
      location: oldData.profile.location || "",
      portfolio: oldData.profile.portfolio || "",
      linkedin: oldData.profile.linkedin || "",
      summary: oldData.profile.summary || ""
    };
  } else if (oldData.personalInfo) {
    // 兼容旧的personalInfo格式
    unifiedData.profile = {
      name: oldData.personalInfo.name || "",
      email: oldData.personalInfo.email || "",
      phone: oldData.personalInfo.phone || "",
      location: oldData.personalInfo.location || "",
      portfolio: oldData.personalInfo.portfolio || "",
      linkedin: oldData.personalInfo.linkedin || "",
      summary: oldData.personalInfo.summary || ""
    };
  }

  // 处理工作经历 - 支持多种旧格式
  if (Array.isArray(oldData.workExperience)) {
    unifiedData.workExperience = oldData.workExperience.map(item => ({
      company: item.company || "",
      position: item.position || "",
      duration: item.duration || "",
      description: item.description || ""
    }));
  } else if (Array.isArray(oldData.workExperiences)) {
    // 兼容旧的workExperiences格式
    unifiedData.workExperience = oldData.workExperiences.map(item => ({
      company: item.company || "",
      position: item.position || "",
      duration: item.duration || "",
      description: item.description || ""
    }));
  }

  // 处理项目经历
  if (Array.isArray(oldData.projectExperience)) {
    unifiedData.projectExperience = oldData.projectExperience.map(item => ({
      name: item.name || "",
      role: item.role || "",
      duration: item.duration || "",
      description: item.description || "",
      url: item.url || ""
    }));
  } else if (Array.isArray(oldData.projects)) {
    // 兼容旧的projects格式
    unifiedData.projectExperience = oldData.projects.map(item => ({
      name: item.name || item.title || "",
      role: item.role || "",
      duration: item.duration || "",
      description: item.description || "",
      url: item.url || ""
    }));
  }

  // 处理教育背景
  if (Array.isArray(oldData.education)) {
    unifiedData.education = oldData.education.map(item => ({
      school: item.school || "",
      degree: item.degree || "",
      major: item.major || "",
      duration: item.duration || ""
    }));
  }

  // 处理技能
  if (Array.isArray(oldData.skills)) {
    unifiedData.skills = oldData.skills.map(item => {
      if (typeof item === 'string') {
        return {
          category: "技能",
          details: item
        };
      } else if (item && typeof item === 'object') {
        return {
          category: item.category || "技能",
          details: item.details || item.name || ""
        };
      }
      return {
        category: "技能",
        details: ""
      };
    });
  }

  // 处理自定义模块
  if (Array.isArray(oldData.customSections)) {
    unifiedData.customSections = oldData.customSections.map(item => ({
      title: item.title || "",
      content: item.content || ""
    }));
  }

  return unifiedData;
}

module.exports = {
  UNIFIED_RESUME_SCHEMA,
  EMPTY_UNIFIED_RESUME,
  validateUnifiedSchema,
  convertToUnifiedSchema
}; 