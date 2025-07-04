/**
 * 简历预览页面组件
 * 功能：模板选择与渲染引擎，支持实时预览和PDF下载
 * 创建时间：2025-01-10
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { getCustomizedResumeById, getTemplatesList, getTemplateById } from '../utils/api';
import ResumeRenderer from './ResumeRenderer';
import TemplateSelector from './TemplateSelector';

const ResumePreviewPage = () => {
  const { id } = useParams(); // 从URL中获取customizedResumeId
  const navigate = useNavigate();

  // 状态管理
  const [customizedResumeData, setCustomizedResumeData] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateDetailLoading, setTemplateDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templatesError, setTemplatesError] = useState(null);

  // 数据获取逻辑
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('🔄 [ResumePreviewPage] 开始加载数据，简历ID:', id);
        setIsLoading(true);
        setError(null);
        
        console.log('📡 [ResumePreviewPage] 发起并行请求：简历数据 + 模板列表');
        
        // 同时获取简历数据和模板列表
        const [resumeResponse, templatesResponse] = await Promise.all([
          getCustomizedResumeById(id),
          getTemplatesList()
        ]);
        
        console.log('📊 [ResumePreviewPage] 简历数据响应:', resumeResponse);
        console.log('📊 [ResumePreviewPage] 模板列表响应:', templatesResponse);
        
        // 处理简历数据
        if (resumeResponse.success) {
          console.log('✅ [ResumePreviewPage] 简历数据获取成功:', {
            id: resumeResponse.data.id,
            hasOptimizedData: !!resumeResponse.data.optimized_data,
            hasOptimizedDataAlt: !!resumeResponse.data.optimizedData,
            dataKeys: Object.keys(resumeResponse.data)
          });
          setCustomizedResumeData(resumeResponse.data);
        } else {
          console.error('❌ [ResumePreviewPage] 简历数据获取失败:', resumeResponse.message);
          setError(resumeResponse.message || '获取简历数据失败');
        }
        
        // 处理模板列表
        if (templatesResponse.success) {
          console.log('✅ [ResumePreviewPage] 模板列表获取成功:', {
            count: templatesResponse.data.length,
            templates: templatesResponse.data.map(t => ({ id: t.id, name: t.name }))
          });
          setTemplates(templatesResponse.data);
          setTemplatesLoading(false);
          
          // 自动选择第一个模板
          if (templatesResponse.data.length > 0) {
            console.log('🎯 [ResumePreviewPage] 自动选择第一个模板:', templatesResponse.data[0].name);
            handleTemplateSelect(templatesResponse.data[0]);
          } else {
            console.warn('⚠️ [ResumePreviewPage] 没有可用模板');
          }
        } else {
          console.error('❌ [ResumePreviewPage] 模板列表获取失败:', templatesResponse.message);
          setTemplatesError(templatesResponse.message || '获取模板列表失败');
        }
        
      } catch (err) {
        console.error('❌ [ResumePreviewPage] 加载数据失败:', err);
        setError(err.message || '网络错误，请稍后重试');
        setTemplatesError('加载模板失败');
      } finally {
        console.log('🏁 [ResumePreviewPage] 数据加载完成');
        setIsLoading(false);
        setTemplatesLoading(false);
      }
    };

    if (id) {
      loadInitialData();
    } else {
      console.error('❌ [ResumePreviewPage] 缺少简历ID参数');
      setError('缺少简历ID参数');
      setIsLoading(false);
    }
  }, [id]);

  // 处理模板选择
  const handleTemplateSelect = async (template) => {
    if (selectedTemplate?.id === template.id) {
      console.log('ℹ️ [ResumePreviewPage] 模板已选择，跳过:', template.name);
      return; // 已选择相同模板，无需重新加载
    }
    
    try {
      console.log('🎨 [ResumePreviewPage] 选择模板:', { id: template.id, name: template.name });
      setTemplateDetailLoading(true);
      
      // 获取模板详情
      console.log('📡 [ResumePreviewPage] 请求模板详情，ID:', template.id);
      const response = await getTemplateById(template.id);
      
      console.log('📊 [ResumePreviewPage] 模板详情响应:', response);
      
      if (response.success) {
        console.log('✅ [ResumePreviewPage] 模板详情获取成功:', {
          id: response.data.id,
          name: response.data.name,
          hasHtmlContent: !!response.data.html_content,
          hasCssContent: !!response.data.css_content,
          htmlContentLength: response.data.html_content?.length || 0,
          cssContentLength: response.data.css_content?.length || 0
        });
        setSelectedTemplate(response.data);
      } else {
        console.error('❌ [ResumePreviewPage] 获取模板详情失败:', response.message);
        alert('获取模板详情失败，请稍后重试');
      }
    } catch (error) {
      console.error('❌ [ResumePreviewPage] 模板选择失败:', error);
      alert('选择模板失败，请稍后重试');
    } finally {
      console.log('🏁 [ResumePreviewPage] 模板加载完成');
      setTemplateDetailLoading(false);
    }
  };

  // 处理PDF下载
  const handleDownloadPDF = async () => {
    try {
      // 获取预览区域的DOM元素
      const previewElement = document.querySelector('.resume-preview');
      
      if (!previewElement) {
        alert('预览区域未找到，请稍后重试');
        return;
      }

      // 配置PDF选项
      const options = {
        margin: [10, 10, 10, 10],
        filename: `简历_${customizedResumeData?.jobTitle || '未命名'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      console.log('🔄 开始生成PDF...');
      
      // 生成并下载PDF
      await html2pdf().from(previewElement).set(options).save();
      
      console.log('✅ PDF生成完成');
      
    } catch (error) {
      console.error('❌ PDF生成失败:', error);
      alert('PDF生成失败，请稍后重试');
    }
  };

  // 返回上一页
  const handleGoBack = () => {
    navigate(-1);
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载简历数据...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold text-lg mb-2">加载失败</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={handleGoBack}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </button>
            </div>
            
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                简历预览与导出
              </h1>
              {customizedResumeData && (
                <p className="text-sm text-gray-500 mt-1">
                  {customizedResumeData.jobTitle} - {customizedResumeData.companyName}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* PDF下载按钮 */}
              <button
                onClick={handleDownloadPDF}
                disabled={!selectedTemplate || templateDetailLoading}
                className={`
                  flex items-center px-4 py-2 rounded-lg font-medium transition-colors
                  ${!selectedTemplate || templateDetailLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                `}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 左侧模板选择器 */}
          <div className="w-80 flex-shrink-0">
            <TemplateSelector
              templates={templates}
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
              isLoading={templatesLoading}
              error={templatesError}
            />
          </div>

          {/* 右侧预览区域 */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">简历预览</h3>
                {templateDetailLoading && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm">加载模板中...</span>
                  </div>
                )}
              </div>
              
              {/* 预览提示 */}
              {!selectedTemplate && (
                <div className="text-center py-16 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">请选择一个模板</p>
                  <p className="text-sm">从左侧选择一个模板来预览简历效果</p>
                </div>
              )}
              
              {/* 简历渲染器 */}
              <ResumeRenderer
                resumeData={customizedResumeData?.optimized_data || customizedResumeData?.optimizedData}
                template={selectedTemplate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreviewPage;