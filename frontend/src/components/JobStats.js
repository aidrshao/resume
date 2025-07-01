/**
 * 岗位统计组件
 * 显示岗位总数和各状态的统计信息
 */

import React from 'react';

const JobStats = ({ stats }) => {
  const statItems = [
    {
      label: '总计',
      value: stats.total,
      icon: '📊',
      color: 'bg-gray-100 text-gray-800',
      bgColor: 'bg-gray-50'
    },
    {
      label: '活跃中',
      value: stats.active,
      icon: '🎯',
      color: 'bg-blue-100 text-blue-800',
      bgColor: 'bg-blue-50'
    },
    {
      label: '已投递',
      value: stats.applied,
      icon: '✅',
      color: 'bg-green-100 text-green-800',
      bgColor: 'bg-green-50'
    },
    {
      label: '已归档',
      value: stats.archived,
      icon: '📁',
      color: 'bg-yellow-100 text-yellow-800',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} rounded-lg p-4 border border-gray-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
              <div className="text-2xl">{item.icon}</div>
            </div>
            
            {/* 进度条（可选） */}
            {stats.total > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      item.label === '总计' ? 'bg-gray-400' :
                      item.label === '活跃中' ? 'bg-blue-400' :
                      item.label === '已投递' ? 'bg-green-400' : 'bg-yellow-400'
                    }`}
                    style={{
                      width: item.label === '总计' ? '100%' : `${(item.value / stats.total) * 100}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {item.label === '总计' ? '100%' : `${Math.round((item.value / stats.total) * 100)}%`}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobStats; 