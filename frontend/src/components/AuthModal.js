/**
 * 认证Modal组件 - 登录/注册弹窗
 * 统一处理用户认证，支持登录和注册模式切换
 */

import React, { useState, useEffect } from 'react';
import { login, register } from '../utils/api';
import { saveAuthData } from '../utils/auth';
import { validateLoginForm, validateRegisterForm } from '../utils/validation';

const AuthModal = ({ isOpen, onClose, mode, onSuccess, onSwitchMode }) => {
  // 表单数据
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  /**
   * 重置表单状态
   */
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setMessage('');
    setIsLoading(false);
  };

  /**
   * Modal打开时重置表单
   */
  useEffect(() => {
    console.log('🔄 AuthModal: useEffect触发', { isOpen, mode });
    if (isOpen) {
      console.log('📂 AuthModal: Modal打开，重置表单');
      resetForm();
    }
  }, [isOpen, mode]);

  /**
   * 处理输入变化
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('⌨️ AuthModal: 输入框变化', { name, value });
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e) => {
    console.log('🚀 AuthModal: handleSubmit 被调用', { mode, formData, isLoading });
    e.preventDefault();
    
    // 表单验证
    console.log('📝 AuthModal: 开始表单验证', formData);
    const validation = mode === 'login' 
      ? validateLoginForm(formData)
      : validateRegisterForm(formData);
    
    console.log('✅ AuthModal: 表单验证结果', validation);
    
    if (!validation.isValid) {
      console.log('❌ AuthModal: 表单验证失败', validation.errors);
      setErrors(validation.errors);
      return;
    }

    console.log('🔄 AuthModal: 开始API请求', { mode, email: formData.email });
    setIsLoading(true);
    setMessage('');
    setErrors({});

    try {
      let response;
      
      if (mode === 'login') {
        console.log('🔑 AuthModal: 调用登录API');
        response = await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        console.log('📝 AuthModal: 调用注册API');
        response = await register({
          email: formData.email,
          password: formData.password
        });
      }

      console.log('📡 AuthModal: API响应', response);

      if (response.success) {
        console.log('✅ AuthModal: 认证成功，保存数据');
        // 保存认证信息
        saveAuthData(response.data.token, response.data.user);
        
        setMessage(response.message || (mode === 'login' ? '登录成功！' : '注册成功！'));
        
        // 延迟关闭Modal，让用户看到成功消息
        console.log('⏰ AuthModal: 设置延迟关闭Modal');
        setTimeout(() => {
          console.log('🎯 AuthModal: 调用onSuccess回调');
          onSuccess();
        }, 1000);
      } else {
        console.log('❌ AuthModal: API返回失败', response);
        setMessage(response.message || `${mode === 'login' ? '登录' : '注册'}失败`);
      }
    } catch (error) {
      console.error(`❌ AuthModal: ${mode === 'login' ? '登录' : '注册'}失败:`, error);
      setMessage(error.message || `${mode === 'login' ? '登录' : '注册'}失败，请重试`);
    } finally {
      console.log('🏁 AuthModal: 请求完成，设置loading为false');
      setIsLoading(false);
    }
  };

  /**
   * 切换认证模式
   */
  const handleSwitchMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    resetForm();
    onSwitchMode(newMode);
  };

  /**
   * 处理Modal关闭
   */
  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  /**
   * 处理背景点击关闭
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) {
    console.log('🚫 AuthModal: Modal未打开，返回null');
    return null;
  }
  
  console.log('📱 AuthModal: 渲染Modal', { isOpen, mode, formData });

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'login' ? '登录账户' : '注册新账户'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Modal内容 */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="请输入邮箱地址"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="请输入密码"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* 确认密码输入 - 仅注册模式显示 */}
            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  确认密码
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请再次输入密码"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* 消息显示 */}
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('成功') 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              onClick={(e) => {
                console.log('🖱️ AuthModal: 登录按钮被点击', { 
                  mode, 
                  isLoading, 
                  disabled: isLoading,
                  formData: formData 
                });
              }}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'login' ? '登录中...' : '注册中...'}
                </div>
              ) : (
                mode === 'login' ? '登录' : '注册'
              )}
            </button>
          </form>

          {/* 模式切换 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? '还没有账户？' : '已有账户？'}
              <button
                onClick={handleSwitchMode}
                disabled={isLoading}
                className="ml-1 text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
              >
                {mode === 'login' ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>

          {/* 注册模式的额外说明 */}
          {mode === 'register' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                注册即表示您同意我们的服务条款和隐私政策。
                我们承诺保护您的个人信息安全。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 