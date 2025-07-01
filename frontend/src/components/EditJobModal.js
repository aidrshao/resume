/**
 * 编辑岗位模态框组件
 * 允许用户编辑现有岗位信息
 */

import React, { useState, useEffect } from 'react';
import { updateJob } from '../utils/api';

const EditJobModal = ({ job, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    salary_range: '',
    location: '',
    job_type: 'full-time',
    status: 'active',
    priority: 3,
    application_deadline: '',
    notes: ''
  });

  // 工作类型选项
  const jobTypeOptions = [
    { value: 'full-time', label: '全职' },
    { value: 'part-time', label: '兼职' },
    { value: 'contract', label: '合同工' },
    { value: 'remote', label: '远程' }
  ];

  // 状态选项
  const statusOptions = [
    { value: 'active', label: '活跃中' },
    { value: 'applied', label: '已投递' },
    { value: 'archived', label: '已归档' }
  ];

  // 优先级选项
  const priorityOptions = [
    { value: 5, label: '非常高 (5)' },
    { value: 4, label: '高 (4)' },
    { value: 3, label: '中等 (3)' },
    { value: 2, label: '低 (2)' },
    { value: 1, label: '很低 (1)' }
  ];

  // 初始化表单数据
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        company: job.company || '',
        description: job.description || '',
        requirements: job.requirements || '',
        salary_range: job.salary_range || '',
        location: job.location || '',
        job_type: job.job_type || 'full-time',
        status: job.status || 'active',
        priority: job.priority || 3,
        application_deadline: job.application_deadline ? 
          new Date(job.application_deadline).toISOString().split('T')[0] : '',
        notes: job.notes || ''
      });
    }
  }, [job]);

  // 处理表单输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 验证表单
  const validateForm = () => {
    const errors = [];
    if (!formData.title.trim()) errors.push('职位名称不能为空');
    if (!formData.company.trim()) errors.push('公司名称不能为空');
    return errors;
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join('、'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await updateJob(job.id, formData);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || '更新岗位失败');
      }
    } catch (err) {
      console.error('更新岗位失败:', err);
      setError('更新岗位失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">编辑岗位</h2>
            <p className="text-sm text-gray-600 mt-1">
              创建于 {formatDate(job?.created_at)} 
              {job?.updated_at !== job?.created_at && (
                <span> • 更新于 {formatDate(job?.updated_at)}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="m-6 bg-red-50 border border-red-200 rounded-md p-4">
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
            </div>
          </div>
        )}

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                职位名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：前端开发工程师"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                公司名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：阿里巴巴"
              />
            </div>
          </div>

          {/* 状态和管理信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作类型</label>
              <select
                value={formData.job_type}
                onChange={(e) => handleInputChange('job_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {jobTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 地点、薪资和截止日期 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作地点</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：北京市朝阳区"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">薪资范围</label>
              <input
                type="text"
                value={formData.salary_range}
                onChange={(e) => handleInputChange('salary_range', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：15K-25K"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申请截止日期</label>
              <input
                type="date"
                value={formData.application_deadline}
                onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 职位描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">职位描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="请描述岗位的主要职责和工作内容..."
            />
          </div>

          {/* 岗位要求 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">岗位要求</label>
            <textarea
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="请描述对候选人的技能、经验等要求..."
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="其他备注信息..."
            />
          </div>

          {/* 来源信息 */}
          {job?.source_type && (
            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">数据来源</h4>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">
                  {job.source_type === 'text' && '✏️ 文本输入'}
                  {job.source_type === 'file' && '📄 文件上传'}
                  {job.source_type === 'image' && '🖼️ 图片上传'}
                </span>
                {job.source_file_path && (
                  <span className="text-blue-600">
                    文件路径：{job.source_file_path.split('/').pop()}
                  </span>
                )}
              </div>
              {job.original_content && (
                <p className="text-xs text-gray-500 mt-2">
                  原始内容：{job.original_content.length > 100 
                    ? job.original_content.substring(0, 100) + '...' 
                    : job.original_content}
                </p>
              )}
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobModal; 