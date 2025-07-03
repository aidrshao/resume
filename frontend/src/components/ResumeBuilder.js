/**
 * 简历生成器组件
 * 功能：提供模板选择、简历内容编辑和实时预览功能
 * 布局：左侧表单 + 右侧预览区
 * 创建时间：2025-07-03
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

const ResumeBuilder = () => {
  const navigate = useNavigate();
  
  // 模板相关状态
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDetail, setTemplateDetail] = useState(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateDetailLoading, setTemplateDetailLoading] = useState(false);
  
  // 简历数据状态
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138000',
      location: '北京市朝阳区',
      summary: '具有5年前端开发经验的软件工程师，精通React、Vue等前端技术栈，具备良好的团队协作能力和项目管理经验。熟悉敏捷开发流程，注重代码质量和用户体验。'
    },
    workExperience: [
      {
        company: '阿里巴巴集团',
        position: '高级前端工程师',
        duration: '2021.03 - 至今',
        description: '负责淘宝商家后台核心功能的前端开发，参与系统架构设计，优化页面性能，提升用户体验。主导了商家数据分析模块的重构工作，页面加载速度提升50%。'
      },
      {
        company: '腾讯科技',
        position: '前端工程师',
        duration: '2019.07 - 2021.02',
        description: '参与微信小程序开发工具的前端开发，负责IDE编辑器、调试器等核心功能模块。协助团队建立前端开发规范，推动代码质量提升。'
      },
      {
        company: '字节跳动',
        position: '前端开发实习生',
        duration: '2019.01 - 2019.06',
        description: '参与今日头条Web版本的开发，负责新闻推荐模块的前端实现。学习并实践了现代前端开发技术栈，获得了宝贵的实际项目经验。'
      }
    ],
    education: [
      {
        school: '清华大学',
        degree: '硕士',
        major: '计算机科学与技术',
        duration: '2017.09 - 2019.06',
        gpa: '3.9/4.0'
      },
      {
        school: '北京理工大学',
        degree: '本科',
        major: '软件工程',
        duration: '2013.09 - 2017.06',
        gpa: '3.8/4.0'
      }
    ],
    skills: [
      'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular',
      'Node.js', 'Express', 'Webpack', 'Vite', 'CSS3', 'HTML5',
      'Git', 'Docker', 'AWS', 'MongoDB', 'MySQL'
    ],
    projects: [
      {
        name: '电商管理平台',
        description: '基于React和Node.js开发的全栈电商管理系统，包含商品管理、订单处理、用户管理、数据统计等完整功能。采用微服务架构，支持高并发访问。',
        technologies: 'React, Node.js, MongoDB, Redis, Docker',
        duration: '2022.03 - 2022.10'
      },
      {
        name: '在线协作工具',
        description: '类似Figma的在线设计协作工具，支持实时多人协作、版本管理、评论系统等功能。前端使用Canvas和WebSocket技术实现实时绘图和同步。',
        technologies: 'Vue.js, Canvas, WebSocket, Python, PostgreSQL',
        duration: '2021.06 - 2022.02'
      }
    ],
    languages: [
      { name: '中文', level: '母语' },
      { name: '英语', level: 'CET-6，熟练读写' },
      { name: '日语', level: 'N2，日常交流' }
    ]
  });
  
  // 渲染相关状态
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderError, setRenderError] = useState('');
  
  // PDF下载相关状态
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // DOM引用
  const currentStyleRef = useRef(null);
  const previewRef = useRef(null);

  /**
   * 组件初始化
   */
  useEffect(() => {
    console.log('🚀 [简历生成器] 组件初始化');
    fetchTemplates();
  }, []);

  /**
   * 当选中模板详情或简历数据变化时，重新渲染
   */
  useEffect(() => {
    if (templateDetail && templateDetail.html_content) {
      console.log('🔄 [简历生成器] 开始渲染简历');
      renderResume();
    }
  }, [templateDetail, resumeData]);

  /**
   * 获取可用模板列表
   */
  const fetchTemplates = async () => {
    try {
      console.log('📡 [模板获取] 开始获取模板列表');
      setTemplatesLoading(true);
      setRenderError('');
      
      const response = await fetch('/api/templates');
      const data = await response.json();
      
      console.log('📡 [模板获取] API响应:', data);
      
      if (data.success) {
        setTemplates(data.data);
        console.log(`✅ [模板获取] 成功获取 ${data.data.length} 个模板`);
        
        // 自动选择第一个模板
        if (data.data.length > 0) {
          await handleTemplateSelect(data.data[0]);
        }
      } else {
        throw new Error(data.message || '获取模板失败');
      }
    } catch (err) {
      console.error('❌ [模板获取] 失败:', err);
      setRenderError('获取模板失败：' + err.message);
    } finally {
      setTemplatesLoading(false);
    }
  };

  /**
   * 选择模板并获取详情
   */
  const handleTemplateSelect = async (template) => {
    try {
      console.log('🎨 [模板选择] 选择模板:', template.name, 'ID:', template.id);
      setTemplateDetailLoading(true);
      setSelectedTemplate(template);
      setRenderError('');
      
      // 获取模板详情（包含HTML和CSS内容）
      const response = await fetch(`/api/templates/${template.id}`);
      const data = await response.json();
      
      console.log('🎨 [模板选择] 模板详情API响应:', data.success ? '成功' : '失败');
      
      if (data.success) {
        setTemplateDetail(data.data);
        console.log('✅ [模板选择] 模板详情加载成功');
      } else {
        throw new Error(data.message || '获取模板详情失败');
      }
    } catch (err) {
      console.error('❌ [模板选择] 失败:', err);
      setRenderError('获取模板详情失败：' + err.message);
    } finally {
      setTemplateDetailLoading(false);
    }
  };

  /**
   * 渲染简历预览
   */
  const renderResume = () => {
    try {
      console.log('🎭 [简历渲染] 开始渲染');
      setRenderError('');
      
      if (!templateDetail || !templateDetail.html_content) {
        console.log('⚠️ [简历渲染] 模板详情不完整，跳过渲染');
        return;
      }

      // 1. 清除旧的CSS样式
      if (currentStyleRef.current) {
        document.head.removeChild(currentStyleRef.current);
        currentStyleRef.current = null;
        console.log('🧹 [简历渲染] 清除旧CSS样式');
      }

      // 2. 注入新的CSS样式
      if (templateDetail.css_content) {
        const styleElement = document.createElement('style');
        styleElement.textContent = templateDetail.css_content;
        styleElement.setAttribute('data-resume-template', templateDetail.id);
        document.head.appendChild(styleElement);
        currentStyleRef.current = styleElement;
        console.log('💄 [简历渲染] 注入新CSS样式');
      }

      // 3. 处理HTML模板，填充数据
      let htmlContent = templateDetail.html_content;

      // 替换个人信息
      htmlContent = htmlContent.replace(/\{\{name\}\}/g, resumeData.personalInfo.name || '姓名');
      htmlContent = htmlContent.replace(/\{\{email\}\}/g, resumeData.personalInfo.email || 'email@example.com');
      htmlContent = htmlContent.replace(/\{\{phone\}\}/g, resumeData.personalInfo.phone || '手机号码');
      htmlContent = htmlContent.replace(/\{\{location\}\}/g, resumeData.personalInfo.location || '地址');
      htmlContent = htmlContent.replace(/\{\{summary\}\}/g, resumeData.personalInfo.summary || '个人简介');

      // 替换工作经历
      const workExperienceHtml = resumeData.workExperience.map((exp, index) => `
        <div class="work-item">
          <div class="work-header">
            <h4 class="work-position">${exp.position || '职位名称'}</h4>
            <span class="work-duration">${exp.duration || '工作时间'}</span>
          </div>
          <div class="work-company">${exp.company || '公司名称'}</div>
          <div class="work-description">${exp.description || '工作描述'}</div>
        </div>
      `).join('');
      htmlContent = htmlContent.replace(/\{\{workExperience\}\}/g, workExperienceHtml);

      // 替换教育经历
      const educationHtml = resumeData.education.map((edu, index) => `
        <div class="education-item">
          <div class="education-header">
            <h4 class="education-school">${edu.school || '学校名称'}</h4>
            <span class="education-duration">${edu.duration || '就读时间'}</span>
          </div>
          <div class="education-detail">
            <span class="education-degree">${edu.degree || '学位'}</span>
            <span class="education-major"> - ${edu.major || '专业'}</span>
            ${edu.gpa ? `<div class="education-gpa">GPA: ${edu.gpa}</div>` : ''}
          </div>
        </div>
      `).join('');
      htmlContent = htmlContent.replace(/\{\{education\}\}/g, educationHtml);

      // 替换技能
      const skillsHtml = resumeData.skills.filter(skill => skill.trim()).map(skill => 
        `<span class="skill-item">${skill}</span>`
      ).join('');
      htmlContent = htmlContent.replace(/\{\{skills\}\}/g, skillsHtml);

      // 替换项目经历
      const projectsHtml = resumeData.projects.map((project, index) => `
        <div class="project-item">
          <div class="project-header">
            <h4 class="project-name">${project.name || '项目名称'}</h4>
            <span class="project-duration">${project.duration || '项目时间'}</span>
          </div>
          <div class="project-description">${project.description || '项目描述'}</div>
          <div class="project-technologies">技术栈：${project.technologies || '技术栈'}</div>
        </div>
      `).join('');
      htmlContent = htmlContent.replace(/\{\{projects\}\}/g, projectsHtml);

      // 替换语言能力
      const languagesHtml = resumeData.languages.map((lang, index) => `
        <div class="language-item">
          <span class="language-name">${lang.name || '语言'}</span>
          <span class="language-level"> - ${lang.level || '水平'}</span>
        </div>
      `).join('');
      htmlContent = htmlContent.replace(/\{\{languages\}\}/g, languagesHtml);

      // 4. 设置渲染结果
      setRenderedHtml(htmlContent);
      console.log('✅ [简历渲染] 渲染完成');

    } catch (err) {
      console.error('❌ [简历渲染] 渲染失败:', err);
      setRenderError('简历渲染失败：' + err.message);
    }
  };

  /**
   * 更新个人信息
   */
  const updatePersonalInfo = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  /**
   * 生成并下载PDF
   */
  const handleDownloadPDF = async () => {
    try {
      console.log('📄 [PDF下载] 开始生成PDF');
      setPdfGenerating(true);
      setRenderError('');

      // 检查预览内容是否存在
      if (!previewRef.current || !renderedHtml) {
        throw new Error('预览内容未准备好，请先选择模板');
      }

      // 生成文件名：姓名_职位_简历.pdf
      const userName = resumeData.personalInfo.name || '用户';
      const fileName = `${userName}_简历.pdf`;

      // 配置html2pdf选项
      const options = {
        margin: [10, 10, 10, 10], // 上、右、下、左边距（毫米）
        filename: fileName,
        image: { 
          type: 'jpeg', 
          quality: 0.98 // 高质量图片
        },
        html2canvas: { 
          scale: 2, // 提高清晰度
          useCORS: true, // 支持跨域图片
          logging: false, // 关闭日志
          letterRendering: true, // 改善文字渲染
          allowTaint: false // 防止canvas污染
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', // A4纸张
          orientation: 'portrait' // 纵向
        }
      };

      console.log('📄 [PDF下载] 配置选项:', options);
      console.log('📄 [PDF下载] 开始转换DOM元素');

      // 获取预览容器，需要去掉transform缩放以获得原始大小
      const element = previewRef.current;
      const originalTransform = element.style.transform;
      const originalWidth = element.style.width;
      
      // 临时移除缩放效果以获得原始大小的PDF
      element.style.transform = 'none';
      element.style.width = 'auto';

      // 生成PDF
      await html2pdf()
        .set(options)
        .from(element)
        .save();

      // 恢复原始样式
      element.style.transform = originalTransform;
      element.style.width = originalWidth;

      console.log('✅ [PDF下载] PDF生成成功:', fileName);

    } catch (error) {
      console.error('❌ [PDF下载] 生成失败:', error);
      setRenderError('PDF生成失败：' + error.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  /**
   * 组件卸载时清理CSS
   */
  useEffect(() => {
    return () => {
      if (currentStyleRef.current) {
        document.head.removeChild(currentStyleRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/resumes')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">简历生成器</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/resumes')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                返回列表
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={!renderedHtml || pdfGenerating}
                className={`px-4 py-2 rounded-md transition-colors ${
                  !renderedHtml || pdfGenerating
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {pdfGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    生成中...
                  </>
                ) : (
                  '📄 下载PDF'
                )}
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                💾 保存简历
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {renderError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {renderError}
            <button 
              onClick={() => setRenderError('')} 
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 左侧：模板选择和简历编辑表单 */}
          <div className="space-y-6">
            
            {/* 模板选择区域 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🎨 选择模板</h2>
              
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">加载模板中...</span>
                </div>
              ) : templates.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`relative cursor-pointer border-2 rounded-lg p-3 transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* 模板缩略图 */}
                      <div className="mb-3">
                        {template.thumbnail_url ? (
                          <img
                            src={template.thumbnail_url}
                            alt={template.name}
                            className="w-full h-24 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center" style={{display: template.thumbnail_url ? 'none' : 'flex'}}>
                          <span className="text-gray-400 text-sm">📄</span>
                        </div>
                      </div>
                      
                      {/* 模板信息 */}
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                          {template.name}
                        </h3>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-xs text-gray-500">{template.category}</span>
                          {template.is_premium && (
                            <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              付费
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 选中标识 */}
                      {selectedTemplate?.id === template.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}

                      {/* 加载指示器 */}
                      {templateDetailLoading && selectedTemplate?.id === template.id && (
                        <div className="absolute inset-0 bg-white bg-opacity-80 rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>暂无可用模板</p>
                </div>
              )}
            </div>

            {/* 个人信息表单 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">👤 个人信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    value={resumeData.personalInfo.name}
                    onChange={(e) => updatePersonalInfo('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入您的姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={resumeData.personalInfo.email}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号码</label>
                  <input
                    type="tel"
                    value={resumeData.personalInfo.phone}
                    onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入手机号码"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">居住地址</label>
                  <input
                    type="text"
                    value={resumeData.personalInfo.location}
                    onChange={(e) => updatePersonalInfo('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="城市，省份"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                <textarea
                  value={resumeData.personalInfo.summary}
                  onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请简要介绍您的专业背景和职业目标..."
                />
              </div>
            </div>

            {/* 功能说明 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">模板系统说明</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    ✅ 现在使用的是管理员后台配置的真实模板系统<br/>
                    ✅ 模板支持动态CSS样式注入和HTML渲染<br/>
                    ✅ 修改左侧信息可实时查看右侧预览效果<br/>
                    ✅ 包含完整的简历数据：个人信息、工作经历、教育背景、技能、项目、语言等
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* 右侧：简历预览区域 */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">👀 实时预览</h2>
                  {selectedTemplate && (
                    <span className="text-sm text-gray-600">
                      {selectedTemplate.name}
                      {templateDetailLoading && <span className="ml-2">🔄</span>}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">加载中...</span>
                  </div>
                ) : templateDetailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">加载模板中...</span>
                  </div>
                ) : renderedHtml ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      ref={previewRef}
                      className="resume-preview-container p-6 bg-white min-h-[700px] scale-75 origin-top-left transform w-[133%] overflow-auto"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2">选择模板开始预览</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder; 