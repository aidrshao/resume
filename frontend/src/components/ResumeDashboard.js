/**
 * 简历仪表板
 * 显示基础简历和AI定制简历，提供创建、编辑、删除功能
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../utils/api';
import html2pdf from 'html2pdf.js';
import ResumeRenderer from './ResumeRenderer';

/* ---------------------------------------------
 * SVG 图标组件
 * -------------------------------------------*/
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
  </svg>
);

const MoreVertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const DocumentTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6.343 17.657l-2.828-2.828m11.314 0l-2.828 2.828m-2.828-7.07l2.828 2.828m0 0l2.828 2.828m-11.314-2.828l2.828-2.828m2.828 7.07l-2.828-2.828" />
  </svg>
);

const ResumeDashboard = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [customizedResumes, setCustomizedResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [baseResume, setBaseResume] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null); // 追踪哪个 "..." 菜单打开
  
  // 🔧 添加重试相关状态
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [lastErrorTime, setLastErrorTime] = useState(null);
  
  // 模板系统状态
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedResumeForTemplate, setSelectedResumeForTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDetailLoading, setTemplateDetailLoading] = useState(false);
  const [renderError, setRenderError] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // DOM引用
  const currentStyleRef = useRef(null);
  const previewRef = useRef(null);

  // 🔧 重试逻辑
  const MAX_RETRY_COUNT = 3;
  const RETRY_DELAY = 2000; // 2秒延迟
  
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  const shouldRetry = (error, currentRetryCount) => {
    if (currentRetryCount >= MAX_RETRY_COUNT) return false;
    
    // 可重试的错误类型
    const retryableErrors = [
      'Network Error',
      'timeout',
      'ERR_NETWORK',
      'ERR_INTERNET_DISCONNECTED',
      'ERR_CONNECTION_REFUSED'
    ];
    
    const errorMessage = error.message || '';
    const shouldRetryError = retryableErrors.some(errorType => 
      errorMessage.includes(errorType)
    );
    
    // 5xx服务器错误也可以重试
    const isServerError = error.response && error.response.status >= 500;
    
    return shouldRetryError || isServerError;
  };
  
  const loadDataWithRetry = async (attemptCount = 0) => {
    try {
      await loadDataCore();
      setRetryCount(0); // 成功后重置重试计数
      setRetrying(false);
    } catch (err) {
      console.error(`❌ [RESUME_DASHBOARD] 第${attemptCount + 1}次尝试失败:`, err);
      
      if (shouldRetry(err, attemptCount)) {
        console.log(`🔄 [RESUME_DASHBOARD] 将在${RETRY_DELAY}ms后进行第${attemptCount + 2}次重试...`);
        setRetrying(true);
        setRetryCount(attemptCount + 1);
        
        await sleep(RETRY_DELAY);
        return loadDataWithRetry(attemptCount + 1);
      } else {
        console.error(`❌ [RESUME_DASHBOARD] 已达到最大重试次数或不可重试的错误`);
        setRetrying(false);
        throw err;
      }
    }
  };
  
  const loadDataCore = async () => {
    // 原有的loadData逻辑移到这里
    setError('');
    
    // 🔧 添加详细的调试日志
    console.log('🔄 [RESUME_DASHBOARD] 开始加载数据...');
    console.log('🔄 [RESUME_DASHBOARD] 当前时间:', new Date().toISOString());
    
    // 检查认证状态
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('🔍 [RESUME_DASHBOARD] 认证状态:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      hasUser: !!user,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'null'
    });
    
    if (!token) {
      console.error('❌ [RESUME_DASHBOARD] 未找到认证token，跳转到登录页');
      setError('认证已过期，请重新登录');
      return;
    }
    
    // 🔧 分别处理两个API调用，添加更详细的错误处理
    console.log('📡 [RESUME_DASHBOARD] 开始并行请求...');
    
    let resumesResponse = null;
    let customizedResponse = null;
    
    try {
      // 分别处理两个API调用
      const promises = [
        api.getResumes().catch(err => {
          console.error('❌ [RESUME_DASHBOARD] 获取基础简历失败:', err);
          return { success: false, error: err, type: 'resumes' };
        }),
        api.getCustomizedResumes().catch(err => {
          console.error('❌ [RESUME_DASHBOARD] 获取定制简历失败:', err);
          return { success: false, error: err, type: 'customized' };
        })
      ];
      
      [resumesResponse, customizedResponse] = await Promise.all(promises);
      
      console.log('📊 [RESUME_DASHBOARD] 基础简历响应:', {
        success: resumesResponse.success,
        hasData: !!resumesResponse.data,
        dataType: typeof resumesResponse.data,
        dataLength: Array.isArray(resumesResponse.data) ? resumesResponse.data.length : 'not_array'
      });
      
      console.log('📊 [RESUME_DASHBOARD] 定制简历响应:', {
        success: customizedResponse.success,
        hasData: !!customizedResponse.data,
        dataType: typeof customizedResponse.data,
        dataLength: Array.isArray(customizedResponse.data) ? customizedResponse.data.length : 'not_array'
      });
      
    } catch (err) {
      console.error('❌ [RESUME_DASHBOARD] 并行请求异常:', err);
      throw err;
    }
    
    // 处理基础简历响应
    if (resumesResponse && resumesResponse.success) {
      setResumes(resumesResponse.data || []);
      const base = (resumesResponse.data || []).find(r => r.is_base);
      setBaseResume(base);
      console.log('✅ [RESUME_DASHBOARD] 基础简历处理成功:', {
        totalCount: resumesResponse.data?.length || 0,
        hasBaseResume: !!base,
        baseResumeId: base?.id
      });
    } else {
      console.error('❌ [RESUME_DASHBOARD] 基础简历响应失败:', resumesResponse);
      if (resumesResponse && resumesResponse.error) {
        throw resumesResponse.error;
      }
    }
    
    // 处理定制简历响应
    if (customizedResponse && customizedResponse.success) {
      setCustomizedResumes(customizedResponse.data || []);
      console.log('✅ [RESUME_DASHBOARD] 定制简历处理成功:', {
        totalCount: customizedResponse.data?.length || 0
      });
    } else {
      console.error('❌ [RESUME_DASHBOARD] 定制简历响应失败:', customizedResponse);
      // 定制简历失败不影响主要功能，只记录错误
      if (customizedResponse && customizedResponse.error) {
        console.error('❌ [RESUME_DASHBOARD] 定制简历错误详情:', customizedResponse.error);
      }
    }
    
    console.log('✅ [RESUME_DASHBOARD] 数据加载完成');
  };

  // 🔧 修改原有的loadData方法
  const loadData = async () => {
    try {
      setLoading(true);
      setLastErrorTime(null);
      await loadDataWithRetry();
    } catch (err) {
      console.error('❌ [RESUME_DASHBOARD] 数据加载失败:', err);
      console.error('❌ [RESUME_DASHBOARD] 错误类型:', err.constructor.name);
      console.error('❌ [RESUME_DASHBOARD] 错误消息:', err.message);
      console.error('❌ [RESUME_DASHBOARD] 错误堆栈:', err.stack);
      
      setLastErrorTime(new Date().toISOString());
      
      // 根据错误类型设置不同的错误消息
      let errorMessage = '加载数据失败，请刷新页面重试';
      
      if (err.message && err.message.includes('Network Error')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      } else if (err.message && err.message.includes('timeout')) {
        errorMessage = '请求超时，请稍后重试';
      } else if (err.response && err.response.status === 401) {
        errorMessage = '认证已过期，请重新登录';
        // 清除本地存储的认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (err.response && err.response.status === 403) {
        errorMessage = '没有权限访问该资源';
      } else if (err.response && err.response.status >= 500) {
        errorMessage = '服务器错误，请稍后重试';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // 🔧 手动重试方法
  const handleRetry = () => {
    console.log('🔄 [RESUME_DASHBOARD] 手动重试请求...');
    setRetryCount(0);
    loadData();
  };

  // 🔧 添加useEffect调用loadData
  useEffect(() => {
    loadData();
  }, []);

  // 删除简历
  const deleteResume = async (id) => {
    if (!window.confirm('确定要删除这个简历吗？')) {
      return;
    }
    
    try {
      const response = await api.deleteResume(id);
      
      if (response.success) {
        loadData();
      } else {
        setError(response.message || '删除失败');
      }
    } catch (err) {
      console.error('删除简历失败:', err);
      setError('删除简历失败，请重试');
    } finally {
      setActiveMenu(null); // 删除后关闭菜单
    }
  };

  // 切换 "..." 操作菜单
  const handleMenuToggle = (menuId) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  /**
   * 获取模板列表
   */
  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      console.log('🔄 [模板系统] 获取模板列表...');
      
      const response = await api.getTemplatesList();
      
      if (response.success) {
        setTemplates(response.data);
        console.log('✅ [模板系统] 获取模板列表成功:', response.data.length);
      } else {
        console.error('❌ [模板系统] 获取模板列表失败:', response.message);
        setError('获取模板列表失败');
      }
    } catch (error) {
      console.error('❌ [模板系统] 获取模板列表异常:', error);
      setError('获取模板列表失败: ' + error.message);
    } finally {
      setTemplatesLoading(false);
    }
  };

  /**
   * 选择模板
   */
  const handleTemplateSelect = async (template) => {
    try {
      setTemplateDetailLoading(true);
      setRenderError('');
      console.log('🎨 [模板系统] 选择模板:', template.name);
      
      // 获取模板详情
      const templateResponse = await api.getTemplateById(template.id);
      
      if (templateResponse.success) {
        const templateDetail = templateResponse.data;
        console.log('✅ [模板系统] 获取模板详情成功:', {
          id: templateDetail.id,
          name: templateDetail.name,
          hasHtmlContent: !!templateDetail.html_content,
          hasCssContent: !!templateDetail.css_content
        });
        
        setSelectedTemplate(templateDetail);
      } else {
        console.error('❌ [模板系统] 获取模板详情失败:', templateResponse.message);
        setRenderError('获取模板详情失败: ' + templateResponse.message);
      }
    } catch (error) {
      console.error('❌ [模板系统] 获取模板详情异常:', error);
      setRenderError('获取模板详情失败: ' + error.message);
    } finally {
      setTemplateDetailLoading(false);
    }
  };

  /**
   * 格式化基础简历数据为渲染所需的格式
   */
  const formatResumeDataForRender = (resume) => {
    try {
      console.log('🔄 [数据格式化] 开始格式化基础简历数据:', {
        id: resume.id,
        title: resume.title,
        hasContent: !!resume.content,
        hasResumeData: !!resume.resume_data,
        hasUnifiedData: !!resume.unified_data
      });

      // 获取简历内容
      let content = resume.unified_data || resume.resume_data || resume.content;
      
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch (parseError) {
          console.warn('⚠️ [数据格式化] 解析简历内容失败:', parseError);
          content = {};
        }
      }
      
      console.log('📊 [数据格式化] 原始内容结构:', {
        keys: Object.keys(content || {}),
        hasProfile: !!content.profile,
        hasPersonalInfo: !!content.personal_info,
        hasWorkExperience: !!content.workExperience,
        hasExperience: !!content.experience,
        hasEducation: !!content.education,
        hasSkills: !!content.skills
      });

      // 格式化为统一的数据结构
      const formattedData = {
        // 个人信息
        profile: {
          name: content.profile?.name || content.personal_info?.name || resume.title || '未命名',
          title: content.profile?.title || content.personal_info?.title || '',
          email: content.profile?.email || content.personal_info?.email || '',
          phone: content.profile?.phone || content.personal_info?.phone || '',
          location: content.profile?.location || content.personal_info?.location || '',
          summary: content.profile?.summary || content.personal_info?.summary || content.summary || '',
          github: content.profile?.github || content.personal_info?.github || '',
          linkedin: content.profile?.linkedin || content.personal_info?.linkedin || ''
        },
        
        // 工作经历
        workExperience: (content.workExperience || content.work_experience || content.experience || []).map(exp => ({
          company: exp.company || '',
          position: exp.position || exp.title || '',
          startDate: exp.startDate || exp.start_date || '',
          endDate: exp.endDate || exp.end_date || '至今',
          description: exp.description || '',
          achievements: exp.achievements || []
        })),
        
        // 教育背景
        education: (content.education || content.educations || []).map(edu => ({
          institution: edu.institution || edu.school || '',
          degree: edu.degree || '',
          major: edu.major || edu.field || '',
          startDate: edu.startDate || edu.start_date || '',
          endDate: edu.endDate || edu.end_date || '',
          gpa: edu.gpa || ''
        })),
        
        // 技能
        skills: Array.isArray(content.skills) ? content.skills.map(skill => ({
          name: typeof skill === 'string' ? skill : skill.name || '',
          level: typeof skill === 'object' ? skill.level || '' : ''
        })) : [],
        
        // 项目经验
        projectExperience: (content.projects || content.projectExperience || []).map(project => ({
          name: project.name || project.title || '',
          description: project.description || '',
          technologies: project.technologies || [],
          startDate: project.startDate || project.start_date || '',
          endDate: project.endDate || project.end_date || ''
        })),
        
        // 其他信息
        languages: content.languages || [],
        certifications: content.certifications || [],
        awards: content.awards || []
      };

      console.log('✅ [数据格式化] 数据格式化完成:', {
        profileName: formattedData.profile.name,
        workExperienceCount: formattedData.workExperience.length,
        educationCount: formattedData.education.length,
        skillsCount: formattedData.skills.length,
        projectCount: formattedData.projectExperience.length
      });

      return formattedData;
    } catch (error) {
      console.error('❌ [数据格式化] 格式化失败:', error);
      return {
        profile: {
          name: resume.title || '未命名',
          title: '',
          email: '',
          phone: '',
          location: '',
          summary: ''
        },
        workExperience: [],
        education: [],
        skills: [],
        projectExperience: [],
        languages: [],
        certifications: [],
        awards: []
      };
    }
  };

  /**
   * 下载PDF
   */
  const handleDownloadPDF = async () => {
    if (!selectedTemplate || !selectedResumeForTemplate) return;
    
    try {
      setPdfGenerating(true);
      
      // 获取预览区域的DOM元素
      const previewElement = document.querySelector('.resume-preview');
      
      if (!previewElement) {
        alert('预览区域未找到，请稍后重试');
        return;
      }
      
      const options = {
        margin: [10, 10, 10, 10],
        filename: `${selectedResumeForTemplate.title || '简历'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait'
        }
      };
      
      await html2pdf().set(options).from(previewElement).save();
      
    } catch (error) {
      console.error('生成PDF失败:', error);
      setError('生成PDF失败: ' + error.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  /**
   * 打开模板选择器
   */
  const handleOpenTemplateSelector = (resume) => {
    setSelectedResumeForTemplate(resume);
    setShowTemplateModal(true);
    setSelectedTemplate(null);
    setRenderError('');
    fetchTemplates();
  };

  /**
   * 关闭模板选择器
   */
  const handleCloseTemplateSelector = () => {
    setShowTemplateModal(false);
    setSelectedResumeForTemplate(null);
    setSelectedTemplate(null);
    setRenderError('');
    
    // 清理样式
    if (currentStyleRef.current) {
      currentStyleRef.current.remove();
      currentStyleRef.current = null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {retrying ? (
              <>
                加载中... (重试 {retryCount}/{MAX_RETRY_COUNT})
                <br />
                <span className="text-sm text-gray-500">
                  如果网络不稳定，系统会自动重试
                </span>
              </>
            ) : (
              '加载中...'
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 顶部标题与新建按钮 */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">简历仪表板</h1>
            <p className="mt-1 text-sm text-gray-500">在这里管理您的所有简历，开启新的职业可能。</p>
          </div>
          <button
            onClick={() => navigate('/resumes/upload-v2')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon />
            创建新简历
          </button>
        </header>

        {/* 🔧 更新错误提示UI */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-800">{error}</p>
                {lastErrorTime && (
                  <p className="text-xs text-red-600 mt-1">
                    错误时间: {new Date(lastErrorTime).toLocaleString()}
                  </p>
                )}
                {retryCount > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    已重试 {retryCount} 次
                  </p>
                )}
              </div>
              <div className="ml-auto pl-3 flex space-x-2">
                <button 
                  onClick={handleRetry}
                  disabled={loading || retrying}
                  className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retrying ? '重试中...' : '🔄 重试'}
                </button>
                <button 
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 基础简历部分 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">我的基础简历</h2>
          {baseResume ? (
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-full">
                    <DocumentTextIcon />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{baseResume.title}</h3>
                    <p className="text-sm text-gray-500">
                      最后更新于 {new Date(baseResume.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button onClick={() => navigate(`/resume/${baseResume.id}/edit`)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                    <EditIcon /> 编辑
                  </button>
                  <div className="relative">
                    <button onClick={() => handleMenuToggle(`base-${baseResume.id}`)} className="text-gray-400 hover:text-gray-600">
                      <MoreVertIcon />
                    </button>
                    {activeMenu === `base-${baseResume.id}` && (
                      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <a href="#" onClick={(e) => { e.preventDefault(); deleteResume(baseResume.id); }} className="block px-4 py-2 text-sm text-red-700 hover:bg-gray-100">删除</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-600 mb-4">您还没有创建基础简历。</p>
              <p className="text-sm text-gray-500 mb-6">基础简历是您所有定制简历的来源。</p>
              <button
                onClick={() => navigate('/resumes/upload-v2')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                立即创建
              </button>
            </div>
          )}
        </section>

        {/* AI定制简历部分 */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">AI 定制简历</h2>
            <button onClick={() => navigate('/jobs')} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">管理目标岗位 →</button>
          </div>
          {customizedResumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customizedResumes.map(resume => (
                <div key={`customized-${resume.id}`} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                  <div className="p-6 flex-grow">
                    <div className="flex items-center mb-3">
                      <SparklesIcon />
                      <h3 className="ml-2 text-md font-semibold text-gray-900 truncate" title={resume.job_title}>
                        {resume.job_title || '专属简历'}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      目标公司: {resume.company_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      创建于: {new Date(resume.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50 rounded-b-lg">
                    <button onClick={() => navigate(`/resumes/customized/${resume.id}`)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">预览与导出</button>
                    <div className="relative">
                      <button onClick={() => handleMenuToggle(`custom-${resume.id}`)} className="text-gray-400 hover:text-gray-600">
                        <MoreVertIcon />
                      </button>
                      {activeMenu === `custom-${resume.id}` && (
                        <div className="origin-top-right absolute right-0 bottom-full mb-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <a href="#" onClick={(e) => { e.preventDefault(); deleteResume(resume.id); }} className="block px-4 py-2 text-sm text-red-700 hover:bg-gray-100">删除</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-600 mb-4">您还没有AI定制简历。</p>
                <p className="text-sm text-gray-500 mb-6">为您的目标岗位生成一份专属简历，大幅提升面试机会。</p>
                <button onClick={() => navigate('/jobs')} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  前往岗位管理
                </button>
              </div>
          )}
        </section>

        {/* 模板预览模态框 */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border shadow-lg rounded-md bg-white" style={{ width: '95%', maxWidth: '1400px', height: '90vh' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  简历预览 - {selectedResumeForTemplate?.title}
                </h3>
                <button
                  onClick={handleCloseTemplateSelector}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex h-full">
                {/* 左侧模板选择区 */}
                <div className="w-1/4 pr-4 border-r border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">选择模板</h4>
                  {templatesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>暂无可用模板</p>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-700">
                          👆 点击下方模板进行预览
                        </p>
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {templates.map(template => (
                          <div
                            key={template.id}
                            className={`cursor-pointer border rounded-lg p-3 hover:bg-gray-50 ${
                              selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <div className="text-center">
                              {template.thumbnail_url && (
                                <img 
                                  src={template.thumbnail_url} 
                                  alt={template.name}
                                  className="w-full h-24 object-cover rounded mb-2"
                                />
                              )}
                              <h5 className="font-medium text-sm text-gray-900">{template.name}</h5>
                              <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 右侧预览区 */}
                <div className="flex-1 pl-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">模板预览</h4>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={!selectedTemplate || pdfGenerating}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pdfGenerating ? '⏳ 生成中...' : '📄 下载PDF'}
                    </button>
                  </div>
                  
                  <div className="border border-gray-300 rounded-lg h-full overflow-auto bg-white">
                    {templateDetailLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : renderError ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-red-600">
                          <p className="mb-2">❌ {renderError}</p>
                        </div>
                      </div>
                                         ) : selectedTemplate ? (
                       <ResumeRenderer
                         resumeData={formatResumeDataForRender(selectedResumeForTemplate)}
                         template={selectedTemplate}
                       />
                     ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        请选择模板查看预览
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeDashboard; 