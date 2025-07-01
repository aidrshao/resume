/**
 * 岗位过滤器组件
 * 提供状态过滤、优先级过滤和搜索功能
 */

import React, { useState, useEffect } from 'react';

const JobFilters = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // 状态选项
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'active', label: '活跃中' },
    { value: 'applied', label: '已投递' },
    { value: 'archived', label: '已归档' }
  ];

  // 优先级选项
  const priorityOptions = [
    { value: '', label: '全部优先级' },
    { value: '5', label: '非常高 (5)' },
    { value: '4', label: '高 (4)' },
    { value: '3', label: '中等 (3)' },
    { value: '2', label: '低 (2)' },
    { value: '1', label: '很低 (1)' }
  ];

  // 同步外部filters到本地状态
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // 处理过滤条件变化
  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // 对于搜索框使用防抖，其他立即更新
    if (key === 'search') {
      // 清除之前的定时器
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      // 设置新的防抖定时器
      const timer = setTimeout(() => {
        onFiltersChange(newFilters);
      }, 300);
      
      setSearchDebounceTimer(timer);
    } else {
      // 状态和优先级立即更新
      onFiltersChange(newFilters);
    }
  };

  // 清空所有过滤条件
  const handleClearFilters = () => {
    const emptyFilters = {
      status: '',
      priority: '',
      search: ''
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  // 检查是否有激活的过滤条件
  const hasActiveFilters = localFilters.status || localFilters.priority || localFilters.search;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
      {/* 搜索框 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-4 w-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="搜索职位、公司..."
          value={localFilters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
        />
      </div>

      {/* 状态过滤 */}
      <select
        value={localFilters.status}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* 优先级过滤 */}
      <select
        value={localFilters.priority}
        onChange={(e) => handleFilterChange('priority', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
      >
        {priorityOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* 清空过滤器按钮 */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="text-gray-500 hover:text-gray-700 text-sm whitespace-nowrap flex items-center"
        >
          <svg 
            className="w-4 h-4 mr-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          清空筛选
        </button>
      )}
    </div>
  );
};

export default JobFilters; 