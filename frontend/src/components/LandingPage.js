/**
 * Landing页面 - 俊才AI简历产品首页
 * 突出产品价值和流程，选择模式后展开功能
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser, logout } from '../utils/auth';
import AuthModal from './AuthModal';
import EditModal from './EditModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const userLoggedIn = isAuthenticated();
  const user = getUser();
  
  // Modal状态管理
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // 选择的信息采集方式
  const [selectedMode, setSelectedMode] = useState(null); // 'upload' | 'chat'
  
  // 待执行的操作（用于登录后继续执行）
  const [pendingAction, setPendingAction] = useState(null);
  
  // 功能体验状态
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [editedResult, setEditedResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', content: '您好！我是AI简历助手，我将通过几个问题来了解您的工作经历和技能。让我们开始吧！\n\n请先告诉我您的姓名？' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * 处理注册按钮点击
   */
  const handleRegisterClick = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  /**
   * 处理登录成功回调
   */
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    
    // 如果有待执行的操作，执行它
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      
      // 延迟执行，确保状态已更新
      setTimeout(() => {
        action();
      }, 100);
    } else {
      // 没有待执行操作，跳转到简历列表
      navigate('/resumes');
    }
  };

  /**
   * 处理用户退出登录
   */
  const handleLogout = () => {
    logout();
    window.location.reload(); // 刷新页面以更新认证状态
  };

  /**
   * 处理模式选择
   */
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    // 重置状态
    setUploadFile(null);
    setUploadResult(null);
    setUploadLoading(false);
    setUploadProgress(0);
    setUploadStage('');
    setChatMessages([
      { type: 'ai', content: '您好！我是AI简历助手，我将通过几个问题来了解您的工作经历和技能。让我们开始吧！\n\n请先告诉我您的姓名？' }
    ]);
    setChatInput('');
  };

  /**
   * 智能轮询任务状态（渐进式间隔）
   * @param {string} taskId - 任务ID
   */
  const pollTaskStatus = async (taskId) => {
    console.log('🔄 [POLL_TASK] ==> 开始智能轮询任务状态:', taskId);
    
    return new Promise((resolve, reject) => {
      let pollCount = 0;
      let currentInterval = 1000; // 初始1秒
      const maxInterval = 10000;  // 最大10秒
      const maxPollCount = 60;    // 最大轮询60次
      let pollTimeout;
      
      const executePoll = async () => {
        pollCount++;
        
        // 只在前10次和后续每5次显示日志，减少日志干扰
        const shouldLog = pollCount <= 10 || pollCount % 5 === 0;
        if (shouldLog) {
          console.log(`🔄 [POLL_TASK] 第 ${pollCount} 次轮询，任务ID: ${taskId}`);
        }
        
        try {
          const token = localStorage.getItem('token');
          
          if (shouldLog) {
            console.log('🔄 [POLL_TASK] 发送状态查询请求...');
          }
          
          const response = await fetch(`/api/tasks/${taskId}/status`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (shouldLog) {
            console.log('🔄 [POLL_TASK] 收到响应:', {
              status: response.status,
              statusText: response.statusText
            });
          }
          
          const data = await response.json();
          if (shouldLog) {
            console.log('🔄 [POLL_TASK] 响应数据:', data);
          }
          
          if (data.success) {
            const task = data.data;
            
            if (shouldLog) {
              console.log('🔄 [POLL_TASK] 任务当前状态:', {
                status: task.status,
                progress: task.progress,
                message: task.message,
                hasResultData: !!task.resultData
              });
            }
            
            // 更新进度和状态
            setUploadProgress(task.progress || 0);
            setUploadStage(task.message || '处理中...');
            
            // 检查任务是否完成
            if (task.status === 'completed') {
              console.log('✅ [POLL_TASK] 任务完成！');
              setUploadProgress(100);
              setUploadStage('解析完成！');
              
              // 设置解析结果
              if (task.resultData && task.resultData.structuredData) {
                console.log('📄 [POLL_TASK] 设置解析结果...');
                setTimeout(() => {
                  setUploadResult(task.resultData.structuredData);
                }, 300);
              } else {
                console.warn('⚠️ [POLL_TASK] 任务完成但缺少结构化数据');
              }
              
              resolve(task);
              return;
            } else if (task.status === 'failed') {
              console.error('❌ [POLL_TASK] 任务失败:', task.errorMessage);
              throw new Error(task.errorMessage || '解析失败');
            } else {
              // 检查是否超过最大轮询次数
              if (pollCount >= maxPollCount) {
                console.error('⏰ [POLL_TASK] 超过最大轮询次数:', maxPollCount);
                throw new Error('处理超时，请稍后重试');
              }
              
              // 渐进式增加轮询间隔
              if (pollCount > 5) {
                currentInterval = Math.min(currentInterval + 1000, maxInterval);
              }
              
              if (shouldLog) {
                console.log(`🔄 [POLL_TASK] 任务处理中，${currentInterval/1000}秒后继续轮询...`);
              }
              
              // 设置下次轮询
              pollTimeout = setTimeout(executePoll, currentInterval);
            }
          } else {
            console.error('❌ [POLL_TASK] API返回失败:', data);
            throw new Error(data.message || '获取任务状态失败');
          }
        } catch (error) {
          console.error('❌ [POLL_TASK] 轮询出错:', {
            error: error.message,
            pollCount: pollCount,
            taskId: taskId
          });
          reject(error);
        }
      };
      
      // 开始第一次轮询
      executePoll();
      
      // 设置总体超时（3分钟）
      const overallTimeout = setTimeout(() => {
        console.error('⏰ [POLL_TASK] 总体超时');
        if (pollTimeout) clearTimeout(pollTimeout);
        reject(new Error('处理超时，请稍后重试'));
      }, 3 * 60 * 1000);
      
      // 清理函数
      const cleanup = () => {
        if (pollTimeout) clearTimeout(pollTimeout);
        if (overallTimeout) clearTimeout(overallTimeout);
      };
      
      // 重写Promise的then/catch以确保清理
      const originalResolve = resolve;
      const originalReject = reject;
      
      resolve = (value) => {
        cleanup();
        originalResolve(value);
      };
      
      reject = (error) => {
        cleanup();
        originalReject(error);
      };
    });
  };

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (event) => {
    const startTime = Date.now();
    console.log('🚀 [FRONTEND_UPLOAD] ==> 开始文件上传处理');
    console.log('🚀 [FRONTEND_UPLOAD] 当前时间:', new Date().toISOString());
    console.log('🚀 [FRONTEND_UPLOAD] 事件对象:', event);
    console.log('🚀 [FRONTEND_UPLOAD] 事件目标:', event.target);
    console.log('🚀 [FRONTEND_UPLOAD] 文件列表:', event.target.files);
    
    const file = event.target.files[0];
    if (!file) {
      console.log('❌ [FRONTEND_UPLOAD] 未选择文件');
      alert('请选择一个文件');
      return;
    }

    console.log('📄 [FRONTEND_UPLOAD] 文件信息:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // 文件大小检查
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.error('❌ [FRONTEND_UPLOAD] 文件过大:', file.size, '字节，最大允许:', maxSize, '字节');
      alert(`文件过大！文件大小：${(file.size / 1024 / 1024).toFixed(2)}MB，最大允许：50MB`);
      return;
    }
    
    console.log('✅ [FRONTEND_UPLOAD] 文件大小检查通过');

    // 检查用户是否已登录
    console.log('🔑 [FRONTEND_UPLOAD] 开始认证状态检查...');
    const authStatus = isAuthenticated();
    console.log('🔑 [FRONTEND_UPLOAD] 认证状态检查结果:', authStatus);
    console.log('🔑 [FRONTEND_UPLOAD] localStorage token:', localStorage.getItem('token') ? '存在' : '不存在');
    console.log('🔑 [FRONTEND_UPLOAD] localStorage user:', localStorage.getItem('user') ? '存在' : '不存在');
    
    if (!authStatus) {
      console.log('🔑 [FRONTEND_UPLOAD] 用户未登录，显示登录框');
      alert('请先登录后再上传文件');
      // 设置待执行的操作并提示登录
      setPendingAction(() => () => {
        const fakeEvent = { target: { files: [file] } };
        handleFileUpload(fakeEvent);
      });
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    
    console.log('✅ [FRONTEND_UPLOAD] 用户已登录，继续文件上传流程');

    console.log('📋 [FRONTEND_UPLOAD] 设置上传状态...');
    setUploadFile(file);
    setUploadLoading(true);
    setUploadResult(null);
    setUploadProgress(0);
    setUploadStage('准备上传文件...');
    
    console.log('📋 [FRONTEND_UPLOAD] UI状态已更新');

    try {
      // 双重检查用户认证状态
      console.log('🔐 [FRONTEND_UPLOAD] 进行二次认证检查...');
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('🔐 [FRONTEND_UPLOAD] 认证信息详情:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        hasUser: !!user,
        tokenPrefix: token ? token.substring(0, 20) + '...' : '无',
        userInfo: user ? JSON.parse(user) : null
      });
      
      if (!token) {
        console.error('❌ [FRONTEND_UPLOAD] token缺失');
        throw new Error('认证信息缺失，请重新登录');
      }

      console.log('📦 [FRONTEND_UPLOAD] 创建FormData...');
      const formData = new FormData();
      formData.append('resume', file);
      
      console.log('📦 [FRONTEND_UPLOAD] FormData创建完成:', {
        fileName: file.name,
        fileSize: file.size,
        formDataKeys: Array.from(formData.keys())
      });
      
      const uploadUrl = '/api/resumes/upload';
      const fullUrl = window.location.origin + uploadUrl;
      console.log('📤 [FRONTEND_UPLOAD] 准备发送请求到:', uploadUrl);
      console.log('📤 [FRONTEND_UPLOAD] 完整URL:', fullUrl);
      console.log('📤 [FRONTEND_UPLOAD] 当前域名:', window.location.origin);
      console.log('📤 [FRONTEND_UPLOAD] 当前协议:', window.location.protocol);
      console.log('📤 [FRONTEND_UPLOAD] 当前主机:', window.location.host);
      console.log('📤 [FRONTEND_UPLOAD] 请求方法: POST');
      console.log('📤 [FRONTEND_UPLOAD] 请求头Authorization: Bearer', token.substring(0, 20) + '...');

      setUploadStage('正在上传文件...');
      console.log('📤 [FRONTEND_UPLOAD] UI状态更新为: 正在上传文件...');
      
      // 创建带超时的fetch请求（10分钟超时）
      // 先测试网络连接
      console.log('🌐 [FRONTEND_UPLOAD] 测试网络连接...');
      try {
        const healthCheck = await fetch('/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5秒超时
        });
        console.log('🌐 [FRONTEND_UPLOAD] 健康检查响应状态:', healthCheck.status);
        
        if (healthCheck.ok) {
          // 先获取响应文本，然后尝试解析JSON
          const responseText = await healthCheck.text();
          try {
            const healthData = JSON.parse(responseText);
            console.log('🌐 [FRONTEND_UPLOAD] 健康检查响应:', healthData);
            console.log('✅ [FRONTEND_UPLOAD] 网络连接正常');
          } catch (jsonError) {
            // 如果不是JSON格式，说明nginx代理配置有问题
            console.warn('⚠️ [FRONTEND_UPLOAD] 健康检查返回非JSON格式:', responseText);
            console.warn('⚠️ [FRONTEND_UPLOAD] 这通常表明nginx代理配置有问题，请检查端口配置');
            console.warn('⚠️ [FRONTEND_UPLOAD] JSON解析错误:', jsonError.message);
            // 不抛出错误，继续执行上传逻辑
          }
        } else {
          console.warn('⚠️ [FRONTEND_UPLOAD] 健康检查状态异常:', healthCheck.status);
        }
      } catch (healthError) {
        console.error('❌ [FRONTEND_UPLOAD] 网络连接测试失败:', healthError);
        alert('网络连接测试失败，请检查网络后重试: ' + healthError.message);
        throw healthError;
      }
      
      console.log('⏱️ [FRONTEND_UPLOAD] 创建超时控制器...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ [FRONTEND_UPLOAD] 请求超时，中断请求...');
        controller.abort();
      }, 600000); // 10分钟超时
      
      console.log('🚀 [FRONTEND_UPLOAD] 开始发送fetch请求...');
      const requestStart = Date.now();
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal
      });
      
      const requestDuration = Date.now() - requestStart;
      clearTimeout(timeoutId);
      
      console.log('📡 [FRONTEND_UPLOAD] 收到响应 (耗时:', requestDuration, 'ms)');
      console.log('📡 [FRONTEND_UPLOAD] 响应状态:', response.status, response.statusText);
      console.log('📡 [FRONTEND_UPLOAD] 响应头:', Object.fromEntries(response.headers.entries()));
      console.log('📡 [FRONTEND_UPLOAD] 响应是否OK:', response.ok);

      if (!response.ok) {
        console.error('❌ [FRONTEND_UPLOAD] HTTP错误响应:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
      }

      console.log('📄 [FRONTEND_UPLOAD] 开始解析JSON响应...');
      const data = await response.json();
      console.log('📋 [FRONTEND_UPLOAD] 响应数据:', JSON.stringify(data, null, 2));
      
      // 处理认证错误
      console.log('🔐 [FRONTEND_UPLOAD] 检查认证状态...');
      if (response.status === 401 || response.status === 403) {
        console.error('🔑 [FRONTEND_UPLOAD] 认证失败，状态码:', response.status);
        console.log('🔑 [FRONTEND_UPLOAD] 清除本地认证信息');
        // 清除无效的认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        alert('登录状态已过期，请重新登录');
        
        // 显示登录框
        setPendingAction(() => () => {
          const fakeEvent = { target: { files: [file] } };
          handleFileUpload(fakeEvent);
        });
        setAuthMode('login');
        setShowAuthModal(true);
        
        throw new Error('登录状态已过期，请重新登录');
      }
      
      console.log('✅ [FRONTEND_UPLOAD] 认证检查通过');
      console.log('📋 [FRONTEND_UPLOAD] 检查响应数据结构...');
      
      if (data.success && data.data && data.data.taskId) {
        // 立即开始轮询后端真实进度
        const taskId = data.data.taskId;
        console.log('✅ [FRONTEND_UPLOAD] 上传成功，任务ID:', taskId);
        console.log('✅ [FRONTEND_UPLOAD] 任务详情:', data.data);
        setUploadStage('文件上传成功，开始解析...');
        
        console.log('🔄 [FRONTEND_UPLOAD] 开始轮询任务状态...');
        await pollTaskStatus(taskId);
      } else {
        console.error('❌ [FRONTEND_UPLOAD] 上传失败，响应结构异常');
        console.error('❌ [FRONTEND_UPLOAD] 期望格式: {success: true, data: {taskId: "..."}}');
        console.error('❌ [FRONTEND_UPLOAD] 实际响应:', data);
        
        const errorMsg = data.message || '上传失败：响应格式异常';
        alert(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [FRONTEND_UPLOAD] ==> 发生错误，开始错误处理');
      console.error('❌ [FRONTEND_UPLOAD] 错误对象:', error);
      console.error('❌ [FRONTEND_UPLOAD] 错误名称:', error.name);
      console.error('❌ [FRONTEND_UPLOAD] 错误消息:', error.message);
      console.error('❌ [FRONTEND_UPLOAD] 错误堆栈:', error.stack);
      console.error('❌ [FRONTEND_UPLOAD] 总耗时:', `${duration}ms`);
      
      // 根据错误类型显示不同的提示
      let userMessage = '';
      if (error.name === 'AbortError') {
        userMessage = '文件上传超时，请检查网络连接或尝试上传较小的文件';
        console.error('❌ [FRONTEND_UPLOAD] 错误类型: 请求超时');
      } else if (error.message.includes('登录') || error.message.includes('认证')) {
        userMessage = `${error.message}，请登录后重试`;
        console.error('❌ [FRONTEND_UPLOAD] 错误类型: 认证问题');
      } else if (error.message.includes('Failed to fetch')) {
        userMessage = '网络连接失败，请检查网络后重试';
        console.error('❌ [FRONTEND_UPLOAD] 错误类型: 网络连接失败');
      } else {
        userMessage = `简历解析失败: ${error.message}`;
        console.error('❌ [FRONTEND_UPLOAD] 错误类型: 其他错误');
      }
      
      console.error('❌ [FRONTEND_UPLOAD] 显示给用户的错误消息:', userMessage);
      alert(userMessage);
      
      console.log('🧹 [FRONTEND_UPLOAD] 清理UI状态...');
      setUploadStage('');
      setUploadProgress(0);
      console.log('🧹 [FRONTEND_UPLOAD] UI状态清理完成');
    } finally {
      setTimeout(() => {
        setUploadLoading(false);
        const totalDuration = Date.now() - startTime;
        console.log(`🏁 [FRONTEND_UPLOAD] 处理完成，总耗时: ${totalDuration}ms`);
      }, 1000);
    }
  };

  /**
   * 处理AI对话
   */
  const handleChatSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    setChatMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: 'demo-' + Date.now(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setChatMessages(prev => [...prev, { type: 'ai', content: data.data.reply }]);
      } else {
        throw new Error(data.message || 'AI回复失败');
      }
    } catch (error) {
      console.error('AI对话失败:', error);
      setChatMessages(prev => [...prev, { type: 'ai', content: '抱歉，我暂时无法回复，请稍后重试。' }]);
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * 处理Enter键发送消息
   */
  const handleChatKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleChatSubmit();
    }
  };

  /**
   * 处理编辑信息变更
   */
  const handleEditChange = (section, field, value, index = null) => {
    setEditedResult(prev => {
      const newResult = { ...prev };
      
      if (index !== null) {
        // 处理数组项
        if (!newResult[section]) newResult[section] = [];
        if (!newResult[section][index]) newResult[section][index] = {};
        newResult[section][index][field] = value;
      } else if (section === 'skills') {
        // 处理技能（逗号分隔的字符串转数组）
        if (!newResult.skills) newResult.skills = {};
        newResult.skills[field] = value.split(',').map(item => item.trim()).filter(item => item);
      } else {
        // 处理普通字段
        if (!newResult[section]) newResult[section] = {};
        newResult[section][field] = value;
      }
      
      return newResult;
    });
  };

  /**
   * 添加经历项目
   */
  const handleAddExperience = (section) => {
    setEditedResult(prev => {
      const newResult = { ...prev };
      if (!newResult[section]) newResult[section] = [];
      
      let newItem = {};
      if (section === 'educations') {
        newItem = { school: '', degree: '', major: '', startDate: '', endDate: '', gpa: '' };
      } else if (section === 'workExperiences') {
        newItem = { company: '', position: '', startDate: '', endDate: '', description: '' };
      } else if (section === 'projects') {
        newItem = { name: '', role: '', startDate: '', endDate: '', description: '' };
      }
      
      newResult[section].push(newItem);
      return newResult;
    });
  };

  /**
   * 删除经历项目
   */
  const handleRemoveExperience = (section, index) => {
    setEditedResult(prev => {
      const newResult = { ...prev };
      if (newResult[section]) {
        newResult[section].splice(index, 1);
      }
      return newResult;
    });
  };

  /**
   * 保存基础简历
   */
  const handleSaveBaseResume = async (forceOverwrite = false) => {
    // 确保forceOverwrite是布尔值，防止意外传递事件对象
    forceOverwrite = Boolean(forceOverwrite);
    
    // 检查用户是否已登录
    if (!isAuthenticated()) {
      // 设置待执行的操作
      setPendingAction(() => () => handleSaveBaseResume(forceOverwrite));
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = editedResult || uploadResult;
      
      // 验证数据的完整性，防止包含DOM引用或循环引用
      if (!dataToSave || typeof dataToSave !== 'object') {
        throw new Error('简历数据无效，请重新解析简历');
      }
      
      // 创建一个干净的数据副本，移除可能的DOM引用
      const cleanData = JSON.parse(JSON.stringify(dataToSave));
      
      const response = await fetch('/api/resumes/save-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          resumeData: cleanData,
          source: selectedMode === 'upload' ? 'upload' : 'chat',
          forceOverwrite: forceOverwrite
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message || '基础简历保存成功！现在可以针对不同岗位进行AI优化。');
        navigate('/resumes');
      } else if (data.error_code === 'RESUME_EXISTS_NEED_CONFIRMATION') {
        // 需要用户确认覆盖
        const existingResume = data.data.existingResume;
        const confirmMessage = `检测到您已有一份基础简历：\n\n标题：${existingResume.title}\n创建时间：${new Date(existingResume.created_at).toLocaleString()}\n更新时间：${new Date(existingResume.updated_at).toLocaleString()}\n\n是否要用新解析的简历覆盖现有简历？\n\n注意：覆盖后原简历数据将无法恢复！`;
        
        if (window.confirm(confirmMessage)) {
          // 用户确认覆盖，重新调用保存函数
          handleSaveBaseResume(true);
          return;
        } else {
          // 用户取消覆盖
          alert('保存已取消。您可以在简历管理页面查看和编辑现有简历。');
        }
      } else {
        throw new Error(data.message || '保存失败');
      }
    } catch (error) {
      console.error('保存基础简历失败:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 重置编辑状态
   */
  const handleCancelEdit = () => {
    setEditedResult(null);
  };



  return (
    <div className="min-h-screen bg-white">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gray-900">俊才AI简历</div>
            </div>
            
            <div className="flex items-center space-x-4">
              {userLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">欢迎，{user?.email}</span>
                  <button
                    onClick={() => navigate('/resumes')}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    我的简历
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                  >
                    登录
                  </button>
                  <button
                    onClick={handleRegisterClick}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    注册
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 顶部大标题区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          {/* 左侧文案 */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight whitespace-nowrap">
              一键定制岗位专属简历
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              AI智能分析岗位需求，让每份简历都精准匹配目标职位，智能解析您的现有简历内容，轻松创建结构化简历
            </p>
            <div className="relative">
              <button
                onClick={() => handleModeSelect('upload')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold px-10 py-4 rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 relative overflow-hidden"
              >
                <span className="relative z-10">立即开始体验</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
          
          {/* 右侧简历对比 */}
          <div className="relative">
            <div className="flex space-x-4">
              {/* 原始简历 */}
              <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                <div className="text-center mb-3">
                  <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full inline-block">
                    原始简历 • 匹配度45%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                  <div className="mt-3 space-y-1">
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/5"></div>
                  </div>
                </div>
              </div>

              {/* 箭头 */}
              <div className="flex items-center">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                  <span className="text-sm">→</span>
                </div>
              </div>

              {/* 定制简历 */}
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 relative">
                <div className="text-center mb-3">
                  <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full inline-block">
                    定制简历 • 匹配度92%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-blue-300 rounded w-full"></div>
                  <div className="h-3 bg-blue-300 rounded w-4/5"></div>
                  <div className="h-2 bg-green-200 rounded w-full"></div>
                  <div className="h-2 bg-green-200 rounded w-3/4"></div>
                  <div className="h-2 bg-purple-200 rounded w-4/5"></div>
                  <div className="mt-3 space-y-1">
                    <div className="h-2 bg-green-200 rounded w-3/4"></div>
                    <div className="h-2 bg-blue-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center">
                  <span className="text-xs">✨</span>
                </div>
              </div>
            </div>
            
            {/* AI优化标签 */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-white px-3 py-1 rounded-full shadow-md border border-gray-200">
                <span className="text-xs font-medium text-gray-600">AI智能优化</span>
              </div>
            </div>
          </div>
        </div>

        {/* 简单三步，打造专属简历 */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">简单三步，打造专属简历</h2>
            <p className="text-xl text-gray-600">AI智能解析与优化，让您的简历更加专业</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* 连接线 */}
            <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-blue-200 to-green-200 transform -translate-y-1/2"></div>
            <div className="hidden md:block absolute top-1/2 right-1/3 w-1/3 h-0.5 bg-gradient-to-r from-green-200 to-purple-200 transform -translate-y-1/2"></div>
            
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative z-10">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">📤</span>
              </div>
              <div className="bg-blue-500 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">上传现有简历</h3>
              <p className="text-gray-600 leading-relaxed">支持PDF、Word等格式，AI智能解析简历内容</p>
            </div>

            <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative z-10">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">🎯</span>
              </div>
              <div className="bg-green-500 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">输入目标岗位</h3>
              <p className="text-gray-600 leading-relaxed">AI分析岗位需求，定制优化策略</p>
            </div>

            <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative z-10">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">⚡</span>
              </div>
              <div className="bg-purple-500 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">一键生成简历</h3>
              <p className="text-gray-600 leading-relaxed">智能优化内容，生成专属定制简历</p>
            </div>
          </div>
        </div>

        {/* 功能特色模块 */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">强大功能特色</h2>
            <p className="text-xl text-gray-600">全方位AI驱动，为您提供最优质的简历优化体验</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AI智能优化 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center border border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI智能优化</h3>
              <p className="text-gray-600 leading-relaxed">
                智能分析您的技能与岗位匹配度，优化语言表达，突出核心优势，让简历更具竞争力
              </p>
            </div>

            {/* 多种模板选择 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center border border-green-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">多种模板选择</h3>
              <p className="text-gray-600 leading-relaxed">
                提供多种专业简历模板，适配不同行业和职位需求，让您的简历脱颖而出
              </p>
            </div>

            {/* 快速高效 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 text-center border border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">快速高效</h3>
              <p className="text-gray-600 leading-relaxed">
                30秒完成简历优化，支持批量生成多个岗位的定制简历，大大提升求职效率
              </p>
            </div>
          </div>
        </div>



                  {!selectedMode ? (
            /* 底部CTA区域 */
            <div>
              {/* 底部渐变CTA */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-4">准备好提升您的简历了吗？</h2>
                  <p className="text-xl mb-8 text-blue-100">AI智能优化，让您的简历脱颖而出</p>
                  <button
                    onClick={() => handleModeSelect('upload')}
                    className="bg-white text-purple-600 text-lg font-semibold px-10 py-4 rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    立即开始体验
                  </button>
                </div>
                {/* 装饰性元素 */}
                <div className="absolute top-4 right-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-20 h-20 bg-white bg-opacity-5 rounded-full"></div>
              </div>
            </div>
          ) : (
          /* 弹窗背景遮罩 */
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {selectedMode === 'upload' && (
                /* 简历上传解析界面 */
                <div className="p-8">
                  {/* 弹窗标题栏 */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                        <span className="text-4xl mr-3">📄</span>
                        导入现有简历
                      </h2>
                      <p className="text-gray-600 mt-2">支持PDF、Word等格式，AI将智能解析您的简历</p>
                    </div>
                    <button
                      onClick={() => setSelectedMode(null)}
                      className="text-gray-400 hover:text-gray-600 text-3xl font-light"
                    >
                      ✕
                    </button>
                  </div>

                  {!uploadResult ? (
                    <div>
                      {/* 文件上传区域 */}
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="text-4xl mb-4">📁</div>
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          点击上传简历文件
                        </p>
                        <p className="text-gray-500 mb-4">
                          支持 PDF、Word、TXT 格式，文件大小不超过 10MB
                        </p>
                        <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium inline-block">
                          选择文件
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {/* 进度条 */}
                      {uploadLoading && (
                        <div className="mt-8">
                          <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium text-gray-700">{uploadStage}</span>
                              <span className="text-sm font-medium text-indigo-600">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" 
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 解析结果展示 */
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">📋 解析结果</h3>
                        <div className="text-sm text-gray-500">
                          文件：{uploadFile?.name}
                        </div>
                      </div>

                      {/* 个人信息 */}
                      {uploadResult.personalInfo && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-3">👤 个人信息</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {uploadResult.personalInfo.name && (
                              <div><span className="font-medium">姓名：</span>{uploadResult.personalInfo.name}</div>
                            )}
                            {uploadResult.personalInfo.phone && (
                              <div><span className="font-medium">电话：</span>{uploadResult.personalInfo.phone}</div>
                            )}
                            {uploadResult.personalInfo.email && (
                              <div><span className="font-medium">邮箱：</span>{uploadResult.personalInfo.email}</div>
                            )}
                            {uploadResult.personalInfo.location && (
                              <div><span className="font-medium">地址：</span>{uploadResult.personalInfo.location}</div>
                            )}
                          </div>
                          {uploadResult.personalInfo.summary && (
                            <div className="mt-3">
                              <span className="font-medium">个人简介：</span>
                              <p className="text-gray-700 mt-1">{uploadResult.personalInfo.summary}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 教育经历 */}
                      {uploadResult.educations && uploadResult.educations.length > 0 && (
                        <div className="mb-6 p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-3">🎓 教育经历</h4>
                          {uploadResult.educations.map((edu, index) => (
                            <div key={index} className="mb-3 last:mb-0">
                              <div className="font-medium">{edu.school} - {edu.major}</div>
                              <div className="text-sm text-gray-600">
                                {edu.degree} | {edu.startDate} - {edu.endDate}
                                {edu.gpa && ` | GPA: ${edu.gpa}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 工作经历 */}
                      {uploadResult.workExperiences && uploadResult.workExperiences.length > 0 && (
                        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-medium text-purple-900 mb-3">💼 工作经历</h4>
                          {uploadResult.workExperiences.map((work, index) => (
                            <div key={index} className="mb-3 last:mb-0">
                              <div className="font-medium">{work.company} - {work.position}</div>
                              <div className="text-sm text-gray-600">
                                {work.startDate} - {work.endDate}
                              </div>
                              {work.description && (
                                <div className="text-sm text-gray-700 mt-1">{work.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 项目经历 */}
                      {uploadResult.projects && uploadResult.projects.length > 0 && (
                        <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                          <h4 className="font-medium text-orange-900 mb-3">🚀 项目经历</h4>
                          {uploadResult.projects.map((project, index) => (
                            <div key={index} className="mb-3 last:mb-0">
                              <div className="font-medium">{project.name}</div>
                              {project.role && (
                                <div className="text-sm text-gray-600">担任角色：{project.role}</div>
                              )}
                              {project.description && (
                                <div className="text-sm text-gray-700 mt-1">{project.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 技能 */}
                      {uploadResult.skills && (
                        <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                          <h4 className="font-medium text-indigo-900 mb-3">💪 技能</h4>
                          <div className="space-y-2 text-sm">
                            {uploadResult.skills.technical && uploadResult.skills.technical.length > 0 && (
                              <div>
                                <span className="font-medium">技术技能：</span>
                                {uploadResult.skills.technical.join(', ')}
                              </div>
                            )}
                            {uploadResult.skills.professional && uploadResult.skills.professional.length > 0 && (
                              <div>
                                <span className="font-medium">专业技能：</span>
                                {uploadResult.skills.professional.join(', ')}
                              </div>
                            )}
                            {uploadResult.skills.soft && uploadResult.skills.soft.length > 0 && (
                              <div>
                                <span className="font-medium">软技能：</span>
                                {uploadResult.skills.soft.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex space-x-4">
                        <button
                          onClick={() => {
                            setEditedResult(uploadResult);
                            setShowEditModal(true);
                          }}
                          className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                          ✏️ 编辑信息
                        </button>
                        <button
                          onClick={() => handleSaveBaseResume()}
                          disabled={isSaving}
                          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {isSaving ? '保存中...' : '💾 保存简历'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedMode === 'chat' && (
                /* AI对话界面 */
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                        <span className="text-4xl mr-3">🤖</span>
                        通过对话创建简历
                      </h2>
                      <p className="text-gray-600 mt-2">AI助手将引导您完善简历信息</p>
                    </div>
                    <button
                      onClick={() => setSelectedMode(null)}
                      className="text-gray-400 hover:text-gray-600 text-3xl font-light"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 对话界面 */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                    {/* 对话区域 */}
                    <div className="h-80 overflow-y-auto p-6 space-y-4">
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-sm px-4 py-3 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 px-4 py-3 rounded-lg">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 输入区域 */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={handleChatKeyPress}
                          placeholder="输入您的回答..."
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          disabled={chatLoading}
                        />
                        <button
                          onClick={handleChatSubmit}
                          disabled={!chatInput.trim() || chatLoading}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        setIsSaving(true);
                        // 这里需要实现保存对话记录并生成简历的逻辑
                      }}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      保存对话记录并生成简历
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 编辑Modal */}
      <EditModal
        isOpen={showEditModal}
        onClose={handleCancelEdit}
        editedResult={editedResult}
        onEditChange={handleEditChange}
        onAddExperience={handleAddExperience}
        onRemoveExperience={handleRemoveExperience}
        onSave={() => handleSaveBaseResume()}
        isSaving={isSaving}
      />

      {/* 认证Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSuccess={handleAuthSuccess}
        onSwitchMode={(mode) => setAuthMode(mode)}
      />
    </div>
  );
};

export default LandingPage; 