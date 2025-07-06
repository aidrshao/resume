/**
 * Landing页面 - 俊才AI简历产品首页
 * 突出产品价值和流程，直接引导用户到V2简历解析流程
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser, logout } from '../utils/auth';
import AuthModal from './AuthModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const userLoggedIn = isAuthenticated();
  const user = getUser();
  
  // Modal状态管理
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  
  // 待执行的操作（用于登录后继续执行）
  const [pendingAction, setPendingAction] = useState(null);

  /**
   * 处理注册按钮点击
   */
  const handleRegisterClick = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  /**
   * 处理登录成功回调
   */
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    
    // 如果有待执行的操作，执行它
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      
      // 延迟执行，确保状态已更新
      setTimeout(() => {
        action();
      }, 100);
    } else {
      // 没有待执行操作，跳转到简历列表
      navigate('/resumes');
    }
  };

  /**
   * 处理用户退出登录
   */
  const handleLogout = () => {
    logout();
    window.location.reload(); // 刷新页面以更新认证状态
  };

  /**
   * 处理主要CTA按钮点击 - 直接导航到V2版本
   */
  const handleStartExperience = () => {
    console.log('🚀 [流量切换] 用户点击开始体验，导航到V2版本');
    navigate('/resumes/upload-v2');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gray-900">俊才AI简历</div>
            </div>
            
            <div className="flex items-center space-x-4">
              {userLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">欢迎，{user?.email}</span>
                  <button
                    onClick={() => navigate('/resumes')}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    我的简历
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                  >
                    登录
                  </button>
                  <button
                    onClick={handleRegisterClick}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    注册
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔧 [管理员按钮] 点击管理员按钮，准备跳转到管理员登录页面');
                      navigate('/admin/login');
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 border border-amber-600"
                    title="管理员入口"
                  >
                    🔐 管理员
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 顶部大标题区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          {/* 左侧文案 */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight whitespace-nowrap">
              一键定制岗位专属简历
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              AI智能分析岗位需求，让每份简历都精准匹配目标职位，智能解析您的现有简历内容，轻松创建结构化简历
            </p>
            <div className="relative">
              <button
                onClick={handleStartExperience}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold px-10 py-4 rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 relative overflow-hidden"
              >
                <span className="relative z-10">立即开始体验</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
          
          {/* 右侧简历对比 */}
          <div className="relative">
            <div className="flex space-x-4">
              {/* 原始简历 */}
              <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                <div className="text-center mb-3">
                  <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full inline-block">
                    原始简历 • 匹配度45%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                  <div className="mt-3 space-y-1">
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/5"></div>
                  </div>
                </div>
              </div>

              {/* 箭头 */}
              <div className="flex items-center">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                  <span className="text-sm">→</span>
                </div>
              </div>

              {/* 定制简历 */}
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 relative">
                <div className="text-center mb-3">
                  <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full inline-block">
                    定制简历 • 匹配度92%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-blue-300 rounded w-full"></div>
                  <div className="h-3 bg-blue-300 rounded w-4/5"></div>
                  <div className="h-2 bg-green-200 rounded w-full"></div>
                  <div className="h-2 bg-green-200 rounded w-3/4"></div>
                  <div className="h-2 bg-purple-200 rounded w-4/5"></div>
                  <div className="mt-3 space-y-1">
                    <div className="h-2 bg-green-200 rounded w-3/4"></div>
                    <div className="h-2 bg-blue-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center">
                  <span className="text-xs">✨</span>
                </div>
              </div>
            </div>
            
            {/* AI优化标签 */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-white px-3 py-1 rounded-full shadow-md border border-gray-200">
                <span className="text-xs font-medium text-gray-600">AI智能优化</span>
              </div>
            </div>
          </div>
        </div>

        {/* 简单三步，打造专属简历 */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">简单三步，打造专属简历</h2>
            <p className="text-xl text-gray-600">AI智能解析与优化，让您的简历更加专业</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* 连接线 */}
            <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-blue-200 to-green-200 transform -translate-y-1/2"></div>
            <div className="hidden md:block absolute top-1/2 right-1/3 w-1/3 h-0.5 bg-gradient-to-r from-green-200 to-purple-200 transform -translate-y-1/2"></div>
            
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative z-10">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">📤</span>
              </div>
              <div className="bg-blue-500 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">上传现有简历</h3>
              <p className="text-gray-600 leading-relaxed">支持PDF、Word等格式，AI智能解析简历内容</p>
            </div>

            <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative z-10">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">🎯</span>
              </div>
              <div className="bg-green-500 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">输入目标岗位</h3>
              <p className="text-gray-600 leading-relaxed">AI分析岗位需求，定制优化策略</p>
            </div>

            <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative z-10">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">⚡</span>
              </div>
              <div className="bg-purple-500 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">一键生成简历</h3>
              <p className="text-gray-600 leading-relaxed">智能优化内容，生成专属定制简历</p>
            </div>
          </div>
        </div>

        {/* 功能特色模块 */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">强大功能特色</h2>
            <p className="text-xl text-gray-600">全方位AI驱动，为您提供最优质的简历优化体验</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AI智能优化 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center border border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI智能优化</h3>
              <p className="text-gray-600 leading-relaxed">
                智能分析您的技能与岗位匹配度，优化语言表达，突出核心优势，让简历更具竞争力
              </p>
            </div>

            {/* 多种模板选择 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center border border-green-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">多种模板选择</h3>
              <p className="text-gray-600 leading-relaxed">
                提供多种专业简历模板，适配不同行业和职位需求，让您的简历脱颖而出
              </p>
            </div>

            {/* 快速高效 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 text-center border border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">快速高效</h3>
              <p className="text-gray-600 leading-relaxed">
                30秒完成简历优化，支持批量生成多个岗位的定制简历，大大提升求职效率
              </p>
            </div>
          </div>
        </div>

        {/* 底部CTA区域 */}
        <div>
          {/* 底部渐变CTA */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">准备好提升您的简历了吗？</h2>
              <p className="text-xl mb-8 text-blue-100">AI智能优化，让您的简历脱颖而出</p>
              <button
                onClick={handleStartExperience}
                className="bg-white text-purple-600 text-lg font-semibold px-10 py-4 rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                立即开始体验
              </button>
            </div>
            {/* 装饰性元素 */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-20 h-20 bg-white bg-opacity-5 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* 认证Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSuccess={handleAuthSuccess}
        onSwitchMode={(mode) => setAuthMode(mode)}
      />
    </div>
  );
};

export default LandingPage; 