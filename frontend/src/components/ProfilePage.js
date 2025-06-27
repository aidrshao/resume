/**
 * 用户中心页面
 * 显示用户信息和提供登出功能
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../utils/api';
import { logout } from '../utils/auth';

const ProfilePage = () => {
  const navigate = useNavigate();
  
  // 用户信息状态
  const [userInfo, setUserInfo] = useState(null);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  
  // 错误信息
  const [error, setError] = useState('');

  /**
   * 加载用户信息
   */
  const loadUserInfo = async () => {
    try {
      setIsLoading(true);
      const response = await getUserProfile();
      
      if (response.success) {
        setUserInfo(response.data);
      }
    } catch (error) {
      setError('获取用户信息失败：' + error.message);
      console.error('获取用户信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理用户登出
   */
  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  /**
   * 格式化日期
   * @param {string} dateString - 日期字符串
   * @returns {string} 格式化后的日期
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // 组件挂载时加载用户信息
  useEffect(() => {
    loadUserInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadUserInfo}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">用户中心</h1>
          <p className="mt-2 text-sm text-gray-600">管理您的账户信息</p>
        </div>

        {/* 用户信息卡片 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">账户信息</h2>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                退出登录
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* 用户ID */}
              <div>
                <dt className="text-sm font-medium text-gray-500">用户ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{userInfo?.id || '-'}</dd>
              </div>

              {/* 邮箱地址 */}
              <div>
                <dt className="text-sm font-medium text-gray-500">邮箱地址</dt>
                <dd className="mt-1 text-sm text-gray-900">{userInfo?.email || '-'}</dd>
              </div>

              {/* 注册时间 */}
              <div>
                <dt className="text-sm font-medium text-gray-500">注册时间</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(userInfo?.created_at)}
                </dd>
              </div>

              {/* 最后更新时间 */}
              <div>
                <dt className="text-sm font-medium text-gray-500">最后更新</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(userInfo?.updated_at)}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={loadUserInfo}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            刷新信息
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            返回首页
          </button>
        </div>

        {/* 功能说明 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">功能说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 这是您的个人账户信息页面</li>
            <li>• 您可以在这里查看账户的基本信息</li>
            <li>• 如需修改信息或密码，请联系管理员</li>
            <li>• 点击"退出登录"可以安全退出系统</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 