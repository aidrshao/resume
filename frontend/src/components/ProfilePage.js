/**
 * 用户中心页面
 * 显示用户信息和提供登出功能
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { API_BASE_URL } from '../utils/api';

/**
 * 个人资料页面组件
 * 显示用户基本信息、会员状态、可用配额等
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    fetchUserProfile();
    fetchMembershipStatus();
  }, []);

  /**
   * 获取用户基本信息
   */
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || '',
          email: data.data.email || ''
        });
      } else {
        setError(data.message || '获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setError('网络错误，请稍后重试');
    }
  };

  /**
   * 获取会员状态信息
   */
  const fetchMembershipStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/memberships/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setMembershipStatus(data.data);
      } else {
        console.warn('获取会员状态失败:', data.message);
      }
    } catch (error) {
      console.error('获取会员状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新用户信息
   */
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setIsEditing(false);
        setError('');
      } else {
        setError(data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 格式化日期显示
   */
  const formatDate = (dateString) => {
    if (!dateString) return '永久有效';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * 获取会员状态显示文本
   */
  const getMembershipStatusText = (status) => {
    const statusMap = {
      'active': '有效',
      'expired': '已过期',
      'cancelled': '已取消',
      'pending': '待激活'
    };
    return statusMap[status] || '未知';
  };

  /**
   * 获取会员状态颜色
   */
  const getMembershipStatusColor = (status) => {
    const colorMap = {
      'active': 'text-green-600 bg-green-100',
      'expired': 'text-red-600 bg-red-100',
      'cancelled': 'text-gray-600 bg-gray-100',
      'pending': 'text-yellow-600 bg-yellow-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">个人资料</h1>
          <p className="mt-2 text-gray-600">管理您的账户信息和会员状态</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 基本信息卡片 */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">基本信息</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isEditing ? '取消' : '编辑'}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓名
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入您的姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入您的邮箱"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? '保存中...' : '保存'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓名
                    </label>
                    <p className="text-gray-900">{profile?.name || '未设置'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      邮箱
                    </label>
                    <p className="text-gray-900">{profile?.email || '未设置'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      注册时间
                    </label>
                    <p className="text-gray-900">{formatDate(profile?.created_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 会员状态卡片 */}
          <div className="space-y-6">
            {/* 当前会员状态 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">会员状态</h3>
              
              {membershipStatus ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      当前套餐
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {membershipStatus.tier_name || '免费版'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      状态
                    </label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMembershipStatusColor(membershipStatus.status)}`}>
                      {getMembershipStatusText(membershipStatus.status)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      到期时间
                    </label>
                    <p className="text-gray-900">{formatDate(membershipStatus.end_date)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AI简历剩余次数
                    </label>
                    <p className="text-2xl font-bold text-blue-600">
                      {membershipStatus.remaining_ai_quota || 0}
                    </p>
                    <p className="text-sm text-gray-500">
                      配额重置时间: {formatDate(membershipStatus.quota_reset_date)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">暂无会员信息</p>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={() => navigate('/membership')}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  管理会员
                </button>
              </div>
            </div>

            {/* 账户操作 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">账户操作</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/resumes')}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
                >
                  我的简历
                </button>
                
                <button
                  onClick={() => navigate('/jobs')}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
                >
                  投递记录
                </button>

                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition-colors"
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 