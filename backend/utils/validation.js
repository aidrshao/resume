/**
 * 数据验证工具
 * 使用Joi进行数据格式验证
 */

const Joi = require('joi');

/**
 * 用户注册数据验证规则（包含邮箱验证码）
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱为必填项'
    }),
  password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      'string.min': '密码至少6位',
      'string.max': '密码最多30位',
      'any.required': '密码为必填项'
    }),
  code: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.length': '验证码必须为6位数字',
      'string.pattern.base': '验证码必须为数字',
      'any.required': '验证码为必填项'
    })
});

/**
 * 用户登录数据验证规则
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱为必填项'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': '密码为必填项'
    })
});

/**
 * 发送验证码数据验证规则
 */
const sendCodeSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱为必填项'
    }),
  type: Joi.string()
    .valid('register', 'login', 'reset_password')
    .required()
    .messages({
      'any.only': '验证码类型无效',
      'any.required': '验证码类型为必填项'
    })
});

/**
 * 验证邮箱验证码数据验证规则
 */
const verifyCodeSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱为必填项'
    }),
  code: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.length': '验证码必须为6位数字',
      'string.pattern.base': '验证码必须为数字',
      'any.required': '验证码为必填项'
    }),
  type: Joi.string()
    .valid('register', 'login', 'reset_password')
    .required()
    .messages({
      'any.only': '验证码类型无效',
      'any.required': '验证码类型为必填项'
    })
});

/**
 * 邮箱验证码登录数据验证规则
 */
const loginWithCodeSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱为必填项'
    }),
  code: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.length': '验证码必须为6位数字',
      'string.pattern.base': '验证码必须为数字',
      'any.required': '验证码为必填项'
    })
});

/**
 * 重置密码数据验证规则
 */
const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱为必填项'
    }),
  code: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.length': '验证码必须为6位数字',
      'string.pattern.base': '验证码必须为数字',
      'any.required': '验证码为必填项'
    }),
  newPassword: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      'string.min': '新密码至少6位',
      'string.max': '新密码最多30位',
      'any.required': '新密码为必填项'
    })
});

/**
 * 岗位创建数据验证规则
 */
const jobCreateSchema = Joi.object({
  user_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '用户ID必须为数字',
      'number.integer': '用户ID必须为整数',
      'number.positive': '用户ID必须为正数',
      'any.required': '用户ID为必填项'
    }),
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': '职位名称不能为空',
      'string.min': '职位名称不能为空',
      'string.max': '职位名称最多255个字符',
      'any.required': '职位名称为必填项'
    }),
  company: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': '公司名称不能为空',
      'string.min': '公司名称不能为空',
      'string.max': '公司名称最多255个字符',
      'any.required': '公司名称为必填项'
    }),
  description: Joi.string()
    .allow('')
    .max(5000)
    .messages({
      'string.max': '职位描述最多5000个字符'
    }),
  requirements: Joi.string()
    .allow('')
    .max(5000)
    .messages({
      'string.max': '岗位要求最多5000个字符'
    }),
  salary_range: Joi.string()
    .allow('')
    .max(100)
    .messages({
      'string.max': '薪资范围最多100个字符'
    }),
  location: Joi.string()
    .allow('')
    .max(255)
    .messages({
      'string.max': '工作地点最多255个字符'
    }),
  job_type: Joi.string()
    .valid('full-time', 'part-time', 'contract', 'remote')
    .default('full-time')
    .messages({
      'any.only': '工作类型必须为全职、兼职、合同工或远程工作中的一种'
    }),
  source_type: Joi.string()
    .valid('text', 'file', 'image')
    .required()
    .messages({
      'any.only': '来源类型必须为文本、文件或图片中的一种',
      'any.required': '来源类型为必填项'
    }),
  source_file_path: Joi.string()
    .allow('')
    .max(500)
    .messages({
      'string.max': '文件路径最多500个字符'
    }),
  original_content: Joi.string()
    .allow('')
    .messages({}),
  status: Joi.string()
    .valid('active', 'applied', 'archived')
    .default('active')
    .messages({
      'any.only': '状态必须为活跃、已投递或已归档中的一种'
    }),
  priority: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .default(1)
    .messages({
      'number.base': '优先级必须为数字',
      'number.integer': '优先级必须为整数',
      'number.min': '优先级最小为1',
      'number.max': '优先级最大为5'
    }),
  application_deadline: Joi.date()
    .allow(null)
    .messages({
      'date.base': '申请截止日期格式不正确'
    }),
  notes: Joi.string()
    .allow('')
    .max(1000)
    .messages({
      'string.max': '备注最多1000个字符'
    })
});

/**
 * 岗位更新数据验证规则
 */
const jobUpdateSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .messages({
      'string.empty': '职位名称不能为空',
      'string.min': '职位名称不能为空',
      'string.max': '职位名称最多255个字符'
    }),
  company: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .messages({
      'string.empty': '公司名称不能为空',
      'string.min': '公司名称不能为空',
      'string.max': '公司名称最多255个字符'
    }),
  description: Joi.string()
    .allow('')
    .max(5000)
    .messages({
      'string.max': '职位描述最多5000个字符'
    }),
  requirements: Joi.string()
    .allow('')
    .max(5000)
    .messages({
      'string.max': '岗位要求最多5000个字符'
    }),
  salary_range: Joi.string()
    .allow('')
    .max(100)
    .messages({
      'string.max': '薪资范围最多100个字符'
    }),
  location: Joi.string()
    .allow('')
    .max(255)
    .messages({
      'string.max': '工作地点最多255个字符'
    }),
  job_type: Joi.string()
    .valid('full-time', 'part-time', 'contract', 'remote')
    .messages({
      'any.only': '工作类型必须为全职、兼职、合同工或远程工作中的一种'
    }),
  status: Joi.string()
    .valid('active', 'applied', 'archived')
    .messages({
      'any.only': '状态必须为活跃、已投递或已归档中的一种'
    }),
  priority: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .messages({
      'number.base': '优先级必须为数字',
      'number.integer': '优先级必须为整数',
      'number.min': '优先级最小为1',
      'number.max': '优先级最大为5'
    }),
  application_deadline: Joi.date()
    .allow(null)
    .messages({
      'date.base': '申请截止日期格式不正确'
    }),
  notes: Joi.string()
    .allow('')
    .max(1000)
    .messages({
      'string.max': '备注最多1000个字符'
    })
}).min(1).messages({
  'object.min': '至少需要提供一个字段进行更新'
});

/**
 * 验证岗位创建数据
 * @param {object} data - 要验证的数据
 * @returns {object} 验证结果
 */
function validateJobData(data) {
  const { error, value } = jobCreateSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }
  
  return {
    isValid: true,
    data: value
  };
}

/**
 * 验证岗位更新数据
 * @param {object} data - 要验证的数据
 * @returns {object} 验证结果
 */
function validateJobUpdate(data) {
  const { error, value } = jobUpdateSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }
  
  return {
    isValid: true,
    data: value
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  sendCodeSchema,
  verifyCodeSchema,
  loginWithCodeSchema,
  resetPasswordSchema,
  jobCreateSchema,
  jobUpdateSchema,
  validateJobData,
  validateJobUpdate
}; 