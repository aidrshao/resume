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
import AIChatPage from './components/AIChatPage';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * 主应用组件
 */
function App() {
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
          
          {/* AI对话页面 - 需要认证 */}
          <Route 
            path="/ai-chat" 
            element={
              <ProtectedRoute>
                <AIChatPage />
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