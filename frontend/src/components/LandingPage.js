/**
 * Landing页面 - 俊才AI简历产品首页 (v2.5 价值主张最终版)
 * 核心优化点：
 * 1. 优化Hero Section：主标题明确为“为每个岗位定制简历”，副标题用“提升3倍”作为支撑。
 * 2. 强化简历对比图：明确标注出匹配度的巨大提升，增强视觉冲击力。
 * 3. 恢复“三步流程”模块，丰富页面内容。
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser, logout } from '../utils/auth';
import AuthModal from './AuthModal';
import { getUserProfile } from '../utils/api'; // 引入API

/**
 * 简历优化前后对比组件 (v2.5)
 * @returns {JSX.Element}
 */
const ResumeComparison = () => {
  return (
    <div className="relative mt-12 lg:mt-0" aria-label="简历优化前后对比图">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {/* 左侧：优化前 */}
        <div className="w-1/2 bg-white rounded-xl shadow-lg p-4 border border-gray-200 transform -rotate-3 transition-transform duration-300 hover:rotate-0 hover:scale-105">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-gray-600 text-sm">通用简历</span>
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">匹配度 45%</span>
          </div>
          <div className="space-y-2.5 opacity-70">
            <div className="h-3 bg-gray-300 rounded-full w-full"></div>
            <div className="h-3 bg-gray-300 rounded-full w-4/5"></div>
            <div className="h-2 bg-gray-200 rounded-full w-full mt-3"></div>
            <div className="h-2 bg-gray-200 rounded-full w-full"></div>
            <div className="h-2 bg-gray-200 rounded-full w-2/3"></div>
          </div>
        </div>

        {/* 中间箭头 */}
        <div className="flex-shrink-0 px-2">
          <svg className="w-8 h-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>

        {/* 右侧：优化后 */}
        <div className="w-1/2 bg-white rounded-xl shadow-2xl p-4 border-2 border-indigo-500 transform rotate-3 transition-transform duration-300 hover:rotate-0 hover:scale-105">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-gray-800 text-sm">AI定制简历</span>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">匹配度 92%</span>
          </div>
          <div className="space-y-2.5">
            <div className="h-3 bg-indigo-300 rounded-full w-full"></div>
            <div className="h-3 bg-indigo-300 rounded-full w-4/5"></div>
            <div className="h-2 bg-green-200 rounded-full w-full mt-3"></div>
            <div className="h-2 bg-green-200 rounded-full w-full"></div>
            <div className="h-2 bg-purple-200 rounded-full w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * LandingPage 组件
 * @returns {JSX.Element}
 */
const LandingPage = () => {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [currentUser, setCurrentUser] = useState(getUser());
  const [profile, setProfile] = useState(null); // 新增状态

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    const checkAuth = () => {
      setIsAuth(isAuthenticated());
      setCurrentUser(getUser());
    };

    const fetchProfile = async () => {
      if (isAuth) {
        try {
          const res = await getUserProfile();
          if (res.data.success) {
            setProfile(res.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch profile on landing page", error);
        }
      }
    };

    checkAuth();
    fetchProfile();

    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, [isAuth]);

  /**
   * 登录或注册成功回调
   */
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // 成功后跳转到简历列表
    navigate('/resumes');
  };

  /**
   * 处理主要CTA按钮点击 - 与旧版“立即开始体验”保持一致
   */
  const handleStartExperience = () => {
    console.log('🚀 [流量切换] 用户点击开始体验，导航到V2版本');
    navigate('/resumes/upload-v2');
  };

  /**
   * 处理退出
   */
  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 主要内容 */}
      <main>
        {/* Hero Section */}
        <section className="relative bg-white pt-20 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* 左侧文案 */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                  别再海投了！<br />
                  <span className="text-indigo-600">为每个岗位，定制一份专属简历。</span>
                </h1>
                <p className="mt-6 max-w-xl mx-auto lg:mx-0 text-lg md:text-xl text-gray-600">
                  我们的AI能深度分析岗位需求，将你的通用简历一键重构，面试邀约率平均提升3倍。
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={handleStartExperience}
                    className="bg-indigo-600 text-white text-lg font-semibold px-8 py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
                  >
                    上传简历，免费优化一次
                  </button>
                </div>
                <p className="mt-4 text-sm text-gray-500">注册即可免费优化，开启求职新可能</p>
              </div>

              {/* 右侧对比图 */}
              <ResumeComparison />
            </div>
          </div>
        </section>

        {/* 三步流程 */}
        <div className="py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">简单三步，打造专属简历</h2>
              <p className="text-xl text-gray-600">告别繁琐的修改，让AI为你完成最困难的工作</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="text-center p-8">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-4 text-2xl font-bold">1</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">上传通用简历</h3>
                <p className="text-gray-600">支持多种格式，或直接粘贴文本，AI将自动完成结构化解析。</p>
              </div>
              <div className="text-center p-8">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-4 text-2xl font-bold">2</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">粘贴目标岗位JD</h3>
                <p className="text-gray-600">告诉AI你的目标，它将像猎头一样，分析职位背后的核心需求。</p>
              </div>
              <div className="text-center p-8">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-4 text-2xl font-bold">3</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">一键生成专属简历</h3>
                <p className="text-gray-600">获得一份深度优化、价值凸显、完美匹配岗位的全新简历。</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 认证弹窗 */}
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