/**
 * 简历仪表板
 * 显示基础简历和岗位专属简历，提供创建、编辑、删除功能
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../utils/api';
import html2pdf from 'html2pdf.js';
import Handlebars from 'handlebars';

const ResumeDashboard = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJobSelectModal, setShowJobSelectModal] = useState(false);
  const [baseResume, setBaseResume] = useState(null);
  const [generatingJobSpecific, setGeneratingJobSpecific] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // 模板系统状态
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedResumeForTemplate, setSelectedResumeForTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDetailLoading, setTemplateDetailLoading] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderError, setRenderError] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // DOM引用
  const currentStyleRef = useRef(null);
  const previewRef = useRef(null);

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

      const data = await api.getResumes();
      
      if (data && data.success) {
        setResumes(data.data || []);
        // 找出基础简历
        const base = data.data ? data.data.find(resume => resume.is_base || (!resume.target_company && !resume.target_position)) : null;
        setBaseResume(base);
      } else {
        setError((data && data.message) || '加载简历列表失败');
      }
    } catch (error) {
      setError(error.message || '加载简历列表失败');
    }
  }, [navigate]);

  /**
   * 加载职位列表
   */
  const loadJobs = useCallback(async () => {
    try {
      const data = await api.getJobs();
      
      if (data && data.success) {
        setJobs(data.data || []);
      } else {
        setError((data && data.message) || '加载职位列表失败');
      }
    } catch (error) {
      setError(error.message || '加载职位列表失败');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadResumes(), loadJobs()]);
      } catch (error) {
        console.error('数据加载失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  /**
   * 删除简历
   */
  const deleteResume = async (id) => {
    if (!window.confirm('确定要删除这份简历吗？')) {
      return;
    }

    try {
      const data = await api.deleteResume(id);
      
      if (data.success) {
        setResumes(resumes.filter(resume => resume.id !== id));
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
          jobRequirements: job.requirements,
          userRequirements: job.user_requirements
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 刷新简历列表
        await loadResumes();
      } else {
        setError(data.message || '生成简历失败');
      }
    } catch (error) {
      console.error('生成简历失败:', error);
      setError(error.message || '生成简历失败');
    } finally {
      setGeneratingJobSpecific(prev => ({ ...prev, [job.id]: false }));
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'completed': return '已完成';
      case 'generating': return '生成中...';
      case 'failed': return '生成失败';
      default: return '未知状态';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * 获取模板列表
   */
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data || []);
        // 自动选择第一个模板
        if (data.data && data.data.length > 0) {
          await handleTemplateSelect(data.data[0]);
        }
      } else {
        setRenderError(data.message || '获取模板列表失败');
      }
    } catch (error) {
      console.error('获取模板失败:', error);
      setRenderError('获取模板失败');
    } finally {
      setTemplatesLoading(false);
    }
  };

  /**
   * 选择模板
   */
  const handleTemplateSelect = async (template) => {
    setSelectedTemplate(template);
    setTemplateDetailLoading(true);
    setRenderError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/templates/${template.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        await renderResumeWithTemplate(template, data.data);
      } else {
        setRenderError(data.message || '获取模板详情失败');
      }
    } catch (error) {
      console.error('获取模板详情失败:', error);
      setRenderError('获取模板详情失败');
    } finally {
      setTemplateDetailLoading(false);
    }
  };

  /**
   * 渲染简历模板
   */
  const renderResumeWithTemplate = async (template, templateData) => {
    try {
      // 清除旧的样式
      if (currentStyleRef.current) {
        document.head.removeChild(currentStyleRef.current);
        currentStyleRef.current = null;
      }

      // 注入新的CSS样式
      if (templateData.css_content) {
        const styleElement = document.createElement('style');
        styleElement.textContent = templateData.css_content;
        document.head.appendChild(styleElement);
        currentStyleRef.current = styleElement;
      }

      // 获取简历数据
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resumes/${selectedResumeForTemplate.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const resumeData = await response.json();
      
      if (!resumeData.success) {
        throw new Error(resumeData.message || '获取简历数据失败');
      }

      // 解析简历内容
      let parsedContent = {};
      try {
        if (resumeData.data.content && typeof resumeData.data.content === 'string') {
          parsedContent = JSON.parse(resumeData.data.content);
        } else if (typeof resumeData.data.content === 'object') {
          parsedContent = resumeData.data.content;
        } else if (resumeData.data.resume_data) {
          if (typeof resumeData.data.resume_data === 'string') {
            parsedContent = JSON.parse(resumeData.data.resume_data);
          } else {
            parsedContent = resumeData.data.resume_data;
          }
        } else {
          parsedContent = {};
        }
      } catch (error) {
        console.error('简历解析失败:', error);
        parsedContent = { summary: resumeData.data.content || '' };
      }

      // 创建标准数据结构（新格式）
      const standardResumeData = {
        profile: {
          name: parsedContent.profile?.name || resumeData.data.title || '姓名',
          email: parsedContent.profile?.email || 'user@example.com',
          phone: parsedContent.profile?.phone || '138-0000-0000',
          location: parsedContent.profile?.location || '北京市',
          portfolio: parsedContent.profile?.portfolio || '',
          linkedin: parsedContent.profile?.linkedin || '',
          summary: parsedContent.profile?.summary || parsedContent.summary || '优秀的专业人士'
        },
        
        workExperience: Array.isArray(parsedContent.workExperience) ? parsedContent.workExperience : [
          {
            position: '待完善职位',
            company: '待完善公司',
            duration: '待完善时间',
            description: '请在简历编辑中完善工作经历信息。'
          }
        ],
        
        projectExperience: Array.isArray(parsedContent.projectExperience) ? parsedContent.projectExperience :
                          Array.isArray(parsedContent.projects) ? parsedContent.projects : [
          {
            name: '待完善项目',
            role: '项目角色',
            duration: '待完善时间',
            description: '请在简历编辑中完善项目经历信息。',
            url: ''
          }
        ],
        
        education: Array.isArray(parsedContent.education) ? parsedContent.education :
                  Array.isArray(parsedContent.educations) ? parsedContent.educations : [
          {
            degree: '待完善学历',
            school: '待完善学校',
            duration: '待完善时间',
            major: '待完善专业'
          }
        ],
        
        skills: Array.isArray(parsedContent.skills) ? 
               (parsedContent.skills.length > 0 && parsedContent.skills[0].category ?
                parsedContent.skills : 
                [{ category: '技能', details: parsedContent.skills.join(', ') }]) :
               [{ category: '技能', details: '待完善技能' }],
        
        customSections: Array.isArray(parsedContent.customSections) ? parsedContent.customSections : []
      };

      // 添加便捷访问属性
      standardResumeData.workExperience.first = standardResumeData.workExperience[0] || {};
      standardResumeData.education.first = standardResumeData.education[0] || {};
      
      // 为skills创建字符串列表
      const skillsStringList = standardResumeData.skills.map(skill => skill.details).filter(d => d).join(', ');
      standardResumeData.skills.list = skillsStringList;

      // 使用Handlebars编译模板
      try {
        // 注册Handlebars helpers
        Handlebars.registerHelper('eq', function(a, b) {
          return a === b;
        });
        
        Handlebars.registerHelper('or', function(a, b) {
          return a || b;
        });

        // 编译模板
        const template = Handlebars.compile(templateData.html_content);
        let htmlContent = template(standardResumeData);

        setRenderedHtml(htmlContent);
        setRenderError('');

      } catch (error) {
        console.error('模板渲染失败:', error);
        setRenderError('模板渲染失败: ' + error.message);
      }

    } catch (error) {
      console.error('渲染简历失败:', error);
      setRenderError('渲染简历失败: ' + error.message);
    }
  };

  /**
   * 下载PDF
   */
  const handleDownloadPDF = async () => {
    if (!renderedHtml || !selectedResumeForTemplate) {
      alert('请先选择简历和模板');
      return;
    }

    setPdfGenerating(true);

    try {
      const previewContainer = previewRef.current;
      if (!previewContainer) {
        throw new Error('预览容器未找到');
      }

      // 临时移除缩放样式，确保PDF以原始大小生成
      const originalTransform = previewContainer.style.transform;
      previewContainer.style.transform = 'none';

      const opt = {
        margin: 10,
        filename: `${selectedResumeForTemplate.title || '简历'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(previewContainer).save();

      // 恢复原始样式
      previewContainer.style.transform = originalTransform;

    } catch (error) {
      console.error('PDF生成失败:', error);
      alert('PDF生成失败: ' + error.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleOpenTemplateSelector = (resume) => {
    setSelectedResumeForTemplate(resume);
    setShowTemplateModal(true);
    setRenderedHtml('');
    setRenderError('');
    fetchTemplates();
  };

  const handleCloseTemplateSelector = () => {
    setShowTemplateModal(false);
    setSelectedResumeForTemplate(null);
    setSelectedTemplate(null);
    setRenderedHtml('');
    setRenderError('');
    setTemplates([]);
    
    // 清理注入的CSS
    if (currentStyleRef.current) {
      document.head.removeChild(currentStyleRef.current);
      currentStyleRef.current = null;
    }
  };

  /**
   * 获取简历优化建议
   */
  const getResumeSuggestions = async (resumeId) => {
    setLoadingSuggestions(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resumes/${resumeId}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.data.suggestions || []);
        setShowSuggestionsModal(true);
      } else {
        setError(data.message || '获取优化建议失败');
      }
    } catch (error) {
      console.error('获取优化建议失败:', error);
      setError(error.message || '获取优化建议失败');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 页面标题和操作栏 */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">简历管理</h1>
                <p className="mt-1 text-sm text-gray-600">管理您的简历，为不同岗位生成专属简历</p>
              </div>
              <div className="flex space-x-4">
                <Link 
                  to="/jobs" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  🎯 岗位管理
                </Link>
                <Link 
                  to="/resumes/create" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ✏️ 手动创建简历
                </Link>
                <Link 
                  to="/landing" 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  📄 智能解析简历
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
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
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">基础简历</h2>
            <p className="mt-1 text-sm text-gray-600">这是您的主要简历，可以作为生成其他专属简历的基础</p>
          </div>
          <div className="p-6">
            {baseResume ? (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">{baseResume.title}</h3>
                    <p className="text-sm text-blue-700">
                      创建时间: {new Date(baseResume.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-blue-700">
                      更新时间: {new Date(baseResume.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenTemplateSelector(baseResume)}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      👁️ 预览
                    </button>
                    <Link 
                      to={`/resumes/edit/${baseResume.id}`}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      ✏️ 编辑
                    </Link>
                    <button
                      onClick={() => getResumeSuggestions(baseResume.id)}
                      disabled={loadingSuggestions}
                      className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {loadingSuggestions ? '⏳' : '💡'} 优化建议
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">您还没有基础简历</p>
                <div className="space-x-4">
                  <Link 
                    to="/landing" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    📄 上传简历文件
                  </Link>
                  <Link 
                    to="/resumes/create" 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    ✏️ 手动创建
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 岗位专属简历部分 */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">岗位专属简历</h2>
                <p className="mt-1 text-sm text-gray-600">针对特定岗位优化的简历版本</p>
              </div>
              {baseResume && (
                <button
                  onClick={() => setShowJobSelectModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  🎯 生成岗位专属简历
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {resumes.filter(resume => !resume.is_base && (resume.target_company || resume.target_position)).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resumes
                  .filter(resume => !resume.is_base && (resume.target_company || resume.target_position))
                  .map(resume => (
                    <div key={resume.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 truncate">{resume.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            🏢 {resume.target_company} - {resume.target_position}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(resume.status)}`}>
                          {getStatusText(resume.status)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-4">
                        生成时间: {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenTemplateSelector(resume)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            👁️ 预览
                          </button>
                          <Link 
                            to={`/resumes/edit/${resume.id}`}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            ✏️ 编辑
                          </Link>
                        </div>
                        <button
                          onClick={() => deleteResume(resume.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">您还没有岗位专属简历</p>
                {baseResume ? (
                  <p className="text-sm text-gray-500">基于基础简历，您可以为特定岗位生成优化的简历版本</p>
                ) : (
                  <p className="text-sm text-gray-500">请先创建基础简历，然后就可以生成岗位专属简历了</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 选择岗位的模态框 */}
        {showJobSelectModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">选择目标岗位</h3>
                {jobs.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {jobs.map(job => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                           onClick={() => generateJobSpecificResume(job)}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{job.title}</h4>
                            <p className="text-sm text-gray-600">{job.company}</p>
                          </div>
                          {generatingJobSpecific[job.id] && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">您还没有添加任何岗位</p>
                    <Link 
                      to="/jobs"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      添加岗位
                    </Link>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowJobSelectModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  ) : (
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
                  )}
                </div>
                
                {/* 右侧预览区 */}
                <div className="flex-1 pl-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">模板预览</h4>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={!renderedHtml || pdfGenerating}
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
                    ) : renderedHtml ? (
                      <div 
                        ref={previewRef}
                        className="p-4 transform scale-75 origin-top-left"
                        style={{ width: '133.33%', transformOrigin: 'top left' }}
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
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

        {/* 优化建议模态框 */}
        {showSuggestionsModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">简历优化建议</h3>
                <button
                  onClick={() => setShowSuggestionsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {suggestions.length > 0 ? (
                  <div className="space-y-4">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{suggestion.category}</h4>
                        <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                        {suggestion.priority && (
                          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {suggestion.priority === 'high' ? '高优先级' :
                             suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无优化建议
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeDashboard; 