/**
 * API请求工具
 * 封装axios请求，统一处理认证和错误
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // token过期或无效，清除本地存储并跳转登录
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const errorMessage = error.response?.data?.message || '网络请求失败';
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * 用户注册
 * @param {Object} userData - 用户数据
 * @param {string} userData.email - 邮箱
 * @param {string} userData.password - 密码
 * @returns {Promise} API响应
 */
export const register = (userData) => {
  console.log('🌐 API: 发送注册请求', userData);
  return api.post('/auth/register', userData);
};

/**
 * 用户登录
 * @param {Object} credentials - 登录凭据
 * @param {string} credentials.email - 邮箱
 * @param {string} credentials.password - 密码
 * @returns {Promise} API响应
 */
export const login = (credentials) => {
  console.log('🌐 API: 发送登录请求', credentials);
  return api.post('/auth/login', credentials);
};

/**
 * 获取用户信息
 * @returns {Promise} API响应
 */
export const getUserProfile = () => {
  return api.get('/profile');
};

export default api; 