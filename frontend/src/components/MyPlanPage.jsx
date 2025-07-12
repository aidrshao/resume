/**
 * “我的套餐与配额”页面组件 (v2.1 布局优化版)
 * 核心功能：
 * 1. 融合了ChatGPT方案中的多维度价值（模板库、数据保存等）。
 * 2. 坚持我们更优的“永久配额”体系，提升高价值用户体验。
 * 3. 采用全新的、更具现代感和营销力的UI设计。
 * 4. 修复了布局问题，确保三个核心套餐在大多数屏幕上并排展示。
 */

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getCurrentUserPlan, getAvailableProducts } from '../utils/api';

// --- SVG 图标组件 ---
const CheckIcon = ({ className = "h-5 w-5 text-green-500" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const PlanCard = ({ plan, currentPlanId }) => {
    const isCurrentPlan = plan.id === currentPlanId;
    
    // 动态判断推荐
    const recommended = plan.name.includes('年度');
    // 从features解析特性列表
    const featuresList = plan.features ? Object.entries(plan.features).map(([key, value]) => `${key}: ${value}`) : [];

    return (
        <div className={`relative rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-2 flex flex-col ${recommended ? 'bg-indigo-600 text-white shadow-2xl' : 'bg-white text-gray-900 shadow-lg'}`}>
            {recommended && <span className="absolute top-0 right-8 -mt-3 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">最受欢迎</span>}
            <div className="flex-grow">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="my-6">
                    <span className="text-5xl font-extrabold">¥{plan.price}</span>
                    <span className={`text-lg font-medium ${recommended ? 'text-indigo-200' : 'text-gray-500'}`}> / {plan.duration_days === 30 ? '月' : (plan.duration_days === 365 ? '年' : '永久')}</span>
                </div>
                <ul className="space-y-4 mb-8">
                    {featuresList.map(feature => (
                        <li key={feature} className="flex items-start">
                            <CheckIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${recommended ? 'text-green-300' : 'text-green-500'}`} />
                            <span className={`ml-3 ${recommended ? 'text-indigo-100' : 'text-gray-600'}`}>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <button disabled={isCurrentPlan} className={`w-full py-3 mt-auto rounded-lg font-semibold transition-colors ${
                isCurrentPlan 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : (recommended 
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700')
            }`}>
                {isCurrentPlan ? '当前套餐' : '选择套餐'}
            </button>
        </div>
    );
};


const MyPlanPage = () => {
  const [loading, setLoading] = useState(true);
  const [currentUserPlan, setCurrentUserPlan] = useState(null);
  const [products, setProducts] = useState({ plans: [], topUpPacks: [] });
  const location = useLocation();
  const [alertMessage, setAlertMessage] = useState(location.state?.message || '');

  useEffect(() => {
    // 新增：从URL查询参数检查并设置提示信息
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('reason') === 'quota_exceeded') {
      setAlertMessage('您的简历优化次数已用完，请升级套餐或购买加油包。');
      // 可选：从URL中移除查询参数以保持整洁
      window.history.replaceState(null, '', location.pathname);
    }

    const fetchData = async () => {
      console.log('[FRONTEND_DEBUG] MyPlanPage mounted. Attempting to fetch user plan data...');
      setLoading(true);
      try {
        const [planRes, productsRes] = await Promise.all([
          getCurrentUserPlan(),
          getAvailableProducts(),
        ]);
        console.log('[FRONTEND_DEBUG] Successfully received data from API (planRes):', planRes);
        console.log('[FRONTEND_DEBUG] Successfully received data from API (productsRes):', productsRes);
        if (planRes.data.success) setCurrentUserPlan(planRes.data.data);
        if (productsRes.data.success) setProducts(productsRes.data.data);
      } catch (error) {
        console.error("[FRONTEND_DEBUG] Failed to fetch data from API. Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !currentUserPlan) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-center p-10">加载中...</div></div>;
  }
  
  const { planName, planId, quotas, subscriptionExpiresAt } = currentUserPlan;
  const subscriptionQuota = quotas.subscription?.resume_optimizations || 0;
  const permanentQuota = quotas.permanent?.resume_optimizations || 0;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {alertMessage && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                <p className="font-bold">操作提醒</p>
                <p>{alertMessage}</p>
            </div>
        )}

        <header className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900">我的套餐与配额</h1>
            <p className="mt-2 text-lg text-gray-600">在这里管理您的会员权益，并根据需要进行升级。</p>
        </header>

        {/* 当前状态总览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-500 mb-4">当前套餐</h2>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl">
              <p className="text-3xl font-bold">{planName}</p>
              {subscriptionExpiresAt && <p className="text-sm opacity-80 mt-1">有效期至: {new Date(subscriptionExpiresAt).toLocaleDateString()}</p>}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-500 mb-4">可用简历优化次数</h2>
            <div className="flex items-end space-x-6">
                {subscriptionQuota > 0 && (
                    <div>
                        <p className="text-5xl font-extrabold text-gray-800">{subscriptionQuota}</p>
                        <p className="text-sm text-gray-500">本月剩余</p>
                    </div>
                )}
                <div>
                    <p className="text-5xl font-extrabold text-gray-800">{permanentQuota}</p>
                    <p className="text-sm text-gray-500">永久额度</p>
                </div>
            </div>
          </div>
        </div>

        {/* 套餐升级与购买区域 */}
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">选择最适合您的方案</h2>
            <p className="text-lg text-gray-600 mb-10">解锁全部潜力，获得更多面试机会。</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {products.plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} currentPlanId={planId} />
            ))}
          </div>

          <div className="max-w-3xl mx-auto text-center border-t border-gray-200 pt-10">
             <h3 className="text-xl font-bold text-gray-900 mb-4">需要更多次数？</h3>
             <p className="text-gray-600 mb-6">购买一个加油包，获得永不过期的额外优化次数。</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {products.topUpPacks.map(pack => (
                     <div key={pack.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                         <p className="font-semibold text-gray-800">{pack.name}</p>
                         <p className="text-3xl font-bold my-2">{pack.features.resume_optimizations || 0}次</p>
                         <button className="w-full py-2 mt-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">
                             购买 (¥{pack.price})
                         </button>
                     </div>
                 ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPlanPage; 