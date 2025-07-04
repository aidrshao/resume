/**
 * 专属简历预览页面组件
 * 负责管理专属简历的数据获取、状态管理和页面布局
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomizedResumeById } from '../utils/api';
import ResumeDisplay from './ResumeDisplay';
import ControlPanel from './ControlPanel';

const ResumePreviewPage = () => {
  const { id } = useParams(); // 从URL中获取customizedResumeId
  const navigate = useNavigate();

  // 核心状态管理
  const [resumeData, setResumeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 数据获取逻辑
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 调用API获取专属简历数据
        const response = await getCustomizedResumeById(id);
        
        if (response.success) {
          setResumeData(response.data);
        } else {
          setError(response.message || '获取简历数据失败');
        }
      } catch (err) {
        console.error('获取专属简历数据失败:', err);
        setError(err.message || '网络错误，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    // 确保ID存在才执行数据获取
    if (id) {
      fetchResumeData();
    } else {
      setError('缺少简历ID参数');
      setIsLoading(false);
    }
  }, [id]);

  // 返回上一页的处理函数
  const handleGoBack = () => {
    navigate(-1);
  };

  // 加载状态渲染
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载专属简历...</p>
        </div>
      </div>
    );
  }

  // 错误状态渲染
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold text-lg mb-2">加载失败</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={handleGoBack}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  // 主要内容渲染
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </button>
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                专属简历预览
              </h1>
              {resumeData && (
                <p className="text-sm text-gray-500 mt-1">
                  {resumeData.jobTitle} - {resumeData.companyName}
                </p>
              )}
            </div>
            <div className="w-20"></div> {/* 占位符，保持居中 */}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 主预览区 - 约70%宽度 */}
          <div className="flex-1 lg:w-3/5">
            <ResumeDisplay data={resumeData?.optimizedContent} />
          </div>

          {/* 右侧控制栏 - 约30%宽度 */}
          <div className="w-full lg:w-2/5 lg:max-w-sm">
            <ControlPanel 
              report={resumeData?.optimizationReport}
              resumeData={resumeData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreviewPage;