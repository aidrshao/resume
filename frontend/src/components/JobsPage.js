/**
 * 岗位管理页面
 * 展示用户的意向岗位列表，支持增删改查，支持生成岗位专属简历
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, deleteJob, batchUpdateJobStatus, getJobStats, getResumes, generateJobSpecificResume } from '../utils/api';
import AddJobModal from './AddJobModal';
import EditJobModal from './EditJobModal';
import JobCard from './JobCard';
import JobFilters from './JobFilters';
import JobStats from './JobStats';
import GenerateResumeModal from './GenerateResumeModal';
import ResumePreviewModal from './ResumePreviewModal';

const JobsPage = () => {
  // 状态管理
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, applied: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedJobs, setSelectedJobs] = useState([]);
  
  // 过滤和搜索状态
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // 生成简历相关状态
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedJobForResume, setSelectedJobForResume] = useState(null);
  const [baseResume, setBaseResume] = useState(null);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 加载岗位列表
  const loadJobs = async (page = 1, newFilters = filters) => {
    console.log('📋 [LOAD_JOBS] 开始加载岗位列表');
    console.log('📋 [LOAD_JOBS] 参数:', { page, newFilters });
    
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...newFilters
      };

      console.log('🌐 [LOAD_JOBS] 调用getJobs API，参数:', params);
      const apiStartTime = Date.now();
      
      const response = await getJobs(params);
      
      const apiEndTime = Date.now();
      const apiDuration = apiEndTime - apiStartTime;
      
      console.log('✅ [LOAD_JOBS] getJobs API调用完成，耗时:', apiDuration + 'ms');
      console.log('📊 [LOAD_JOBS] API响应:', response);
      console.log('🔍 [LOAD_JOBS] response.success:', response.success);
      
      if (response && response.success) {
        console.log('📋 [LOAD_JOBS] 设置岗位数据，数量:', response.data?.jobs?.length || 0);
        console.log('📋 [LOAD_JOBS] 分页信息:', response.data?.pagination);
        
        setJobs(response.data.jobs);
        setCurrentPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.totalPages);
        
        console.log('✅ [LOAD_JOBS] 岗位列表加载成功');
      } else {
        const errorMessage = response?.message || '获取岗位列表失败';
        console.log('❌ [LOAD_JOBS] 岗位列表加载失败:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('💥 [LOAD_JOBS] 加载岗位列表异常:', err);
      setError('加载岗位列表失败');
    } finally {
      setLoading(false);
      console.log('🏁 [LOAD_JOBS] 岗位列表加载流程结束');
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    console.log('📊 [LOAD_STATS] 开始加载统计数据');
    
    try {
      console.log('🌐 [LOAD_STATS] 调用getJobStats API');
      const apiStartTime = Date.now();
      
      const response = await getJobStats();
      
      const apiEndTime = Date.now();
      const apiDuration = apiEndTime - apiStartTime;
      
      console.log('✅ [LOAD_STATS] getJobStats API调用完成，耗时:', apiDuration + 'ms');
      console.log('📊 [LOAD_STATS] API响应:', response);
      console.log('🔍 [LOAD_STATS] response.success:', response.success);
      
      if (response && response.success) {
        console.log('📊 [LOAD_STATS] 设置统计数据:', response.data);
        setStats(response.data);
        console.log('✅ [LOAD_STATS] 统计数据加载成功');
      } else {
        console.log('❌ [LOAD_STATS] 统计数据加载失败:', response?.message);
      }
    } catch (err) {
      console.error('💥 [LOAD_STATS] 加载统计数据异常:', err);
    }
    
    console.log('🏁 [LOAD_STATS] 统计数据加载流程结束');
  };

  // 获取基础简历
  const loadBaseResume = async () => {
    try {
      const response = await getResumes();
      if (response.success) {
        const baseResumeData = response.data.find(resume => resume.is_base);
        setBaseResume(baseResumeData);
        return baseResumeData;
      }
    } catch (err) {
      console.error('获取基础简历失败:', err);
      return null;
    }
  };

  // 处理生成简历点击
  const handleGenerateResume = async (job) => {
    // 先检查是否有基础简历
    const baseResumeData = await loadBaseResume();
    if (!baseResumeData) {
      alert('请先创建基础简历后再生成岗位专属简历');
      return;
    }

    setSelectedJobForResume(job);
    setShowGenerateModal(true);
  };

  // 确认生成简历
  const handleConfirmGenerate = async (job, userRequirements) => {
    if (!baseResume) {
      setError('未找到基础简历');
      return;
    }

    try {
      setIsGenerating(true);
      
      const response = await generateJobSpecificResume({
        baseResumeId: baseResume.id,
        targetCompany: job.company,
        targetPosition: job.title,
        userRequirements: userRequirements || ''
      });

      if (response.success) {
        // 关闭生成确认弹窗
        setShowGenerateModal(false);
        
        // 设置生成的简历并显示预览
        setGeneratedResume(response.data);
        setShowPreviewModal(true);
      } else {
        setError(response.message || '生成简历失败');
      }
    } catch (err) {
      console.error('生成简历失败:', err);
      setError('生成简历失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存生成的简历
  const handleSaveResume = async (resume) => {
    try {
      setIsSaving(true);
      // 简历已经在后端生成并保存，这里只需要关闭预览弹窗
      setShowPreviewModal(false);
      setGeneratedResume(null);
      setSelectedJobForResume(null);
      
      // 可以显示成功消息
      alert('简历已成功保存！您可以在简历管理页面查看。');
    } catch (err) {
      console.error('保存简历失败:', err);
      setError('保存简历失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 重新生成简历
  const handleRegenerateResume = () => {
    setShowPreviewModal(false);
    setGeneratedResume(null);
    setShowGenerateModal(true);
  };

  // 初始化数据
  useEffect(() => {
    loadJobs();
    loadStats();
  }, []);

  // 处理过滤条件变化
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    loadJobs(1, newFilters);
  };

  // 处理分页
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadJobs(page);
  };

  // 处理岗位删除
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('确定要删除这个岗位吗？')) {
      return;
    }

    try {
      const response = await deleteJob(jobId);
      if (response.success) {
        // 刷新列表
        loadJobs(currentPage);
        loadStats();
        
        // 取消选中
        setSelectedJobs(prev => prev.filter(id => id !== jobId));
      } else {
        setError(response.message || '删除岗位失败');
      }
    } catch (err) {
      console.error('删除岗位失败:', err);
      setError('删除岗位失败');
    }
  };

  // 处理岗位编辑
  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowEditModal(true);
  };

  // 处理批量操作
  const handleBatchStatusUpdate = async (status) => {
    if (selectedJobs.length === 0) {
      alert('请先选择要操作的岗位');
      return;
    }

    try {
      const response = await batchUpdateJobStatus(selectedJobs, status);
      if (response.success) {
        // 刷新列表
        loadJobs(currentPage);
        loadStats();
        
        // 清空选中状态
        setSelectedJobs([]);
      } else {
        setError(response.message || '批量更新失败');
      }
    } catch (err) {
      console.error('批量更新失败:', err);
      setError('批量更新失败');
    }
  };

  // 处理岗位选择
  const handleJobSelect = (jobId, isSelected) => {
    if (isSelected) {
      setSelectedJobs(prev => [...prev, jobId]);
    } else {
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
    }
  };

  // 全选/取消全选
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedJobs(jobs.map(job => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  // 渲染分页组件
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 上一页
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          上一页
        </button>
      );
    }

    // 页码
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // 下一页
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          下一页
        </button>
      );
    }

    return (
      <div className="flex justify-center space-x-1 mt-8">
        {pages}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">意向岗位管理</h1>
              <p className="mt-1 text-sm text-gray-500">管理您的意向岗位，为定制简历做准备</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/resumes"
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                简历管理
              </Link>
              <Link
                to="/ai-chat"
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                AI问答创建
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* 统计信息 */}
      <JobStats stats={stats} />

      {/* 操作区域 */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        {/* 左侧：新建按钮和批量操作 */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建岗位
          </button>

          {selectedJobs.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                已选择 {selectedJobs.length} 个岗位
              </span>
              <button
                onClick={() => handleBatchStatusUpdate('applied')}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                标记为已投递
              </button>
              <button
                onClick={() => handleBatchStatusUpdate('archived')}
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                归档
              </button>
            </div>
          )}
        </div>

        {/* 右侧：过滤和搜索 */}
        <JobFilters filters={filters} onFiltersChange={handleFiltersChange} />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 岗位列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      ) : jobs.length > 0 ? (
        <>
          {/* 全选选项 */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="selectAll"
              checked={jobs.length > 0 && selectedJobs.length === jobs.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="selectAll" className="ml-2 text-sm text-gray-600">
              全选
            </label>
          </div>

          {/* 岗位卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={selectedJobs.includes(job.id)}
                onSelect={(isSelected) => handleJobSelect(job.id, isSelected)}
                onEdit={() => handleEditJob(job)}
                onDelete={() => handleDeleteJob(job.id)}
                onGenerateResume={() => handleGenerateResume(job)}
              />
            ))}
          </div>

          {/* 分页 */}
          {renderPagination()}
        </>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无岗位</h3>
          <p className="mt-1 text-sm text-gray-500">开始创建您的第一个意向岗位吧</p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              新建岗位
            </button>
          </div>
        </div>
      )}

      {/* 新建岗位模态框 */}
      {showAddModal && (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            console.log('🎉 [JOBS_PAGE] AddJobModal onSuccess回调被调用');
            console.log('🔄 [JOBS_PAGE] 开始执行成功后的操作...');
            
            console.log('🚪 [JOBS_PAGE] 关闭添加岗位模态框');
            setShowAddModal(false);
            
            console.log('📋 [JOBS_PAGE] 重新加载岗位列表，当前页:', currentPage);
            loadJobs(currentPage);
            
            console.log('📊 [JOBS_PAGE] 重新加载统计信息');
            loadStats();
            
            console.log('✅ [JOBS_PAGE] onSuccess回调执行完成');
          }}
        />
      )}

      {/* 编辑岗位模态框 */}
      {showEditModal && editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => {
            setShowEditModal(false);
            setEditingJob(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingJob(null);
            loadJobs(currentPage);
            loadStats();
          }}
        />
      )}

      {/* 生成简历确认模态框 */}
      {showGenerateModal && selectedJobForResume && (
        <GenerateResumeModal
          isOpen={showGenerateModal}
          onClose={() => {
            setShowGenerateModal(false);
            setSelectedJobForResume(null);
          }}
          job={selectedJobForResume}
          onConfirm={handleConfirmGenerate}
          isGenerating={isGenerating}
        />
      )}

      {/* 简历预览模态框 */}
      {showPreviewModal && generatedResume && selectedJobForResume && (
        <ResumePreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setGeneratedResume(null);
            setSelectedJobForResume(null);
          }}
          resume={generatedResume}
          job={selectedJobForResume}
          onSave={handleSaveResume}
          onRegenerate={handleRegenerateResume}
          isSaving={isSaving}
        />
      )}
      </div>
    </div>
  );
};

export default JobsPage; 