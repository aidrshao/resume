/**
 * 简历模板选择组件
 * 提供美观的模板选择界面，支持预览、选择和PDF生成
 */

import React, { useState, useEffect } from 'react';
import { 
  getResumeTemplates, 
  generateResumePreview, 
  generateResumePDF, 
  downloadResumePDF 
} from '../utils/api';

// API基础URL
const API_BASE_URL = 'http://localhost:8000/api';

const ResumeTemplateSelector = ({ resumeId, onTemplateSelect, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [error, setError] = useState('');
  const [templatePreviews, setTemplatePreviews] = useState({});

  // 获取模板列表
  useEffect(() => {
    fetchTemplates();
  }, []);

  // 为每个模板生成预览缩略图
  useEffect(() => {
    if (templates.length > 0) {
      generateTemplatePreviews();
    }
  }, [templates]);

  /**
   * 获取所有可用模板
   */
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/resume-render/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      } else {
        setError(data.message || '获取模板失败');
      }
    } catch (error) {
      console.error('获取模板失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 为所有模板生成预览缩略图
   */
  const generateTemplatePreviews = async () => {
    const token = localStorage.getItem('token');
    const previews = {};

    // 并行生成所有模板的预览
    const previewPromises = templates.map(async (template) => {
      try {
        const response = await fetch(`${API_BASE_URL}/resume-render/preview`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resumeId: resumeId,
            templateId: template.id
          })
        });

        const data = await response.json();
        
        if (data.success) {
          previews[template.id] = data.data.html;
        }
      } catch (error) {
        console.error(`模板 ${template.id} 预览生成失败:`, error);
      }
    });

    await Promise.all(previewPromises);
    setTemplatePreviews(previews);
  };

  /**
   * 预览模板效果
   */
  const handlePreview = async (template) => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('token');
      
      // 如果已经有缓存的预览，直接使用
      if (templatePreviews[template.id]) {
        setPreviewHtml(templatePreviews[template.id]);
        setSelectedTemplate(template);
        setShowPreview(true);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/resume-render/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeId: resumeId,
          templateId: template.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPreviewHtml(data.data.html);
        setSelectedTemplate(template);
        setShowPreview(true);
        
        // 缓存预览结果
        setTemplatePreviews(prev => ({
          ...prev,
          [template.id]: data.data.html
        }));
      } else {
        setError(data.message || '预览生成失败');
      }
    } catch (error) {
      console.error('预览失败:', error);
      setError('预览生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * 预览PDF效果
   */
  const handlePDFPreview = async (template) => {
    try {
      setGeneratingPDF(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/resume-render/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeId: resumeId,
          templateId: template.id,
          options: {
            format: 'A4',
            margin: {
              top: '10mm',
              right: '10mm',
              bottom: '10mm',
              left: '10mm'
            }
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 构建PDF预览URL
        const pdfUrl = `${API_BASE_URL}${data.data.downloadUrl}`;
        setPdfPreviewUrl(pdfUrl);
        setSelectedTemplate(template);
        setShowPDFPreview(true);
      } else {
        setError(data.message || 'PDF预览生成失败');
      }
    } catch (error) {
      console.error('PDF预览失败:', error);
      setError('PDF预览生成失败，请稍后重试');
    } finally {
      setGeneratingPDF(false);
    }
  };

  /**
   * 下载PDF
   */
  const handleDownloadPDF = async (template) => {
    try {
      setGeneratingPDF(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/resume-render/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeId: resumeId,
          templateId: template.id,
          options: {
            format: 'A4',
            margin: {
              top: '10mm',
              right: '10mm',
              bottom: '10mm',
              left: '10mm'
            }
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 使用fetch携带token下载PDF
        const downloadResponse = await fetch(`${API_BASE_URL}${data.data.downloadUrl}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (downloadResponse.ok) {
          // 创建blob并下载
          const blob = await downloadResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = data.data.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          // 调用回调函数
          if (onTemplateSelect) {
            onTemplateSelect(template, 'pdf');
          }
        } else {
          const errorData = await downloadResponse.json();
          setError(errorData.message || 'PDF下载失败');
        }
      } else {
        setError(data.message || 'PDF生成失败');
      }
    } catch (error) {
      console.error('PDF生成失败:', error);
      setError('PDF生成失败，请稍后重试');
    } finally {
      setGeneratingPDF(false);
    }
  };

  /**
   * 选择模板并生成HTML
   */
  const handleSelectTemplate = async (template) => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/resume-render/render`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeId: resumeId,
          templateId: template.id,
          format: 'html'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (onTemplateSelect) {
          onTemplateSelect(template, 'html', data.data);
        }
      } else {
        setError(data.message || '模板应用失败');
      }
    } catch (error) {
      console.error('模板应用失败:', error);
      setError('模板应用失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * 获取模板颜色主题
   */
  const getTemplateTheme = (config) => {
    if (!config || !config.colors) return 'bg-blue-500';
    
    const primaryColor = config.colors.primary;
    if (primaryColor.includes('#2563eb')) return 'bg-blue-500';
    if (primaryColor.includes('#7c3aed')) return 'bg-purple-500';
    if (primaryColor.includes('#059669')) return 'bg-green-500';
    if (primaryColor.includes('#dc2626')) return 'bg-red-500';
    
    return 'bg-gray-500';
  };

  /**
   * 关闭预览
   */
  const closePreview = () => {
    setShowPreview(false);
    setPreviewHtml('');
    setSelectedTemplate(null);
  };

  /**
   * 关闭PDF预览
   */
  const closePDFPreview = () => {
    setShowPDFPreview(false);
    setPdfPreviewUrl('');
    setSelectedTemplate(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载模板...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">选择简历模板</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              关闭
            </button>
          </div>
        )}

        {/* 模板网格 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-all duration-200 hover:shadow-lg"
              >
                {/* 模板预览图 */}
                <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 p-2 overflow-hidden">
                  {templatePreviews[template.id] ? (
                    <div 
                      className="w-full h-full overflow-hidden rounded border border-gray-200 bg-white text-xs transform scale-50 origin-top-left"
                      style={{ 
                        width: '200%', 
                        height: '200%',
                        fontSize: '6px',
                        lineHeight: '1.2'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: templatePreviews[template.id] 
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <div className="text-xs text-gray-500">生成预览中...</div>
                      </div>
                    </div>
                  )}
                  
                  {template.is_premium && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      高级
                    </div>
                  )}
                </div>

                {/* 模板信息 */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* 模板特征 */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    <span className={`px-2 py-1 text-xs rounded ${getTemplateTheme(template.template_config)} text-white`}>
                      {template.template_config?.layout === 'two-column' ? '双栏布局' : '单栏布局'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      专业风格
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(template)}
                      disabled={generating}
                      className="flex-1 px-3 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 disabled:opacity-50 text-sm"
                    >
                      {generating ? '处理中...' : '预览'}
                    </button>
                    <button
                      onClick={() => handlePDFPreview(template)}
                      disabled={generatingPDF}
                      className="flex-1 px-3 py-2 border border-green-500 text-green-500 rounded hover:bg-green-50 disabled:opacity-50 text-sm"
                    >
                      {generatingPDF ? '生成中...' : 'PDF预览'}
                    </button>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSelectTemplate(template)}
                      disabled={generating}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                    >
                      选择模板
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(template)}
                      disabled={generatingPDF}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                    >
                      下载PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无可用模板</h3>
              <p className="text-gray-500">请联系管理员添加模板</p>
            </div>
          )}
        </div>

        {/* HTML预览模态框 */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  预览: {selectedTemplate?.name}
                </h3>
                <button
                  onClick={closePreview}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
                <div 
                  className="border border-gray-200 rounded-lg bg-white p-4"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={closePreview}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    handleSelectTemplate(selectedTemplate);
                    closePreview();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  使用此模板
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF预览模态框 */}
        {showPDFPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  PDF预览: {selectedTemplate?.name}
                </h3>
                <button
                  onClick={closePDFPreview}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
                {pdfPreviewUrl && (
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-[70vh] border border-gray-300 rounded"
                    title="PDF预览"
                  />
                )}
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={closePDFPreview}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    handleDownloadPDF(selectedTemplate);
                    closePDFPreview();
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  下载PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeTemplateSelector; 