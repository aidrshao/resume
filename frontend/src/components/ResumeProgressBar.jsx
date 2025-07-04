/**
 * 简历上传进度条组件
 * 支持多种状态：idle、uploading、parsing、success、error
 * 提供平滑的动画效果以提升用户体验
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ResumeProgressBar = ({ 
  status = 'idle', 
  uploadProgress = 0, 
  message = '', 
  className = '' 
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // 平滑进度条动画效果
  useEffect(() => {
    if (status === 'uploading') {
      const targetProgress = Math.min(100, Math.max(0, uploadProgress));
      
      // 使用动画逐渐更新进度
      const animateProgress = () => {
        setAnimatedProgress(current => {
          const diff = targetProgress - current;
          if (Math.abs(diff) < 0.1) {
            return targetProgress;
          }
          return current + diff * 0.1;
        });
      };
      
      const interval = setInterval(animateProgress, 16); // 60fps
      return () => clearInterval(interval);
    }
  }, [status, uploadProgress]);

  // 更新显示进度
  useEffect(() => {
    if (status === 'uploading') {
      setDisplayProgress(animatedProgress);
    } else if (status === 'success') {
      setDisplayProgress(100);
    }
  }, [status, animatedProgress]);

  // 如果状态为 idle，不渲染组件
  if (status === 'idle') {
    return null;
  }

  /**
   * 获取状态对应的颜色配置
   * @param {string} status - 当前状态
   * @returns {Object} 颜色配置
   */
  const getStatusStyles = (status) => {
    const styles = {
      uploading: {
        progressColor: 'bg-blue-500',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      },
      parsing: {
        progressColor: 'bg-blue-500',
        bgColor: 'bg-blue-100', 
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      },
      success: {
        progressColor: 'bg-green-500',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      },
      error: {
        progressColor: 'bg-red-500',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200'
      }
    };
    return styles[status] || styles.uploading;
  };

  /**
   * 获取状态对应的默认消息
   * @param {string} status - 当前状态
   * @param {number} progress - 进度值
   * @returns {string} 默认消息
   */
  const getDefaultMessage = (status, progress) => {
    switch (status) {
      case 'uploading':
        return `简历上传中... ${Math.round(progress)}%`;
      case 'parsing':
        return 'AI 奋力解析中，请稍候...';
      case 'success':
        return message || '简历解析成功！';
      case 'error':
        return message || '处理失败，请重试';
      default:
        return '';
    }
  };

  const statusStyles = getStatusStyles(status);
  const displayMessage = message || getDefaultMessage(status, displayProgress);

  return (
    <div className={`resume-progress-bar ${className}`}>
      <div className={`bg-white rounded-lg border ${statusStyles.borderColor} p-6 shadow-sm transition-all duration-300`}>
        {/* 消息文本 */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm font-medium ${statusStyles.textColor} transition-colors duration-300`}>
            {displayMessage}
          </span>
          {status === 'uploading' && (
            <span className={`text-sm font-medium ${statusStyles.textColor} transition-colors duration-300`}>
              {Math.round(displayProgress)}%
            </span>
          )}
        </div>

        {/* 进度条容器 */}
        <div className="progress-container">
          {/* 普通进度条 - 用于上传和完成状态 */}
          {(status === 'uploading' || status === 'success') && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ease-out ${statusStyles.progressColor}`}
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          )}

          {/* 不确定状态进度条 - 用于解析状态 */}
          {status === 'parsing' && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden relative">
              <div
                className={`h-2 rounded-full absolute top-0 left-0 ${statusStyles.progressColor} animate-progress-indeterminate`}
                style={{ width: '30%' }}
              />
            </div>
          )}

          {/* 错误状态进度条 */}
          {status === 'error' && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ease-out ${statusStyles.progressColor}`}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>

        {/* 状态图标 */}
        <div className="flex items-center justify-center mt-4">
          {status === 'uploading' && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-xs text-gray-500">正在上传文件...</span>
            </div>
          )}
          
          {status === 'parsing' && (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-gray-500">AI 正在解析中...</span>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">处理完成</span>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">处理失败</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// PropTypes 类型定义
ResumeProgressBar.propTypes = {
  status: PropTypes.oneOf(['idle', 'uploading', 'parsing', 'success', 'error']),
  uploadProgress: PropTypes.number,
  message: PropTypes.string,
  className: PropTypes.string
};

export default ResumeProgressBar; 