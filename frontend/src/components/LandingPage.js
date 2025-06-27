/**
 * Landing页面 - 产品展示和价值传达
 * 让用户先了解产品价值，再引导注册登录
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
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  /**
   * 处理需要认证的操作
   * @param {string} action - 操作类型
   */
  const handleAuthAction = (action) => {
    console.log('🎯 LandingPage: handleAuthAction被调用', { action, userLoggedIn });
    if (userLoggedIn) {
      // 已登录，直接执行操作
      console.log('✅ LandingPage: 用户已登录，直接跳转');
      switch (action) {
        case 'create-resume':
          navigate('/create-resume');
          break;
        case 'my-resumes':
          navigate('/profile');
          break;
        case 'templates':
          navigate('/templates');
          break;
        default:
          navigate('/profile');
      }
    } else {
      // 未登录，弹出登录Modal
      console.log('🔐 LandingPage: 用户未登录，弹出AuthModal');
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

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
    console.log('🎉 LandingPage: 认证成功回调被调用');
    setShowAuthModal(false);
    // 可以在这里添加登录成功后的跳转逻辑
    navigate('/profile');
  };

  /**
   * 处理退出登录
   */
  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">简历大师</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {userLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    欢迎，{user?.email}
                  </span>
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    用户中心
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
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
                    免费注册
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero区域 */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            打造专业简历
            <span className="text-indigo-600 block">轻松获得心仪工作</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            使用AI智能简历生成器，3分钟创建专业简历。
            精美模板、智能优化、一键导出，让您在求职路上脱颖而出。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleAuthAction('create-resume')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              🚀 立即创建简历
            </button>
            
            <button
              onClick={() => handleAuthAction('templates')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transform hover:scale-105 transition-all duration-200"
            >
              📋 浏览模板
            </button>
          </div>
        </div>
      </section>

      {/* 功能特点 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择我们？</h2>
            <p className="text-lg text-gray-600">专业、智能、高效的简历制作平台</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI智能优化</h3>
              <p className="text-gray-600">
                基于大数据分析，智能优化简历内容，
                提高简历通过率和面试邀请率
              </p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">精美模板</h3>
              <p className="text-gray-600">
                50+专业设计模板，涵盖各行各业，
                让您的简历在众多候选人中脱颖而出
              </p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">快速生成</h3>
              <p className="text-gray-600">
                3分钟完成简历制作，一键导出PDF，
                支持在线预览和实时编辑
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 使用步骤 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">三步制作专业简历</h2>
            <p className="text-lg text-gray-600">简单几步，轻松完成</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">选择模板</h3>
              <p className="text-gray-600">从50+专业模板中选择适合您的风格</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">填写信息</h3>
              <p className="text-gray-600">AI智能提示，帮助您完善简历内容</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">下载使用</h3>
              <p className="text-gray-600">一键导出PDF，立即投递简历</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            准备好开始您的职业生涯了吗？
          </h2>
          <p className="text-xl text-indigo-200 mb-8">
            加入已有10万+用户的简历制作平台，让专业简历为您打开职场大门
          </p>
          
          <button
            onClick={() => handleAuthAction('create-resume')}
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            🎯 开始制作简历
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 简历大师. 让每个人都能拥有专业简历.
          </p>
        </div>
      </footer>

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