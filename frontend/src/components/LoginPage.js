/**
 * 用户登录页面
 * 提供用户登录表单和相关功能
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../utils/api';
import { validateLoginForm } from '../utils/validation';
import { saveAuthData } from '../utils/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  
  // 表单状态
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  // 表单验证错误
  const [errors, setErrors] = useState({});
  
  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 提示信息
  const [message, setMessage] = useState({ type: '', content: '' });

  /**
   * 处理输入框变化
   * @param {Object} e - 事件对象
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('⌨️ LoginPage: 输入框变化', { name, value });
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除对应字段的错误信息
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * 处理表单提交
   * @param {Object} e - 事件对象
   */
  const handleSubmit = async (e) => {
    console.log('🚀 LoginPage: handleSubmit 被调用', { formData, isSubmitting });
    e.preventDefault();
    
    // 表单验证
    console.log('📝 LoginPage: 开始表单验证', formData);
    const validation = validateLoginForm(formData);
    console.log('✅ LoginPage: 表单验证结果', validation);
    
    if (!validation.isValid) {
      console.log('❌ LoginPage: 表单验证失败', validation.errors);
      setErrors(validation.errors);
      return;
    }
    
    console.log('🔄 LoginPage: 开始API请求');
    setIsSubmitting(true);
    setMessage({ type: '', content: '' });
    
    try {
      console.log('🔑 LoginPage: 调用登录API');
      const response = await login(formData);
      console.log('📡 LoginPage: API响应', response);
      
      if (response.success) {
        console.log('✅ LoginPage: 登录成功，保存数据');
        // 保存认证信息
        saveAuthData(response.data.token, response.data.user);
        
        setMessage({
          type: 'success',
          content: '登录成功！正在跳转...'
        });
        
        console.log('⏰ LoginPage: 设置延迟跳转');
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        console.log('❌ LoginPage: API返回失败', response);
        setMessage({
          type: 'error',
          content: response.message || '登录失败'
        });
      }
    } catch (error) {
      console.error('❌ LoginPage: 登录失败:', error);
      setMessage({
        type: 'error',
        content: error.message || '登录失败，请重试'
      });
    } finally {
      console.log('🏁 LoginPage: 请求完成，设置submitting为false');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          登录到您的账户
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          还没有账户？{' '}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            立即注册
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* 提示信息 */}
          {message.content && (
            <div className={`mb-4 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.content}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请输入邮箱地址"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请输入密码"
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* 提交按钮 */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={(e) => {
                  console.log('🖱️ LoginPage: 登录按钮被点击', { 
                    isSubmitting, 
                    disabled: isSubmitting,
                    formData: formData 
                  });
                }}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {isSubmitting ? '登录中...' : '登录'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 