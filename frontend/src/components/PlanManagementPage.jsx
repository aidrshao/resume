import React, { useEffect, useState } from 'react';

/**
 * PlanManagementPage (重构版)
 * ---------------------------
 * 管理员套餐管理界面 - 支持预定义权益配置
 * - 展示套餐列表
 * - 新增 / 编辑套餐（使用权益字典）
 * - 设为默认
 */

const PlanManagementPage = () => {
  const [plans, setPlans] = useState([]);
  const [featuresDictionary, setFeaturesDictionary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const token = localStorage.getItem('adminToken');

  // 获取套餐列表
  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const normalized = (data.data || []).map(p => ({
          ...p,
          features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
        }));
        setPlans(normalized);
      } else {
        alert(data.message || '获取套餐失败');
      }
    } catch (err) {
      console.error(err);
      alert('获取套餐失败');
    }
  };

  // 获取权益字典
  const fetchFeaturesDictionary = async () => {
    try {
      const res = await fetch('/api/admin/features', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFeaturesDictionary(data.data || []);
      } else {
        console.error('获取权益字典失败:', data.message);
      }
    } catch (err) {
      console.error('获取权益字典失败:', err);
    }
  };

  // 初始化数据
  const initializeData = async () => {
    setLoading(true);
    await Promise.all([fetchPlans(), fetchFeaturesDictionary()]);
    setLoading(false);
  };

  useEffect(() => {
    initializeData();
    // eslint-disable-next-line
  }, []);

  const openModal = (plan = null) => {
    if (plan && typeof plan.features === 'string') {
      plan = { ...plan, features: JSON.parse(plan.features) };
    }
    setEditingPlan(plan);
    setModalVisible(true);
  };

  const savePlan = async (plan) => {
    const method = plan.id ? 'PUT' : 'POST';
    const url = plan.id ? `/api/admin/plans/${plan.id}` : '/api/admin/plans';
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(plan)
      });
      const data = await res.json();
      if (data.success) {
        setModalVisible(false);
        fetchPlans();
      } else {
        alert(data.message || '保存失败');
      }
    } catch (err) {
      console.error(err);
      alert('保存失败');
    }
  };

  const setDefault = async (id) => {
    try {
      const res = await fetch(`/api/admin/plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_default: true })
      });
      const data = await res.json();
      if (data.success) {
        fetchPlans();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (err) {
      console.error(err);
      alert('操作失败');
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm(`确定要删除此套餐吗 (ID: ${id})？相关用户的套餐关联将被置空，此操作不可恢复。`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchPlans(); // Refresh the list
      } else {
        alert(data.message || '删除失败');
      }
    } catch (err) {
      console.error(err);
      alert('删除失败');
    }
  };

  // 格式化权益显示
  const formatFeatures = (features) => {
    if (!features || typeof features !== 'object') return '无';
    
    return Object.entries(features).map(([key, value]) => {
      const featureInfo = featuresDictionary.find(f => f.key === key);
      const displayName = featureInfo ? featureInfo.name : key;
      
      let displayValue = value;
      if (featureInfo?.type === 'boolean') {
        displayValue = value ? '✅' : '❌';
      } else if (featureInfo?.type === 'enum') {
        displayValue = value;
      }
      
      return `${displayName}: ${displayValue}`;
    }).join('\\n');
  };

  // 套餐编辑模态框
  const PlanModal = () => {
    const [form, setForm] = useState(
      editingPlan || { 
        name: '', 
        price: 0, 
        duration_days: 30, 
        features: {}, 
        status: 'active', 
        is_default: false, 
        sort_order: 0 
      }
    );

    const updateField = (field, value) => setForm({ ...form, [field]: value });

    // 添加权益
    const addFeature = (featureKey) => {
      if (!featureKey || form.features[featureKey] !== undefined) return;
      
      const featureInfo = featuresDictionary.find(f => f.key === featureKey);
      let defaultValue = '';
      
      if (featureInfo?.type === 'numeric') {
        defaultValue = 0;
      } else if (featureInfo?.type === 'boolean') {
        defaultValue = false;
      } else if (featureInfo?.type === 'enum') {
        defaultValue = featureInfo.options?.[0] || '';
      }
      
      setForm({
        ...form,
        features: { ...form.features, [featureKey]: defaultValue }
      });
    };

    // 更新权益值
    const updateFeatureValue = (key, value) => {
      setForm({
        ...form,
        features: { ...form.features, [key]: value }
      });
    };

    // 删除权益
    const removeFeature = (key) => {
      const newFeatures = { ...form.features };
      delete newFeatures[key];
      setForm({ ...form, features: newFeatures });
    };

    // 渲染权益输入控件
    const renderFeatureInput = (featureKey, value) => {
      const featureInfo = featuresDictionary.find(f => f.key === featureKey);
      if (!featureInfo) return null;

      switch (featureInfo.type) {
        case 'numeric':
          return (
            <input
              type="number"
              min="0"
              className="border p-2 w-32"
              value={value}
              onChange={e => updateFeatureValue(featureKey, parseInt(e.target.value) || 0)}
            />
          );
        
        case 'boolean':
          return (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!value}
                onChange={e => updateFeatureValue(featureKey, e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">{value ? '启用' : '禁用'}</span>
            </label>
          );
        
        case 'enum':
          return (
            <select
              value={value}
              onChange={e => updateFeatureValue(featureKey, e.target.value)}
              className="border p-2 w-32"
            >
              {featureInfo.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        
        default:
          return (
            <input
              type="text"
              className="border p-2 w-32"
              value={value}
              onChange={e => updateFeatureValue(featureKey, e.target.value)}
            />
          );
      }
    };

    // 可添加的权益选项（排除已添加的）
    const availableFeatures = featuresDictionary.filter(
      f => !Object.hasOwnProperty.call(form.features, f.key)
    );

    return (
      <Modal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        title={form.id ? '编辑套餐' : '新增套餐'}
      >
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">套餐名称</span>
              <input 
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" 
                placeholder="如：新用户免费套餐" 
                value={form.name} 
                onChange={e => updateField('name', e.target.value)} 
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">价格 (元)</span>
                <input 
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" 
                  type="number" 
                  min="0" 
                  placeholder="0" 
                  value={form.price} 
                  onChange={e => updateField('price', parseFloat(e.target.value) || 0)} 
                />
                <span className="text-xs text-gray-500">0 代表免费</span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">时长天数</span>
                <input 
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" 
                  type="number" 
                  min="0" 
                  placeholder="30" 
                  value={form.duration_days} 
                  onChange={e => updateField('duration_days', parseInt(e.target.value) || 0)} 
                />
                <span className="text-xs text-gray-500">30=月度, 365=年度, 99999=终生</span>
              </label>
            </div>
          </div>

          {/* 权益配置 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">权益配置</h3>
              {availableFeatures.length > 0 && (
                <select
                  onChange={e => {
                    if (e.target.value) {
                      addFeature(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="">+ 添加权益</option>
                  {availableFeatures.map(feature => (
                    <option key={feature.key} value={feature.key}>
                      {feature.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-3">
              {Object.entries(form.features).map(([key, value]) => {
                const featureInfo = featuresDictionary.find(f => f.key === key);
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {featureInfo ? featureInfo.name : key}
                      </div>
                      {featureInfo?.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {featureInfo.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {renderFeatureInput(key, value)}
                      <button
                        type="button"
                        onClick={() => removeFeature(key)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(form.features).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无权益配置，点击上方"添加权益"开始配置
                </div>
              )}
            </div>
          </div>

          {/* 其他设置 */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={form.is_default} 
                onChange={e => updateField('is_default', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">设为默认套餐</span>
            </label>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModalVisible(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => savePlan(form)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              保存套餐
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">套餐管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理系统套餐和权益配置</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          新增套餐
        </button>
      </div>

      {/* 套餐列表 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                套餐信息
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                价格/时长
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                权益配置
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map(plan => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {plan.name}
                        {plan.is_default && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            默认
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">ID: {plan.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">￥{plan.price}</div>
                  <div className="text-sm text-gray-500">{plan.duration_days} 天</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs">
                    <pre className="whitespace-pre-wrap text-xs">
                      {formatFeatures(plan.features)}
                    </pre>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    plan.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.status === 'active' ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-4">
                    <button 
                      onClick={() => openModal(plan)} 
                      className="text-blue-600 hover:text-blue-900"
                    >
                      编辑
                    </button>
                    {!plan.is_default && (
                      <button 
                        onClick={() => setDefault(plan.id)} 
                        className="text-orange-600 hover:text-orange-900"
                      >
                        设为默认
                      </button>
                    )}
                    {!plan.is_default && (
                      <button 
                        onClick={() => deletePlan(plan.id)} 
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {plans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无套餐数据</p>
          </div>
        )}
      </div>

      {/* 模态框 */}
      {modalVisible && <PlanModal />}
    </div>
  );
};

export default PlanManagementPage;

/* 简易 Modal 组件 */
const Modal = ({ visible, onClose, title, children }) => {
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
}; 