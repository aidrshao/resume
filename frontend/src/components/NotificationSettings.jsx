/**
 * @file NotificationSettings.jsx
 * @description Component for managing user notification preferences.
 * @author [Your Name]
 * @date 2024-07-15
 */
import React, { useState } from 'react';

const Toggle = ({ label, description, enabled, setEnabled }) => (
    <div
        onClick={() => setEnabled(!enabled)}
        className="flex justify-between items-center p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
    >
        <div>
            <p className="font-medium text-gray-800">{label}</p>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className={`w-14 h-8 flex items-center rounded-full p-1 duration-300 ease-in-out ${enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out ${enabled ? 'translate-x-6' : ''}`} />
        </div>
    </div>
);


const NotificationSettings = () => {
    const [notifications, setNotifications] = useState({
        productUpdates: true,
        promotionalOffers: false,
        monthlyNewsletter: true,
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Mock API call
            console.log("Saving notification settings:", notifications);
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert("设置已保存！ (模拟)");
        } catch (error) {
            console.error("Failed to save settings", error);
            alert("保存失败，请稍后再试。");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">通知设置</h2>
            <div className="space-y-4">
                <Toggle
                    label="产品更新邮件"
                    description="当有新功能或重要更新时通知我。"
                    enabled={notifications.productUpdates}
                    setEnabled={(value) => setNotifications(prev => ({ ...prev, productUpdates: value }))}
                />
                 <hr/>
                <Toggle
                    label="优惠活动邮件"
                    description="接收折扣、促销和会员专属优惠信息。"
                    enabled={notifications.promotionalOffers}
                    setEnabled={(value) => setNotifications(prev => ({ ...prev, promotionalOffers: value }))}
                />
                 <hr/>
                <Toggle
                    label="月度精选资讯"
                    description="每月接收求职技巧和行业动态汇总。"
                    enabled={notifications.monthlyNewsletter}
                    setEnabled={(value) => setNotifications(prev => ({ ...prev, monthlyNewsletter: value }))}
                />
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 text-right">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? '正在保存...' : '保存设置'}
                </button>
            </div>
        </div>
    );
};

export default NotificationSettings; 