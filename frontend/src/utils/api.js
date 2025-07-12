/**
 * API请求工具
 * 封装axios请求，统一处理认证和错误
 */

import axios from 'axios';
import logger from './logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// 导出API基础URL
export { API_BASE_URL };

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 增加到60秒，支持AI处理的长时间请求
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加重试机制
const retryRequest = async (config, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await api(config);
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // 如果是连接拒绝或网络错误，进行重试
      if (error.message.includes('ERR_CONNECTION_REFUSED') || 
          error.message.includes('Network Error') ||
          error.message.includes('ERR_NETWORK')) {
        console.warn(`⚠️ [API_RETRY] 第${i + 1}次重试失败，${delay}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 指数退避
      } else {
        throw error;
      }
    }
  }
};

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 记录请求开始时间
    config.metadata = { startTime: Date.now() };
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 使用logger记录关键信息
    logger.apiCall(config.method, config.url, 'REQUEST', 0, {
      hasToken: !!token,
      url: config.baseURL + config.url
    });
    
    return config;
  },
  (error) => {
    logger.error('API请求配置错误', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const endTime = Date.now();
    const startTime = response.config.metadata?.startTime || endTime;
    const duration = endTime - startTime;
    
    // 使用logger记录响应信息
    logger.apiCall(response.config.method, response.config.url, response.status, duration, {
      success: true,
      dataSize: JSON.stringify(response.data).length + ' bytes',
      responseData: response.data
    });
    
    // 如果耗时超过200ms，记录警告
    if (duration > 200) {
      logger.warn('API请求耗时较长', {
        duration: duration + 'ms',
        url: response.config.url
      });
    }
    
    return response;
  },
  (error) => {
    const endTime = Date.now();
    const startTime = error.config?.metadata?.startTime || endTime;
    const duration = endTime - startTime;
    
    // 使用logger记录错误信息
    logger.error('API请求失败', {
      message: error.message,
      name: error.name,
      duration: duration + 'ms',
      url: error.config?.url,
      method: error.config?.method
    });
    
    // 详细的错误分析
    if (error.response) {
      logger.error('服务器响应错误', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
      
      // 处理未授权/令牌无效错误
      const status = error.response.status;
      const errCode = error.response.data?.error_code;
      if (
        status === 401 ||
        (status === 403 && ['TOKEN_MALFORMED', 'TOKEN_INVALID', 'TOKEN_EXPIRED'].includes(errCode))
      ) {
        logger.auth('检测到鉴权失败，清除认证信息', {
          url: error.config?.url,
          status,
          errorCode: errCode
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      logger.error('网络连接错误', {
        readyState: error.request.readyState,
        statusText: error.request.statusText,
        url: error.config?.url
      });
      
      // 检查是否是连接中断
      if (error.message.includes('Network Error') || 
          error.message.includes('ERR_NETWORK') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        logger.error('网络连接中断', { message: error.message });
        error.userMessage = '网络连接中断，请检查网络后重试';
      }
      
      // 检查是否是超时
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        logger.error('请求超时', { code: error.code, message: error.message });
        error.userMessage = '请求超时，请稍后重试';
      }
      
      // 检查是否是连接拒绝
      if (error.message.includes('ERR_CONNECTION_REFUSED')) {
        logger.error('连接被拒绝', { message: error.message });
        error.userMessage = '无法连接到服务器，请检查网络连接后重试';
      }
    } else {
      logger.error('其他API错误', {
        config: error.config,
        stack: error.stack
      });
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
  logger.auth('发送登录请求', { email: credentials.email });
  return api.post('/auth/login', credentials).then(response => {
    logger.auth('登录API响应成功', { email: credentials.email, success: response.data.success });
    return response.data;
  }).catch(error => {
    logger.authError('登录API响应失败', error);
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

/**
 * 检查专属简历是否存在
 * @param {Object} data - 检查参数
 * @param {number} data.baseResumeId - 基础简历ID
 * @param {number} data.targetJobId - 目标岗位ID
 * @returns {Promise} API响应
 */
export const checkCustomizedResumeExists = (data) => {
  console.log('🔍 API: 检查专属简历是否存在', data);
  return api.get('/resumes/customize/check', { params: data }).then(response => {
    console.log('✅ [CHECK_CUSTOMIZED_RESUME] API响应成功:', response.data);
    return response.data;
  }).catch(error => {
    console.error('❌ [CHECK_CUSTOMIZED_RESUME] API响应失败:', error);
    throw error;
  });
};

/**
 * 生成定制简历
 * @param {Object} data - 生成参数
 * @param {number} data.baseResumeId - 基础简历ID
 * @param {number} data.targetJobId - 目标岗位ID
 * @param {boolean} data.forceOverwrite - 是否强制覆盖
 * @returns {Promise<Object>} 响应数据
 */
export const customizeResume = (data) => {
  console.log('🌐 API: 生成定制简历', data);
  
  // 记录开始时间
  const startTime = Date.now();
  const requestId = `CUSTOMIZE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`🚀 [CUSTOMIZE_API] 开始请求 - ID: ${requestId}`);
  console.log(`📊 [CUSTOMIZE_API] 参数:`, {
    baseResumeId: data.baseResumeId,
    targetJobId: data.targetJobId,
    forceOverwrite: data.forceOverwrite,
    timestamp: new Date().toISOString()
  });
  
  // 创建取消令牌
  const source = axios.CancelToken.source();
  
  // 设置5分钟超时（300秒）
  const timeout = 300000;
  
  console.log(`⏱️ [CUSTOMIZE_API] 超时设置: ${timeout}ms (${timeout/1000}秒)`);
  
  // 定时器：每30秒输出一次进度
  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    console.log(`⏳ [CUSTOMIZE_API] 进行中... 已耗时: ${elapsed}ms (${(elapsed/1000).toFixed(1)}秒)`);
  }, 30000);
  
  return api.post('/resumes/customize', data, {
    timeout: timeout,
    cancelToken: source.token,
    // 添加请求头标识
    headers: {
      'X-Request-ID': requestId,
      'X-Request-Type': 'customize-resume'
    }
  }).then(response => {
    clearInterval(progressInterval);
    const duration = Date.now() - startTime;
    
    console.log(`✅ [CUSTOMIZE_RESUME] API响应成功: ${JSON.stringify(response.data)}`);
    console.log(`⏱️ [CUSTOMIZE_API] 总耗时: ${duration}ms (${(duration/1000).toFixed(1)}秒)`);
    console.log(`📊 [CUSTOMIZE_API] 性能统计:`, {
      requestId: requestId,
      duration: duration,
      success: true,
      responseSize: JSON.stringify(response.data).length
    });
    
    return response.data;
  }).catch(error => {
    clearInterval(progressInterval);
    const duration = Date.now() - startTime;
    
    console.error(`❌ [CUSTOMIZE_RESUME] API响应失败: ${error.constructor.name}`);
    console.error(`❌ [CUSTOMIZE_API] 错误详情:`, {
      requestId: requestId,
      duration: duration,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      isTimeout: error.code === 'ECONNABORTED' && error.message.includes('timeout'),
      isCancelled: axios.isCancel(error)
    });
    
    // 增强错误信息
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error(`⏰ [CUSTOMIZE_API] 请求超时 - 耗时: ${duration}ms, 超时设置: ${timeout}ms`);
      error.message = `定制简历生成超时 (${(duration/1000).toFixed(1)}秒)。AI优化过程通常需要2-5分钟，请稍后再试。`;
    }
    
    throw error;
  });
};

