/**
 * @file SecuritySettings.jsx
 * @description Component for updating user password.
 * @author [Your Name]
 * @date 2024-07-15
 */
import React, { useState } from 'react';
import { requestAccountDeletion } from '../utils/api'; // 导入新的专用函数
import { useAuth } from '../utils/auth'; // 假设有auth hook来处理登出

const SecuritySettings = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // --- 新增状态用于账户删除 ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    
    const { logout } = useAuth(); // 从auth context获取logout方法

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmNewPassword) {
            setError('新密码两次输入不匹配。');
            return;
        }
        if (formData.newPassword.length < 6) {
            setError('新密码长度不能少于6位。');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.post('/profile/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });
            if (response.data.success) {
                setSuccessMessage('密码更新成功！');
                setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            } else {
                setError(response.data.message || '发生未知错误。');
            }
        } catch (err) {
            console.error('Failed to update password', err);
            setError(err.response?.data?.message || '更新失败，请稍后再试。');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- 新增函数用于处理账户删除 ---
    const openDeleteModal = () => {
        setIsDeleteModalOpen(true);
        setDeletePassword('');
        setDeleteError('');
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
    };

    const handleAccountDeletion = async (e) => {
        e.preventDefault();
        if (deletePassword === '') {
            setDeleteError('请输入密码以确认。');
            return;
        }
        
        setIsDeleting(true);
        setDeleteError('');

        try {
            await requestAccountDeletion(deletePassword);
            
            // 成功后，执行登出并跳转
            alert('您的账户删除请求已提交。我们将在30天后永久清除您的所有数据。');
            logout();
            // 通常logout函数会处理重定向，例如 window.location.href = '/';
            
        } catch (err) {
            const errorMessage = err.response?.data?.message || '操作失败，请稍后重试。';
            setDeleteError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };


    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">账户安全</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        当前密码
                    </label>
                    <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        新密码
                    </label>
                    <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        确认新密码
                    </label>
                    <input
                        type="password"
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

                <div className="pt-6 border-t border-gray-200 text-right">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? '正在更新...' : '更新密码'}
                    </button>
                </div>
            </form>

            {/* --- 新增账户删除区域 --- */}
            <div className="mt-12 border-t pt-8 border-red-300">
                <h3 className="text-xl font-bold text-red-600">危险区域</h3>
                <p className="text-gray-600 mt-2">
                    删除您的账户是一个不可逆转的操作。所有与您账户相关的数据，包括简历、求职信息等，都将被永久移除。
                </p>
                <button
                    onClick={openDeleteModal}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
                >
                    永久删除我的账户
                </button>
            </div>

            {/* --- 新增账户删除确认模态框 --- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
                        <h2 className="text-2xl font-bold text-red-700 mb-4">您确定要继续吗？</h2>
                        <p className="text-gray-700 mb-6">
                            这是一个 **不可逆转** 的操作。您的账户和所有数据将在30天后被 **永久删除**。要确认删除，请输入您的登录密码。
                        </p>
                        <form onSubmit={handleAccountDeletion}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="delete-password">
                                    密码
                                </label>
                                <input
                                    type="password"
                                    id="delete-password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            {deleteError && <p className="text-red-500 text-sm mb-4">{deleteError}</p>}

                            <div className="flex items-center justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    disabled={isDeleting}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? '正在删除...' : '我明白，确认删除'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecuritySettings; 