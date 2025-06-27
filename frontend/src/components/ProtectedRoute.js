/**
 * 路由保护组件
 * 检查用户认证状态，未登录时重定向到登录页
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

/**
 * 保护需要认证的路由
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @returns {React.ReactElement} 路由组件或重定向
 */
const ProtectedRoute = ({ children }) => {
  // 检查用户是否已认证
  if (!isAuthenticated()) {
    // 未认证时重定向到登录页
    return <Navigate to="/login" replace />;
  }

  // 已认证时渲染子组件
  return children;
};

export default ProtectedRoute; 