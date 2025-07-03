/**
 * 模板管理组件 - 管理员用
 * 功能：管理简历模板的增删改查
 * 技术栈：React + Tailwind CSS
 * 创建时间：2025-01-03
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 模板管理主组件
 */
const TemplateManagement = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    html_content: '',
    css_content: '',
    thumbnail_url: '',
    is_premium: false,
    status: 'draft',
    description: '',
    category: 'professional',
    sort_order: 0
  });
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  /**
   * 获取模板列表
   */
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/templates/admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
        setTotal(data.data.length);
      } else {
        console.error('获取模板列表失败:', data.message);
        alert('获取模板列表失败: ' + data.message);
      }
    } catch (error) {
      console.error('获取模板列表失败:', error);
      alert('获取模板列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 组件挂载时获取数据
   */
  useEffect(() => {
    fetchTemplates();
  }, []);

  /**
   * 处理表单输入变化
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 打开新增模态框
   */
  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      html_content: '',
      css_content: '',
      thumbnail_url: '',
      is_premium: false,
      status: 'draft',
      description: '',
      category: 'professional',
      sort_order: 0
    });
    setModalVisible(true);
  };

  /**
   * 打开编辑模态框
   */
  const openEditModal = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || '',
      html_content: template.html_content || '',
      css_content: template.css_content || '',
      thumbnail_url: template.thumbnail_url || '',
      is_premium: template.is_premium || false,
      status: template.status || 'draft',
      description: template.description || '',
      category: template.category || 'professional',
      sort_order: template.sort_order || 0
    });
    setModalVisible(true);
  };

  /**
   * 关闭模态框
   */
  const closeModal = () => {
    setModalVisible(false);
    setEditingTemplate(null);
  };

  /**
   * 发布/取消发布模板
   */
  const toggleTemplateStatus = async (templateId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const actionText = newStatus === 'published' ? '发布' : '取消发布';
    
    if (!window.confirm(`确定要${actionText}这个模板吗？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`模板${actionText}成功`);
        fetchTemplates();
      } else {
        alert(`${actionText}失败: ` + (data.message || '未知错误'));
      }
    } catch (error) {
      console.error(`${actionText}模板失败:`, error);
      alert(`${actionText}失败，请稍后重试`);
    }
  };

  /**
   * 保存模板
   */
  const saveTemplate = async () => {
    // 数据验证
    if (!formData.name?.trim()) {
      alert('请输入模板名称');
      return;
    }
    if (!formData.html_content?.trim()) {
      alert('请输入HTML内容');
      return;
    }
    if (!formData.css_content?.trim()) {
      alert('请输入CSS内容');
      return;
    }

    // 数据格式化 - 确保所有字段都有正确的类型和格式
    const templateData = {
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || '',
      html_content: formData.html_content?.trim() || '',
      css_content: formData.css_content?.trim() || '',
      thumbnail_url: formData.thumbnail_url?.trim() || '',
      status: formData.status || 'draft',
      category: formData.category || 'professional',
      is_premium: Boolean(formData.is_premium),
      sort_order: parseInt(formData.sort_order) || 0
    };

    // 如果缩略图URL为空，不发送这个字段
    if (!templateData.thumbnail_url) {
      delete templateData.thumbnail_url;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingTemplate 
        ? `/api/templates/${editingTemplate.id}` 
        : '/api/templates';
      
      const response = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      });

      const data = await response.json();
      if (data.success) {
        alert(editingTemplate ? '模板更新成功' : '模板创建成功');
        closeModal();
        fetchTemplates();
      } else {
        // 更好的错误信息显示
        let errorMessage = '保存失败: ';
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage += data.errors.map(err => typeof err === 'object' ? err.message : err).join(', ');
        } else {
          errorMessage += data.message || '未知错误';
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('保存模板失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  /**
   * 删除模板
   */
  const deleteTemplate = async (templateId) => {
    if (!window.confirm('确定要删除这个模板吗？此操作不可恢复。')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('模板删除成功');
        fetchTemplates();
      } else {
        alert('删除失败: ' + data.message);
      }
    } catch (error) {
      console.error('删除模板失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  /**
   * 生成模板缩略图
   */
  const generateThumbnail = async (template) => {
    try {
      console.log('🖼️ [缩略图生成] 开始为模板生成缩略图:', template.name);
      
      // 简化版缩略图生成：使用SVG生成不同样式的缩略图
      const defaultThumbnails = [
        'data:image/svg+xml;base64,' + btoa(`
          <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f8f9fa"/>
            <rect x="20" y="20" width="160" height="40" fill="#3b82f6"/>
            <rect x="20" y="80" width="100" height="20" fill="#e5e7eb"/>
            <rect x="20" y="110" width="120" height="20" fill="#e5e7eb"/>
            <rect x="20" y="150" width="160" height="30" fill="#f3f4f6"/>
            <rect x="20" y="200" width="140" height="20" fill="#e5e7eb"/>
            <rect x="20" y="230" width="100" height="20" fill="#e5e7eb"/>
            <text x="100" y="45" text-anchor="middle" fill="white" font-family="Arial" font-size="14">${template.name}</text>
          </svg>
        `),
        'data:image/svg+xml;base64,' + btoa(`
          <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#ffffff"/>
            <rect x="20" y="20" width="160" height="60" fill="#10b981"/>
            <rect x="20" y="100" width="80" height="15" fill="#d1d5db"/>
            <rect x="20" y="125" width="120" height="15" fill="#d1d5db"/>
            <rect x="20" y="160" width="160" height="25" fill="#f9fafb"/>
            <rect x="20" y="200" width="140" height="15" fill="#d1d5db"/>
            <rect x="20" y="225" width="100" height="15" fill="#d1d5db"/>
            <text x="100" y="55" text-anchor="middle" fill="white" font-family="Arial" font-size="12">${template.name}</text>
          </svg>
        `),
        'data:image/svg+xml;base64,' + btoa(`
          <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f1f5f9"/>
            <rect x="20" y="20" width="160" height="50" fill="#8b5cf6"/>
            <rect x="20" y="90" width="90" height="18" fill="#e2e8f0"/>
            <rect x="20" y="118" width="130" height="18" fill="#e2e8f0"/>
            <rect x="20" y="156" width="160" height="28" fill="#fafafa"/>
            <rect x="20" y="204" width="150" height="18" fill="#e2e8f0"/>
            <rect x="20" y="232" width="110" height="18" fill="#e2e8f0"/>
            <text x="100" y="50" text-anchor="middle" fill="white" font-family="Arial" font-size="11">${template.name}</text>
          </svg>
        `)
      ];

      // 根据模板ID选择不同的缩略图样式
      const thumbnailUrl = defaultThumbnails[template.id % defaultThumbnails.length];

      // 更新模板的缩略图URL
      const updateResponse = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          thumbnail_url: thumbnailUrl
        })
      });

      if (updateResponse.ok) {
        console.log('✅ [缩略图生成] 缩略图生成并保存成功');
        alert('缩略图生成成功！');
        // 刷新模板列表
        fetchTemplates();
      } else {
        throw new Error('保存缩略图失败');
      }

    } catch (error) {
      console.error('❌ [缩略图生成] 缩略图生成失败:', error);
      alert('缩略图生成失败：' + error.message);
    }
  };

  /**
   * 状态标签样式
   */
  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      published: '已发布',
      draft: '草稿',
      archived: '已归档'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  /**
   * 分页数据
   */
  const paginatedTemplates = templates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">模板管理</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={openAddModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新增模板
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 统计信息 */}
        <div className="mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900">模板总数</h3>
                  <p className="text-sm text-gray-500">
                    总计 {templates.length} 个模板，
                    其中 {templates.filter(t => t.status === 'published').length} 个已发布，
                    {templates.filter(t => t.status === 'draft').length} 个草稿
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 模板列表 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">模板列表</h3>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {/* 表格 */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          模板信息
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          缩略图
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          类型
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          创建时间
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedTemplates.map((template) => (
                        <tr key={template.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {template.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {template.description || '暂无描述'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {template.thumbnail_url ? (
                              <img 
                                src={template.thumbnail_url} 
                                alt={template.name}
                                className="h-12 w-16 object-cover rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="h-12 w-16 bg-gray-200 rounded flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(template.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {template.is_premium && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  付费
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {template.category || 'professional'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(template.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {/* 发布/取消发布按钮 */}
                              <button
                                onClick={() => toggleTemplateStatus(template.id, template.status)}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  template.status === 'published'
                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                                title={template.status === 'published' ? '取消发布' : '发布模板'}
                              >
                                {template.status === 'published' ? '取消发布' : '发布'}
                              </button>
                              
                              {/* 生成缩略图按钮 */}
                              <button
                                onClick={() => generateThumbnail(template)}
                                className="text-blue-600 hover:text-blue-900 text-xs"
                                title="生成缩略图"
                              >
                                缩略图
                              </button>
                              
                              {/* 编辑按钮 */}
                              <button
                                onClick={() => openEditModal(template)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                编辑
                              </button>
                              
                              {/* 删除按钮 */}
                              <button
                                onClick={() => deleteTemplate(template.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 分页 */}
                {templates.length > pageSize && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      显示 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        上一页
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(total / pageSize)))}
                        disabled={currentPage >= Math.ceil(total / pageSize)}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 模态框 */}
      {modalVisible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* 模态框标题 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTemplate ? '编辑模板' : '新增模板'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 表单内容 */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* 模板名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    模板名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="请输入模板名称"
                  />
                </div>

                {/* 模板描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    模板描述
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="请输入模板描述"
                  />
                </div>

                {/* 缩略图URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    缩略图URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="请输入缩略图URL"
                  />
                </div>

                {/* 状态和选项 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 状态 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      状态
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="draft">草稿</option>
                      <option value="published">已发布</option>
                      <option value="archived">已归档</option>
                    </select>
                  </div>

                  {/* 分类 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      分类
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="professional">专业</option>
                      <option value="creative">创意</option>
                      <option value="simple">简洁</option>
                      <option value="modern">现代</option>
                    </select>
                  </div>

                  {/* 是否付费 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      付费模板
                    </label>
                    <div className="flex items-center h-10">
                      <input
                        type="checkbox"
                        checked={formData.is_premium}
                        onChange={(e) => handleInputChange('is_premium', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        是付费模板
                      </label>
                    </div>
                  </div>
                </div>

                {/* 排序 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order || 0}
                    onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="排序值（数字）"
                    min="0"
                  />
                </div>

                {/* HTML内容 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTML内容 *
                  </label>
                  <textarea
                    value={formData.html_content}
                    onChange={(e) => handleInputChange('html_content', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="请输入HTML模板内容"
                  />
                </div>

                {/* CSS内容 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CSS内容 *
                  </label>
                  <textarea
                    value={formData.css_content}
                    onChange={(e) => handleInputChange('css_content', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="请输入CSS样式内容"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  取消
                </button>
                <button
                  onClick={saveTemplate}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  {editingTemplate ? '更新' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement; 