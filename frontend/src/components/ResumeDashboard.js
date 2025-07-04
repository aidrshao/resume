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
  
  // 新的模板系统状态
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
   * 获取模板列表
   */
  const fetchTemplates = async () => {
    try {
      console.log('🔄 [模板加载] 开始获取模板列表');
      setTemplatesLoading(true);
      setRenderError('');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📊 [模板加载] API返回:', data);

      if (data.success) {
        const templateList = data.data || [];
        setTemplates(templateList);
        console.log('✅ [模板加载] 成功加载', templateList.length, '个模板');
        
        // 自动选择第一个模板并渲染
        if (templateList.length > 0 && selectedResumeForTemplate) {
          console.log('🎯 [自动选择] 选择第一个模板:', templateList[0].name);
          await handleTemplateSelect(templateList[0]);
        }
      } else {
        console.error('❌ [模板加载] 失败:', data.message);
        setRenderError(data.message || '获取模板列表失败');
      }
    } catch (error) {
      console.error('❌ [模板加载] 异常:', error);
      setRenderError('网络错误，请稍后重试');
    } finally {
      setTemplatesLoading(false);
    }
  };

  /**
   * 选择模板并获取详情
   */
  const handleTemplateSelect = async (template) => {
    try {
      console.log('🎨 [模板选择] 选择模板:', template.name);
      setSelectedTemplate(template);
      setTemplateDetailLoading(true);
      setRenderError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/templates/${template.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📄 [模板详情] API返回:', data);

      if (data.success) {
        console.log('✅ [模板详情] 获取成功，开始渲染');
        await renderResumeWithTemplate(template, data.data);
      } else {
        console.error('❌ [模板详情] 获取失败:', data.message);
        setRenderError(data.message || '获取模板详情失败');
      }
    } catch (error) {
      console.error('❌ [模板选择] 异常:', error);
      setRenderError('模板加载失败，请稍后重试');
    } finally {
      setTemplateDetailLoading(false);
    }
  };

  /**
   * 使用模板渲染简历 - 新版本支持统一变量规范
   */
  const renderResumeWithTemplate = async (template, templateData) => {
    try {
      console.log('🖥️ [简历渲染] 开始渲染，模板:', template.name);
      
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
        console.log('✅ [CSS注入] 样式注入成功');
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

      console.log('📊 [简历数据] 获取成功，开始解析...');
      console.log('📊 [原始简历数据]:', resumeData.data);

      // 解析简历内容
      let parsedContent = {};
      try {
        // 尝试解析JSON格式的内容
        if (resumeData.data.content && typeof resumeData.data.content === 'string') {
          console.log('📊 [解析] 解析字符串格式的content字段');
          parsedContent = JSON.parse(resumeData.data.content);
        } else if (typeof resumeData.data.content === 'object') {
          console.log('📊 [解析] 使用对象格式的content字段');
          parsedContent = resumeData.data.content;
        } else if (resumeData.data.resume_data) {
          console.log('📊 [解析] 使用resume_data字段');
          if (typeof resumeData.data.resume_data === 'string') {
            parsedContent = JSON.parse(resumeData.data.resume_data);
          } else {
            parsedContent = resumeData.data.resume_data;
          }
        } else {
          console.log('📊 [解析] 没有找到有效数据，使用空对象');
          parsedContent = {};
        }
      } catch (error) {
        console.error('❌ [简历解析] JSON解析失败:', error);
        parsedContent = { summary: resumeData.data.content || '' };
      }

      console.log('📊 [解析后的数据]:', parsedContent);

      // 创建符合 UNIFIED_RESUME_SCHEMA 的完整数据结构
      const standardResumeData = {
        // 个人信息 - 按新规范格式 (profile)
        profile: {
          name: parsedContent.profile?.name || parsedContent.personalInfo?.name || resumeData.data.title || '姓名',
          email: parsedContent.profile?.email || parsedContent.personalInfo?.email || 'user@example.com',
          phone: parsedContent.profile?.phone || parsedContent.personalInfo?.phone || '138-0000-0000',
          location: parsedContent.profile?.location || parsedContent.personalInfo?.location || '北京市',
          portfolio: parsedContent.profile?.portfolio || parsedContent.personalInfo?.portfolio || '',
          linkedin: parsedContent.profile?.linkedin || parsedContent.personalInfo?.linkedin || '',
          summary: parsedContent.profile?.summary || parsedContent.personalInfo?.summary || parsedContent.summary || '优秀的专业人士'
        },
        
        // 工作经历 - 新格式 workExperience (非复数)
        workExperience: Array.isArray(parsedContent.workExperience) ? parsedContent.workExperience : 
                       Array.isArray(parsedContent.workExperiences) ? parsedContent.workExperiences : [
          {
            position: '待完善职位',
            company: '待完善公司',
            duration: '待完善时间',
            description: '请在简历编辑中完善工作经历信息。'
          }
        ],
        
        // 项目经历 - 新格式 projectExperience
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
        
        // 教育背景 - 新格式 education (非复数)
        education: Array.isArray(parsedContent.education) ? parsedContent.education :
                  Array.isArray(parsedContent.educations) ? parsedContent.educations : [
          {
            degree: '待完善学历',
            school: '待完善学校',
            duration: '待完善时间',
            major: '待完善专业'
          }
        ],
        
        // 技能 - 新格式，支持分类结构
        skills: Array.isArray(parsedContent.skills) ? 
               (parsedContent.skills.length > 0 && parsedContent.skills[0].category ?
                parsedContent.skills : 
                [{ category: '技能', details: parsedContent.skills.join(', ') }]) :
               [{ category: '技能', details: '待完善技能' }],
        
        // 自定义模块
        customSections: Array.isArray(parsedContent.customSections) ? parsedContent.customSections : []
      };

      // 为了兼容旧模板，添加向后兼容的属性
      standardResumeData.personalInfo = standardResumeData.profile; // 向后兼容
      standardResumeData.workExperiences = standardResumeData.workExperience; // 向后兼容
      standardResumeData.projects = standardResumeData.projectExperience; // 向后兼容
      standardResumeData.educations = standardResumeData.education; // 向后兼容

      // 添加便捷访问属性
      standardResumeData.workExperience.first = standardResumeData.workExperience[0] || {};
      standardResumeData.education.first = standardResumeData.education[0] || {};
      
      // 为skills创建字符串列表（向后兼容）
      const skillsStringList = standardResumeData.skills.map(skill => skill.details).filter(d => d).join(', ');
      standardResumeData.skills.list = skillsStringList;

      console.log('✅ [数据规范化] 数据结构标准化完成:', {
        profile: !!standardResumeData.profile.name,
        workExperience: standardResumeData.workExperience.length,
        projectExperience: standardResumeData.projectExperience.length,
        education: standardResumeData.education.length,
        skills: standardResumeData.skills.length
      });

      console.log('🔍 [数据验证] 最终数据结构:', standardResumeData);

      // 使用Handlebars编译模板
      let compiledTemplate;
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
        
        console.log('✅ [Handlebars] 模板编译和渲染成功');

        // ========== 向后兼容性处理 ==========
        // 为了支持旧模板，同时进行简单变量替换
        console.log('🔄 [向后兼容] 开始处理旧格式变量...');
        
        // 新格式变量替换 (profile.*)
        htmlContent = htmlContent.replace(/\{\{profile\.name\}\}/g, standardResumeData.profile.name);
        htmlContent = htmlContent.replace(/\{\{profile\.email\}\}/g, standardResumeData.profile.email);
        htmlContent = htmlContent.replace(/\{\{profile\.phone\}\}/g, standardResumeData.profile.phone);
        htmlContent = htmlContent.replace(/\{\{profile\.location\}\}/g, standardResumeData.profile.location);
        htmlContent = htmlContent.replace(/\{\{profile\.summary\}\}/g, standardResumeData.profile.summary);

        // 旧格式兼容性替换 (personalInfo.*)
        htmlContent = htmlContent.replace(/\{\{personalInfo\.name\}\}/g, standardResumeData.profile.name);
        htmlContent = htmlContent.replace(/\{\{personalInfo\.email\}\}/g, standardResumeData.profile.email);
        htmlContent = htmlContent.replace(/\{\{personalInfo\.phone\}\}/g, standardResumeData.profile.phone);
        htmlContent = htmlContent.replace(/\{\{personalInfo\.location\}\}/g, standardResumeData.profile.location);
        htmlContent = htmlContent.replace(/\{\{personalInfo\.summary\}\}/g, standardResumeData.profile.summary);
        
        // 简单格式兼容性替换 (直接变量)
        htmlContent = htmlContent.replace(/\{\{name\}\}/g, standardResumeData.profile.name);
        htmlContent = htmlContent.replace(/\{\{email\}\}/g, standardResumeData.profile.email);
        htmlContent = htmlContent.replace(/\{\{phone\}\}/g, standardResumeData.profile.phone);
        htmlContent = htmlContent.replace(/\{\{location\}\}/g, standardResumeData.profile.location);
        htmlContent = htmlContent.replace(/\{\{summary\}\}/g, standardResumeData.profile.summary);
        htmlContent = htmlContent.replace(/\{\{position\}\}/g, standardResumeData.workExperience.first.position || '职位');

        // 移除任何未处理的Handlebars语法
        htmlContent = htmlContent.replace(/\{\{#[^}]+\}\}/g, function(match) {
          console.warn('⚠️ [未处理变量]:', match);
          return match; // 保留原始变量，便于调试
        });

        console.log('✅ [向后兼容] 处理完成');

        // 最终调试：检查是否还有未替换的变量
        const remainingVars = htmlContent.match(/\{\{[^}]+\}\}/g) || [];
        if (remainingVars.length > 0) {
          console.log('⚠️ [变量检查] 发现未替换的变量:', remainingVars);
        }
        
        console.log('🔍 [变量替换] 个人信息验证:');
        console.log('姓名:', standardResumeData.profile.name);
        console.log('邮箱:', standardResumeData.profile.email);
        console.log('电话:', standardResumeData.profile.phone);
        console.log('地址:', standardResumeData.profile.location);

        setRenderedHtml(htmlContent);
        console.log('✅ [简历渲染] 渲染完成');

      } catch (handlebarsError) {
        console.error('❌ [Handlebars] 模板编译失败:', handlebarsError);
        console.log('🔄 [降级处理] 使用简单变量替换...');
        
        // Handlebars失败时，降级到简单替换模式
        let htmlContent = templateData.html_content;
        
        // 新格式变量替换
        htmlContent = htmlContent.replace(/\{\{profile\.name\}\}/g, standardResumeData.profile.name);
        htmlContent = htmlContent.replace(/\{\{profile\.email\}\}/g, standardResumeData.profile.email);
        htmlContent = htmlContent.replace(/\{\{profile\.phone\}\}/g, standardResumeData.profile.phone);
        htmlContent = htmlContent.replace(/\{\{profile\.location\}\}/g, standardResumeData.profile.location);
        htmlContent = htmlContent.replace(/\{\{profile\.summary\}\}/g, standardResumeData.profile.summary);
        
        // 使用标准数据进行简单替换（向后兼容）
        htmlContent = htmlContent.replace(/\{\{personalInfo\.name\}\}/g, standardResumeData.profile.name);
        htmlContent = htmlContent.replace(/\{\{personalInfo\.email\}\}/g, standardResumeData.profile.email);
        htmlContent = htmlContent.replace(/\{\{personalInfo\.phone\}\}/g, standardResumeData.profile.phone);
        htmlContent = htmlContent.replace(/\{\{personalInfo\.location\}\}/g, standardResumeData.profile.location);
        htmlContent = htmlContent.replace(/\{\{personalInfo\.summary\}\}/g, standardResumeData.profile.summary);
        
        // 旧格式兼容
        htmlContent = htmlContent.replace(/\{\{name\}\}/g, standardResumeData.profile.name);
        htmlContent = htmlContent.replace(/\{\{email\}\}/g, standardResumeData.profile.email);
        htmlContent = htmlContent.replace(/\{\{phone\}\}/g, standardResumeData.profile.phone);
        htmlContent = htmlContent.replace(/\{\{location\}\}/g, standardResumeData.profile.location);
        htmlContent = htmlContent.replace(/\{\{summary\}\}/g, standardResumeData.profile.summary);
        htmlContent = htmlContent.replace(/\{\{position\}\}/g, standardResumeData.workExperience.first.position || '职位');

        // 简单的列表替换 - 工作经历
        const workExpHtml = standardResumeData.workExperience.map(exp => 
          `<div class="work-item">
            <h4>${exp.position || '职位'}</h4>
            <div class="work-meta">${exp.company || '公司'} | ${exp.duration || '工作时间'}</div>
            <p>${exp.description || '工作描述'}</p>
          </div>`
        ).join('');
        htmlContent = htmlContent.replace(/\{\{workExperience\}\}/g, workExpHtml);
        htmlContent = htmlContent.replace(/\{\{workExperiences\}\}/g, workExpHtml); // 向后兼容

        // 简单的列表替换 - 教育背景
        const educationHtml = standardResumeData.education.map(edu => 
          `<div class="education-item">
            <h4>${edu.degree || '学位'}</h4>
            <div class="education-meta">${edu.school || '学校'} | ${edu.duration || '就读时间'}</div>
            <p>${edu.major || '专业'}</p>
          </div>`
        ).join('');
        htmlContent = htmlContent.replace(/\{\{education\}\}/g, educationHtml);
        htmlContent = htmlContent.replace(/\{\{educations\}\}/g, educationHtml); // 向后兼容

        // 简单的列表替换 - 技能
        const skillsHtml = standardResumeData.skills.map(skill => 
          `<div class="skill-category">
            <h5>${skill.category}</h5>
            <span class="skill-details">${skill.details}</span>
          </div>`
        ).join('');
        htmlContent = htmlContent.replace(/\{\{skills\}\}/g, skillsHtml);

        // 项目经历
        const projectsHtml = standardResumeData.projectExperience.map(proj => 
          `<div class="project-item">
            <h4>${proj.name || '项目名称'}</h4>
            <div class="project-meta">${proj.role || '角色'} | ${proj.duration || '时间'}</div>
            <p>${proj.description || '项目描述'}</p>
          </div>`
        ).join('');
        htmlContent = htmlContent.replace(/\{\{projectExperience\}\}/g, projectsHtml);
        htmlContent = htmlContent.replace(/\{\{projects\}\}/g, projectsHtml); // 向后兼容

        // 移除未处理的Handlebars语法
        htmlContent = htmlContent.replace(/\{\{#[^}]+\}\}/g, '');
        htmlContent = htmlContent.replace(/\{\{\/[^}]+\}\}/g, '');
        htmlContent = htmlContent.replace(/\{\{[^}]+\}\}/g, '');

        setRenderedHtml(htmlContent);
        console.log('✅ [降级处理] 简单替换完成');
      }

    } catch (error) {
      console.error('❌ [简历渲染] 渲染失败:', error);
      setRenderError('模板渲染失败：' + error.message);
    }
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

      // 生成文件名：使用简历标题或者从渲染内容中提取姓名
      const resumeName = selectedResumeForTemplate?.title || '简历';
      const cleanName = resumeName.replace(/[<>:"/\\|?*]/g, '_'); // 清理文件名中的非法字符
      const fileName = `${cleanName}.pdf`;

      // 配置html2pdf选项
      const options = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { 
          type: 'jpeg', 
          quality: 0.98 
        },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: false 
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4',
          orientation: 'portrait' 
        }
      };

      console.log('📄 [PDF下载] 配置选项:', options);

      // 获取预览容器
      const element = previewRef.current;
      const originalTransform = element.style.transform;
      const originalWidth = element.style.width;
      
      // 临时移除缩放效果
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
   * 打开模板选择器
   */
  const handleOpenTemplateSelector = (resume) => {
    setSelectedResumeForTemplate(resume);
    setShowTemplateModal(true);
    fetchTemplates(); // 加载模板列表
  };

  /**
   * 关闭模板选择器
   */
  const handleCloseTemplateSelector = () => {
    setShowTemplateModal(false);
    setSelectedResumeForTemplate(null);
    setSelectedTemplate(null);
    setRenderedHtml('');
    setRenderError('');
    
    // 清除CSS样式
    if (currentStyleRef.current) {
      document.head.removeChild(currentStyleRef.current);
      currentStyleRef.current = null;
    }
  };

  // 组件卸载时清理样式
  useEffect(() => {
    return () => {
      if (currentStyleRef.current) {
        document.head.removeChild(currentStyleRef.current);
      }
    };
  }, []);

  /**
   * 获取简历建议
   */
  const getResumeSuggestions = async (resumeId) => {
    try {
      setLoadingSuggestions(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resumes/${resumeId}/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuggestions(data.data);
        setShowSuggestionsModal(true);
      } else {
        setError(data.message || '获取简历建议失败');
      }
    } catch (err) {
      console.error('获取简历建议失败:', err);
      setError('获取简历建议失败，请稍后重试');
    } finally {
      setLoadingSuggestions(false);
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
                to="/resumes/new"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                📝 创建新简历
              </Link>
              <Link
                to="/ai-chat"
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                🤖 AI问答创建
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
                  to="/resumes/new"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  📝 创建基础简历
                </Link>
                <Link
                  to="/ai-chat"
                  className="bg-green-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  🤖 AI创建简历
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
                    <button
                      onClick={() => getResumeSuggestions(baseResume.id)}
                      className="text-green-600 hover:text-green-900 text-sm font-medium"
                    >
                      获取建议
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
                        {resume.status === 'completed' && (
                          <button
                            onClick={() => getResumeSuggestions(resume.id)}
                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                          >
                            获取建议
                          </button>
                        )}
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

      {/* 简历建议模态框 */}
      {showSuggestionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">📝 简历优化建议</h3>
                <button
                  onClick={() => setShowSuggestionsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {loadingSuggestions ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">AI正在分析您的简历...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">✨</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">恭喜！</h4>
                  <p className="text-gray-500">您的简历已经很棒了，暂无特别建议</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        suggestion.priority === 'high' 
                          ? 'bg-red-50 border-red-400' 
                          : suggestion.priority === 'medium'
                          ? 'bg-yellow-50 border-yellow-400'
                          : 'bg-blue-50 border-blue-400'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {suggestion.priority === 'high' && <span className="text-red-500">🔴</span>}
                          {suggestion.priority === 'medium' && <span className="text-yellow-500">🟡</span>}
                          {suggestion.priority === 'low' && <span className="text-blue-500">🔵</span>}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {suggestion.title}
                            </h4>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              suggestion.priority === 'high' 
                                ? 'bg-red-100 text-red-800' 
                                : suggestion.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {suggestion.priority === 'high' ? '重要' : suggestion.priority === 'medium' ? '一般' : '建议'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {suggestion.description}
                          </p>
                          {suggestion.section && (
                            <div className="mt-2 text-xs text-gray-500">
                              📍 相关部分：{suggestion.section}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-green-500 text-xl">💡</span>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-800">小贴士</h4>
                        <p className="text-sm text-green-700">
                          根据以上建议优化简历后，您可以重新获取建议来查看改进效果
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 新的模板选择器 */}
      {showTemplateModal && selectedResumeForTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">选择简历模板</h3>
                  <p className="text-sm text-gray-500">为简历 "{selectedResumeForTemplate.title}" 选择合适的模板</p>
                </div>
                <button
                  onClick={handleCloseTemplateSelector}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：模板选择 */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">📚 可用模板</h4>
                  
                  {templatesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">加载模板中...</span>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>暂无可用模板</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className={`relative cursor-pointer border-2 rounded-lg p-4 transition-all ${
                            selectedTemplate?.id === template.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-1">
                                {template.name}
                              </h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{template.category}</span>
                                {template.is_premium && (
                                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                    付费
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* 选中标识 */}
                            {selectedTemplate?.id === template.id && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 右侧：预览和操作 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">👀 实时预览</h4>
                    {selectedTemplate && renderedHtml && (
                      <button
                        onClick={handleDownloadPDF}
                        disabled={pdfGenerating}
                        className={`px-4 py-2 rounded-md transition-colors ${
                          pdfGenerating
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
                    )}
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {templateDetailLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">加载模板中...</span>
                      </div>
                    ) : renderError ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="text-red-500 text-lg mb-2">⚠️</div>
                          <p className="text-red-600 text-sm">{renderError}</p>
                        </div>
                      </div>
                    ) : renderedHtml ? (
                      <div 
                        ref={previewRef}
                        className="p-6 bg-white min-h-[400px] scale-50 origin-top-left transform w-[200%] overflow-auto"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      />
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
      )}
    </div>
  );
};

export default ResumeDashboard; 