/**
 * 获取定制简历列表
 * @param {Object} params - 查询参数
 * @returns {Promise} API响应
 */
export const getCustomizedResumes = (params = {}) => {
  console.log('🌐 API: 获取定制简历列表', params);
  return api.get('/customized-resumes', { params }).then(response => {
    console.log('✅ [GET_CUSTOMIZED_RESUMES] API响应成功:', response.data);
    return response.data;
  }).catch(error => {
    console.error('❌ [GET_CUSTOMIZED_RESUMES] API响应失败:', error);
    throw error;
  });
};

/**
 * 获取定制简历详情
 * @param {number} customizedResumeId - 定制简历ID
 * @returns {Promise} API响应
 */
export const getCustomizedResumeById = (customizedResumeId) => {
  console.log('🌐 API: 获取定制简历详情', customizedResumeId);
  return api.get(`/customized-resumes/${customizedResumeId}`).then(response => {
    console.log('✅ [GET_CUSTOMIZED_RESUME] API响应成功:', response.data);
    return response.data;
  }).catch(error => {
    console.error('❌ [GET_CUSTOMIZED_RESUME] API响应失败:', error);
    throw error;
  });
};

/**
 * 删除定制简历
 * @param {number} customizedResumeId - 定制简历ID
 * @returns {Promise} API响应
 */
