/**
 * 认证拦截器工具
 * 统一处理需要认证的操作，未登录时弹出认证Modal
 */

import { isAuthenticated } from './auth';

// 全局认证状态管理
let authModalHandler = null;

/**
 * 设置认证Modal处理器
 * @param {Function} handler - Modal处理函数
 */
export const setAuthModalHandler = (handler) => {
  authModalHandler = handler;
};

/**
 * 认证拦截器
 * @param {Function} action - 需要认证的操作
 * @param {Object} options - 配置选项
 * @returns {boolean} 是否已认证
 */
export const requireAuth = (action, options = {}) => {
  if (isAuthenticated()) {
    // 已登录，直接执行操作
    if (typeof action === 'function') {
      action();
    }
    return true;
  } else {
    // 未登录，弹出认证Modal
    if (authModalHandler) {
      authModalHandler({
        mode: options.preferRegister ? 'register' : 'login',
        onSuccess: () => {
          // 认证成功后执行操作
          if (typeof action === 'function') {
            action();
          }
        }
      });
    } else {
      console.warn('认证Modal处理器未设置，请调用setAuthModalHandler设置');
    }
    return false;
  }
};

/**
 * 创建需要认证的操作包装器
 * @param {Function} action - 需要认证的操作
 * @param {Object} options - 配置选项
 * @returns {Function} 包装后的操作函数
 */
export const withAuth = (action, options = {}) => {
  return (...args) => {
    return requireAuth(() => action(...args), options);
  };
};

/**
 * 预定义的需要认证的操作类型
 */
export const AUTH_ACTIONS = {
  CREATE_RESUME: 'create-resume',
  VIEW_TEMPLATES: 'view-templates',
  MY_RESUMES: 'my-resumes',
  PROFILE: 'profile',
  DOWNLOAD: 'download',
  SAVE: 'save'
};

/**
 * 检查特定操作是否需要认证
 * @param {string} actionType - 操作类型
 * @returns {boolean} 是否需要认证
 */
export const isAuthRequired = (actionType) => {
  // 所有操作都需要认证，除了浏览公开内容
  const publicActions = ['view-public-templates', 'view-samples'];
  return !publicActions.includes(actionType);
}; 