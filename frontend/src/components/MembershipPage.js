/**
 * 用户会员页面
 * 显示会员状态、套餐购买、订单历史等功能
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MembershipPage = () => {
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [membershipTiers, setMembershipTiers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status'); // status, purchase, orders
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const navigate = useNavigate();

  /**
   * 获取会员状态
   */
  const fetchMembershipStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/memberships/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setMembershipStatus(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('❌ [FETCH_STATUS] 获取会员状态失败:', error);
      setMessage({
        type: 'error',
        content: '获取会员状态失败: ' + error.message
      });
    }
  };

  /**
   * 获取会员套餐列表
   */
  const fetchMembershipTiers = async () => {
    try {
      const response = await fetch('/api/memberships/tiers');

      const data = await response.json();
      if (data.success) {
        setMembershipTiers(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('❌ [FETCH_TIERS] 获取套餐列表失败:', error);
      setMessage({
        type: 'error',
        content: '获取套餐列表失败: ' + error.message
      });
    }
  };

  /**
   * 获取订单历史
   */
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/memberships/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('❌ [FETCH_ORDERS] 获取订单历史失败:', error);
      setMessage({
        type: 'error',
        content: '获取订单历史失败: ' + error.message
      });
    }
  };

  /**
   * 购买会员套餐
   */
  const handlePurchase = async (tierId) => {
    try {
      setPurchaseLoading(true);
      const token = localStorage.getItem('token');

      // 1. 创建订单
      const orderResponse = await fetch('/api/memberships/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          membershipTierId: tierId,
          paymentMethod: 'alipay'
        })
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) {
        throw new Error(orderData.message);
      }

      // 2. 模拟支付（实际项目中应该跳转到支付页面）
      const confirmPay = window.confirm(
        `确认购买 ${orderData.data.tierName}？\n` +
        `金额：¥${orderData.data.finalAmount}\n` +
        `订单号：${orderData.data.orderNumber}\n\n` +
        `点击确定模拟支付成功`
      );

      if (!confirmPay) {
        setMessage({
          type: 'info',
          content: '已取消购买'
        });
        return;
      }

      // 3. 激活订单
      const activateResponse = await fetch(`/api/memberships/orders/${orderData.data.orderId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionId: `MOCK_PAY_${Date.now()}`
        })
      });

      const activateData = await activateResponse.json();
      if (!activateData.success) {
        throw new Error(activateData.message);
      }

      setMessage({
        type: 'success',
        content: `恭喜！${activateData.data.tierName} 会员激活成功！`
      });

      // 刷新数据
      await fetchMembershipStatus();
      await fetchOrders();
      setActiveTab('status');

    } catch (error) {
      console.error('❌ [PURCHASE] 购买失败:', error);
      setMessage({
        type: 'error',
        content: '购买失败: ' + error.message
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  /**
   * 页面初始化
   */
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([
        fetchMembershipStatus(),
        fetchMembershipTiers(),
        fetchOrders()
      ]);
      setLoading(false);
    };

    initData();
  }, []);

  /**
   * 清除消息
   */
  useEffect(() => {
    if (message.content) {
      const timer = setTimeout(() => {
        setMessage({ type: '', content: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  /**
   * 格式化日期
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  /**
   * 格式化金额
   */
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  /**
   * 获取状态显示文本
   */
  const getStatusText = (status) => {
    const statusMap = {
      'pending': '待支付',
      'paid': '已支付',
      'cancelled': '已取消',
      'refunded': '已退款'
    };
    return statusMap[status] || status;
  };

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'text-yellow-600',
      'paid': 'text-green-600',
      'cancelled': 'text-gray-600',
      'refunded': 'text-red-600'
    };
    return colorMap[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">会员中心</h1>
          <p className="mt-2 text-gray-600">管理您的会员状态和套餐</p>
        </div>

        {/* 消息提示 */}
        {message.content && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium">{message.content}</p>
              </div>
            </div>
          </div>
        )}

        {/* 选项卡导航 */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('status')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'status'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              会员状态
            </button>
            <button
              onClick={() => setActiveTab('purchase')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'purchase'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              购买套餐
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              订单历史
            </button>
          </nav>
        </div>

        {/* 会员状态 */}
        {activeTab === 'status' && membershipStatus && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">当前会员状态</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600">会员类型</h3>
                  <p className="text-lg font-semibold text-blue-900">{membershipStatus.tierName}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600">AI剩余次数</h3>
                  <p className="text-lg font-semibold text-green-900">
                    {membershipStatus.remainingAiQuota} / {membershipStatus.totalAiQuota}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600">到期时间</h3>
                  <p className="text-lg font-semibold text-purple-900">
                    {membershipStatus.endDate ? formatDate(membershipStatus.endDate) : '永久'}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-600">配额重置</h3>
                  <p className="text-lg font-semibold text-orange-900">
                    {membershipStatus.quotaResetDate ? formatDate(membershipStatus.quotaResetDate) : '-'}
                  </p>
                </div>
              </div>

              {membershipStatus.features && membershipStatus.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">会员特权</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {membershipStatus.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!membershipStatus.hasMembership && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">升级会员享受更多功能</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        购买会员套餐即可享受AI简历生成、优化等高级功能
                      </p>
                      <button
                        onClick={() => setActiveTab('purchase')}
                        className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                      >
                        立即购买 →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 购买套餐 */}
        {activeTab === 'purchase' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">选择会员套餐</h2>
              <p className="mt-2 text-gray-600">解锁AI简历生成和优化功能</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {membershipTiers.map((tier) => (
                <div key={tier.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">{tier.name}</h3>
                    {tier.description && (
                      <p className="mt-2 text-sm text-gray-600">{tier.description}</p>
                    )}
                    
                    <div className="mt-4">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-gray-900">
                          ¥{formatPrice(tier.reduction_price || tier.original_price)}
                        </span>
                        {tier.reduction_price && (
                          <span className="ml-2 text-lg text-gray-500 line-through">
                            ¥{formatPrice(tier.original_price)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {tier.duration_days > 0 ? `${tier.duration_days}天` : '永久'}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">包含功能：</p>
                      <ul className="mt-2 space-y-1">
                        <li className="text-sm text-gray-600 flex items-center">
                          <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          AI简历生成 {tier.ai_resume_quota}次/月
                        </li>
                        <li className="text-sm text-gray-600 flex items-center">
                          <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {tier.template_access_level === 'all' ? '所有模板' : 
                           tier.template_access_level === 'advanced' ? '高级模板' : '基础模板'}
                        </li>
                        {tier.features && typeof tier.features === 'string' && JSON.parse(tier.features).map((feature, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <button
                      onClick={() => handlePurchase(tier.id)}
                      disabled={purchaseLoading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {purchaseLoading ? '处理中...' : '立即购买'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 订单历史 */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">订单历史</h2>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无订单</h3>
                <p className="mt-1 text-sm text-gray-500">您还没有购买过任何套餐</p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab('purchase')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    购买套餐
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <li key={order.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              {order.tier_name}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                            <span>订单号: {order.order_number}</span>
                            <span>金额: ¥{formatPrice(order.final_amount)}</span>
                            <span>下单时间: {formatDate(order.created_at)}</span>
                            {order.paid_at && (
                              <span>支付时间: {formatDate(order.paid_at)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipPage; 