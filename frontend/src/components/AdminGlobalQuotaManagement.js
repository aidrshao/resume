/**
 * 管理员全局配额配置管理组件
 * 用于管理系统级别的配额配置
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminGlobalQuotaManagement = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({
    category: '',
    isActive: 'true'
  });
  const [statistics, setStatistics] = useState(null);

  // 获取配额配置列表
  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/global-quota-configs', {
        headers: { Authorization: `Bearer ${token}` },
        params: filter
      });

      if (response.data.success) {
        setConfigs(response.data.data);
      }
    } catch (error) {
      console.error('获取全局配额配置失败:', error);
      alert('获取配额配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/global-quota-configs/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('获取配额配置统计失败:', error);
    }
  };

  // 更新配额配置
  const handleUpdateConfig = async (configId, updateData) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`/api/admin/global-quota-configs/${configId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('配额配置更新成功');
        await fetchConfigs();
        setEditingConfig(null);
      }
    } catch (error) {
      console.error('更新配额配置失败:', error);
      alert('更新配额配置失败');
    } finally {
      setSaving(false);
    }
  };

  // 批量更新配额配置
  const handleBatchUpdate = async () => {
    const configUpdates = configs
      .filter(config => config.modified)
      .map(config => ({
        id: config.id,
        default_quota: config.default_quota,
        is_active: config.is_active
      }));

    if (configUpdates.length === 0) {
      alert('没有需要更新的配置');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('/api/admin/global-quota-configs/batch-update', {
        configUpdates
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`批量更新了${configUpdates.length}个配额配置`);
        await fetchConfigs();
      }
    } catch (error) {
      console.error('批量更新失败:', error);
      alert('批量更新失败');
    } finally {
      setSaving(false);
    }
  };

  // 标记配置为已修改
  const handleConfigChange = (configId, field, value) => {
    setConfigs(prevConfigs => 
      prevConfigs.map(config => 
        config.id === configId 
          ? { ...config, [field]: value, modified: true }
          : config
      )
    );
  };

  useEffect(() => {
    fetchConfigs();
    fetchStatistics();
  }, [filter]);

  const getResetCycleText = (cycle) => {
    const cycleMap = {
      'daily': '每日',
      'weekly': '每周',
      'monthly': '每月',
      'yearly': '每年',
      'never': '永不重置'
    };
    return cycleMap[cycle] || cycle;
  };

  const getCategoryText = (category) => {
    const categoryMap = {
      'user_registration': '新用户注册',
      'premium_membership': '付费会员',
      'rate_limiting': '频率限制',
      'guest_access': '游客访问'
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载配额配置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">全局配额配置管理</h1>
                <p className="mt-2 text-sm text-gray-600">
                  管理系统级别的配额分配规则，替代硬编码的配额值
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBatchUpdate}
                  disabled={saving || !configs.some(c => c.modified)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '保存中...' : '批量保存'}
                </button>
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          {statistics && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
                  <div className="text-sm text-gray-500">总配置数</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
                  <div className="text-sm text-gray-500">启用配置</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-yellow-600">{statistics.inactive}</div>
                  <div className="text-sm text-gray-500">禁用配置</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">{statistics.categories}</div>
                  <div className="text-sm text-gray-500">配置分类</div>
                </div>
              </div>
            </div>
          )}

          {/* 筛选器 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">分类筛选</label>
                <select
                  id="category"
                  value={filter.category}
                  onChange={(e) => setFilter({...filter, category: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">全部分类</option>
                  <option value="user_registration">新用户注册</option>
                  <option value="premium_membership">付费会员</option>
                  <option value="rate_limiting">频率限制</option>
                  <option value="guest_access">游客访问</option>
                </select>
              </div>
              <div>
                <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">状态筛选</label>
                <select
                  id="isActive"
                  value={filter.isActive}
                  onChange={(e) => setFilter({...filter, isActive: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="true">仅启用</option>
                  <option value="false">仅禁用</option>
                  <option value="">全部状态</option>
                </select>
              </div>
            </div>
          </div>

          {/* 配额配置列表 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配置名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配额类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">默认配额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">重置周期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configs.map((config) => (
                  <tr key={config.id} className={config.modified ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{config.config_name}</div>
                      <div className="text-sm text-gray-500">{config.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {config.quota_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={config.default_quota}
                        onChange={(e) => handleConfigChange(config.id, 'default_quota', parseInt(e.target.value))}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getResetCycleText(config.reset_cycle)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getCategoryText(config.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.is_active}
                          onChange={(e) => handleConfigChange(config.id, 'is_active', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">
                          {config.is_active ? '启用' : '禁用'}
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {config.modified && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          已修改
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {configs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">暂无配额配置数据</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGlobalQuotaManagement; 