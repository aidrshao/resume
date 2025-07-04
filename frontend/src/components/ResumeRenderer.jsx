/**
 * 简历渲染器组件
 * 功能：使用Handlebars模板引擎渲染简历内容
 * 创建时间：2025-01-10
 */

import React, { useEffect, useRef } from 'react';
import Handlebars from 'handlebars';

const ResumeRenderer = ({ resumeData, template }) => {
  const previewRef = useRef(null);
  const styleRef = useRef(null);

  useEffect(() => {
    console.log('🎨 [ResumeRenderer] useEffect 触发:', { 
      hasResumeData: !!resumeData, 
      hasTemplate: !!template,
      templateName: template?.name || 'N/A',
      resumeDataKeys: resumeData ? Object.keys(resumeData) : 'N/A'
    });
    
    if (!resumeData || !template) {
      console.log('⏸️ [ResumeRenderer] 数据不完整，等待加载...');
      return;
    }

    console.log('🎨 [ResumeRenderer] 开始渲染简历:', { 
      templateId: template.id,
      templateName: template.name,
      resumeDataType: typeof resumeData,
      resumeDataKeys: Object.keys(resumeData),
      htmlContentLength: template.html_content?.length || 0,
      cssContentLength: template.css_content?.length || 0
    });

    // 检查简历数据结构
    console.log('📊 [ResumeRenderer] 简历数据详情:', {
      profile: resumeData.profile ? {
        name: resumeData.profile.name,
        keys: Object.keys(resumeData.profile)
      } : 'N/A',
      workExperience: resumeData.workExperience?.length || 0,
      education: resumeData.education?.length || 0,
      skills: resumeData.skills?.length || 0,
      projectExperience: resumeData.projectExperience?.length || 0
    });

    try {
      // 1. 清理之前的样式
      if (styleRef.current) {
        console.log('🧹 [ResumeRenderer] 清理之前的样式');
        styleRef.current.remove();
        styleRef.current = null;
      }

      // 2. 编译HTML模板
      console.log('🔧 [ResumeRenderer] 编译HTML模板...');
      const htmlTemplate = Handlebars.compile(template.html_content);
      
      // 3. 生成最终的HTML
      console.log('🎯 [ResumeRenderer] 生成最终HTML...');
      const finalHtml = htmlTemplate(resumeData);
      console.log('📝 [ResumeRenderer] 生成的HTML长度:', finalHtml.length);
      
      // 4. 将HTML内容渲染到预览区
      if (previewRef.current) {
        console.log('📋 [ResumeRenderer] 将HTML渲染到预览区...');
        previewRef.current.innerHTML = finalHtml;
      } else {
        console.error('❌ [ResumeRenderer] 预览区引用不存在');
      }
      
      // 5. 创建并应用CSS样式
      if (template.css_content) {
        console.log('🎨 [ResumeRenderer] 应用CSS样式...');
        const styleElement = document.createElement('style');
        styleElement.textContent = template.css_content;
        styleElement.setAttribute('data-template-id', template.id);
        document.head.appendChild(styleElement);
        styleRef.current = styleElement;
        console.log('✅ [ResumeRenderer] CSS样式已应用');
      } else {
        console.warn('⚠️ [ResumeRenderer] 模板没有CSS内容');
      }

      console.log('✅ [ResumeRenderer] 渲染完成');
      
    } catch (error) {
      console.error('❌ [ResumeRenderer] 渲染失败:', error);
      console.error('❌ [ResumeRenderer] 错误详情:', {
        message: error.message,
        stack: error.stack,
        templateId: template.id,
        templateName: template.name,
        resumeDataValid: !!resumeData
      });
      
      if (previewRef.current) {
        previewRef.current.innerHTML = `
          <div class="p-8 text-center text-red-600">
            <h3 class="text-lg font-semibold mb-2">渲染失败</h3>
            <p class="text-sm">${error.message}</p>
            <details class="mt-4">
              <summary class="cursor-pointer">查看错误详情</summary>
              <pre class="text-xs mt-2 text-left bg-gray-100 p-2 rounded">${error.stack}</pre>
            </details>
          </div>
        `;
      }
    }
  }, [resumeData, template]);

  // 清理函数：组件卸载时清理样式
  useEffect(() => {
    return () => {
      console.log('🧹 [ResumeRenderer] 组件卸载，清理样式');
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, []);

  console.log('🖼️ [ResumeRenderer] 渲染组件:', {
    hasResumeData: !!resumeData,
    hasTemplate: !!template,
    showPlaceholder: !resumeData || !template
  });

  return (
    <div className="resume-renderer">
      <div 
        ref={previewRef} 
        className="resume-preview"
        style={{ 
          minHeight: '800px',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {/* 如果没有数据或模板，显示占位符 */}
        {(!resumeData || !template) && (
          <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>
                {!resumeData && !template ? '正在加载数据和模板...' : 
                 !resumeData ? '正在加载简历数据...' : 
                 '正在加载模板...'}
              </p>
              <p className="text-xs mt-2 text-gray-400">
                数据状态: {resumeData ? '✓' : '✗'} | 模板状态: {template ? '✓' : '✗'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeRenderer; 