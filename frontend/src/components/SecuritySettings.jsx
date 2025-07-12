/**
 * @file SecuritySettings.jsx
 * @description Component for updating user password.
 * @author [Your Name]
 * @date 2024-07-15
 */
import React, { useState } from 'react';
import { changePassword } from '../utils/api';

const SecuritySettings = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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
            const response = await changePassword({
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
        </div>
    );
};

export default SecuritySettings; 