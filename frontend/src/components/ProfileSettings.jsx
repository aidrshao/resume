/**
 * @file ProfileSettings.jsx
 * @description Component for updating user profile information.
 * @author [Your Name]
 * @date 2024-07-15
 */
import React, { useState, useRef } from 'react';
import { uploadAvatar } from '../utils/api';
import { API_BASE_URL } from '../utils/api';
import { getUser, saveAuthData, getToken } from '../utils/auth';

const ProfileSettings = ({ userData, setUserData }) => {
    const fileInputRef = useRef(null);

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('avatar', file);

        try {
            const response = await uploadAvatar(uploadFormData);
            if (response.data.success) {
                // 更新用户数据，包含新的头像URL
                const updatedUserData = {
                    ...userData,
                    avatar_url: response.data.avatarUrl
                };
                setUserData(updatedUserData);
                
                // 同时更新localStorage中的用户信息，让导航栏立即显示新头像
                const currentUser = getUser();
                const currentToken = getToken();
                if (currentUser && currentToken) {
                    const updatedUser = {
                        ...currentUser,
                        avatar_url: response.data.avatarUrl
                    };
                    saveAuthData(currentToken, updatedUser);
                }
                
                alert('头像更新成功！');
            }
        } catch (error) {
            console.error('Failed to upload avatar', error);
            alert('头像上传失败，请稍后再试。');
        }
    };

    if (!userData) {
        return <div>正在加载个人资料...</div>;
    }
    
    // Construct full avatar URL
    const avatarSrc = userData.avatar_url 
        ? (userData.avatar_url.startsWith('http') ? userData.avatar_url : `${API_BASE_URL.replace('/api', '')}${userData.avatar_url}`)
        : `https://ui-avatars.com/api/?name=${userData.name || userData.email}&background=random`;


    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">个人资料</h2>
            
            <div className="flex items-center mb-8">
                <img
                    src={avatarSrc}
                    alt="User Avatar"
                    className="w-24 h-24 rounded-full object-cover mr-6 border-4 border-gray-200"
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                />
                <button 
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                    上传新头像
                </button>
            </div>

            <div className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        姓名
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={userData.name || '未设置'}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">姓名信息来源于您上传的最新简历。</p>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        邮箱地址
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={userData.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                     <p className="text-xs text-gray-500 mt-1">邮箱地址不可修改。</p>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings; 