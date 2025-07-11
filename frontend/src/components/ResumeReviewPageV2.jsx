/**
 * V2版本简历审核页面
 * 用于展示AI解析结果并允许用户审核和编辑
 * 支持完整的UNIFIED_RESUME_SCHEMA格式编辑和保存
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTaskResultV2, saveBaseResume } from '../utils/api';

const ResumeReviewPageV2 = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  // 状态管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskResult, setTaskResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 表单数据状态 - 严格按照UNIFIED_RESUME_SCHEMA结构
  const [formData, setFormData] = useState({
    profile: {
      name: '',
      email: '',
      phone: '',
      location: '',
      portfolio: '',
      linkedin: '',
      summary: ''
    },
    workExperience: [],
    projectExperience: [],
    education: [],
    skills: [],
    customSections: []
  });

  /**
   * 获取任务结果并初始化表单数据
   */
  useEffect(() => {
    const fetchTaskResult = async () => {
      try {
        console.log('📊 [REVIEW_V2] 获取任务结果:', taskId);
        
        // [FRONTEND_DEBUG] 开始获取结果
        console.log(`[FRONTEND_DEBUG] ResumeReviewPageV2 mounted. Attempting to fetch result for taskId: ${taskId}`);
        
        setLoading(true);
        setError(null);

        const response = await getTaskResultV2(taskId);

        // [FRONTEND_DEBUG] 收到响应后的日志
        console.log(`[FRONTEND_DEBUG] Successfully received data from API for taskId ${taskId}:`, {
          success: response.success,
          hasData: !!response.data,
          message: response.message,
          dataKeys: response.data ? Object.keys(response.data) : [],
          resumeDataExists: !!(response.data?.resume_data),
          resumeDataKeys: response.data?.resume_data ? Object.keys(response.data.resume_data) : [],
          profileExists: !!(response.data?.resume_data?.profile),
          profileData: response.data?.resume_data?.profile || null
        });

        if (response.success && response.data) {
          console.log('✅ [REVIEW_V2] 任务结果获取成功');
          console.log('📊 [REVIEW_V2] 原始响应数据:', JSON.stringify(response.data, null, 2));
          
          setTaskResult(response.data);
          
          // 🔧 增强数据初始化逻辑
          const resumeData = response.data.resume_data || {};
          console.log('🔍 [REVIEW_V2] 解析的简历数据:', JSON.stringify(resumeData, null, 2));
          console.log('🔍 [REVIEW_V2] 数据完整性检查:');
          console.log('  - profile存在:', !!resumeData.profile);
          console.log('  - 姓名:', resumeData.profile?.name || '未解析');
          console.log('  - 邮箱:', resumeData.profile?.email || '未解析');
          console.log('  - 电话:', resumeData.profile?.phone || '未解析');
          console.log('  - 工作经验数量:', resumeData.workExperience?.length || 0);
          console.log('  - 教育背景数量:', resumeData.education?.length || 0);
          console.log('  - 技能数量:', resumeData.skills?.length || 0);
          
          // 验证关键数据是否存在
          const hasValidData = resumeData.profile?.name || 
                              resumeData.workExperience?.length > 0 ||
                              resumeData.education?.length > 0;
          
          if (!hasValidData) {
            console.warn('⚠️ [REVIEW_V2] 检测到数据可能不完整，但继续初始化表单');
          } else {
            console.log('✅ [REVIEW_V2] 数据验证通过，包含有效信息');
          }
          
          // 确保所有字段都有默认值，但保留现有数据
          const formDataInit = {
            profile: {
              name: resumeData.profile?.name || '',
              email: resumeData.profile?.email || '',
              phone: resumeData.profile?.phone || '',
              location: resumeData.profile?.location || '',
              portfolio: resumeData.profile?.portfolio || '',
              linkedin: resumeData.profile?.linkedin || '',
              summary: resumeData.profile?.summary || ''
            },
            workExperience: Array.isArray(resumeData.workExperience) ? resumeData.workExperience : [],
            projectExperience: Array.isArray(resumeData.projectExperience) ? resumeData.projectExperience : [],
            education: Array.isArray(resumeData.education) ? resumeData.education : [],
            skills: Array.isArray(resumeData.skills) ? resumeData.skills : [],
            customSections: Array.isArray(resumeData.customSections) ? resumeData.customSections : []
          };
          
          console.log('📝 [REVIEW_V2] 表单数据初始化完成:', {
            profileName: formDataInit.profile.name,
            profileEmail: formDataInit.profile.email,
            workExpCount: formDataInit.workExperience.length,
            educationCount: formDataInit.education.length
          });
          
          setFormData(formDataInit);
          
        } else {
          throw new Error(response.message || '获取解析结果失败');
        }

      } catch (error) {
        console.error('❌ [REVIEW_V2] 获取任务结果失败:', error);
        console.error('❌ [REVIEW_V2] 错误详情:', {
          name: error.name,
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        // [FRONTEND_DEBUG] 错误处理日志
        console.error(`[FRONTEND_DEBUG] Failed to fetch data from API for taskId ${taskId}. Error:`, {
          name: error.name,
          message: error.message,
          stack: error.stack,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          } : null
        });
        
        // 🔧 改进错误处理
        if (error.response?.status === 404) {
          setError('任务不存在或已过期。这可能是因为：\n1. 解析任务尚未完成\n2. 任务ID无效\n3. 任务结果已过期\n\n请返回重新上传简历');
        } else if (error.response?.status === 400) {
          const errorData = error.response.data;
          if (errorData?.error_code === 'TASK_NOT_COMPLETED') {
            setError(`任务尚未完成，当前状态：${errorData.data?.current_status || '未知'}，进度：${errorData.data?.progress || 0}%\n\n请稍后再试`);
          } else {
            setError('任务处理异常，请重新上传简历或联系技术支持');
          }
        } else if (error.message?.includes('Network') || error.code === 'ERR_NETWORK') {
          setError('网络连接失败，请检查网络后重试');
        } else {
          setError(error.message || '获取解析结果失败，请重试');
        }
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskResult();
    } else {
      setError('缺少任务ID参数');
      setLoading(false);
    }
  }, [taskId]);

  /**
   * 更新个人信息
   */
  const updateProfile = (field, value) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  /**
   * 更新数组类型字段的某一项
   */
  const updateArrayItem = (arrayName, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  /**
   * 添加数组项目
   */
  const addArrayItem = (arrayName, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultItem]
    }));
  };

  /**
   * 删除数组项目
   */
  const removeArrayItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  /**
   * 保存为基础简历
   */
  const handleSaveBaseResume = async () => {
    try {
      console.log('💾 [REVIEW_V2] 开始保存基础简历');
      
      setSaving(true);
      setError(null);

      // 验证必填字段
      if (!formData.profile.name.trim()) {
        throw new Error('请填写姓名');
      }
      if (!formData.profile.email.trim()) {
        throw new Error('请填写邮箱');
      }

      // 构建保存数据，确保符合UNIFIED_RESUME_SCHEMA
      const saveData = {
        ...formData,
        _metadata: {
          convertedAt: new Date().toISOString(),
          sourceFormat: 'v2_review_page',
          schemaVersion: '2.1',
          taskId: taskId
        }
      };

      const response = await saveBaseResume(saveData);

      if (response.success) {
        console.log('✅ [REVIEW_V2] 基础简历保存成功');
        setSaveSuccess(true);
        
        // 显示成功提示，3秒后跳转
        setTimeout(() => {
          navigate('/resumes');
        }, 3000);
      } else {
        throw new Error(response.message || '保存失败');
      }

    } catch (error) {
      console.error('❌ [REVIEW_V2] 保存失败:', error);
      setError(error.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 渲染加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            正在获取解析结果
          </h2>
          <p className="text-sm text-gray-500">
            任务ID: {taskId}
          </p>
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            获取失败
          </h2>
          <p className="text-sm text-red-600 mb-6">
            {error}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              重新加载
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 渲染成功保存状态
  if (saveSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-green-500">
            <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            保存成功！
          </h2>
          <p className="text-sm text-green-600 mb-4">
            您的基础简历已成功保存，正在跳转到简历管理页面...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  简历信息审核与编辑
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  AI已成功解析您的简历，请审核并编辑信息，确认无误后保存为基础简历
                </p>
              </div>
            </div>
          </div>

          {/* 文件元信息 */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">原始文件:</span>
                <p className="text-gray-900">{taskResult?.original_filename || '未知'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">文件大小:</span>
                <p className="text-gray-900">{formatFileSize(taskResult?.metadata?.file_size || 0)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">处理时间:</span>
                <p className="text-gray-900">{Math.round((taskResult?.metadata?.processing_time || 0) / 1000)}秒</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">解析版本:</span>
                <p className="text-gray-900">v{taskResult?.schema_version || '2.1'}</p>
              </div>
            </div>
          </div>
        </div>

        <form className="space-y-8">
          {/* 个人信息表单 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">个人信息</h2>
              <p className="text-sm text-gray-500 mt-1">请确认和完善您的基本信息</p>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.profile.name}
                    onChange={(e) => updateProfile('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入您的姓名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.profile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入您的邮箱"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
                  <input
                    type="tel"
                    value={formData.profile.phone}
                    onChange={(e) => updateProfile('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入您的电话号码"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">地址</label>
                  <input
                    type="text"
                    value={formData.profile.location}
                    onChange={(e) => updateProfile('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入您的地址"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">作品集链接</label>
                  <input
                    type="url"
                    value={formData.profile.portfolio}
                    onChange={(e) => updateProfile('portfolio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://your-portfolio.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.profile.linkedin}
                    onChange={(e) => updateProfile('linkedin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/yourname"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                <textarea
                  value={formData.profile.summary}
                  onChange={(e) => updateProfile('summary', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请简要介绍您的专业背景、技能和职业目标..."
                />
              </div>
            </div>
          </div>

          {/* 工作经历表单 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">工作经历</h2>
                  <p className="text-sm text-gray-500 mt-1">按时间倒序添加您的工作经历</p>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem('workExperience', {
                    company: '',
                    position: '',
                    duration: '',
                    description: ''
                  })}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加工作经历
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              {formData.workExperience.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
                  </svg>
                  <p>还没有添加工作经历，点击上方按钮添加</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.workExperience.map((work, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900">工作经历 {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('workExperience', index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                          <input
                            type="text"
                            value={work.company}
                            onChange={(e) => updateArrayItem('workExperience', index, 'company', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="请输入公司名称"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">职位名称</label>
                          <input
                            type="text"
                            value={work.position}
                            onChange={(e) => updateArrayItem('workExperience', index, 'position', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="请输入职位名称"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">工作时间</label>
                          <input
                            type="text"
                            value={work.duration}
                            onChange={(e) => updateArrayItem('workExperience', index, 'duration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：2020.01 - 2023.12"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">工作描述</label>
                          <textarea
                            value={work.description}
                            onChange={(e) => updateArrayItem('workExperience', index, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="请描述您在该职位的主要工作内容和成就..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 教育经历表单 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">教育经历</h2>
                  <p className="text-sm text-gray-500 mt-1">按时间倒序添加您的教育经历</p>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem('education', {
                    school: '',
                    degree: '',
                    major: '',
                    duration: ''
                  })}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加教育经历
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              {formData.education.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <p>还没有添加教育经历，点击上方按钮添加</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900">教育经历 {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('education', index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">学校名称</label>
                          <input
                            type="text"
                            value={edu.school}
                            onChange={(e) => updateArrayItem('education', index, 'school', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="请输入学校名称"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">学历</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateArrayItem('education', index, 'degree', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：本科、硕士、博士"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
                          <input
                            type="text"
                            value={edu.major}
                            onChange={(e) => updateArrayItem('education', index, 'major', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="请输入专业名称"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">就读时间</label>
                          <input
                            type="text"
                            value={edu.duration}
                            onChange={(e) => updateArrayItem('education', index, 'duration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：2016.09 - 2020.06"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 项目经历表单 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">项目经历</h2>
                  <p className="text-sm text-gray-500 mt-1">添加您参与的重要项目</p>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem('projectExperience', {
                    name: '',
                    role: '',
                    duration: '',
                    description: '',
                    url: ''
                  })}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加项目经历
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              {formData.projectExperience.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p>还没有添加项目经历，点击上方按钮添加</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.projectExperience.map((project, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900">项目经历 {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('projectExperience', index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
                          <input
                            type="text"
                            value={project.name}
                            onChange={(e) => updateArrayItem('projectExperience', index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="请输入项目名称"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">担任角色</label>
                          <input
                            type="text"
                            value={project.role}
                            onChange={(e) => updateArrayItem('projectExperience', index, 'role', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：前端开发、项目经理"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">项目时间</label>
                          <input
                            type="text"
                            value={project.duration}
                            onChange={(e) => updateArrayItem('projectExperience', index, 'duration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：2022.01 - 2022.06"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">项目链接</label>
                          <input
                            type="url"
                            value={project.url}
                            onChange={(e) => updateArrayItem('projectExperience', index, 'url', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://project-demo.com"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
                          <textarea
                            value={project.description}
                            onChange={(e) => updateArrayItem('projectExperience', index, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="请描述项目背景、您的贡献和取得的成果..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 技能表单 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">技能</h2>
                  <p className="text-sm text-gray-500 mt-1">按分类添加您的技能</p>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem('skills', {
                    category: '',
                    details: ''
                  })}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加技能分类
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              {formData.skills.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p>还没有添加技能，点击上方按钮添加</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900">技能分类 {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('skills', index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">技能分类</label>
                          <input
                            type="text"
                            value={skill.category}
                            onChange={(e) => updateArrayItem('skills', index, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：编程语言、框架、工具"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">具体技能</label>
                          <input
                            type="text"
                            value={skill.details}
                            onChange={(e) => updateArrayItem('skills', index, 'details', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：JavaScript, React, Vue.js, Node.js"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 自定义部分表单 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">其他信息</h2>
                  <p className="text-sm text-gray-500 mt-1">添加其他重要信息，如获奖经历、证书等</p>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem('customSections', {
                    title: '',
                    content: ''
                  })}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加其他信息
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              {formData.customSections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>还没有添加其他信息，点击上方按钮添加</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.customSections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900">其他信息 {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('customSections', index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateArrayItem('customSections', index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如：获奖经历、证书、志愿活动"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                          <textarea
                            value={section.content}
                            onChange={(e) => updateArrayItem('customSections', index, 'content', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="请详细描述相关内容..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  确认信息无误后，点击保存按钮将数据保存为您的基础简历
                </div>
                <div className="space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBaseResume}
                    disabled={saving}
                    className="px-8 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? '保存中...' : '确认无误，保存为基础简历'}
                  </button>
                </div>
              </div>
              
              {/* 错误提示 */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* 用户视图不展示调试信息 */}
      </div>
    </div>
  );
};

export default ResumeReviewPageV2; 