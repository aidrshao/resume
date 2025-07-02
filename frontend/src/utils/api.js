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

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('🔐 [API请求拦截器] 开始处理请求');
    console.log('🔐 [API请求拦截器] 请求URL:', config.url);
    console.log('🔐 [API请求拦截器] 请求方法:', config.method);
    console.log('🔐 [API请求拦截器] localStorage中的token:', localStorage.getItem('token') ? localStorage.getItem('token').substring(0, 20) + '...' : '无');
    
    // 记录请求开始时间
    config.metadata = { startTime: Date.now() };
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ [API请求拦截器] 已添加Authorization头');
    } else {
      console.log('⚠️ [API请求拦截器] 没有找到token');
    }
    
    console.log('🔐 [API请求拦截器] 最终请求头:', JSON.stringify(config.headers, null, 2));
    console.log('🌐 [API请求拦截器] 发送请求到:', config.baseURL + config.url);
    
    return config;
  },
  (error) => {
    console.error('❌ [API请求拦截器] 请求配置错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const endTime = Date.now();
    const startTime = response.config.metadata?.startTime || endTime;
    const duration = endTime - startTime;
    
    console.log('✅ [API响应拦截器] 请求成功');
    console.log('✅ [API响应拦截器] 状态码:', response.status);
    console.log('✅ [API响应拦截器] 响应数据:', response.data);
    console.log('📊 [API响应拦截器] 网络请求耗时:', duration + 'ms');
    console.log('📊 [API响应拦截器] 响应大小:', JSON.stringify(response.data).length + ' bytes');
    
    // 如果耗时超过200ms，记录警告
    if (duration > 200) {
      console.warn('⚠️ [API响应拦截器] 请求耗时较长:', duration + 'ms');
      console.warn('⚠️ [API响应拦截器] 请求URL:', response.config.url);
    }
    
    return response;
  },
  (error) => {
    const endTime = Date.now();
    const startTime = error.config?.metadata?.startTime || endTime;
    const duration = endTime - startTime;
    
    console.error('❌ [API响应拦截器] 请求失败');
    console.error('❌ [API响应拦截器] 错误信息:', error.message);
    console.error('❌ [API响应拦截器] 错误类型:', error.name);
    console.error('❌ [API响应拦截器] 网络请求耗时:', duration + 'ms');
    
    // 详细的错误分析
    if (error.response) {
      console.error('❌ [API响应拦截器] 服务器响应错误');
      console.error('❌ [API响应拦截器] 响应状态码:', error.response.status);
      console.error('❌ [API响应拦截器] 响应数据:', error.response.data);
      console.error('❌ [API响应拦截器] 响应头:', error.response.headers);
      
      // 处理401未授权错误
      if (error.response.status === 401) {
        console.log('🔐 [API响应拦截器] 检测到401错误，清除token并跳转到登录页');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('❌ [API响应拦截器] 网络连接错误，没有收到响应');
      console.error('❌ [API响应拦截器] 请求状态:', error.request.readyState);
      console.error('❌ [API响应拦截器] 请求状态文本:', error.request.statusText);
      console.error('❌ [API响应拦截器] 请求URL:', error.config?.url);
      
      // 检查是否是连接中断
      if (error.message.includes('Network Error') || 
          error.message.includes('ERR_NETWORK') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        console.error('🌐 [API响应拦截器] 网络连接中断');
        error.userMessage = '网络连接中断，请检查网络后重试';
      }
      
      // 检查是否是超时
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error('⏰ [API响应拦截器] 请求超时');
        error.userMessage = '请求超时，请稍后重试';
      }
      
      // 检查是否是连接拒绝
      if (error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.error('🚫 [API响应拦截器] 连接被拒绝');
        error.userMessage = '无法连接到服务器，请联系技术支持';
      }
    } else {
      console.error('❌ [API响应拦截器] 其他错误');
      console.error('❌ [API响应拦截器] 错误配置:', error.config);
      console.error('❌ [API响应拦截器] 错误堆栈:', error.stack);
    }
    
    // 添加错误发生的时间戳
    error.timestamp = new Date().toISOString();
    error.duration = duration;
    
    return Promise.reject(error);
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
  return api.post('/auth/login', credentials).then(response => {
    console.log('✅ [LOGIN] API响应成功:', response.data);
    return response.data;
  }).catch(error => {
    console.error('❌ [LOGIN] API响应失败:', error);
    throw error;
  });
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
  return api.post('/auth/send-code', data).then(response => {
    console.log('✅ [SEND_CODE] API响应成功:', response.data);
    return response.data;
  }).catch(error => {
    console.error('❌ [SEND_CODE] API响应失败:', error);
    throw error;
  });
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
  return api.post('/auth/login-with-code', credentials).then(response => {
    console.log('✅ [LOGIN_WITH_CODE] API响应成功:', response.data);
    return response.data;
  }).catch(error => {
    console.error('❌ [LOGIN_WITH_CODE] API响应失败:', error);
    throw error;
  });
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
  return api.get('/jobs', { params }).then(response => {
    // 返回实际的数据内容，而不是完整的axios响应
    return response.data;
  });
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
  return api.post('/jobs', jobData).then(response => {
    console.log('✅ [CREATE_JOB] API响应成功:', response.data);
    return response.data;
  }).catch(error => {
    console.error('❌ [CREATE_JOB] API响应失败:', error);
    throw error;
  });
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
  }).then(response => {
    console.log('✅ [UPLOAD_JOB] API响应成功:', response.data);
    return response.data;
  }).catch(error => {
    console.error('❌ [UPLOAD_JOB] API响应失败:', error);
    throw error;
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
  return api.put(`/jobs/${jobId}`, updateData).then(response => {
    return response.data;
  });
};

/**
 * 删除岗位
 * @param {number} jobId - 岗位ID
 * @returns {Promise} API响应
 */
export const deleteJob = (jobId) => {
  console.log('🌐 API: 删除岗位', jobId);
  return api.delete(`/jobs/${jobId}`).then(response => {
    return response.data;
  });
};

/**
 * 批量更新岗位状态
 * @param {Array} jobIds - 岗位ID数组
 * @param {string} status - 新状态
 * @returns {Promise} API响应
 */
export const batchUpdateJobStatus = (jobIds, status) => {
  console.log('🌐 API: 批量更新岗位状态', jobIds, status);
  return api.patch('/jobs/batch-status', { job_ids: jobIds, status }).then(response => {
    return response.data;
  });
};

/**
 * 获取岗位统计信息
 * @returns {Promise} API响应
 */
export const getJobStats = () => {
  console.log('🌐 API: 获取岗位统计');
  return api.get('/jobs/stats').then(response => {
    return response.data;
  });
};

// ===== 简历管理相关API =====

/**
 * 获取简历列表
 * @param {Object} params - 查询参数
 * @returns {Promise} API响应
 */
export const getResumes = (params = {}) => {
  const startTime = Date.now();
  const performanceId = `getResumes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('🌐 API: 获取简历列表', params);
  console.log('📊 [FRONTEND_PERFORMANCE] 开始时间:', new Date().toISOString());
  console.log('📊 [FRONTEND_PERFORMANCE] 性能ID:', performanceId);
  
  // 记录axios请求开始时间
  const axiosStartTime = Date.now();
  console.log('🌐 [AXIOS_REQUEST] 开始发送axios请求:', axiosStartTime);
  
  return api.get('/resumes', { params }).then(response => {
    const axiosEndTime = Date.now();
    const axiosDuration = axiosEndTime - axiosStartTime;
    console.log('🌐 [AXIOS_REQUEST] axios请求完成，耗时:', axiosDuration + 'ms');
    
    // 数据处理开始
    const processStartTime = Date.now();
    console.log('🔄 [DATA_PROCESSING] 开始处理响应数据:', processStartTime);
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    const processDuration = endTime - processStartTime;
    
    console.log('✅ [FRONTEND_PERFORMANCE] 简历列表请求完成');
    console.log('📊 [FRONTEND_PERFORMANCE] 总耗时:', totalDuration + 'ms');
    console.log('📊 [FRONTEND_PERFORMANCE] axios耗时:', axiosDuration + 'ms');
    console.log('📊 [FRONTEND_PERFORMANCE] 数据处理耗时:', processDuration + 'ms');
    console.log('📊 [FRONTEND_PERFORMANCE] 响应数据大小:', JSON.stringify(response).length + ' bytes');
    console.log('📊 [FRONTEND_PERFORMANCE] 响应数据:', response);
    console.log('📊 [FRONTEND_PERFORMANCE] 性能ID:', performanceId);
    
    // 性能警告
    if (totalDuration > 200) {
      console.warn('⚠️ [PERFORMANCE_WARNING] 请求总耗时超过200ms:', totalDuration + 'ms');
      console.warn('⚠️ [PERFORMANCE_WARNING] axios耗时:', axiosDuration + 'ms');
      console.warn('⚠️ [PERFORMANCE_WARNING] 数据处理耗时:', processDuration + 'ms');
    }
    
    // 返回实际的数据内容，而不是完整的axios响应
    return response.data;
  }).catch(error => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error('❌ [FRONTEND_PERFORMANCE] 简历列表请求失败，耗时:', duration + 'ms');
    console.error('❌ [FRONTEND_PERFORMANCE] 性能ID:', performanceId);
    console.error('❌ [FRONTEND_PERFORMANCE] 错误:', error);
    throw error;
  });
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
  return api.post('/resumes/generate-for-job', data).then(response => {
    console.log('✅ [GENERATE_RESUME] API响应成功:', response.data);
    return response.data;
  }).catch(error => {
    console.error('❌ [GENERATE_RESUME] API响应失败:', error);
    throw error;
  });
};

// ===== 简历模板渲染相关API =====

/**
 * 获取所有简历模板
 * @returns {Promise} API响应
 */
export const getResumeTemplates = () => {
  console.log('🎨 [模板API] 开始获取简历模板列表');
  return api.get('/resume-render/templates');
};

/**
 * 生成简历预览HTML
 * @param {Object} data - 预览参数
 * @param {number} data.resumeId - 简历ID
 * @param {number} data.templateId - 模板ID
 * @returns {Promise} API响应
 */
export const generateResumePreview = (data) => {
  console.log('🎨 [模板API] 开始生成简历预览', data);
  return api.post('/resume-render/preview', data);
};

/**
 * 生成简历PDF
 * @param {Object} data - PDF生成参数
 * @param {number} data.resumeId - 简历ID
 * @param {number} data.templateId - 模板ID
 * @returns {Promise} API响应
 */
export const generateResumePDF = (data) => {
  console.log('🎨 [模板API] 开始生成简历PDF', data);
  return api.post('/resume-render/pdf', data);
};

/**
 * 下载简历PDF
 * @param {string} filename - PDF文件名
 * @returns {Promise} API响应
 */
export const downloadResumePDF = (filename) => {
  console.log('🎨 [模板API] 开始下载简历PDF', filename);
  return api.get(`/resume-render/download/${filename}`, {
    responseType: 'blob'
  });
};

export default api;
