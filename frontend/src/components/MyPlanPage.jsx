/**
 * “我的套餐与配额”页面组件 (v2.3 真实数据集成版)
 * 核心功能：
 * 1. 引入“权益解释器”，将机器可读的JSON翻译成用户友好的中文描述。
 * 2. 彻底重构UI，优化字体、排版和视觉层次，使其更专业、更美观。
 * 3. 确保所有组件都能正确消费和展示新的权益描述。
 * 4. 使用真实的API数据，替换了mock数据。
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCurrentUserPlan, getAvailableProducts } from '../utils/api'; // 使用真实API
import { interpretFeatures } from '../utils/featureInterpreter';

// --- 子组件 ---
const CheckIcon = ({ className = "h-5 w-5 text-green-500" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
);

const getPlanUnit = (duration) => {
    if (duration === 30) return '月';
    if (duration === 365) return '年';
    return '永久';
};

const PlanCard = ({ plan, currentPlanId }) => {
    const isCurrentPlan = plan.id === currentPlanId;
    const featuresList = interpretFeatures(plan.features);
    const recommended = plan.name.includes('年度'); // 从真实数据动态判断
    const unit = getPlanUnit(plan.duration_days); // 从真实数据动态转换

    return (
        <div className={`relative rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-2 flex flex-col ${recommended ? 'bg-indigo-600 text-white shadow-2xl' : 'bg-white text-gray-900 shadow-lg border border-gray-200'}`}>
            {recommended && <span className="absolute top-0 right-8 -mt-3 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">最受欢迎</span>}
            <div className="flex-grow">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="my-4">
                    <span className="text-4xl font-extrabold">¥{plan.price}</span>
                    <span className={`text-base font-medium ${recommended ? 'text-indigo-200' : 'text-gray-500'}`}> / {unit}</span>
                    {/* originalPrice is not available in real data, so it's removed */}
                </div>
                <ul className="space-y-3 mb-6 text-sm">
                    {featuresList.map(feature => (
                        <li key={feature} className="flex items-start">
                            <CheckIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${recommended ? 'text-green-300' : 'text-green-500'}`} />
                            <span className={`ml-3 ${recommended ? 'text-indigo-100' : 'text-gray-600'}`}>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <button disabled={isCurrentPlan} className={`w-full py-3 mt-auto rounded-lg font-semibold text-base transition-colors ${ isCurrentPlan ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : (recommended ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700')}`}>
                {isCurrentPlan ? '当前套餐' : '选择套餐'}
            </button>
        </div>
    );
};

// --- 主页面组件 ---
const MyPlanPage = () => {
  const [loading, setLoading] = useState(true);
  const [currentUserPlan, setCurrentUserPlan] = useState(null);
  const [products, setProducts] = useState({ plans: [], topUpPacks: [] });
  const location = useLocation();
  const [alertMessage, setAlertMessage] = useState(location.state?.message || '');

  useEffect(() => {
    // 恢复：从URL查询参数检查并设置提示信息
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('reason') === 'quota_exceeded') {
      setAlertMessage('您的简历优化次数已用完，请升级套餐或购买加油包。');
      // 从URL中移除查询参数以保持整洁
      window.history.replaceState(null, '', location.pathname);
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // 使用真实API
        const [planRes, productsRes] = await Promise.all([
          getCurrentUserPlan(),
          getAvailableProducts(),
        ]);
        if (planRes.data.success) setCurrentUserPlan(planRes.data.data);
        if (productsRes.data.success) setProducts(productsRes.data.data);
      } catch (error) { 
        console.error("Failed to fetch data:", error); 
        setAlertMessage('加载套餐信息失败，请稍后重试。');
      } 
      finally { setLoading(false); }
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
            <h1 className="text-3xl font-bold text-gray-900">我的套餐与配额</h1>
            <p className="mt-2 text-lg text-gray-600">在这里管理您的会员权益，并根据需要进行升级。</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <p className="text-base font-semibold opacity-80">当前套餐</p>
              <p className="text-3xl font-bold mt-2">{planName}</p>
            </div>
            {subscriptionExpiresAt && <p className="text-sm opacity-80 mt-4">有效期至: {new Date(subscriptionExpiresAt).toLocaleDateString()}</p>}
          </div>
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="text-base font-semibold text-gray-500">本月可用配额</p>
              <p className="text-5xl font-extrabold text-gray-800 mt-2">{subscriptionQuota}</p>
              <p className="text-sm text-gray-500">简历优化次数 (次月重置)</p>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-500">永久配额</p>
              <p className="text-5xl font-extrabold text-gray-800 mt-2">{permanentQuota}</p>
              <p className="text-sm text-gray-500">简历优化次数 (永不过期)</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">选择最适合您的方案</h2>
            <p className="text-lg text-gray-600 mb-10">解锁全部潜力，获得更多面试机会。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {products.plans.map((plan) => <PlanCard key={plan.id} plan={plan} currentPlanId={planId} />)}
          </div>
          <div className="max-w-3xl mx-auto text-center border-t border-gray-200 pt-12">
             <h3 className="text-2xl font-bold text-gray-900 mb-4">需要更多次数？</h3>
             <p className="text-gray-600 mb-6">购买一个加油包，获得永不过期的额外优化次数。</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {products.topUpPacks.map(pack => (
                     <div key={pack.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                         <p className="font-semibold text-gray-800 text-lg">{pack.name}</p>
                         <p className="text-3xl font-bold my-3">{pack.features.resume_optimizations || 0}次</p>
                         <button className="w-full py-2 mt-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">购买 (¥{pack.price})</button>
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