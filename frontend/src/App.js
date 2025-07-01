/**
 * React主应用组件
 * 配置应用路由和全局布局
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/ProfilePage';
import ResumeDashboard from './components/ResumeDashboard';
import ResumeView from './components/ResumeView';
import ResumeEdit from './components/ResumeEdit';
import AIChatPage from './components/AIChatPage';
import JobsPage from './components/JobsPage';
import ProtectedRoute from './components/ProtectedRoute';
// 管理员相关组件
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminUserManagement from './components/AdminUserManagement';
import AdminProtectedRoute from './components/AdminProtectedRoute';

/**
 * 主应用组件
 */
function App() {
  // 添加调试日志
  console.log('🚀 [APP] 应用启动，配置路由...');
  
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 首页 - Landing页面 */}
          <Route path="/" element={<LandingPage />} />
          
          {/* 独立的登录页面（保留，用于直接访问） */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* 独立的注册页面（保留，用于直接访问） */}
          <Route path="/register" element={<RegisterPage />} />
          
          {/* 管理员路由 */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminProtectedRoute>
                <AdminUserManagement />
              </AdminProtectedRoute>
            } 
          />
          
          {/* 用户中心 - 需要认证 */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          
          {/* 简历管理页面 - 需要认证 */}
          <Route 
            path="/resumes" 
            element={
              <ProtectedRoute>
                <ResumeDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* 简历查看页面 - 需要认证 */}
          <Route 
            path="/resume/:id" 
            element={
              <ProtectedRoute>
                <ResumeView />
              </ProtectedRoute>
            } 
          />
          
          {/* 简历编辑页面 - 需要认证 */}
          <Route 
            path="/resume/:id/edit" 
            element={
              <ProtectedRoute>
                <ResumeEdit />
              </ProtectedRoute>
            } 
          />
          
          {/* AI对话页面 - 需要认证 */}
          <Route 
            path="/ai-chat" 
            element={
              <ProtectedRoute>
                <AIChatPage />
              </ProtectedRoute>
            } 
          />
          
          {/* 岗位管理页面 - 需要认证 */}
          <Route 
            path="/jobs" 
            element={
              <ProtectedRoute>
                <JobsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* 创建简历页面 - 需要认证（重定向到简历管理） */}
          <Route 
            path="/create-resume" 
            element={
              <ProtectedRoute>
                <Navigate to="/resumes" replace />
              </ProtectedRoute>
            } 
          />
          
          {/* 模板页面 - 需要认证（重定向到简历管理） */}
          <Route 
            path="/templates" 
            element={
              <ProtectedRoute>
                <Navigate to="/resumes" replace />
              </ProtectedRoute>
            } 
          />
          
          {/* 404重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 