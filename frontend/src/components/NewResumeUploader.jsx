/**
 * V2版本简历上传组件
 * 支持文件拖拽上传、实时状态轮询、AI解析进度展示
 * 完成后自动跳转到审核页面
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseResumeV2, getTaskStatusV2, getTaskResultV2 } from '../utils/api';

/**
 * ----------  新增通用 SVG 图标 & 环形进度条 ----------
 * 说明：仅用于视觉展示，不影响业务逻辑。
 */

const UploadCloudIcon = ({ className = '' }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const CheckCircleIcon = ({ className = '' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const ExclamationCircleIcon = ({ className = '' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

// 环形进度条
const CircularProgress = ({ progress = 0, status = 'processing' }) => {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    processing: 'text-indigo-600',
    completed: 'text-green-500',
    failed: 'text-red-500',
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-gray-200"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={colorClasses[status] || 'text-indigo-600'}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          style={{
            transition: 'stroke-dashoffset 0.35s',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {status === 'completed' && <CheckCircleIcon className="w-16 h-16 text-green-500" />}
        {status === 'failed' && <ExclamationCircleIcon className="w-16 h-16 text-red-500" />}
        {status === 'processing' && (
          <span className="text-2xl font-bold text-gray-700">{Math.round(progress)}%</span>
        )}
      </div>
    </div>
  );
};

const NewResumeUploader = ({ onComplete, className = '' }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // 组件状态管理
  const [status, setStatus] = useState('idle'); // idle, uploading, uploaded, polling, completed, failed
  const [uploadProgress, setUploadProgress] = useState(0);
  const [taskId, setTaskId] = useState(null);
  const [taskProgress, setTaskProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  /**
   * 清理轮询定时器
   */
  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  /**
   * 组件卸载时清理资源
   */
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  /**
   * 验证文件类型和大小
   * @param {File} file - 选择的文件
   * @returns {Object} 验证结果
   */
  const validateFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain' // .txt
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: '仅支持 PDF、Word文档(.docx/.doc) 和文本文件(.txt) 格式'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: '文件大小不能超过 50MB'
      };
    }

    return { valid: true };
  };

  /**
   * 处理文件选择
   * @param {File} file - 选择的文件
   */
  const handleFileSelect = useCallback((file) => {
    console.log('📁 [NEW_UPLOADER] 文件选择:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // 验证文件
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      setStatus('idle');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setStatus('uploading');
    setUploadProgress(0);
    setMessage(`正在上传 ${file.name}...`);

    // 开始上传
    uploadFile(file);
  }, []);

  /**
   * 上传文件到V2 API
   * @param {File} file - 要上传的文件
   */
  const uploadFile = async (file) => {
    try {
      console.log('🚀 [NEW_UPLOADER] 开始上传文件');

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // 调用V2 API上传文件
      const response = await parseResumeV2(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.data?.taskId) {
        const newTaskId = response.data.taskId;
        
        console.log('✅ [NEW_UPLOADER] 文件上传成功，任务ID:', newTaskId);
        
        setTaskId(newTaskId);
        setStatus('uploaded');
        setMessage('文件上传成功，正在准备解析...');

        // 延迟0.5秒后开始轮询
        setTimeout(() => {
          startPolling(newTaskId);
        }, 500);

      } else {
        throw new Error(response.message || '上传失败');
      }

    } catch (error) {
      console.error('❌ [NEW_UPLOADER] 文件上传失败:', error);
      
      setStatus('failed');
      setError(error.message || '文件上传失败，请重试');
      setMessage('上传失败');
    }
  };

  /**
   * 开始轮询任务状态
   * @param {string} taskId - 任务ID
   */
  const startPolling = (taskId) => {
    console.log('🔄 [NEW_UPLOADER] 开始轮询任务状态:', taskId);
    
    setStatus('polling');
    setTaskProgress(0);
    setMessage('任务已加入队列，等待处理...');

    // 立即查询一次
    pollTaskStatus(taskId);

    // 设置定时轮询
    pollIntervalRef.current = setInterval(() => {
      pollTaskStatus(taskId);
    }, 2500); // 每2.5秒轮询一次
  };

  /**
   * 轮询任务状态
   * @param {string} taskId - 任务ID
   */
  const pollTaskStatus = async (taskId) => {
    try {
      const response = await getTaskStatusV2(taskId);

      if (response.success && response.data) {
        const { status: taskStatus, progress, message: taskMessage } = response.data;

        console.log('📊 [NEW_UPLOADER] 任务状态更新:', {
          status: taskStatus,
          progress,
          message: taskMessage
        });

        setTaskProgress(progress || 0);
        setMessage(taskMessage || getStatusMessage(taskStatus, progress));

        switch (taskStatus) {
          case 'queued':
            setMessage('任务已加入队列，等待处理...');
            break;

          case 'processing':
            setMessage(taskMessage || `AI正在分析简历内容... ${progress || 0}%`);
            break;

          case 'completed':
            console.log('🎉 [NEW_UPLOADER] 任务完成，准备跳转');
            
            clearPolling();
            setStatus('completed');
            setTaskProgress(100);
            setMessage('简历解析完成！正在跳转到审核页面...');

            // 🔧 改进跳转逻辑：在跳转前验证结果可用性
            setTimeout(async () => {
              try {
                console.log('🔍 [NEW_UPLOADER] 验证任务结果可用性...');
                
                // 尝试获取任务结果以确保数据完整
                const resultResponse = await getTaskResultV2(taskId);
                if (resultResponse.success && resultResponse.data?.resume_data) {
                  console.log('✅ [NEW_UPLOADER] 任务结果验证成功，准备跳转');
                  console.log('📊 [NEW_UPLOADER] 结果预览:', {
                    hasProfile: !!resultResponse.data.resume_data.profile,
                    profileName: resultResponse.data.resume_data.profile?.name || '未解析',
                    workExpCount: resultResponse.data.resume_data.workExperience?.length || 0,
                    educationCount: resultResponse.data.resume_data.education?.length || 0
                  });
                  
                  // 数据验证成功，执行跳转
                  if (onComplete) {
                    onComplete(taskId);
                  } else {
                    navigate(`/resumes/v2/review/${taskId}`);
                  }
                } else {
                  console.error('❌ [NEW_UPLOADER] 任务结果验证失败，数据不完整');
                  console.error('❌ [NEW_UPLOADER] 结果响应:', resultResponse);
                  
                  // 数据不完整，显示错误但仍然尝试跳转
                  setError('解析完成但数据可能不完整，正在跳转到审核页面...');
                  
                  setTimeout(() => {
                    if (onComplete) {
                      onComplete(taskId);
                    } else {
                      navigate(`/resumes/v2/review/${taskId}`);
                    }
                  }, 2000);
                }
              } catch (verifyError) {
                console.error('❌ [NEW_UPLOADER] 结果验证出错:', verifyError);
                
                // 验证失败但仍然跳转，让审核页面处理错误
                setMessage('解析完成，正在跳转...');
                if (onComplete) {
                  onComplete(taskId);
                } else {
                  navigate(`/resumes/v2/review/${taskId}`);
                }
              }
            }, 1000);
            break;

          case 'failed':
            console.error('❌ [NEW_UPLOADER] 任务处理失败');
            console.error('❌ [NEW_UPLOADER] 失败详情:', response.data);
            
            const errorMessage = response.data.error || response.data.message || '简历解析失败，请重试';
            const failedStep = response.data.failedAtStep || null;
            
            clearPolling();
            setStatus('failed');
            setError(failedStep ? `${errorMessage} (失败于步骤${failedStep})` : errorMessage);
            setMessage('解析失败');
            break;

          default:
            console.warn('⚠️ [NEW_UPLOADER] 未知任务状态:', taskStatus);
            break;
        }
      } else {
        throw new Error(response.message || '状态查询失败');
      }

    } catch (error) {
      console.error('❌ [NEW_UPLOADER] 轮询状态失败:', error);
      
      // 如果是网络错误，继续轮询
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        console.log('⚠️ [NEW_UPLOADER] 网络错误，继续轮询...');
        return;
      }

      // 🔧 改进：对于临时错误，继续轮询而不是立即停止
      if (error.response?.status === 500 || error.response?.status === 502 || error.response?.status === 503) {
        console.log('⚠️ [NEW_UPLOADER] 服务器临时错误，继续轮询...');
        return;
      }

      // 只有在确定是永久性错误时才停止轮询
      if (error.response?.status === 404 || error.response?.status === 403) {
        clearPolling();
        setStatus('failed');
        setError('任务不存在或无权访问');
      } else {
        // 其他未知错误，记录但继续轮询
        console.log('⚠️ [NEW_UPLOADER] 未知错误，继续轮询...', error.message);
      }
    }
  };

  /**
   * 根据状态生成消息
   * @param {string} status - 任务状态
   * @param {number} progress - 进度
   * @returns {string} 状态消息
   */
  const getStatusMessage = (status, progress) => {
    switch (status) {
      case 'queued':
        return '任务已加入队列，等待处理...';
      case 'processing':
        if (progress < 20) return '正在提取文件内容...';
        if (progress < 40) return '准备AI解析提示词...';
        if (progress < 80) return 'AI正在深度分析简历内容...';
        if (progress < 100) return '转换为统一数据格式...';
        return '即将完成...';
      case 'completed':
        return '简历解析完成！';
      case 'failed':
        return '解析失败，请重试';
      default:
        return '处理中...';
    }
  };

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 只有当拖拽完全离开拖拽区域时才设置为false
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * 处理文件拖拽放置
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  /**
   * 处理文件输入变化
   */
  const handleFileInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  /**
   * 触发文件选择
   */
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  /**
   * 重置组件状态
   */
  const resetUploader = () => {
    clearPolling();
    setStatus('idle');
    setUploadProgress(0);
    setTaskId(null);
    setTaskProgress(0);
    setMessage('');
    setError(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 获取当前显示的进度值
   */
  const getCurrentProgress = () => {
    switch (status) {
      case 'uploading':
        return uploadProgress;
      case 'polling':
        return taskProgress;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  /**
   * 获取状态样式配置
   */
  const getStatusStyles = () => {
    if (status === 'failed' || error) {
      return {
        borderColor: 'border-red-300',
        bgColor: 'bg-red-50',
        textColor: 'text-red-600',
        progressColor: 'bg-red-500'
      };
    }

    if (status === 'completed') {
      return {
        borderColor: 'border-green-300',
        bgColor: 'bg-green-50',
        textColor: 'text-green-600',
        progressColor: 'bg-green-500'
      };
    }

    if (status === 'uploading' || status === 'polling') {
      return {
        borderColor: 'border-blue-300',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        progressColor: 'bg-blue-500'
      };
    }

    if (isDragOver) {
      return {
        borderColor: 'border-blue-400',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        progressColor: 'bg-blue-500'
      };
    }

    return {
      borderColor: 'border-gray-300',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      progressColor: 'bg-blue-500'
    };
  };

  const styles = getStatusStyles();
  const currentProgress = getCurrentProgress();
  const isProcessing = status === 'uploading' || status === 'polling';
  const isCompleted = status === 'completed';
  const hasFailed = status === 'failed' || error;

  const displayProgress = getCurrentProgress();

  return (
    <div className={`flex items-center justify-center min-h-screen bg-gray-100 p-4 ${className}`}>
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* 顶部图标 / 进度圈 */}
          <div className="mb-6 flex justify-center">
            {['uploading', 'uploaded', 'polling', 'completed', 'failed'].includes(status) ? (
              <CircularProgress
                progress={displayProgress}
                status={status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'processing'}
              />
            ) : (
              <UploadCloudIcon className="w-24 h-24 mx-auto text-gray-300" />
            )}
          </div>

          {/* 状态标题 */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {status === 'idle' && '上传您的简历'}
            {status === 'uploading' && '正在上传...'}
            {(status === 'uploaded' || status === 'polling') && 'AI解析中...'}
            {status === 'completed' && '解析完成！'}
            {status === 'failed' && '出现错误'}
          </h2>

          {/* 描述 / 错误信息 */}
          <p className="text-gray-500 mb-8 min-h-[2rem]">{error || message}</p>

          {/* 空闲状态：拖拽 / 选择文件区域 */}
          {status === 'idle' && (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-10 transition-colors duration-200 ${
                isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={triggerFileSelect}
                className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              >
                选择文件
              </button>
              <p className="mt-4 text-sm text-gray-400">或将文件拖拽到此处</p>
            </div>
          )}

          {/* 失败状态：重新上传按钮 */}
          {status === 'failed' && (
            <button
              type="button"
              onClick={resetUploader}
              className="bg-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors shadow-md"
            >
              重新上传
            </button>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">支持 PDF, DOC, DOCX, TXT. 最大 50MB.</p>
      </div>
    </div>
  );
};

export default NewResumeUploader; 