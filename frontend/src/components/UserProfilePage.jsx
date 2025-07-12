/**
 * @file UserProfilePage.jsx
 * @description Parent component for the user profile section.
 * @author [Your Name]
 * @date 2024-07-15
 */
import React, { useState, useEffect } from 'react';
import { getUserProfile } from '../utils/api';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';


const UserProfilePage = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await getUserProfile();
                if(response.data.success) {
                  setUserData(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings userData={userData} setUserData={setUserData} />;
            case 'security':
                return <SecuritySettings />;
            case 'notifications':
                return <NotificationSettings />;
            default:
                return <ProfileSettings userData={userData} setUserData={setUserData} />;
        }
    };

    const TabButton = ({ tabName, currentTab, setTab, children }) => (
        <button
            onClick={() => setTab(tabName)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentTab === tabName
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            {children}
        </button>
    );

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="text-lg font-medium text-gray-700">正在加载您的个人资料...</div></div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-900">个人中心</h1>
                    <p className="mt-2 text-lg text-gray-600">管理您的账户信息和偏好设置</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <aside className="md:col-span-1">
                        <nav className="space-y-2">
                            <TabButton tabName="profile" currentTab={activeTab} setTab={setActiveTab}>个人资料</TabButton>
                            <TabButton tabName="security" currentTab={activeTab} setTab={setActiveTab}>账户安全</TabButton>
                            <TabButton tabName="notifications" currentTab={activeTab} setTab={setActiveTab}>通知设置</TabButton>
                        </nav>
                    </aside>
                    <main className="md:col-span-3">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage; 