/**
 * 前端表单验证工具
 * 提供常用的表单验证函数
 */

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否为有效邮箱
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {Object} 验证结果
 */
export const validatePassword = (password) => {
  const result = {
    valid: true,
    errors: []
  };

  if (!password) {
    result.valid = false;
    result.errors.push('密码不能为空');
    return result;
  }

  if (password.length < 6) {
    result.valid = false;
    result.errors.push('密码至少6位');
  }

  if (password.length > 30) {
    result.valid = false;
    result.errors.push('密码最多30位');
  }

  return result;
};

/**
 * 验证注册表单
 * @param {Object} formData - 表单数据
 * @param {string} formData.email - 邮箱
 * @param {string} formData.password - 密码
 * @param {string} formData.confirmPassword - 确认密码
 * @returns {Object} 验证结果
 */
export const validateRegisterForm = (formData) => {
  console.log('🔍 Validation: 开始验证注册表单', formData);
  const result = {
    isValid: true,
    errors: {}
  };

  // 验证邮箱
  if (!formData.email) {
    result.isValid = false;
    result.errors.email = '邮箱不能为空';
  } else if (!isValidEmail(formData.email)) {
    result.isValid = false;
    result.errors.email = '邮箱格式不正确';
  }

  // 验证密码
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.valid) {
    result.isValid = false;
    result.errors.password = passwordValidation.errors[0];
  }

  // 验证确认密码
  if (!formData.confirmPassword) {
    result.isValid = false;
    result.errors.confirmPassword = '请确认密码';
  } else if (formData.password !== formData.confirmPassword) {
    result.isValid = false;
    result.errors.confirmPassword = '两次密码输入不一致';
  }

  console.log('✅ Validation: 注册表单验证结果', result);
  return result;
};

/**
 * 验证登录表单
 * @param {Object} formData - 表单数据
 * @param {string} formData.email - 邮箱
 * @param {string} formData.password - 密码
 * @returns {Object} 验证结果
 */
export const validateLoginForm = (formData) => {
  console.log('🔍 Validation: 开始验证登录表单', formData);
  const result = {
    isValid: true,
    errors: {}
  };

  // 验证邮箱
  if (!formData.email) {
    result.isValid = false;
    result.errors.email = '邮箱不能为空';
  } else if (!isValidEmail(formData.email)) {
    result.isValid = false;
    result.errors.email = '邮箱格式不正确';
  }

  // 验证密码
  if (!formData.password) {
    result.isValid = false;
    result.errors.password = '密码不能为空';
  }

  console.log('✅ Validation: 登录表单验证结果', result);
  return result;
}; 