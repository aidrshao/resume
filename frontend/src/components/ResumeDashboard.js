/**
 * 简历仪表板
 * 显示基础简历和AI定制简历，提供创建、编辑、删除功能
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../utils/api';
import html2pdf from 'html2pdf.js';
import ResumeRenderer from './ResumeRenderer';

const ResumeDashboard = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [customizedResumes, setCustomizedResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [baseResume, setBaseResume] = useState(null);
  
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

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
             // 并行获取基础简历和定制简历
             const [resumesResponse, customizedResponse] = await Promise.all([
        api.getResumes(),
        api.getCustomizedResumes()
      ]);
      
      console.log('基础简历响应:', resumesResponse);
      console.log('定制简历响应:', customizedResponse);
      
      if (resumesResponse.success) {
        setResumes(resumesResponse.data);
        const base = resumesResponse.data.find(r => r.is_base);
        setBaseResume(base);
        
        console.log('基础简历:', base);
      }
      
      if (customizedResponse.success) {
        setCustomizedResumes(customizedResponse.data);
      }
      
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('加载数据失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

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
    }
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
                <p className="mt-1 text-sm text-gray-600">管理您的简历，创建和编辑您的个人简历</p>
              </div>
              <div className="flex space-x-4">
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
                      to={`/resume/${baseResume.id}/edit`}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      ✏️ 编辑
                    </Link>
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

        {/* AI定制简历部分 */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">AI定制简历</h2>
                <p className="mt-1 text-sm text-gray-600">基于AI优化的个性化简历版本</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {/* 定制简历 */}
            {customizedResumes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-md font-medium text-gray-700 mb-4">🎯 AI定制简历</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customizedResumes.map(resume => (
                    <div key={`customized-${resume.id}`} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-blue-900 truncate">
                            {resume.job_title || '专属简历'}
                          </h3>
                          <p className="text-sm text-blue-700 mt-1">
                            🏢 {resume.company_name}
                          </p>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                            AI定制版本
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-blue-600 mb-4">
                        生成时间: {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <Link 
                            to={`/resumes/customized/${resume.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            👁️ 预览
                          </Link>
                          <Link 
                            to={`/resumes/customized/${resume.id}`}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            ✏️ 编辑模板
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 空状态 */}
            {customizedResumes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">您还没有AI定制简历</p>
                {baseResume ? (
                  <p className="text-sm text-gray-500">基于基础简历，您可以生成AI优化的定制简历版本</p>
                ) : (
                  <p className="text-sm text-gray-500">请先创建基础简历，然后就可以生成AI定制简历了</p>
                )}
              </div>
            )}
          </div>
        </div>

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