/**
 * React主应用组件
 * 配置应用路由和全局布局
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated } from './utils/auth';

/**
 * 首页组件
 */
const HomePage = () => {
  const userLoggedIn = isAuthenticated();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          简历管理系统
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          欢迎使用我们的简历管理平台
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {userLoggedIn ? (
            <div className="text-center space-y-4">
              <p className="text-gray-700">您已登录系统</p>
              <div className="space-y-3">
                <a
                  href="/profile"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  前往用户中心
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-700">请登录或注册以使用系统功能</p>
              <div className="space-y-3">
                <a
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  登录
                </a>
                <a
                  href="/register"
                  className="w-full flex justify-center py-2 px-4 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  注册新账户
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 主应用组件
 */
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 首页 */}
          <Route path="/" element={<HomePage />} />
          
          {/* 登录页 */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* 注册页 */}
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
          
          {/* 404重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 