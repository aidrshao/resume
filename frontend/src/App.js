/**
 * React主应用组件
 * 配置应用路由和全局布局
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import logger from './utils/logger';
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
import AdminMembershipTiers from './components/AdminMembershipTiers';
import AdminUserMembershipManagement from './components/AdminUserMembershipManagement';
import AdminAIPromptManagement from './components/AdminAIPromptManagement';
import AdminGlobalQuotaManagement from './components/AdminGlobalQuotaManagement';
import TemplateManagement from './components/TemplateManagement';
import ResumeBuilder from './components/ResumeBuilder';
import MembershipPage from './components/MembershipPage';
import AdminProtectedRoute from './components/AdminProtectedRoute';

/**
 * 错误边界组件
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ [ERROR_BOUNDARY] 捕获到错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-red-600 mb-2">应用出现错误</h2>
            <p className="text-gray-600 mb-4">请刷新页面重试</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 主应用组件
 */
function App() {
  // 添加调试日志
  logger.info('应用启动，配置路由', {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
  
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
          {/* 首页 - Landing页面 */}
          <Route path="/" element={<LandingPage />} />
          
          {/* 独立的登录页面（保留，用于直接访问） */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* 独立的注册页面（保留，用于直接访问） */}
          <Route path="/register" element={<RegisterPage />} />
          
          {/* 模板测试页面 - 用于开发测试 */}
          
          
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
          <Route 
            path="/admin/membership-tiers" 
            element={
              <AdminProtectedRoute>
                <AdminMembershipTiers />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/user-memberships" 
            element={
              <AdminProtectedRoute>
                <AdminUserMembershipManagement />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/ai-prompts" 
            element={
              <AdminProtectedRoute>
                <AdminAIPromptManagement />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/global-quota-configs" 
            element={
              <AdminProtectedRoute>
                <AdminGlobalQuotaManagement />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/templates" 
            element={
              <AdminProtectedRoute>
                <TemplateManagement />
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
          
          {/* 会员中心 - 需要认证 */}
          <Route 
            path="/membership" 
            element={
              <ProtectedRoute>
                <MembershipPage />
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
          
          {/* 简历生成器页面 - 需要认证 */}
          <Route 
            path="/resumes/new" 
            element={
              <ProtectedRoute>
                <ResumeBuilder />
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
    </ErrorBoundary>
  );
}

export default App; 