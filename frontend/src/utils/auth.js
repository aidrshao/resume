/**
 * 前端认证工具
 * 处理用户认证状态管理
 */

/**
 * 保存用户登录信息
 * @param {string} token - JWT token
 * @param {Object} user - 用户信息
 */
export const saveAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * 获取保存的token
 * @returns {string|null} JWT token
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * 获取保存的用户信息
 * @returns {Object|null} 用户信息
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('解析用户信息失败:', error);
    return null;
  }
};

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

/**
 * 清除认证信息
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * 用户登出
 */
export const logout = () => {
  clearAuthData();
  window.location.href = '/login';
}; 