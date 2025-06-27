/**
 * 数据验证工具
 * 使用Joi进行数据格式验证
 */

const Joi = require('joi');

/**
 * 用户注册数据验证规则
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

module.exports = {
  registerSchema,
  loginSchema
}; 