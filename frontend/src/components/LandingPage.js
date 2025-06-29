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
   * 轮询任务状态
   * @param {string} taskId - 任务ID
   */
  const pollTaskStatus = async (taskId) => {
    console.log('🔄 [POLL_TASK] ==> 开始轮询任务状态:', taskId);
    
    return new Promise((resolve, reject) => {
      let pollCount = 0;
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`🔄 [POLL_TASK] 第 ${pollCount} 次轮询，任务ID: ${taskId}`);
        
        try {
          const token = localStorage.getItem('token');
          
          console.log('🔄 [POLL_TASK] 发送状态查询请求...');
          const response = await fetch(`/api/tasks/${taskId}/status`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('🔄 [POLL_TASK] 收到响应:', {
            status: response.status,
            statusText: response.statusText
          });
          
          const data = await response.json();
          console.log('🔄 [POLL_TASK] 响应数据:', data);
          
          if (data.success) {
            const task = data.data;
            
            console.log('🔄 [POLL_TASK] 任务当前状态:', {
              status: task.status,
              progress: task.progress,
              message: task.message,
              hasResultData: !!task.resultData
            });
            
            // 更新进度和状态
            setUploadProgress(task.progress || 0);
            setUploadStage(task.message || '处理中...');
            
            // 检查任务是否完成
            if (task.status === 'completed') {
              console.log('✅ [POLL_TASK] 任务完成！');
              clearInterval(pollInterval);
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
            } else if (task.status === 'failed') {
              console.error('❌ [POLL_TASK] 任务失败:', task.errorMessage);
              clearInterval(pollInterval);
              throw new Error(task.errorMessage || '解析失败');
            } else {
              console.log('🔄 [POLL_TASK] 任务仍在处理中，继续轮询...');
            }
            // 继续轮询处理中的任务
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
          clearInterval(pollInterval);
          reject(error);
        }
      }, 1000); // 每秒轮询一次
      
      // 设置超时（5分钟）
      setTimeout(() => {
        console.error('⏰ [POLL_TASK] 轮询超时');
        clearInterval(pollInterval);
        reject(new Error('解析超时，请稍后重试'));
      }, 5 * 60 * 1000);
    });
  };

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (event) => {
    const startTime = Date.now();
    console.log('🚀 [FRONTEND_UPLOAD] ==> 开始文件上传处理');
    
    const file = event.target.files[0];
    if (!file) {
      console.log('❌ [FRONTEND_UPLOAD] 未选择文件');
      return;
    }

    console.log('📄 [FRONTEND_UPLOAD] 文件信息:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // 检查用户是否已登录
    const authStatus = isAuthenticated();
    console.log('🔑 [FRONTEND_UPLOAD] 认证状态检查:', authStatus);
    
    if (!authStatus) {
      console.log('🔑 用户未登录，显示登录框');
      // 设置待执行的操作并提示登录
      setPendingAction(() => () => {
        const fakeEvent = { target: { files: [file] } };
        handleFileUpload(fakeEvent);
      });
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    setUploadFile(file);
    setUploadLoading(true);
    setUploadResult(null);
    setUploadProgress(0);
    setUploadStage('准备上传文件...');

    try {
      // 双重检查用户认证状态
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('🔐 [FRONTEND_UPLOAD] 认证信息检查:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        hasUser: !!user,
        tokenPrefix: token ? token.substring(0, 20) + '...' : '无'
      });
      
      if (!token) {
        throw new Error('认证信息缺失，请重新登录');
      }

      const formData = new FormData();
      formData.append('resume', file);
      
      console.log('📤 [FRONTEND_UPLOAD] 准备发送请求到:', '/api/resumes/upload');
      console.log('📤 [FRONTEND_UPLOAD] FormData包含文件:', file.name);

      setUploadStage('正在上传文件...');
      
      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      console.log('📡 [FRONTEND_UPLOAD] 收到响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('📋 [FRONTEND_UPLOAD] 响应数据:', data);
      
      // 处理认证错误
      if (response.status === 401 || response.status === 403) {
        console.log('🔑 认证失败，清除本地认证信息');
        // 清除无效的认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 显示登录框
        setPendingAction(() => () => {
          const fakeEvent = { target: { files: [file] } };
          handleFileUpload(fakeEvent);
        });
        setAuthMode('login');
        setShowAuthModal(true);
        
        throw new Error('登录状态已过期，请重新登录');
      }
      
      if (data.success && data.data.taskId) {
        // 立即开始轮询后端真实进度
        const taskId = data.data.taskId;
        console.log('✅ [FRONTEND_UPLOAD] 上传成功，任务ID:', taskId);
        setUploadStage('文件上传成功，开始解析...');
        
        await pollTaskStatus(taskId);
      } else {
        console.error('❌ [FRONTEND_UPLOAD] 上传失败，服务器响应:', data);
        throw new Error(data.message || '上传失败');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [FRONTEND_UPLOAD] 简历解析失败:', error);
      console.error('❌ [FRONTEND_UPLOAD] 错误详情:', {
        message: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      
      // 根据错误类型显示不同的提示
      if (error.message.includes('登录') || error.message.includes('认证')) {
        alert(`${error.message}，请登录后重试`);
      } else {
        alert('简历解析失败，请稍后重试');
      }
      
      setUploadStage('');
      setUploadProgress(0);
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

  /**
   * 临时诊断函数 - 检查认证状态
   */
  const handleDiagnosis = async () => {
    console.log('🔍 开始认证诊断...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Token:', token ? '存在' : '不存在');
    console.log('User:', user ? '存在' : '不存在');
    console.log('isAuthenticated():', isAuthenticated());
    
    if (token) {
      try {
        // 测试API调用
        const response = await fetch('/api/resumes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        console.log('API测试结果:', response.status, data);
        
        alert(`诊断结果：
Token: ${token ? '存在' : '不存在'}
User: ${user ? '存在' : '不存在'}  
认证检查: ${isAuthenticated() ? '通过' : '失败'}
API测试: ${response.status} - ${data.message || '成功'}`);
      } catch (error) {
        console.error('API测试失败:', error);
        alert(`诊断结果：
Token: ${token ? '存在' : '不存在'}
User: ${user ? '存在' : '不存在'}
认证检查: ${isAuthenticated() ? '通过' : '失败'}
API测试: 失败 - ${error.message}`);
      }
    } else {
      alert(`诊断结果：
Token: 不存在
User: ${user ? '存在' : '不存在'}
认证检查: 失败
需要先登录！`);
    }
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
                    onClick={handleDiagnosis}
                    className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                    title="诊断认证状态"
                  >
                    🔍诊断
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
                    onClick={handleDiagnosis}
                    className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                    title="诊断认证状态"
                  >
                    🔍诊断
                  </button>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            通过 AI 创建简历
          </h1>
        </div>

        {/* 产品亮点 - 三步流程 */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">采集经历</h3>
              <p className="text-gray-600">上传现有简历或通过对话收集工作经历</p>
            </div>

            <div className="p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">润色亮点</h3>
              <p className="text-gray-600">AI智能优化简历内容，突出个人亮点</p>
            </div>

            <div className="p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">岗位定制</h3>
              <p className="text-gray-600">根据目标岗位定制专属简历版本</p>
            </div>
          </div>
        </div>

        {!selectedMode ? (
          /* 选择信息采集方式 */
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">选择信息采集方式</h2>
              <p className="text-lg text-gray-600">选择一种方式开始创建您的专业简历</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 导入现有简历 */}
              <div 
                onClick={() => handleModeSelect('upload')}
                className="bg-gray-50 rounded-2xl p-8 cursor-pointer hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-indigo-200"
              >
                <div className="text-center">
                  <div className="text-5xl mb-6">📄</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">导入现有简历</h3>
                  <p className="text-gray-600 mb-6">
                    上传您的简历文件，AI将智能解析并优化内容
                  </p>
                  <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium inline-block">
                    选择此方式
                  </div>
                </div>
              </div>

              {/* 通过对话创建 */}
              <div 
                onClick={() => handleModeSelect('chat')}
                className="bg-gray-50 rounded-2xl p-8 cursor-pointer hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-green-200"
              >
                <div className="text-center">
                  <div className="text-5xl mb-6">🤖</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">通过对话创建简历</h3>
                  <p className="text-gray-600 mb-6">
                    与AI助手对话，逐步收集您的工作经历和技能
                  </p>
                  <div className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium inline-block">
                    选择此方式
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                💡 无需注册即可体验，完整功能需要登录
              </p>
            </div>
          </div>
        ) : (
          /* 展开的功能界面 */
          <div className="max-w-4xl mx-auto">
            {/* 返回选择按钮 */}
            <div className="mb-6">
              <button
                onClick={() => setSelectedMode(null)}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                ← 重新选择采集方式
              </button>
            </div>

            {selectedMode === 'upload' && (
              /* 简历上传解析界面 */
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">📄</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">导入现有简历</h2>
                  <p className="text-gray-600">支持PDF、Word等格式，AI将智能解析您的简历</p>
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
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">🤖</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">通过对话创建简历</h2>
                  <p className="text-gray-600">AI助手将引导您完善简历信息</p>
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