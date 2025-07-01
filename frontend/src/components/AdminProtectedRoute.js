/**
 * 管理员路由保护组件
 * 验证管理员身份和权限
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  console.log('🛡️ [ADMIN_PROTECTED_ROUTE] 开始权限检查...');
  
  // 检查管理员Token
  const adminToken = localStorage.getItem('adminToken');
  const adminInfo = localStorage.getItem('adminInfo');
  
  console.log('🔑 [ADMIN_PROTECTED_ROUTE] adminToken:', adminToken ? '存在' : '不存在');
  console.log('👤 [ADMIN_PROTECTED_ROUTE] adminInfo:', adminInfo ? '存在' : '不存在');
  
  // 如果没有管理员Token，重定向到管理员登录页面
  if (!adminToken || !adminInfo) {
    console.log('❌ [ADMIN_PROTECTED_ROUTE] Token或用户信息缺失，重定向到登录页');
    return <Navigate to="/admin/login" replace />;
  }
  
  try {
    // 验证Token是否过期
    const parsedAdminInfo = JSON.parse(adminInfo);
    console.log('📋 [ADMIN_PROTECTED_ROUTE] 解析的管理员信息:', parsedAdminInfo);
    
    // 检查是否为管理员 - 修复：使用role字段而不是is_admin
    if (parsedAdminInfo.role !== 'admin') {
      console.log('❌ [ADMIN_PROTECTED_ROUTE] 用户角色不是管理员，当前角色:', parsedAdminInfo.role);
      return <Navigate to="/admin/login" replace />;
    }
    
    console.log('✅ [ADMIN_PROTECTED_ROUTE] 权限验证通过，允许访问');
    
    // TODO: 可以添加更详细的Token过期检查
    
    return children;
  } catch (error) {
    console.error('❌ [ADMIN_PROTECTED_ROUTE] 管理员信息解析失败:', error);
    return <Navigate to="/admin/login" replace />;
  }
};

export default AdminProtectedRoute; 