/**
 * 简历仪表板
 * 显示基础简历和岗位专属简历，提供创建、编辑、删除功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../utils/api';
import ResumeTemplateSelector from './ResumeTemplateSelector';

const ResumeDashboard = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJobSelectModal, setShowJobSelectModal] = useState(false);
  const [baseResume, setBaseResume] = useState(null);
  const [generatingJobSpecific, setGeneratingJobSpecific] = useState({});
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedResumeForTemplate, setSelectedResumeForTemplate] = useState(null);

  /**
   * 加载用户的简历列表
   */
  const loadResumes = useCallback(async () => {
    const loadStartTime = Date.now();
    console.log('🔄 [LOAD_RESUMES] 开始执行loadResumes函数');
    console.log('🔄 [LOAD_RESUMES] 开始时间:', new Date().toISOString());
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ [LOAD_RESUMES] 没有token，跳转到登录页');
        navigate('/login');
        return;
      }

      console.log('🌐 [LOAD_RESUMES] 开始调用api.getResumes()');
      const apiStartTime = Date.now();
      
      const data = await api.getResumes();
      
      const apiEndTime = Date.now();
      const apiDuration = apiEndTime - apiStartTime;
      console.log('🌐 [LOAD_RESUMES] api.getResumes()完成，耗时:', apiDuration + 'ms');
      console.log('🔍 [LOAD_RESUMES] 返回的数据:', data);
      
      if (data && data.success) {
        console.log('✅ [LOAD_RESUMES] 数据处理开始，简历数量:', data.data ? data.data.length : 0);
        const processStartTime = Date.now();
        
        setResumes(data.data || []);
        // 找出基础简历
        const base = data.data ? data.data.find(resume => resume.is_base || (!resume.target_company && !resume.target_position)) : null;
        setBaseResume(base);
        
        const processEndTime = Date.now();
        const processDuration = processEndTime - processStartTime;
        console.log('✅ [LOAD_RESUMES] 数据处理完成，耗时:', processDuration + 'ms');
        console.log('✅ [LOAD_RESUMES] 基础简历:', base ? base.title : '未找到');
      } else {
        console.error('❌ [LOAD_RESUMES] API返回失败:', data ? data.message : '无数据');
        setError((data && data.message) || '加载简历列表失败');
      }
    } catch (error) {
      console.error('❌ [LOAD_RESUMES] 异常:', error);
      setError(error.message || '加载简历列表失败');
    } finally {
      const totalDuration = Date.now() - loadStartTime;
      console.log('🏁 [LOAD_RESUMES] loadResumes函数执行完成，总耗时:', totalDuration + 'ms');
    }
  }, [navigate]);

  /**
   * 加载职位列表
   */
  const loadJobs = useCallback(async () => {
    const loadStartTime = Date.now();
    console.log('🔄 [LOAD_JOBS] 开始执行loadJobs函数');
    console.log('🔄 [LOAD_JOBS] 开始时间:', new Date().toISOString());
    
    try {
      console.log('🌐 [LOAD_JOBS] 开始调用api.getJobs()');
      const apiStartTime = Date.now();
      
      const data = await api.getJobs();
      
      const apiEndTime = Date.now();
      const apiDuration = apiEndTime - apiStartTime;
      console.log('🌐 [LOAD_JOBS] api.getJobs()完成，耗时:', apiDuration + 'ms');
      console.log('🔍 [LOAD_JOBS] 返回的数据:', data);
      
      if (data && data.success) {
        console.log('✅ [LOAD_JOBS] 数据处理开始，职位数量:', data.data ? data.data.length : 0);
        const processStartTime = Date.now();
        
        setJobs(data.data || []);
        
        const processEndTime = Date.now();
        const processDuration = processEndTime - processStartTime;
        console.log('✅ [LOAD_JOBS] 数据处理完成，耗时:', processDuration + 'ms');
      } else {
        console.error('❌ [LOAD_JOBS] API返回失败:', data ? data.message : '无数据');
        setError((data && data.message) || '加载职位列表失败');
      }
    } catch (error) {
      console.error('❌ [LOAD_JOBS] 异常:', error);
      setError(error.message || '加载职位列表失败');
    } finally {
      const totalDuration = Date.now() - loadStartTime;
      console.log('🏁 [LOAD_JOBS] loadJobs函数执行完成，总耗时:', totalDuration + 'ms');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      console.log('🔄 [RESUME_DASHBOARD] 开始加载数据...');
      const loadStartTime = Date.now();
      
      try {
        await Promise.all([loadResumes(), loadJobs()]);
        const loadEndTime = Date.now();
        console.log('✅ [RESUME_DASHBOARD] 数据加载完成，总耗时:', (loadEndTime - loadStartTime) + 'ms');
      } catch (error) {
        console.error('❌ [RESUME_DASHBOARD] 数据加载失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // 移除loadResumes和loadJobs依赖，避免无限循环

  /**
   * 删除简历
   */
  const deleteResume = async (id) => {
    if (!window.confirm('确定要删除这份简历吗？')) {
      return;
    }

    try {
      // 使用封装的API工具
      const data = await api.deleteResume(id);
      
      if (data.success) {
        setResumes(resumes.filter(resume => resume.id !== id));
        // 如果删除的是基础简历，重新设置
        if (baseResume && baseResume.id === id) {
          setBaseResume(null);
        }
      } else {
        setError(data.message || '删除简历失败');
      }
    } catch (error) {
      console.error('删除简历失败:', error);
      setError(error.message || '删除简历失败');
    }
  };

  /**
   * 为指定岗位生成专属简历
   */
  const generateJobSpecificResume = async (job) => {
    if (!baseResume) {
      alert('请先创建基础简历');
      return;
    }

    setGeneratingJobSpecific(prev => ({ ...prev, [job.id]: true }));
    setShowJobSelectModal(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/resumes/generate-for-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          baseResumeId: baseResume.id,
          jobId: job.id,
          targetCompany: job.company,
          targetPosition: job.title,
          jobDescription: job.description,
          jobRequirements: job.requirements
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // 刷新简历列表
        await loadResumes();
        
        if (data.data.status === 'generating') {
          alert('岗位专属简历生成任务已启动，AI正在优化中，请稍后查看结果！');
        } else {
          alert('岗位专属简历生成成功！');
        }
      } else if (response.status === 409) {
        // 已存在相同岗位的专属简历
        setError(`${data.message}。您可以直接使用现有的专属简历或删除后重新生成。`);
      } else {
        setError(data.message || '生成岗位专属简历失败');
      }
    } catch (error) {
      console.error('生成岗位专属简历失败:', error);
      setError(error.message || '生成岗位专属简历失败');
    } finally {
      setGeneratingJobSpecific(prev => ({ ...prev, [job.id]: false }));
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

  // 分离基础简历和岗位专属简历
  const jobSpecificResumes = resumes.filter(resume => 
    resume.target_company || resume.target_position
  );

  /**
   * 打开模板选择器
   */
  const handleOpenTemplateSelector = (resume) => {
    setSelectedResumeForTemplate(resume);
    setShowTemplateSelector(true);
  };

  /**
   * 关闭模板选择器
   */
  const handleCloseTemplateSelector = () => {
    setShowTemplateSelector(false);
    setSelectedResumeForTemplate(null);
  };

  /**
   * 模板选择完成回调
   */
  const handleTemplateSelected = (template, format, data) => {
    console.log('模板选择完成:', { template, format, data });
    
    // 显示成功消息
    alert(`${format === 'pdf' ? 'PDF生成' : '模板应用'}成功！`);
    
    // 关闭选择器
    handleCloseTemplateSelector();
    
    // 如果需要，可以刷新简历列表
    if (format === 'html') {
      loadResumes();
    }
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
              <p className="mt-1 text-sm text-gray-500">管理您的基础简历和岗位专属简历</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/jobs"
                className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                岗位管理
              </Link>
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

        {/* 基础简历区域 */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">基础简历</h2>
            {baseResume && (
              <button
                onClick={() => setShowJobSelectModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                🎯 生成岗位专属简历
              </button>
            )}
          </div>

          {!baseResume ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无基础简历</h3>
              <p className="text-gray-500 mb-6">基础简历是生成岗位专属简历的基础，请先创建一份基础简历</p>
              <div className="flex justify-center space-x-4">
                <Link
                  to="/create-resume"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  创建基础简历
                </Link>
                <Link
                  to="/ai-chat"
                  className="bg-green-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  AI创建简历
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {baseResume.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {baseResume.template_name || '默认模板'}
                    </p>
                    <div className="mt-2 flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(baseResume.status)}`}
                      >
                        {getStatusText(baseResume.status)}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        基础简历
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  创建时间: {new Date(baseResume.created_at).toLocaleDateString()}
                </div>

                <div className="mt-6 flex justify-between">
                  <div className="flex space-x-2">
                    <Link
                      to={`/resume/${baseResume.id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      查看
                    </Link>
                    <Link
                      to={`/resume/${baseResume.id}/edit`}
                      className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleOpenTemplateSelector(baseResume)}
                      className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                    >
                      选择模板
                    </button>
                  </div>
                  <button
                    onClick={() => deleteResume(baseResume.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 岗位专属简历区域 */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">岗位专属简历</h2>
            <span className="text-sm text-gray-500">
              根据具体岗位优化的定制简历
            </span>
          </div>

          {jobSpecificResumes.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无岗位专属简历</h3>
              <p className="text-gray-500 mb-6">
                {baseResume 
                  ? '基于基础简历，为具体岗位生成定制化的专属简历，提高求职成功率'
                  : '请先创建基础简历，然后选择岗位生成专属简历'
                }
              </p>
              {baseResume && (
                <button
                  onClick={() => setShowJobSelectModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  🎯 生成岗位专属简历
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobSpecificResumes.map((resume) => (
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
                          {resume.template_name || '默认模板'}
                        </p>
                        <div className="mt-2 flex items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(resume.status)}`}
                          >
                            {getStatusText(resume.status)}
                          </span>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            岗位专属
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                      <p><span className="font-medium">目标公司:</span> {resume.target_company}</p>
                      <p><span className="font-medium">目标岗位:</span> {resume.target_position}</p>
                    </div>

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
                        <button
                          onClick={() => handleOpenTemplateSelector(resume)}
                          className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                        >
                          选择模板
                        </button>
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

      {/* 选择岗位生成简历的弹窗 */}
      {showJobSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">选择岗位生成专属简历</h3>
                <button
                  onClick={() => setShowJobSelectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {Array.isArray(jobs) && jobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📝</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">暂无岗位信息</h4>
                  <p className="text-gray-500 mb-6">请先在岗位管理中添加意向岗位</p>
                  <Link
                    to="/jobs"
                    className="bg-purple-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-purple-700"
                  >
                    前往岗位管理
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(jobs) && jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => generateJobSpecificResume(job)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{job.title}</h4>
                          <p className="text-sm text-gray-600">{job.company}</p>
                        </div>
                        {generatingJobSpecific[job.id] && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                      </div>
                      
                      {job.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {job.description.substring(0, 100)}...
                        </p>
                      )}
                      
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                        <button
                          disabled={generatingJobSpecific[job.id]}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                          {generatingJobSpecific[job.id] ? '生成中...' : '生成简历'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 模板选择器 */}
      {showTemplateSelector && selectedResumeForTemplate && (
        <ResumeTemplateSelector
          resumeId={selectedResumeForTemplate.id}
          onTemplateSelect={handleTemplateSelected}
          onClose={handleCloseTemplateSelector}
        />
      )}
    </div>
  );
};

export default ResumeDashboard; 