/**
 * 岗位卡片组件 (UI v2.0 重构)
 * 仅优化视觉样式，不影响原有交互逻辑
 */

import React, { useState, useEffect, useRef } from 'react';

const JobCard = ({ job, isSelected, onSelect, onEdit, onDelete, onGenerateCustomResume, isGeneratingCustom }) => {
  // 下拉菜单控制
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 状态与优先级显示配置
  const statusConfig = {
    active: { label: '活跃中', color: 'bg-blue-100 text-blue-800' },
    applied: { label: '已投递', color: 'bg-green-100 text-green-800' },
    archived: { label: '已归档', color: 'bg-gray-100 text-gray-800' }
  };
  const priorityConfig = {
    5: { label: '最高', color: 'text-red-600' },
    4: { label: '高', color: 'text-orange-600' },
    3: { label: '中', color: 'text-yellow-600' },
    2: { label: '低', color: 'text-gray-600' },
    1: { label: '很低', color: 'text-gray-400' }
  };
  const jobTypeConfig = {
    'full-time': '全职',
    'part-time': '兼职',
    contract: '合同工',
    remote: '远程'
  };

  const currentStatus = statusConfig[job.status] || statusConfig.active;
  const currentPriority = priorityConfig[job.priority] || priorityConfig[3];

  // 帮助函数
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div
      className={`flex flex-col bg-white rounded-xl border transition-shadow duration-300 hover:shadow-xl ${
        isSelected ? 'border-indigo-500 shadow-lg' : 'border-gray-200'
      }`}
    >
      {/* 卡片主体 */}
      <div className="p-5 flex-1 flex flex-col">
        {/* 顶部：复选框 + 标题 + 操作菜单 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate" title={job.title}>
                {job.title}
              </h3>
              <p className="text-sm text-gray-500 truncate" title={job.company}>
                {job.company}
              </p>
            </div>
          </div>

          {/* 右上角更多操作 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {menuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  编辑岗位
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  删除岗位
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 标签 */}
        <div className="flex items-center space-x-2 mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus.color}`}>{currentStatus.label}</span>
          <span className={`inline-flex items-center text-xs font-medium ${currentPriority.color}`}>优先级: {currentPriority.label}</span>
        </div>

        {/* 关键信息 */}
        <div className="space-y-3 text-sm text-gray-600 flex-1">
          {job.location && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="ml-2 truncate" title={job.location}>{job.location}</span>
            </div>
          )}
          {job.job_type && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
              <span className="ml-2">{jobTypeConfig[job.job_type] || job.job_type}</span>
            </div>
          )}
          {job.salary_range && (
            <div className="flex items-center text-green-600 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="ml-2">{job.salary_range}</span>
            </div>
          )}
        </div>

        {/* 创建/更新时间 */}
        <div className="mt-4 text-xs text-gray-400">
          <div>创建于 {formatDate(job.created_at)}</div>
          {job.updated_at !== job.created_at && <div>更新于 {formatDate(job.updated_at)}</div>}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="px-5 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
        <button
          onClick={() => onGenerateCustomResume && onGenerateCustomResume(job.id)}
          disabled={isGeneratingCustom}
          className={`w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isGeneratingCustom ? 'text-gray-500 bg-gray-200 cursor-not-allowed' : 'text-white bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isGeneratingCustom ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              正在生成...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              生成AI定制简历
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default JobCard; 