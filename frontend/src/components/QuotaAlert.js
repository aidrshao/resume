/**
 * 配额提示组件
 * 在用户配额不足时显示友好的提示信息
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuotaAlert = ({ 
  isOpen, 
  onClose, 
  message = "您的AI配额已用完", 
  description = "请升级会员套餐以继续使用AI功能",
  showUpgradeButton = true 
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  /**
   * 处理升级点击
   */
  const handleUpgrade = () => {
    onClose();
    navigate('/membership?tab=purchase');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          {/* 图标 */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.608-2.887L13.074 4.735c-.896-1.22-3.252-1.22-4.148 0L2.474 15.113C1.58 16.333 2.542 18 4.082 18z" />
            </svg>
          </div>
          
          {/* 标题 */}
          <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
            配额不足
          </h3>
          
          {/* 消息内容 */}
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500 mb-2">
              {message}
            </p>
            <p className="text-sm text-gray-400">
              {description}
            </p>
          </div>
          
          {/* 按钮区域 */}
          <div className="items-center px-4 py-3">
            <div className="flex justify-center space-x-3">
              {showUpgradeButton && (
                <button
                  onClick={handleUpgrade}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-auto hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                >
                  升级会员
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-auto hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 配额状态指示器
 * 显示当前用户的配额状态
 */
export const QuotaIndicator = ({ 
  currentQuota = 0, 
  totalQuota = 0,
  className = "",
  showDetails = true 
}) => {
  const percentage = totalQuota > 0 ? (currentQuota / totalQuota) * 100 : 0;
  const isLow = percentage <= 20;
  const isEmpty = currentQuota <= 0;

  if (!showDetails) return null;

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {/* 配额指示器 */}
      <div className="flex items-center">
        <svg className={`h-4 w-4 ${
          isEmpty ? 'text-red-500' : 
          isLow ? 'text-yellow-500' : 
          'text-green-500'
        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className={`ml-1 text-sm font-medium ${
          isEmpty ? 'text-red-700' : 
          isLow ? 'text-yellow-700' : 
          'text-green-700'
        }`}>
          {currentQuota}/{totalQuota}
        </span>
      </div>
      
      {/* 状态标签 */}
      {isEmpty && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          配额已用完
        </span>
      )}
      {isLow && !isEmpty && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          配额不足
        </span>
      )}
    </div>
  );
};

/**
 * 配额检查Hook
 * 用于检查用户配额状态并处理配额不足的情况
 */
export const useQuotaCheck = () => {
  const navigate = useNavigate();

  /**
   * 检查AI配额
   */
  const checkAIQuota = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/memberships/check-quota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'resume_generation'
        })
      });

      const data = await response.json();
      return {
        hasQuota: data.success,
        message: data.message,
        quotaInfo: data.data
      };
    } catch (error) {
      console.error('❌ [QUOTA_CHECK] 配额检查失败:', error);
      return {
        hasQuota: false,
        message: '配额检查失败，请稍后重试',
        quotaInfo: null
      };
    }
  };

  /**
   * 获取用户配额状态
   */
  const getQuotaStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/memberships/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        return {
          success: true,
          quotaInfo: {
            currentQuota: data.data.remainingAiQuota,
            totalQuota: data.data.totalAiQuota,
            tierName: data.data.tierName,
            hasMembership: data.data.hasMembership
          }
        };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('❌ [QUOTA_STATUS] 获取配额状态失败:', error);
      return { success: false, message: '获取配额状态失败' };
    }
  };

  return {
    checkAIQuota,
    getQuotaStatus
  };
};

export default QuotaAlert; 