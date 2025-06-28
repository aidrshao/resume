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
 * 验证注册验证码表单
 * @param {Object} formData - 表单数据
 * @param {string} formData.email - 邮箱
 * @param {string} formData.password - 密码
 * @param {string} formData.confirmPassword - 确认密码
 * @param {string} formData.code - 验证码
 * @returns {Object} 验证结果
 */
export const validateRegisterCodeForm = (formData) => {
  console.log('🔍 Validation: 开始验证注册验证码表单', formData);
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

  // 验证验证码
  if (!formData.code) {
    result.isValid = false;
    result.errors.code = '验证码不能为空';
  } else if (!isValidVerificationCode(formData.code)) {
    result.isValid = false;
    result.errors.code = '验证码格式不正确';
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

  console.log('✅ Validation: 注册验证码表单验证结果', result);
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

/**
 * 验证验证码格式
 * @param {string} code - 验证码
 * @returns {boolean} 是否为有效验证码
 */
export const isValidVerificationCode = (code) => {
  // 验证码应该是6位数字
  const codeRegex = /^\d{6}$/;
  return codeRegex.test(code);
};

/**
 * 验证验证码登录表单
 * @param {Object} formData - 表单数据
 * @param {string} formData.email - 邮箱
 * @param {string} formData.code - 验证码
 * @returns {Object} 验证结果
 */
export const validateCodeLoginForm = (formData) => {
  console.log('🔍 Validation: 开始验证验证码登录表单', formData);
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

  // 验证验证码
  if (!formData.code) {
    result.isValid = false;
    result.errors.code = '验证码不能为空';
  } else if (!isValidVerificationCode(formData.code)) {
    result.isValid = false;
    result.errors.code = '验证码格式不正确，请输入6位数字';
  }

  console.log('✅ Validation: 验证码登录表单验证结果', result);
  return result;
};

/**
 * 验证发送验证码表单
 * @param {Object} formData - 表单数据
 * @param {string} formData.email - 邮箱
 * @returns {Object} 验证结果
 */
export const validateSendCodeForm = (formData) => {
  console.log('🔍 Validation: 开始验证发送验证码表单', formData);
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

  console.log('✅ Validation: 发送验证码表单验证结果', result);
  return result;
};

/**
 * 验证重置密码表单
 * @param {Object} formData - 表单数据
 * @param {string} formData.email - 邮箱
 * @param {string} formData.code - 验证码
 * @param {string} formData.newPassword - 新密码
 * @param {string} formData.confirmPassword - 确认新密码
 * @returns {Object} 验证结果
 */
export const validateResetPasswordForm = (formData) => {
  console.log('🔍 Validation: 开始验证重置密码表单', formData);
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

  // 验证验证码
  if (!formData.code) {
    result.isValid = false;
    result.errors.code = '验证码不能为空';
  } else if (!isValidVerificationCode(formData.code)) {
    result.isValid = false;
    result.errors.code = '验证码格式不正确，请输入6位数字';
  }

  // 验证新密码
  const passwordValidation = validatePassword(formData.newPassword);
  if (!passwordValidation.valid) {
    result.isValid = false;
    result.errors.newPassword = passwordValidation.errors[0];
  }

  // 验证确认密码
  if (!formData.confirmPassword) {
    result.isValid = false;
    result.errors.confirmPassword = '请确认新密码';
  } else if (formData.newPassword !== formData.confirmPassword) {
    result.isValid = false;
    result.errors.confirmPassword = '两次密码输入不一致';
  }

  console.log('✅ Validation: 重置密码表单验证结果', result);
  return result;
}; 