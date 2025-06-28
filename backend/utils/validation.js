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

module.exports = {
  registerSchema,
  loginSchema,
  sendCodeSchema,
  verifyCodeSchema,
  loginWithCodeSchema,
  resetPasswordSchema
}; 