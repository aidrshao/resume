/**
 * 简历预览弹窗组件
 * 显示AI生成的简历内容，让用户确认是否保存
 */

import React from 'react';

const ResumePreviewModal = ({ 
  isOpen, 
  onClose, 
  resume, 
  job, 
  onSave, 
  onRegenerate, 
  isSaving = false 
}) => {
  if (!isOpen || !resume) return null;

  // 解析简历内容
  const parseResumeData = (data) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return { content: data };
      }
    }
    return data || {};
  };

  const resumeData = parseResumeData(resume.data);

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              📋 简历预览
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              为 <span className="font-medium text-blue-600">{job?.company}</span> - 
              <span className="font-medium text-blue-600">{job?.title}</span> 生成的专属简历
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 简历内容 */}
        <div className="p-6">
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            {/* 简历标题 */}
            <div className="text-center mb-8 border-b pb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {resume.title}
              </h1>
              <p className="text-gray-600">
                目标职位：{job?.title} @ {job?.company}
              </p>
            </div>

            {/* 简历内容展示 */}
            <div className="space-y-6">
              {resumeData.content && (
                <div className="prose prose-sm max-w-none">
                  <div 
                    className="whitespace-pre-wrap text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: resumeData.content.replace(/\n/g, '<br>') 
                    }}
                  />
                </div>
              )}

              {/* 如果有结构化数据，展示更详细的内容 */}
              {resumeData.personalInfo && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">
                    个人信息
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(resumeData.personalInfo).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium text-gray-700 w-20">{key}：</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resumeData.workExperience && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">
                    工作经历
                  </h3>
                  <div className="space-y-4">
                    {resumeData.workExperience.map((exp, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                          <span className="text-sm text-gray-500">{exp.duration}</span>
                        </div>
                        <p className="text-gray-700 font-medium mb-2">{exp.company}</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resumeData.skills && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">
                    专业技能
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 生成信息 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>生成时间：{formatDate(resume.updated_at)}</span>
                <span>状态：
                  <span className={`ml-1 font-medium ${
                    resume.status === 'completed' ? 'text-green-600' : 
                    resume.status === 'generating' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {resume.status === 'completed' ? '已完成' : 
                     resume.status === 'generating' ? '生成中' : '未知'}
                  </span>
                </span>
              </div>
              <div className="text-xs text-gray-500">
                ID: {resume.id}
              </div>
            </div>
          </div>
        </div>

        {/* 弹窗底部按钮 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onRegenerate}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isSaving}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重新生成
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
              disabled={isSaving}
            >
              关闭
            </button>
            <button
              onClick={() => onSave(resume)}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  保存中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  保存简历
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreviewModal; 