/**
 * 生成简历确认弹窗组件
 * 用户选择岗位后，确认生成专属简历的弹窗
 */

import React, { useState } from 'react';

const GenerateResumeModal = ({ isOpen, onClose, job, onConfirm, isGenerating = false }) => {
  const [userRequirements, setUserRequirements] = useState('');

  // 处理确认
  const handleConfirm = () => {
    onConfirm(job, userRequirements.trim());
  };

  // 重置表单
  const handleClose = () => {
    setUserRequirements('');
    onClose();
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            📝 生成岗位专属简历
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isGenerating}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 弹窗内容 */}
        <div className="p-6">
          {/* 岗位信息预览 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">目标岗位信息</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-800 w-16">职位：</span>
                <span className="text-sm text-blue-700">{job.title}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-800 w-16">公司：</span>
                <span className="text-sm text-blue-700">{job.company}</span>
              </div>
              {job.location && (
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-800 w-16">地点：</span>
                  <span className="text-sm text-blue-700">{job.location}</span>
                </div>
              )}
              {job.salary_range && (
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-800 w-16">薪资：</span>
                  <span className="text-sm text-blue-700">{job.salary_range}</span>
                </div>
              )}
            </div>
          </div>

          {/* 用户要求输入 */}
          <div className="mb-6">
            <label htmlFor="userRequirements" className="block text-sm font-medium text-gray-700 mb-2">
              💡 特殊要求或个性化需求（可选）
            </label>
            <textarea
              id="userRequirements"
              value={userRequirements}
              onChange={(e) => setUserRequirements(e.target.value)}
              placeholder="请输入您希望在简历中突出的技能、经验或其他要求，例如：&#10;- 突出Python和机器学习相关经验&#10;- 强调金融行业项目经验&#10;- 重点展示团队管理能力&#10;&#10;如果没有特殊要求，可以留空，AI将根据岗位要求自动优化简历。"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={isGenerating}
            />
            <p className="mt-1 text-xs text-gray-500">
              AI将根据您的要求和岗位描述，智能优化您的基础简历内容
            </p>
          </div>

          {/* 生成说明 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  生成流程说明
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>1. AI将分析您的基础简历和目标岗位要求</p>
                  <p>2. 根据岗位特点智能调整简历内容结构</p>
                  <p>3. 突出与岗位匹配的技能和经验</p>
                  <p>4. 生成完成后您可以预览和修改</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 弹窗底部按钮 */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
            disabled={isGenerating}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                生成中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                开始生成
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateResumeModal; 