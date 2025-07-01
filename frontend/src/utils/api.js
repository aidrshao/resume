/**
 * API请求工具
 * 封装axios请求，统一处理认证和错误
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// 导出API基础URL
export { API_BASE_URL };

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
 * 发送验证码
 * @param {Object} data - 发送参数
 * @param {string} data.email - 邮箱
 * @param {string} data.type - 验证码类型 (register/login/reset)
 * @returns {Promise} API响应
 */
export const sendVerificationCode = (data) => {
  console.log('🌐 API: 发送验证码请求', data);
  return api.post('/auth/send-code', data);
};

/**
 * 验证码登录
 * @param {Object} credentials - 登录凭据
 * @param {string} credentials.email - 邮箱
 * @param {string} credentials.code - 验证码
 * @returns {Promise} API响应
 */
export const loginWithCode = (credentials) => {
  console.log('🌐 API: 发送验证码登录请求', credentials);
  return api.post('/auth/login-with-code', credentials);
};

/**
 * 验证邮箱验证码
 * @param {Object} data - 验证参数
 * @param {string} data.email - 邮箱
 * @param {string} data.code - 验证码
 * @param {string} data.type - 验证码类型
 * @returns {Promise} API响应
 */
export const verifyEmailCode = (data) => {
  console.log('🌐 API: 发送验证码验证请求', data);
  return api.post('/auth/verify-code', data);
};

/**
 * 重置密码
 * @param {Object} data - 重置参数
 * @param {string} data.email - 邮箱
 * @param {string} data.code - 验证码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise} API响应
 */
export const resetPassword = (data) => {
  console.log('🌐 API: 发送重置密码请求', data);
  return api.post('/auth/reset-password', data);
};

/**
 * 获取用户信息
 * @returns {Promise} API响应
 */
export const getUserProfile = () => {
  return api.get('/profile');
};

// ===== 岗位管理相关API =====

/**
 * 获取岗位列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.status - 状态过滤
 * @param {number} params.priority - 优先级过滤
 * @param {string} params.search - 搜索关键词
 * @returns {Promise} API响应
 */
export const getJobs = (params = {}) => {
  console.log('🌐 API: 获取岗位列表', params);
  return api.get('/jobs', { params });
};

/**
 * 获取岗位详情
 * @param {number} jobId - 岗位ID
 * @returns {Promise} API响应
 */
export const getJobById = (jobId) => {
  console.log('🌐 API: 获取岗位详情', jobId);
  return api.get(`/jobs/${jobId}`);
};

/**
 * 创建新岗位（文本输入）
 * @param {Object} jobData - 岗位数据
 * @param {string} jobData.title - 职位名称
 * @param {string} jobData.company - 公司名称
 * @param {string} jobData.description - 职位描述
 * @param {string} jobData.requirements - 岗位要求
 * @param {string} jobData.salary_range - 薪资范围
 * @param {string} jobData.location - 工作地点
 * @param {string} jobData.job_type - 工作类型
 * @param {number} jobData.priority - 优先级
 * @param {string} jobData.application_deadline - 申请截止日期
 * @param {string} jobData.notes - 备注
 * @returns {Promise} API响应
 */
export const createJob = (jobData) => {
  console.log('🌐 API: 创建新岗位', jobData);
  return api.post('/jobs', jobData);
};

/**
 * 上传文件创建岗位
 * @param {FormData} formData - 包含文件和基本信息的FormData对象
 * @returns {Promise} API响应
 */
export const uploadJobFile = (formData) => {
  console.log('🌐 API: 上传岗位文件');
  return api.post('/jobs/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 更新岗位信息
 * @param {number} jobId - 岗位ID
 * @param {Object} updateData - 要更新的数据
 * @returns {Promise} API响应
 */
export const updateJob = (jobId, updateData) => {
  console.log('🌐 API: 更新岗位信息', jobId, updateData);
  return api.put(`/jobs/${jobId}`, updateData);
};

/**
 * 删除岗位
 * @param {number} jobId - 岗位ID
 * @returns {Promise} API响应
 */
export const deleteJob = (jobId) => {
  console.log('🌐 API: 删除岗位', jobId);
  return api.delete(`/jobs/${jobId}`);
};

/**
 * 批量更新岗位状态
 * @param {Array} jobIds - 岗位ID数组
 * @param {string} status - 新状态
 * @returns {Promise} API响应
 */
export const batchUpdateJobStatus = (jobIds, status) => {
  console.log('🌐 API: 批量更新岗位状态', jobIds, status);
  return api.patch('/jobs/batch-status', { job_ids: jobIds, status });
};

/**
 * 获取岗位统计信息
 * @returns {Promise} API响应
 */
export const getJobStats = () => {
  console.log('🌐 API: 获取岗位统计');
  return api.get('/jobs/stats');
};

// ===== 简历管理相关API =====

/**
 * 获取简历列表
 * @param {Object} params - 查询参数
 * @returns {Promise} API响应
 */
export const getResumes = (params = {}) => {
  console.log('🌐 API: 获取简历列表', params);
  return api.get('/resumes', { params });
};

/**
 * 获取简历详情
 * @param {number} resumeId - 简历ID
 * @returns {Promise} API响应
 */
export const getResumeById = (resumeId) => {
  console.log('🌐 API: 获取简历详情', resumeId);
  return api.get(`/resumes/${resumeId}`);
};

/**
 * 创建新简历
 * @param {Object} resumeData - 简历数据
 * @returns {Promise} API响应
 */
export const createResume = (resumeData) => {
  console.log('🌐 API: 创建新简历', resumeData);
  return api.post('/resumes', resumeData);
};

/**
 * 更新简历信息
 * @param {number} resumeId - 简历ID
 * @param {Object} updateData - 要更新的数据
 * @returns {Promise} API响应
 */
export const updateResume = (resumeId, updateData) => {
  console.log('🌐 API: 更新简历信息', resumeId, updateData);
  return api.put(`/resumes/${resumeId}`, updateData);
};

/**
 * 删除简历
 * @param {number} resumeId - 简历ID
 * @returns {Promise} API响应
 */
export const deleteResume = (resumeId) => {
  console.log('🌐 API: 删除简历', resumeId);
  return api.delete(`/resumes/${resumeId}`);
};

/**
 * 生成岗位专属简历
 * @param {Object} data - 生成参数
 * @param {number} data.baseResumeId - 基础简历ID
 * @param {string} data.targetCompany - 目标公司
 * @param {string} data.targetPosition - 目标职位
 * @param {string} data.userRequirements - 用户额外要求
 * @returns {Promise} API响应
 */
export const generateJobSpecificResume = (data) => {
  console.log('🌐 API: 生成岗位专属简历', data);
  return api.post('/resumes/generate-for-job', data);
};

export default api; 