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
 * 检查JWT token的基本格式
 * @param {string} token - JWT token
 * @returns {boolean} token格式是否有效
 */
const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  // JWT应该有3个部分，用.分隔
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // 简单检查payload是否可以解码（不验证签名）
    const payload = JSON.parse(atob(parts[1]));
    
    // 检查是否有必要字段和未过期
    if (!payload.userId || !payload.exp) return false;
    
    // 检查是否过期
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.log('🔑 Token已过期');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('🔑 Token格式验证失败:', error);
    return false;
  }
};

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  
  // 检查基本存在性
  if (!token || !user) {
    return false;
  }
  
  // 检查token格式和有效期
  if (!isValidTokenFormat(token)) {
    console.log('🔑 Token无效，清除认证信息');
    clearAuthData();
    return false;
  }
  
  return true;
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