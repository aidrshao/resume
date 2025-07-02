/**
 * 管理员AI提示词管理组件
 * 管理系统的AI提示词模板和配置
 */

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentTextIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlayIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AdminAIPromptManagement = () => {
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 筛选和分页状态
  const [filters, setFilters] = useState({
    category: '',
    isActive: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });
  
  // 模态框状态
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create', 'edit', 'view', 'test'
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    prompt_template: '',
    description: '',
    category: 'general',
    model_type: 'gpt',
    model_config: {
      temperature: 0.7,
      max_tokens: 4000,
      timeout: 120000
    },
    variables: {},
    is_active: true
  });
  
  // 测试渲染状态
  const [testData, setTestData] = useState({
    template: '',
    variables: {}
  });
  const [testResult, setTestResult] = useState('');
  
  // 批量操作状态
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBatchMenu, setShowBatchMenu] = useState(false);

  // 获取管理员token
  const getAdminToken = () => {
    return localStorage.getItem('adminToken');
  };

  // API请求封装
  const apiRequest = async (url, options = {}) => {
    const token = getAdminToken();
    const response = await fetch(`/api/admin${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  };

  // 加载提示词列表
  const loadPrompts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.category && { category: filters.category }),
        ...(filters.isActive !== '' && { isActive: filters.isActive })
      });

      const response = await apiRequest(`/ai-prompts?${queryParams}`);
      
      setPrompts(response.data.prompts || []);
      setStats(response.data.stats || {});
      setPagination(prev => ({
        ...prev,
        total: response.data.stats?.total || 0
      }));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const response = await apiRequest('/ai-prompts/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadPrompts();
    loadCategories();
  }, [pagination.page, pagination.limit, filters]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      prompt_template: '',
      description: '',
      category: 'general',
      model_type: 'gpt',
      model_config: {
        temperature: 0.7,
        max_tokens: 4000,
        timeout: 120000
      },
      variables: {},
      is_active: true
    });
  };

  // 打开模态框
  const openModal = (type, prompt = null) => {
    setModalType(type);
    setSelectedPrompt(prompt);
    
    if (type === 'create') {
      resetForm();
    } else if (type === 'edit' && prompt) {
      setFormData({
        name: prompt.name || '',
        key: prompt.key || '',
        prompt_template: prompt.prompt_template || '',
        description: prompt.description || '',
        category: prompt.category || 'general',
        model_type: prompt.model_type || 'gpt',
        model_config: prompt.model_config || {
          temperature: 0.7,
          max_tokens: 4000,
          timeout: 120000
        },
        variables: prompt.variables || {},
        is_active: prompt.is_active !== undefined ? prompt.is_active : true
      });
    } else if (type === 'test' && prompt) {
      setTestData({
        template: prompt.prompt_template || '',
        variables: prompt.variables || {}
      });
      setTestResult('');
    }
    
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedPrompt(null);
    setError('');
    setSuccess('');
    setTestResult('');
  };

  // 保存提示词
  const savePrompt = async () => {
    try {
      setLoading(true);
      
      if (modalType === 'create') {
        await apiRequest('/ai-prompts', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setSuccess('创建提示词成功');
      } else if (modalType === 'edit') {
        await apiRequest(`/ai-prompts/${selectedPrompt.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setSuccess('更新提示词成功');
      }
      
      await loadPrompts();
      closeModal();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 删除提示词
  const deletePrompt = async (id) => {
    if (!window.confirm('确定要删除这个提示词吗？')) {
      return;
    }
    
    try {
      setLoading(true);
      await apiRequest(`/ai-prompts/${id}`, {
        method: 'DELETE'
      });
      setSuccess('删除提示词成功');
      await loadPrompts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 测试渲染
  const testRender = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/ai-prompts/test-render', {
        method: 'POST',
        body: JSON.stringify(testData)
      });
      setTestResult(response.data.rendered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 批量操作
  const batchOperation = async (operation) => {
    if (selectedIds.length === 0) {
      setError('请选择要操作的项目');
      return;
    }
    
    if (!window.confirm(`确定要${operation}选中的${selectedIds.length}个提示词吗？`)) {
      return;
    }
    
    try {
      setLoading(true);
      await apiRequest('/ai-prompts/batch', {
        method: 'POST',
        body: JSON.stringify({
          operation,
          ids: selectedIds
        })
      });
      setSuccess(`批量${operation}操作成功`);
      setSelectedIds([]);
      setShowBatchMenu(false);
      await loadPrompts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理表单变化
  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // 渲染统计卡片
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">总提示词</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <CheckIcon className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">已启用</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.active || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <XMarkIcon className="h-8 w-8 text-red-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">已禁用</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.inactive || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <CogIcon className="h-8 w-8 text-purple-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">分类数量</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.categories?.length || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染筛选器
  const renderFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部分类</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select
            value={filters.isActive}
            onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="true">已启用</option>
            <option value="false">已禁用</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="搜索名称或标识..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-end">
          <button
            onClick={() => openModal('create')}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            新建提示词
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染提示词表格
  const renderPromptTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">提示词列表</h3>
        
        {selectedIds.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowBatchMenu(!showBatchMenu)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
            >
              批量操作 ({selectedIds.length})
              {showBatchMenu ? <ChevronUpIcon className="h-4 w-4 ml-2" /> : <ChevronDownIcon className="h-4 w-4 ml-2" />}
            </button>
            
            {showBatchMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <button
                  onClick={() => batchOperation('activate')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  批量启用
                </button>
                <button
                  onClick={() => batchOperation('deactivate')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  批量禁用
                </button>
                <button
                  onClick={() => batchOperation('delete')}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  批量删除
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedIds.length === prompts.length && prompts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(prompts.map(p => p.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标识
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分类
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                模型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                更新时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prompts.map((prompt) => (
              <tr key={prompt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(prompt.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(prev => [...prev, prompt.id]);
                      } else {
                        setSelectedIds(prev => prev.filter(id => id !== prompt.id));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{prompt.name}</div>
                  <div className="text-sm text-gray-500">{prompt.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{prompt.key}</code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {prompt.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prompt.model_type === 'gpt' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {prompt.model_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prompt.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {prompt.is_active ? '已启用' : '已禁用'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(prompt.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal('view', prompt)}
                      className="text-blue-600 hover:text-blue-900"
                      title="查看"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openModal('test', prompt)}
                      className="text-green-600 hover:text-green-900"
                      title="测试"
                    >
                      <PlayIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openModal('edit', prompt)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="编辑"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePrompt(prompt.id)}
                      className="text-red-600 hover:text-red-900"
                      title="删除"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {prompts.length === 0 && !loading && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无提示词</h3>
          <p className="mt-1 text-sm text-gray-500">开始创建第一个AI提示词模板</p>
        </div>
      )}
    </div>
  );

  // 渲染模态框
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {modalType === 'create' && '创建提示词'}
              {modalType === 'edit' && '编辑提示词'}
              {modalType === 'view' && '查看提示词'}
              {modalType === 'test' && '测试提示词'}
            </h3>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {(modalType === 'create' || modalType === 'edit') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入提示词名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标识 *</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => handleFormChange('key', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入唯一标识，如：resume_optimization"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">通用</option>
                    <option value="resume">简历</option>
                    <option value="chat">对话</option>
                    <option value="analysis">分析</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模型类型</label>
                  <select
                    value={formData.model_type}
                    onChange={(e) => handleFormChange('model_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gpt">GPT-4o</option>
                    <option value="deepseek">DeepSeek</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={formData.is_active}
                    onChange={(e) => handleFormChange('is_active', e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">启用</option>
                    <option value="false">禁用</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入提示词描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">提示词模板 *</label>
                <textarea
                  value={formData.prompt_template}
                  onChange={(e) => handleFormChange('prompt_template', e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="输入提示词模板内容，使用 ${variableName} 定义变量"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.model_config.temperature}
                    onChange={(e) => handleFormChange('model_config.temperature', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    min="100"
                    max="8000"
                    value={formData.model_config.max_tokens}
                    onChange={(e) => handleFormChange('model_config.max_tokens', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
                  <input
                    type="number"
                    min="30000"
                    max="300000"
                    value={formData.model_config.timeout}
                    onChange={(e) => handleFormChange('model_config.timeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={savePrompt}
                  disabled={loading || !formData.name || !formData.key || !formData.prompt_template}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}

          {modalType === 'view' && selectedPrompt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <p className="text-sm text-gray-900">{selectedPrompt.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标识</label>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedPrompt.key}</code>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <p className="text-sm text-gray-900">{selectedPrompt.description || '无描述'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">提示词模板</label>
                <pre className="text-sm bg-gray-50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
                  {selectedPrompt.prompt_template}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模型配置</label>
                  <pre className="text-sm bg-gray-50 p-3 rounded-md">
                    {JSON.stringify(selectedPrompt.model_config, null, 2)}
                  </pre>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">变量定义</label>
                  <pre className="text-sm bg-gray-50 p-3 rounded-md">
                    {JSON.stringify(selectedPrompt.variables, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {modalType === 'test' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板内容</label>
                <textarea
                  value={testData.template}
                  onChange={(e) => setTestData(prev => ({ ...prev, template: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">测试变量 (JSON格式)</label>
                <textarea
                  value={JSON.stringify(testData.variables, null, 2)}
                  onChange={(e) => {
                    try {
                      const variables = JSON.parse(e.target.value);
                      setTestData(prev => ({ ...prev, variables }));
                    } catch (err) {
                      // 忽略JSON解析错误，用户输入过程中可能不完整
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder='{"targetCompany": "某科技公司", "targetPosition": "产品经理"}'
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={testRender}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? '渲染中...' : '测试渲染'}
                </button>
              </div>

              {testResult && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">渲染结果</label>
                  <pre className="text-sm bg-gray-50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap border">
                    {testResult}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI提示词管理</h1>
        <p className="mt-1 text-sm text-gray-600">
          管理系统的AI提示词模板和配置参数
        </p>
      </div>

      {/* 错误和成功提示 */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 筛选器 */}
      {renderFilters()}

      {/* 提示词表格 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      ) : (
        renderPromptTable()
      )}

      {/* 分页 */}
      {pagination.total > pagination.limit && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            显示 {((pagination.page - 1) * pagination.limit) + 1} 到{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} 项，
            共 {pagination.total} 项
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page * pagination.limit >= pagination.total}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 模态框 */}
      {renderModal()}
    </div>
  );
};

export default AdminAIPromptManagement; 