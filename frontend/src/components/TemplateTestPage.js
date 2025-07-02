/**
 * 模板测试页面
 * 用于测试模板预览和PDF预览功能
 */

import React, { useState } from 'react';
import ResumeTemplateSelector from './ResumeTemplateSelector';

const TemplateTestPage = () => {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  // 模拟用户ID=2的简历数据
  const resumeId = 2;

  const handleTemplateSelect = (template, format, data) => {
    console.log('选择的模板:', template);
    console.log('选择的格式:', format);
    console.log('生成的数据:', data);
    
    setSelectedTemplate(template);
    setSelectedFormat(format);
    
    if (format === 'html' && data) {
      setHtmlContent(data.html || '');
    }
    
    setShowTemplateSelector(false);
  };

  const handleCloseTemplateSelector = () => {
    setShowTemplateSelector(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            模板预览测试页面
          </h1>
          <p className="text-gray-600">
            测试模板选择器的预览和PDF生成功能
          </p>
        </div>

        {/* 控制按钮 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                功能测试
              </h2>
              <p className="text-gray-600">
                点击按钮打开模板选择器，测试预览功能
              </p>
            </div>
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              打开模板选择器
            </button>
          </div>
        </div>

        {/* 选择结果显示 */}
        {selectedTemplate && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              选择结果
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">选择的模板</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>名称:</strong> {selectedTemplate.name}</p>
                  <p><strong>描述:</strong> {selectedTemplate.description}</p>
                  <p><strong>布局:</strong> {selectedTemplate.template_config?.layout}</p>
                  <p><strong>主色调:</strong> {selectedTemplate.template_config?.colors?.primary}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">操作信息</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>格式:</strong> {selectedFormat}</p>
                  <p><strong>时间:</strong> {new Date().toLocaleString()}</p>
                  <p><strong>简历ID:</strong> {resumeId}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HTML内容预览 */}
        {htmlContent && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              生成的HTML内容预览
            </h2>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-auto">
              <div 
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                className="prose max-w-none"
              />
            </div>
          </div>
        )}

        {/* 功能说明 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            功能说明
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">🎨 模板预览</h3>
              <p className="text-gray-600">
                在模板选择界面，每个模板卡片都会自动显示实际的简历预览缩略图，
                点击"预览"按钮可以查看完整的HTML预览效果。
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">📄 PDF预览</h3>
              <p className="text-gray-600">
                点击"PDF预览"按钮可以在模态框中预览PDF效果，
                确认满意后再点击"下载PDF"进行实际下载。
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">⚡ 性能优化</h3>
              <p className="text-gray-600">
                模板预览会被缓存，避免重复生成。
                所有模板的缩略图会并行生成，提升用户体验。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 模板选择器 */}
      {showTemplateSelector && (
        <ResumeTemplateSelector
          resumeId={resumeId}
          onTemplateSelect={handleTemplateSelect}
          onClose={handleCloseTemplateSelector}
        />
      )}
    </div>
  );
};

export default TemplateTestPage; 