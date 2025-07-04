// 新的统一简历数据范式
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

// 统一数据范式的默认空值
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

// 数据验证函数
const validateUnifiedSchema = (data) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '数据格式错误：必须是对象' };
  }

  // 验证profile
  if (!data.profile || typeof data.profile !== 'object') {
    return { valid: false, error: 'profile字段缺失或格式错误' };
  }

  // 验证数组字段
  const arrayFields = ['workExperience', 'projectExperience', 'education', 'skills', 'customSections'];
  for (const field of arrayFields) {
    if (data[field] && !Array.isArray(data[field])) {
      return { valid: false, error: `${field}字段必须是数组` };
    }
  }

  return { valid: true, error: null };
};

// 数据转换函数 - 将旧格式转换为新格式
const convertToUnifiedSchema = (oldData) => {
  console.log('🔄 [SCHEMA_CONVERTER] 开始转换数据到统一范式');
  console.log('🔄 [SCHEMA_CONVERTER] 原始数据类型:', typeof oldData);
  
  let parsedData;
  
  // 处理不同的输入格式
  if (typeof oldData === 'string') {
    try {
      parsedData = JSON.parse(oldData);
    } catch (error) {
      console.log('❌ [SCHEMA_CONVERTER] JSON解析失败，使用默认数据');
      return EMPTY_UNIFIED_RESUME;
    }
  } else if (typeof oldData === 'object') {
    parsedData = oldData;
  } else {
    console.log('❌ [SCHEMA_CONVERTER] 无效数据类型，使用默认数据');
    return EMPTY_UNIFIED_RESUME;
  }

  if (!parsedData) {
    return EMPTY_UNIFIED_RESUME;
  }

  console.log('🔄 [SCHEMA_CONVERTER] 解析后的数据字段:', Object.keys(parsedData));

  // 构建统一格式
  const unified = {
    profile: {
      name: extractString(parsedData, ['name', 'personalInfo.name', 'profile.name']) || "",
      email: extractString(parsedData, ['email', 'personalInfo.email', 'profile.email']) || "",
      phone: extractString(parsedData, ['phone', 'personalInfo.phone', 'profile.phone']) || "",
      location: extractString(parsedData, ['location', 'personalInfo.location', 'profile.location', 'address']) || "",
      portfolio: extractString(parsedData, ['portfolio', 'personalInfo.portfolio', 'profile.portfolio', 'website']) || "",
      linkedin: extractString(parsedData, ['linkedin', 'personalInfo.linkedin', 'profile.linkedin']) || "",
      summary: extractString(parsedData, ['summary', 'personalInfo.summary', 'profile.summary', 'objective']) || ""
    },
    workExperience: convertWorkExperience(parsedData),
    projectExperience: convertProjectExperience(parsedData),
    education: convertEducation(parsedData),
    skills: convertSkills(parsedData),
    customSections: convertCustomSections(parsedData)
  };

  console.log('✅ [SCHEMA_CONVERTER] 转换完成，统一格式数据字段:', Object.keys(unified));
  return unified;
};

// 辅助函数：提取字符串值
const extractString = (data, paths) => {
  for (const path of paths) {
    const value = getNestedValue(data, path);
    if (value && typeof value === 'string') {
      return value;
    }
  }
  return "";
};

// 辅助函数：获取嵌套值
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// 转换工作经历
const convertWorkExperience = (data) => {
  const sources = [
    data.workExperience,
    data.workExperiences,
    data.work_experience,
    data.work_experiences
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source.map(exp => ({
        company: exp.company || exp.employer || "",
        position: exp.position || exp.title || exp.role || "",
        duration: exp.duration || exp.period || exp.time || "",
        description: exp.description || exp.responsibilities || exp.duties || ""
      }));
    }
  }
  return [];
};

// 转换项目经历
const convertProjectExperience = (data) => {
  const sources = [
    data.projectExperience,
    data.projects,
    data.project_experience
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source.map(proj => ({
        name: proj.name || proj.title || "",
        role: proj.role || proj.position || "",
        duration: proj.duration || proj.period || proj.time || "",
        description: proj.description || proj.details || "",
        url: proj.url || proj.link || proj.website || ""
      }));
    }
  }
  return [];
};

// 转换教育经历
const convertEducation = (data) => {
  const sources = [
    data.education,
    data.educations,
    data.educational_background
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source.map(edu => ({
        school: edu.school || edu.institution || edu.university || "",
        degree: edu.degree || edu.level || "",
        major: edu.major || edu.field || edu.subject || "",
        duration: edu.duration || edu.period || edu.time || ""
      }));
    }
  }
  return [];
};

// 转换技能
const convertSkills = (data) => {
  const sources = [
    data.skills,
    data.skill,
    data.technical_skills
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      // 如果已经是分类格式
      if (source.length > 0 && source[0].category) {
        return source.map(skill => ({
          category: skill.category || "技能",
          details: skill.details || skill.items || ""
        }));
      }
      // 如果是简单字符串数组
      else {
        return [{
          category: "技能",
          details: source.join(", ")
        }];
      }
    } else if (typeof source === 'string') {
      return [{
        category: "技能",
        details: source
      }];
    }
  }
  return [];
};

// 转换自定义模块
const convertCustomSections = (data) => {
  const customSections = [];
  
  // 查找可能的自定义模块
  const possibleSections = [
    { key: 'awards', title: '获奖经历' },
    { key: 'certifications', title: '证书认证' },
    { key: 'publications', title: '发表论文' },
    { key: 'languages', title: '语言能力' },
    { key: 'hobbies', title: '兴趣爱好' },
    { key: 'volunteer', title: '志愿经历' }
  ];

  for (const section of possibleSections) {
    if (data[section.key]) {
      let content = "";
      if (Array.isArray(data[section.key])) {
        content = data[section.key].join(", ");
      } else if (typeof data[section.key] === 'string') {
        content = data[section.key];
      }
      
      if (content) {
        customSections.push({
          title: section.title,
          content: content
        });
      }
    }
  }

  return customSections;
};

// 导出所有函数和常量
module.exports = {
  UNIFIED_RESUME_SCHEMA,
  EMPTY_UNIFIED_RESUME,
  validateUnifiedSchema,
  convertToUnifiedSchema
}; 