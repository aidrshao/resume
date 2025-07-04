/**
 * 模板功能测试页面
 * 功能：演示和测试模板选择与渲染功能
 * 创建时间：2025-01-10
 */

import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { getTemplatesList, getTemplateById } from '../utils/api';
import ResumeRenderer from './ResumeRenderer';
import TemplateSelector from './TemplateSelector';

const TemplateTestPage = () => {
  // 状态管理
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateDetailLoading, setTemplateDetailLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);

  // 测试用简历数据
  const testResumeData = {
    profile: {
      name: "张三",
      email: "zhangsan@example.com",
      phone: "13800138000",
      location: "北京市朝阳区",
      summary: "资深前端开发工程师，5年工作经验，专注于React和Vue.js生态系统开发，具有丰富的移动端和PC端项目经验。"
    },
    workExperience: [
      {
        position: "高级前端工程师",
        company: "阿里巴巴集团",
        duration: "2021.01 - 至今",
        description: [
          "负责淘宝商城前端架构设计和优化，提升页面加载速度30%",
          "主导团队技术选型，推动React 18和TypeScript在项目中的应用",
          "指导初级工程师进行代码开发，制定前端开发规范"
        ]
      },
      {
        position: "前端工程师",
        company: "腾讯科技",
        duration: "2019.06 - 2020.12",
        description: [
          "参与微信小程序开发框架建设，服务于数百万开发者",
          "负责H5页面性能监控系统开发，实现实时性能数据收集",
          "协助产品经理进行需求分析和技术可行性评估"
        ]
      }
    ],
    projectExperience: [
      {
        name: "电商购物平台",
        role: "前端技术负责人",
        duration: "2021.03 - 2021.12",
        description: [
          "负责整体前端架构设计，采用微前端架构支持多团队协作",
          "实现了商品展示、购物车、订单管理等核心功能模块",
          "集成了支付宝、微信支付等第三方支付接口"
        ],
        technologies: ["React", "TypeScript", "Redux", "Ant Design", "Webpack"]
      }
    ],
    education: [
      {
        school: "清华大学",
        degree: "学士",
        major: "计算机科学与技术",
        duration: "2015.09 - 2019.06",
        gpa: "3.8/4.0"
      }
    ],
    skills: [
      {
        category: "前端技术",
        details: "React, Vue.js, TypeScript, JavaScript ES6+, HTML5, CSS3"
      },
      {
        category: "开发工具",
        details: "Git, Webpack, Vite, Jest, Cypress, VS Code"
      },
      {
        category: "后端技术",
        details: "Node.js, Express, MongoDB, MySQL"
      }
    ]
  };

  // 加载模板列表
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true);
        setTemplatesError(null);
        
        const response = await getTemplatesList();
        
        if (response.success) {
          setTemplates(response.data);
        } else {
          setTemplatesError(response.message || '获取模板列表失败');
        }
      } catch (error) {
        console.error('加载模板失败:', error);
        setTemplatesError('网络错误，请稍后重试');
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // 处理模板选择
  const handleTemplateSelect = async (template) => {
    if (selectedTemplate?.id === template.id) {
      return;
    }
    
    try {
      setTemplateDetailLoading(true);
      
      const response = await getTemplateById(template.id);
      
      if (response.success) {
        setSelectedTemplate(response.data);
        console.log('✅ 模板选择成功:', response.data.name);
      } else {
        console.error('❌ 获取模板详情失败:', response.message);
        alert('获取模板详情失败，请稍后重试');
      }
    } catch (error) {
      console.error('❌ 模板选择失败:', error);
      alert('选择模板失败，请稍后重试');
    } finally {
      setTemplateDetailLoading(false);
    }
  };

  // 处理PDF下载
  const handleDownloadPDF = async () => {
    try {
      const previewElement = document.querySelector('.resume-preview');
      
      if (!previewElement) {
        alert('预览区域未找到，请稍后重试');
        return;
      }

      const options = {
        margin: [10, 10, 10, 10],
        filename: `测试简历_${selectedTemplate?.name || '未知模板'}_${new Date().toISOString().split('T')[0]}.pdf`,
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
      
      await html2pdf().from(previewElement).set(options).save();
      
      console.log('✅ PDF生成完成');
      
    } catch (error) {
      console.error('❌ PDF生成失败:', error);
      alert('PDF生成失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                模板功能测试页面
              </h1>
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
                下载测试PDF
              </button>
              
              {/* 状态指示器 */}
              {templateDetailLoading && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm">加载中...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 功能说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-blue-800 font-medium">功能测试说明</h3>
              <p className="text-blue-700 text-sm mt-1">
                此页面用于测试模板选择与渲染功能。左侧选择模板，右侧查看渲染效果，最后可下载PDF。
              </p>
            </div>
          </div>
        </div>

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
            
            {/* 测试数据信息 */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-gray-900 mb-3">测试数据信息</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <div>姓名: {testResumeData.profile.name}</div>
                <div>邮箱: {testResumeData.profile.email}</div>
                <div>工作经验: {testResumeData.workExperience.length} 段</div>
                <div>项目经验: {testResumeData.projectExperience.length} 个</div>
                <div>教育背景: {testResumeData.education.length} 段</div>
                <div>技能领域: {testResumeData.skills.length} 个</div>
              </div>
            </div>
          </div>

          {/* 右侧预览区域 */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  简历预览
                  {selectedTemplate && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({selectedTemplate.name})
                    </span>
                  )}
                </h3>
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
                resumeData={testResumeData}
                template={selectedTemplate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateTestPage; 