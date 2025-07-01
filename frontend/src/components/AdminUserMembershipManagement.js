/**
 * 用户会员管理页面
 * 管理员可以查看、编辑用户会员状态和配额
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminUserMembershipManagement = () => {
  const [users, setUsers] = useState([]);
  const [membershipTiers, setMembershipTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [membershipForm, setMembershipForm] = useState({
    userId: '',
    tierName: '',
    durationDays: 30
  });
  const [quotaForm, setQuotaForm] = useState({
    userId: '',
    quotaAmount: 0,
    quotaType: 'monthly_ai_resume'
  });
  const navigate = useNavigate();

  /**
   * 获取用户列表
   */
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/users?page=${page}&limit=${pagination.limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('❌ [FETCH_USERS] 获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取会员套餐列表
   */
  const fetchMembershipTiers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/membership-tiers?activeOnly=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setMembershipTiers(data.data);
      }
    } catch (error) {
      console.error('❌ [FETCH_TIERS] 获取套餐列表失败:', error);
    }
  };

  /**
   * 开通会员
   */
  const handleGrantMembership = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/grant-membership', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(membershipForm)
      });

      const data = await response.json();
      if (data.success) {
        alert('会员开通成功！');
        setShowMembershipModal(false);
        setMembershipForm({ userId: '', tierName: '', durationDays: 30 });
        fetchUsers();
      } else {
        alert('开通失败：' + data.message);
      }
    } catch (error) {
      console.error('❌ [GRANT_MEMBERSHIP] 开通会员失败:', error);
      alert('开通失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 分配配额
   */
  const handleAssignQuota = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/assign-quota', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quotaForm)
      });

      const data = await response.json();
      if (data.success) {
        alert('配额分配成功！');
        setShowQuotaModal(false);
        setQuotaForm({ userId: '', quotaAmount: 0, quotaType: 'monthly_ai_resume' });
        fetchUsers();
      } else {
        alert('分配失败：' + data.message);
      }
    } catch (error) {
      console.error('❌ [ASSIGN_QUOTA] 分配配额失败:', error);
      alert('分配失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 打开开通会员模态框
   */
  const openMembershipModal = (user) => {
    setSelectedUser(user);
    setMembershipForm({ 
      userId: user.id, 
      tierName: '', 
      durationDays: 30 
    });
    setShowMembershipModal(true);
  };

  /**
   * 打开配额分配模态框
   */
  const openQuotaModal = (user) => {
    setSelectedUser(user);
    setQuotaForm({ 
      userId: user.id, 
      quotaAmount: 0, 
      quotaType: 'monthly_ai_resume' 
    });
    setShowQuotaModal(true);
  };

  /**
   * 获取会员状态颜色
   */
  const getMembershipStatusColor = (status) => {
    const colorMap = {
      'active': 'bg-green-100 text-green-800',
      'expired': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    fetchUsers();
    fetchMembershipTiers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ← 返回仪表板
              </button>
              <h1 className="text-xl font-semibold text-gray-900">用户会员管理</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              用户会员列表 (共 {pagination.total} 个用户)
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      用户信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      会员状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      当前套餐
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      剩余配额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      到期时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || '未设置姓名'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMembershipStatusColor(user.membership_status)}`}>
                          {user.membership_status || '未开通'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.current_tier || '免费版'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-blue-600 font-medium">
                          {user.remaining_ai_quota || 0} 次
                        </div>
                        <div className="text-xs text-gray-500">AI简历生成</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.membership_expires_at ? 
                          new Date(user.membership_expires_at).toLocaleDateString() : 
                          '永久有效'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={() => openMembershipModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          开通会员
                        </button>
                        <button 
                          onClick={() => openQuotaModal(user)}
                          className="text-green-600 hover:text-green-900"
                        >
                          分配配额
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  显示第 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 条
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchUsers(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => fetchUsers(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 开通会员模态框 */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              为 {selectedUser?.name || selectedUser?.email} 开通会员
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择套餐
                </label>
                <select
                  value={membershipForm.tierName}
                  onChange={(e) => setMembershipForm({...membershipForm, tierName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择套餐</option>
                  {membershipTiers.map(tier => (
                    <option key={tier.id} value={tier.name}>
                      {tier.name} - ¥{tier.original_price} ({tier.ai_resume_quota}次/月)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  有效期 (天数)
                </label>
                <input
                  type="number"
                  value={membershipForm.durationDays}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 30 : Math.max(0, parseInt(e.target.value) || 30);
                    setMembershipForm({...membershipForm, durationDays: value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="30"
                />
                <p className="text-xs text-gray-500 mt-1">输入0表示永久有效</p>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleGrantMembership}
                disabled={!membershipForm.tierName || loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '开通中...' : '确认开通'}
              </button>
              <button
                onClick={() => setShowMembershipModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分配配额模态框 */}
      {showQuotaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              为 {selectedUser?.name || selectedUser?.email} 分配配额
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配额类型
                </label>
                <select
                  value={quotaForm.quotaType}
                  onChange={(e) => setQuotaForm({...quotaForm, quotaType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly_ai_resume">AI简历生成 (月度)</option>
                  <option value="monthly_ai_chat">AI聊天咨询 (月度)</option>
                  <option value="monthly_job_search">岗位搜索 (月度)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配额数量
                </label>
                <input
                  type="number"
                  value={quotaForm.quotaAmount}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                    setQuotaForm({...quotaForm, quotaAmount: value});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="请输入配额数量"
                />
                <p className="text-xs text-gray-500 mt-1">将增加到用户当前配额中</p>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleAssignQuota}
                disabled={quotaForm.quotaAmount <= 0 || loading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '分配中...' : '确认分配'}
              </button>
              <button
                onClick={() => setShowQuotaModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserMembershipManagement;
