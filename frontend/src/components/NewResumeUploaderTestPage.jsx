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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">上传简历</h1>
        <p className="text-center text-gray-600 mb-6">支持 PDF、Word 文档和文本文件，最大 50MB</p>

        <NewResumeUploader onComplete={handleUploadComplete} className="min-h-0" />

        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            返回首页
          </button>
          <button
            onClick={() => navigate('/resumes')}
            className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
          >
            查看我的简历
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewResumeUploaderTestPage; 