export const deleteCustomizedResume = (customizedResumeId) => {
  console.log('🌐 API: 删除定制简历', customizedResumeId);
  return api.delete(`/customized-resumes/${customizedResumeId}`).then(response => {
    console.log('✅ [DELETE_CUSTOMIZED_RESUME] API响应成功:', response.data);
    return response.data;
  }).catch(error => {
    console.error('❌ [DELETE_CUSTOMIZED_RESUME] API响应失败:', error);
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

// ===== 新的模板API接口 =====

/**
 * 获取已发布的模板列表
 * @returns {Promise} API响应
 */
export const getTemplatesList = () => api.get('/templates');

/**
 * Get a single template by its ID.
 * @param {string} id The ID of the template.
 * @returns {Promise<Object>} The server response.
 */
export const getTemplateById = (id) => api.get(`/templates/${id}`);

// New functions for billing and plans
/**
 * Fetches the current user's active plan and quotas.
 * @returns {Promise<Object>} The server response.
 */
export const getCurrentUserPlan = () => api.get('/auth/me/plan');

/**
 * Fetches all available subscription plans and top-up packs.
 * @returns {Promise<Object>} The server response.
 */
export const getAvailableProducts = () => api.get('/billing/products');

/**
 * Changes the user's password.
 * @param {object} passwordData The password data ({ currentPassword, newPassword }).
 * @returns {Promise<Object>} The server response.
 */
export const changePassword = (passwordData) => api.post('/profile/change-password', passwordData);

/**
 * Uploads a new user avatar.
 * @param {FormData} formData The form data containing the avatar file.
 * @returns {Promise<Object>} The server response.
 */
export const uploadAvatar = (formData) => api.post('/profile/upload-avatar', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

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

// ===== V2 简历解析 API =====

/**
 * V2 简历解析 - 上传文件并创建解析任务
 * @param {File} file - 简历文件
 * @returns {Promise} API响应，包含taskId
 */
export const parseResumeV2 = (file) => {
  logger.info('V2简历解析开始', { 
    fileName: file.name, 
    fileSize: file.size,
    fileType: file.type 
  });
  
  const formData = new FormData();
  formData.append('resume', file);
  
  return api.post('/v2/resumes/parse', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000, // 2分钟超时
  }).then(response => {
    logger.info('V2简历解析请求成功', { 
      taskId: response.data.data?.taskId,
      status: response.data.data?.status 
    });
    return response.data;
  }).catch(error => {
    logger.error('V2简历解析请求失败', error);
    throw error;
  });
};

/**
 * V2 简历解析 - 查询任务状态
 * @param {string} taskId - 任务ID
 * @returns {Promise} API响应，包含任务状态
 */
export const getTaskStatusV2 = async (taskId) => {
  try {
    const response = await retryRequest({
      method: 'get',
      url: `/v2/tasks/${taskId}/status`
    });
    
    logger.info('V2任务状态查询', { 
      taskId, 
      status: response.data.data?.status,
      progress: response.data.data?.progress 
    });
    return response.data;
  } catch (error) {
    logger.error('V2任务状态查询失败', { taskId, error: error.message });
    throw error;
  }
};

/**
 * V2 简历解析 - 获取解析结果
 * @param {string} taskId - 任务ID
 * @returns {Promise} API响应，包含解析结果
 */
export const getTaskResultV2 = (taskId) => {
  logger.info('V2解析结果获取开始', { taskId });
  
  return api.get(`/v2/tasks/${taskId}/result`).then(response => {
    logger.info('V2解析结果获取成功', { 
      taskId,
      dataSize: JSON.stringify(response.data.data?.resume_data || {}).length 
    });
    return response.data;
  }).catch(error => {
    logger.error('V2解析结果获取失败', { taskId, error: error.message });
    throw error;
  });
};

/**
 * 保存基础简历 - 将编辑后的简历数据保存为用户的基础简历
 * @param {Object} resumeData - 简历数据（符合UNIFIED_RESUME_SCHEMA格式）
 * @returns {Promise} API响应
 */
export const saveBaseResume = (resumeData) => {
  logger.info('保存基础简历开始', { 
    hasProfile: !!resumeData.profile,
    workExperienceCount: resumeData.workExperience?.length || 0,
    educationCount: resumeData.education?.length || 0 
  });
  
  // 🔧 修复：确保传递给后端的格式正确
  const requestData = {
    content: resumeData  // 后端期望的是 { content: ... } 格式
  };
  
  return api.post('/resumes/save-base', requestData).then(response => {
    logger.info('基础简历保存成功', { 
      success: response.data.success,
      resumeId: response.data.data?.resumeId 
    });
    return response.data;
  }).catch(error => {
    logger.error('基础简历保存失败', { error: error.message });
    throw error;
  });
};

export default api;
