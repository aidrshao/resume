/**
 * 控制面板组件
 * 接收report prop（resumeData.optimization_report），负责展示分析报告和操作功能
 */

import React, { useState } from 'react';

const ControlPanel = ({ report, resumeData }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [isDownloading, setIsDownloading] = useState(false);

  // 如果没有报告数据，显示占位符
  if (!report) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // 解析报告数据
  let parsedReport;
  try {
    parsedReport = typeof report === 'string' ? JSON.parse(report) : report;
  } catch (error) {
    console.error('解析报告数据失败:', error);
    parsedReport = {};
  }

  const { 
    overallScore = 0, 
    matchingRate = 0, 
    sectionImprovements = [], 
    strengths = [], 
    suggestions = [] 
  } = parsedReport;

  // 获取分数对应的颜色
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // 获取分数对应的进度条颜色
  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 下载PDF功能（暂时禁用）
  const handleDownload = async () => {
    setIsDownloading(true);
    
    // 模拟下载过程
    setTimeout(() => {
      alert('PDF下载功能正在开发中，敬请期待！');
      setIsDownloading(false);
    }, 1000);
  };

  // 模板选择处理
  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
    // 这里将来会触发模板切换逻辑
    console.log('切换到模板:', template);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
      {/* 分析报告标题 */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          优化分析报告
        </h2>
        <p className="text-gray-600 text-sm mt-1">AI智能分析简历匹配度和优化建议</p>
      </div>

      {/* 核心评分区域 */}
      <div className="space-y-4">
        {/* 综合评分 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">综合评分</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(overallScore)}`}>
              {overallScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor(overallScore)}`}
              style={{ width: `${overallScore}%` }}
            ></div>
          </div>
        </div>

        {/* 匹配度 */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">岗位匹配度</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(matchingRate)}`}>
              {matchingRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor(matchingRate)}`}
              style={{ width: `${matchingRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 优势亮点 */}
      {strengths && strengths.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            优势亮点
          </h3>
          <div className="space-y-2">
            {strengths.map((strength, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 改进建议 */}
      {suggestions && suggestions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            改进建议
          </h3>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分段改进详情 */}
      {sectionImprovements && sectionImprovements.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            分段优化详情
          </h3>
          <div className="space-y-3">
            {sectionImprovements.map((section, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{section.section}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(section.score || 0)}`}>
                    {section.score || 0}/100
                  </span>
                </div>
                {section.suggestions && (
                  <p className="text-gray-600 text-sm">{section.suggestions}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 模板选择器（未来扩展点） */}
      <div className="border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          选择模板
          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            即将上线
          </span>
        </h3>
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'professional', name: '专业版', description: '适合商务场景' },
              { id: 'creative', name: '创意版', description: '适合设计岗位' },
              { id: 'minimal', name: '简约版', description: '适合技术岗位' }
            ].map((template) => (
              <label key={template.id} className="relative">
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={selectedTemplate === template.id}
                  onChange={() => handleTemplateChange(template.id)}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 操作按钮区域 */}
      <div className="border-t pt-6 space-y-3">
        {/* 下载PDF按钮 */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              下载中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              下载PDF
            </>
          )}
        </button>

        {/* 分享按钮 */}
        <button
          onClick={() => alert('分享功能开发中，敬请期待！')}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          分享简历
        </button>

        {/* 重新生成按钮 */}
        <button
          onClick={() => alert('重新生成功能开发中，敬请期待！')}
          className="w-full flex items-center justify-center px-4 py-3 border border-orange-300 hover:border-orange-400 text-orange-700 font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          重新生成
        </button>
      </div>

      {/* 简历信息概览 */}
      {resumeData && (
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">简历信息</h3>
          <div className="space-y-2 text-sm text-gray-600">
            {resumeData.jobTitle && (
              <div className="flex items-center">
                <span className="font-medium mr-2">目标岗位:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {resumeData.jobTitle}
                </span>
              </div>
            )}
            {resumeData.companyName && (
              <div className="flex items-center">
                <span className="font-medium mr-2">目标公司:</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {resumeData.companyName}
                </span>
              </div>
            )}
            {resumeData.createdAt && (
              <div className="flex items-center">
                <span className="font-medium mr-2">创建时间:</span>
                <span>{new Date(resumeData.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel; 