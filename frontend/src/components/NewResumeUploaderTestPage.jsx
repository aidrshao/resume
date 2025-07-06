/**
 * 新版简历上传组件测试页面
 * 用于测试和展示V2版本的上传功能
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewResumeUploader from './NewResumeUploader';

const NewResumeUploaderTestPage = () => {
  const navigate = useNavigate();

  /**
   * 处理上传完成后的回调
   * @param {string} taskId - 任务ID
   */
  const handleUploadComplete = (taskId) => {
    console.log('🎉 [TEST_PAGE] 上传完成，任务ID:', taskId);
    // 🔧 修复：添加跳转到审核页面的逻辑
    console.log('🚀 [TEST_PAGE] 正在跳转到审核页面...');
    navigate(`/resumes/v2/review/${taskId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            V2版本简历上传测试
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            全新的异步解析引擎，支持PDF、Word文档和文本文件
          </p>
          
          {/* 功能特性介绍 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🚀 新功能特性
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>文件拖拽上传</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>实时状态轮询</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>AI智能解析</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>支持多种格式</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>异步队列处理</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>自动跳转审核</span>
              </div>
            </div>
          </div>
        </div>

        {/* 新版上传组件 */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <NewResumeUploader 
            onComplete={handleUploadComplete}
            className="max-w-2xl mx-auto"
          />
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            💡 使用说明
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>1. 支持的文件格式：PDF (.pdf)、Word文档 (.docx/.doc)、文本文件 (.txt)</p>
            <p>2. 文件大小限制：最大 50MB</p>
            <p>3. 上传方式：可以直接拖拽文件到上传区域，或点击"选择文件"按钮</p>
            <p>4. 处理流程：文件上传 → AI解析 → 数据转换 → 完成后自动跳转</p>
            <p>5. 实时状态：整个过程中会显示实时的处理进度和状态信息</p>
          </div>
        </div>

        {/* 技术说明 */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔧 技术特性
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">前端技术</h4>
              <ul className="space-y-1">
                <li>• React Hooks状态管理</li>
                <li>• 文件拖拽API</li>
                <li>• 实时轮询机制</li>
                <li>• Tailwind CSS样式</li>
                <li>• 响应式设计</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">后端技术</h4>
              <ul className="space-y-1">
                <li>• 异步任务队列</li>
                <li>• Redis缓存存储</li>
                <li>• AI模型集成</li>
                <li>• 多格式文件解析</li>
                <li>• 统一数据格式</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 导航按钮 */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            返回首页
          </button>
          <button
            onClick={() => navigate('/resumes')}
            className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            查看我的简历
          </button>
        </div>

        {/* 开发者信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">🚧 开发者信息</h4>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>• 当前环境：开发模式</p>
              <p>• API端点：/api/v2/resumes/parse</p>
              <p>• 轮询间隔：2.5秒</p>
              <p>• 任务ID会在处理完成后显示在页面底部</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewResumeUploaderTestPage; 