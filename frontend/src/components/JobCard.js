/**
 * 岗位卡片组件
 * 展示单个岗位的信息，包含选择、编辑、删除功能
 */

import React from 'react';

const JobCard = ({ job, isSelected, onSelect, onEdit, onDelete, onGenerateCustomResume, isGeneratingCustom }) => {
  // 状态显示配置
  const statusConfig = {
    active: {
      label: '活跃中',
      color: 'bg-blue-100 text-blue-800',
      icon: '🎯'
    },
    applied: {
      label: '已投递',
      color: 'bg-green-100 text-green-800',
      icon: '✅'
    },
    archived: {
      label: '已归档',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '📁'
    }
  };

  // 优先级显示配置
  const priorityConfig = {
    5: { label: '非常高', color: 'text-red-600', icon: '🔥' },
    4: { label: '高', color: 'text-orange-600', icon: '⭐' },
    3: { label: '中等', color: 'text-yellow-600', icon: '➖' },
    2: { label: '低', color: 'text-gray-600', icon: '⬇️' },
    1: { label: '很低', color: 'text-gray-400', icon: '❄️' }
  };

  // 工作类型显示配置
  const jobTypeConfig = {
    'full-time': '全职',
    'part-time': '兼职',
    'contract': '合同工',
    'remote': '远程'
  };

  // 数据来源显示配置
  const sourceTypeConfig = {
    text: { label: '文本输入', icon: '✏️' },
    file: { label: '文件上传', icon: '📄' },
    image: { label: '图片上传', icon: '🖼️' }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  // 截断文本
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const currentStatus = statusConfig[job.status] || statusConfig.active;
  const currentPriority = priorityConfig[job.priority] || priorityConfig[3];
  const currentSource = sourceTypeConfig[job.source_type] || sourceTypeConfig.text;

  return (
    <div className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* 卡片头部 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          {/* 左侧：选择框和标题 */}
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {job.title}
              </h3>
              <p className="text-gray-600 font-medium">
                {job.company}
              </p>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="编辑岗位"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="删除岗位"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 状态和优先级标签 */}
        <div className="flex items-center space-x-2 mt-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus.color}`}>
            <span className="mr-1">{currentStatus.icon}</span>
            {currentStatus.label}
          </span>
          
          <span className={`inline-flex items-center text-xs font-medium ${currentPriority.color}`}>
            <span className="mr-1">{currentPriority.icon}</span>
            {currentPriority.label}
          </span>

          <span className="inline-flex items-center text-xs text-gray-500">
            <span className="mr-1">{currentSource.icon}</span>
            {currentSource.label}
          </span>
        </div>
      </div>

      {/* 卡片内容 */}
      <div className="p-4 space-y-3">
        {/* 工作地点和类型 */}
        {(job.location || job.job_type) && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {job.location && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </div>
            )}
            {job.job_type && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
                {jobTypeConfig[job.job_type] || job.job_type}
              </div>
            )}
          </div>
        )}

        {/* 薪资范围 */}
        {job.salary_range && (
          <div className="flex items-center text-sm text-green-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            {job.salary_range}
          </div>
        )}

        {/* 职位描述 */}
        {job.description && (
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {truncateText(job.description, 120)}
            </p>
          </div>
        )}

        {/* 申请截止日期 */}
        {job.application_deadline && (
          <div className="flex items-center text-sm text-orange-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            截止日期：{formatDate(job.application_deadline)}
          </div>
        )}

        {/* 备注 */}
        {job.notes && (
          <div className="bg-gray-50 rounded-md p-2">
            <p className="text-sm text-gray-600">
              💬 {truncateText(job.notes, 80)}
            </p>
          </div>
        )}
      </div>

      {/* 卡片底部 */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* 左侧：时间信息 */}
          <div className="text-xs text-gray-500">
            <div>创建于 {formatDate(job.created_at)}</div>
            {job.updated_at !== job.created_at && (
              <div>更新于 {formatDate(job.updated_at)}</div>
            )}
          </div>
          
          {/* 右侧：操作按钮组 */}
          <div className="flex items-center space-x-2">
            {/* 生成定制简历按钮 */}
            <button
              onClick={() => onGenerateCustomResume && onGenerateCustomResume(job.id)}
              disabled={isGeneratingCustom}
              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                isGeneratingCustom 
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                  : 'text-white bg-blue-600 hover:bg-blue-700'
              }`}
              title="生成定制简历（新版本）"
            >
              {isGeneratingCustom ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1"></div>
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  生成定制简历
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard; 