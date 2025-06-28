/**
 * 简历仪表板
 * 显示用户的所有简历，提供创建、编辑、删除功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ResumeDashboard = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * 加载用户的简历列表
   */
  const loadResumes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/resumes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setResumes(data.data);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('加载简历列表失败:', error);
      setError('加载简历列表失败');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);



  /**
   * 删除简历
   */
  const deleteResume = async (id) => {
    if (!window.confirm('确定要删除这份简历吗？')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setResumes(resumes.filter(resume => resume.id !== id));
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('删除简历失败:', error);
      setError('删除简历失败');
    }
  };

  /**
   * 获取状态显示文本
   */
  const getStatusText = (status) => {
    const statusMap = {
      'draft': '草稿',
      'generating': '生成中',
      'completed': '已完成',
      'failed': '生成失败'
    };
    return statusMap[status] || status;
  };

  /**
   * 获取状态样式
   */
  const getStatusStyle = (status) => {
    const styleMap = {
      'draft': 'bg-gray-100 text-gray-800',
      'generating': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return styleMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">我的简历</h1>
              <p className="mt-1 text-sm text-gray-500">管理您的所有简历</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/create-resume"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                创建新简历
              </Link>
              <Link
                to="/ai-chat"
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                AI问答创建
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {resumes.length === 0 ? (
          // 空状态
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">没有简历</h3>
            <p className="mt-1 text-sm text-gray-500">开始创建您的第一份AI简历吧！</p>
            <div className="mt-6 flex justify-center space-x-3">
              <Link
                to="/create-resume"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                创建简历
              </Link>
              <Link
                to="/ai-chat"
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
              >
                AI问答创建
              </Link>
            </div>
          </div>
        ) : (
          // 简历列表
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {resume.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {resume.template_name || '无模板'}
                      </p>
                      <div className="mt-2 flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(resume.status)}`}
                        >
                          {getStatusText(resume.status)}
                        </span>
                        {resume.generation_mode === 'advanced' && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            AI优化
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {resume.target_company && (
                    <div className="mt-4 text-sm text-gray-600">
                      <p><span className="font-medium">目标公司:</span> {resume.target_company}</p>
                      {resume.target_position && (
                        <p><span className="font-medium">目标岗位:</span> {resume.target_position}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 text-xs text-gray-500">
                    创建时间: {new Date(resume.created_at).toLocaleDateString()}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <div className="flex space-x-2">
                      <Link
                        to={`/resume/${resume.id}`}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        查看
                      </Link>
                      <Link
                        to={`/resume/${resume.id}/edit`}
                        className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                      >
                        编辑
                      </Link>
                    </div>
                    <button
                      onClick={() => deleteResume(resume.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeDashboard; 