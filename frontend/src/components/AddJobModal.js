/**
 * 新建岗位模态框组件
 * 支持文本输入和文件上传两种方式创建岗位
 */

import React, { useState } from 'react';
import { createJob, uploadJobFile } from '../utils/api';

const AddJobModal = ({ onClose, onSuccess }) => {
  const [currentTab, setCurrentTab] = useState('text'); // 'text' 或 'upload'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 文本输入表单数据（简化版）
  const [textFormData, setTextFormData] = useState({
    title: '',           // 岗位名称
    company: '',         // 公司名字  
    description: '',     // 职位描述
    requirements: ''     // 岗位要求
  });

  // 文件上传表单数据（仅文件，无需用户输入岗位名称和公司）
  const [uploadFormData, setUploadFormData] = useState({
    file: null,
    notes: ''  // 可选备注
  });



  // 处理文本表单输入
  const handleTextInputChange = (field, value) => {
    setTextFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理上传表单输入
  const handleUploadInputChange = (field, value) => {
    setUploadFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setUploadFormData(prev => ({
      ...prev,
      file
    }));
  };

  // 验证文本表单
  const validateTextForm = () => {
    const errors = [];
    if (!textFormData.title.trim()) errors.push('岗位名称不能为空');
    if (!textFormData.company.trim()) errors.push('公司名称不能为空');
    if (!textFormData.description.trim()) errors.push('职位描述不能为空');
    if (!textFormData.requirements.trim()) errors.push('岗位要求不能为空');
    return errors;
  };

  // 验证上传表单
  const validateUploadForm = () => {
    const errors = [];
    if (!uploadFormData.file) errors.push('请选择要上传的文件');
    return errors;
  };

  // 提交文本表单
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    
    // 验证表单
    const validationErrors = validateTextForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('、'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await createJob(textFormData);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || '创建岗位失败');
      }
    } catch (err) {
      console.error('创建岗位失败:', err);
      setError('创建岗位失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 提交上传表单
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    // 验证表单
    const validationErrors = validateUploadForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('、'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFormData.file);
      if (uploadFormData.notes) {
        formData.append('notes', uploadFormData.notes);
      }

      const response = await uploadJobFile(formData);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || '上传岗位文件失败');
      }
    } catch (err) {
      console.error('上传岗位文件失败:', err);
      setError('上传岗位文件失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">新建岗位</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 标签页切换 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setCurrentTab('text')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm ${
              currentTab === 'text'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ✏️ 文本输入
          </button>
          <button
            onClick={() => setCurrentTab('upload')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm ${
              currentTab === 'upload'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📁 文件上传
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
        <div className="p-6">
          {currentTab === 'text' ? (
            // 文本输入表单（简化版）
            <form onSubmit={handleTextSubmit} className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    岗位名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={textFormData.title}
                    onChange={(e) => handleTextInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：前端开发工程师"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    公司名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={textFormData.company}
                    onChange={(e) => handleTextInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：阿里巴巴"
                  />
                </div>
              </div>

              {/* 职位描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  职位描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={textFormData.description}
                  onChange={(e) => handleTextInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请描述岗位的主要职责和工作内容..."
                />
              </div>

              {/* 岗位要求 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  岗位要求 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={textFormData.requirements}
                  onChange={(e) => handleTextInputChange('requirements', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请描述对候选人的技能、经验等要求..."
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-3 pt-4">
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
                  {loading ? '创建中...' : '创建岗位'}
                </button>
              </div>
            </form>
          ) : (
            // 文件上传表单（自动解析岗位信息）
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {/* 文件上传说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      上传岗位相关文件，系统将自动解析岗位名称、公司名称、职位描述和岗位要求等信息。
                    </p>
                  </div>
                </div>
              </div>

              {/* 文件上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  岗位文件 <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>选择文件上传</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="pl-1">或拖拽文件到此处</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      支持 PDF, DOC, DOCX, TXT, JPG, PNG, GIF, WEBP 格式，最大 10MB
                    </p>
                    {uploadFormData.file && (
                      <p className="text-sm text-green-600 mt-2">
                        已选择：{uploadFormData.file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={uploadFormData.notes}
                  onChange={(e) => handleUploadInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="关于这个文件的说明..."
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-3 pt-4">
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
                  {loading ? '上传中...' : '上传岗位'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddJobModal; 