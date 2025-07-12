import React, { useEffect, useState } from 'react';

/**
 * TopUpPackManagementPage
 * -----------------------
 * 管理员 "加油包" 管理界面
 * - 复用权益字典逻辑，配置加油包内含的永久配额
 */

const TopUpPackManagementPage = () => {
  const [packs, setPacks] = useState([]);
  const [featuresDictionary, setFeaturesDictionary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  
  const token = localStorage.getItem('adminToken');

  const fetchPacks = async () => {
    try {
      const res = await fetch('/api/admin/top-up-packs', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setPacks(data.data || []);
      } else {
        alert(data.message || '获取加油包失败');
      }
    } catch (err) {
      alert('获取加油包失败');
    }
  };

  const fetchFeaturesDictionary = async () => {
    try {
      const res = await fetch('/api/admin/features', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setFeaturesDictionary(data.data || []);
      }
    } catch (err) {
      console.error('获取权益字典失败:', err);
    }
  };

  const initializeData = async () => {
    setLoading(true);
    await Promise.all([fetchPacks(), fetchFeaturesDictionary()]);
    setLoading(false);
  };

  useEffect(() => {
    initializeData();
    // eslint-disable-next-line
  }, []);

  const openModal = (pack = null) => {
    setEditingPack(pack);
    setModalVisible(true);
  };

  const savePack = async (pack) => {
    const method = pack.id ? 'PUT' : 'POST';
    const url = pack.id ? `/api/admin/top-up-packs/${pack.id}` : '/api/admin/top-up-packs';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(pack)
      });
      const data = await res.json();
      if (data.success) {
        setModalVisible(false);
        fetchPacks();
      } else {
        alert(data.message || '保存失败');
      }
    } catch (err) {
      alert('保存失败');
    }
  };

  const deletePack = async (id) => {
    if (!window.confirm(`确定要删除此加油包吗 (ID: ${id})？此操作不可恢复。`)) return;
    try {
      const res = await fetch(`/api/admin/top-up-packs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) fetchPacks();
      else alert(data.message || '删除失败');
    } catch (err) {
      alert('删除失败');
    }
  };

  const formatFeatures = (features) => {
    return Object.entries(features).map(([key, value]) => {
      const featureInfo = featuresDictionary.find(f => f.key === key);
      const displayName = featureInfo ? featureInfo.name : key;
      return `${displayName}: ${value}`;
    }).join('\\n');
  };

  const PackModal = () => {
    const [form, setForm] = useState(editingPack || { name: '', price: 10, features: {}, status: 'active' });
    const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const addFeature = (key) => {
      if (!key || form.features[key] !== undefined) return;
      const featureInfo = featuresDictionary.find(f => f.key === key);
      let defaultValue = featureInfo?.type === 'numeric' ? 0 : (featureInfo?.type === 'boolean' ? false : (featureInfo?.options?.[0] || ''));
      updateFeatureValue(key, defaultValue);
    };
    const updateFeatureValue = (key, value) => setForm(prev => ({ ...prev, features: { ...prev.features, [key]: value } }));
    const removeFeature = (key) => {
      const newFeatures = { ...form.features };
      delete newFeatures[key];
      setForm(prev => ({ ...prev, features: newFeatures }));
    };

    const renderFeatureInput = (key, value) => {
        const featureInfo = featuresDictionary.find(f => f.key === key);
        if (!featureInfo) return null;
        switch (featureInfo.type) {
            case 'numeric': return <input type="number" min="0" className="border p-2 w-32" value={value} onChange={e => updateFeatureValue(key, parseInt(e.target.value) || 0)} />;
            case 'boolean': return <input type="checkbox" checked={!!value} onChange={e => updateFeatureValue(key, e.target.checked)} />;
            case 'enum': return <select value={value} onChange={e => updateFeatureValue(key, e.target.value)} className="border p-2 w-32">{featureInfo.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>;
            default: return <input type="text" className="border p-2 w-32" value={value} onChange={e => updateFeatureValue(key, e.target.value)} />;
        }
    };

    const availableFeatures = featuresDictionary.filter(f => !Object.hasOwnProperty.call(form.features, f.key));

    return (
        <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title={form.id ? '编辑加油包' : '新增加油包'}>
            <div className="space-y-6">
                <label className="block"><span className="text-sm font-medium">名称</span><input className="mt-1 block w-full" value={form.name} onChange={e => updateField('name', e.target.value)} /></label>
                <label className="block"><span className="text-sm font-medium">价格 (元)</span><input type="number" min="0" className="mt-1 block w-full" value={form.price} onChange={e => updateField('price', parseFloat(e.target.value) || 0)} /></label>
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">权益配置</h3>
                        {availableFeatures.length > 0 && (
                            <select onChange={e => { if (e.target.value) { addFeature(e.target.value); e.target.value = ''; } }} className="border rounded px-3 py-2 text-sm" defaultValue=""><option value="">+ 添加权益</option>{availableFeatures.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}</select>
                        )}
                    </div>
                    <div className="space-y-3">
                        {Object.entries(form.features).map(([key, value]) => {
                            const featureInfo = featuresDictionary.find(f => f.key === key);
                            return (
                                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div className="flex-1"><div className="font-medium text-sm">{featureInfo?.name || key}</div>{featureInfo?.description && <div className="text-xs text-gray-500 mt-1">{featureInfo.description}</div>}</div>
                                    <div className="flex items-center space-x-2">{renderFeatureInput(key, value)}<button onClick={() => removeFeature(key)} className="text-red-600">删除</button></div>
                                </div>
                            );
                        })}
                        {Object.keys(form.features).length === 0 && <div className="text-center py-8 text-gray-500">暂无权益配置</div>}
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t"><button onClick={() => setModalVisible(false)}>取消</button><button onClick={() => savePack(form)} className="bg-blue-600 text-white px-4 py-2 rounded">保存</button></div>
            </div>
        </Modal>
    );
  };
  
  if (loading) return <div className="p-4 text-center">加载中...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
            <div><h1 className="text-2xl font-bold">加油包管理</h1><p className="text-sm text-gray-600 mt-1">管理一次性购买的权益包</p></div>
            <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded">新增加油包</button>
        </div>
        <div className="bg-white shadow-sm rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">名称</th><th className="px-6 py-3 text-left">价格</th><th className="px-6 py-3 text-left">权益</th><th className="px-6 py-3 text-left">状态</th><th className="px-6 py-3 text-right">操作</th></tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {packs.map(pack => (
                        <tr key={pack.id}>
                            <td className="px-6 py-4">{pack.name}</td>
                            <td className="px-6 py-4">￥{pack.price}</td>
                            <td className="px-6 py-4"><pre className="text-xs">{formatFeatures(pack.features)}</pre></td>
                            <td className="px-6 py-4">{pack.status}</td>
                            <td className="px-6 py-4 text-right space-x-4"><button onClick={() => openModal(pack)} className="text-blue-600">编辑</button><button onClick={() => deletePack(pack.id)} className="text-red-600">删除</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {packs.length === 0 && <div className="text-center py-12 text-gray-500">暂无加油包</div>}
        </div>
        {modalVisible && <PackModal />}
    </div>
  );
};

export default TopUpPackManagementPage;

const Modal = ({ visible, onClose, title, children }) => {
    if (!visible) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl"><div className="flex justify-between items-center px-6 py-4 border-b"><h2 className="text-xl font-semibold">{title}</h2><button onClick={onClose} className="text-2xl font-bold">×</button></div><div className="px-6 py-4">{children}</div></div>
        </div>
    );
}; 