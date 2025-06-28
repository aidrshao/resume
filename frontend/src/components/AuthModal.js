/**
 * 认证Modal组件 - 登录/注册弹窗
 * 统一处理用户认证，支持登录和注册模式切换，支持密码登录和验证码登录
 */

import React, { useState, useEffect } from 'react';
import { login, loginWithCode, sendVerificationCode, register } from '../utils/api';
import { saveAuthData } from '../utils/auth';
import { 
  validateLoginForm, 
  validateCodeLoginForm, 
  validateSendCodeForm, 
  validateRegisterCodeForm
} from '../utils/validation';

const AuthModal = ({ isOpen, onClose, mode, onSuccess, onSwitchMode }) => {
  // 当前认证模式：'login' | 'register'
  const [authMode, setAuthMode] = useState(mode);
  
  // 登录方式：'password' | 'code' (仅登录模式有效)
  const [loginType, setLoginType] = useState('password');
  
  // 表单数据
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    code: ''
  });

  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  // 发送验证码状态
  const [codeSending, setCodeSending] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);

  /**
   * 倒计时效果
   */
  useEffect(() => {
    let timer;
    if (codeCountdown > 0) {
      timer = setTimeout(() => {
        setCodeCountdown(codeCountdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [codeCountdown]);

  /**
   * 监听 mode 变化
   */
  useEffect(() => {
    setAuthMode(mode);
  }, [mode]);

  /**
   * 重置表单状态
   */
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      code: ''
    });
    setErrors({});
    setMessage('');
    setIsLoading(false);
    setLoginType('password');
    setCodeSending(false);
    setCodeCountdown(0);
  };

  /**
   * Modal打开时重置表单
   */
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, authMode]);

  /**
   * 处理输入框变化
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`⌨️ AuthModal: 输入框变化 ${name}:`, value);
    
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

    // 清除通用消息
    if (message) {
      setMessage('');
    }
  };

  /**
   * 切换登录方式
   */
  const handleLoginTypeSwitch = (type) => {
    console.log('AuthModal: 切换登录方式', type);
    setLoginType(type);
    setFormData(prev => ({
      ...prev,
      password: '',
      code: ''
    }));
    setErrors({});
    setMessage('');
  };

  /**
   * 发送验证码
   */
  const handleSendCode = async () => {
    const emailValidation = validateSendCodeForm({ email: formData.email });
    if (!emailValidation.isValid) {
      setErrors({ email: emailValidation.errors.email });
      return;
    }

    setCodeSending(true);
    setErrors(prev => ({ ...prev, email: '' }));

    try {
      console.log('📧 AuthModal: 开始发送验证码', { 
        email: formData.email, 
        type: authMode === 'login' ? 'login' : 'register' 
      });
      
      const response = await sendVerificationCode({
        email: formData.email,
        type: authMode === 'login' ? 'login' : 'register'
      });

      if (response.success) {
        setMessage(response.message || '验证码已发送到您的邮箱');
        setCodeCountdown(60);
      } else {
        setMessage(response.message || '验证码发送失败');
      }
    } catch (error) {
      console.error('❌ AuthModal: 发送验证码失败:', error);
      setMessage(error.message || '验证码发送失败，请稍后重试');
    } finally {
      setCodeSending(false);
    }
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 表单验证
    let validation;
    if (authMode === 'login') {
      validation = loginType === 'password' 
        ? validateLoginForm(formData)
        : validateCodeLoginForm(formData);
    } else {
      validation = validateRegisterCodeForm(formData);
    }
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setErrors({});

    try {
      let response;
      
      if (authMode === 'login') {
        if (loginType === 'password') {
          response = await login({
            email: formData.email,
            password: formData.password
          });
        } else {
          response = await loginWithCode({
            email: formData.email,
            code: formData.code
          });
        }
      } else {
        response = await register({
          email: formData.email,
          password: formData.password,
          code: formData.code
        });
      }

      if (response.success) {
        // 注册成功不自动登录，只显示成功消息
        if (authMode === 'register') {
          setMessage('注册成功！请使用您的账户登录');
          
          // 延迟切换到登录模式
          setTimeout(() => {
            setAuthMode('login');
            onSwitchMode('login');
            resetForm();
            setFormData(prev => ({ ...prev, email: formData.email }));
          }, 2000);
        } else {
          // 登录成功，保存认证信息
          saveAuthData(response.data.token, response.data.user);
          setMessage(response.message || '登录成功！');
          
          // 延迟关闭Modal，让用户看到成功消息
          setTimeout(() => {
            onSuccess();
          }, 1000);
        }
      } else {
        setMessage(response.message || `${authMode === 'login' ? '登录' : '注册'}失败`);
      }
    } catch (error) {
      console.error(`❌ AuthModal: ${authMode === 'login' ? '登录' : '注册'}失败:`, error);
      setMessage(error.message || `${authMode === 'login' ? '登录' : '注册'}失败，请重试`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 切换认证模式
   */
  const handleSwitchMode = () => {
    const newMode = authMode === 'login' ? 'register' : 'login';
    resetForm();
    setAuthMode(newMode);
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
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {authMode === 'login' ? '登录账户' : '注册新账户'}
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
          {/* 登录模式切换按钮 - 仅登录模式显示 */}
          {authMode === 'login' && (
            <div className="mb-6">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => handleLoginTypeSwitch('password')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    loginType === 'password'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  密码登录
                </button>
                <button
                  type="button"
                  onClick={() => handleLoginTypeSwitch('code')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    loginType === 'code'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  验证码登录
                </button>
              </div>
            </div>
          )}

          {/* 消息显示 */}
          {message && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              message.includes('成功') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

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

            {/* 验证码输入 - 验证码登录模式或注册模式显示 */}
            {(authMode === 'register' || (authMode === 'login' && loginType === 'code')) && (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  {authMode === 'register' ? '邮箱验证码' : '验证码'}
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    id="code"
                    name="code"
                    maxLength="6"
                    value={formData.code}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 ${
                      errors.code ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="请输入6位验证码"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={codeSending || codeCountdown > 0 || isLoading || !formData.email}
                    className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white whitespace-nowrap ${
                      codeSending || codeCountdown > 0 || isLoading || !formData.email
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                  >
                    {codeSending ? '发送中...' : codeCountdown > 0 ? `${codeCountdown}秒` : '发送验证码'}
                  </button>
                </div>
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  验证码将发送到您的邮箱，有效期10分钟
                </p>
              </div>
            )}

            {/* 密码输入 - 密码登录模式或注册模式显示 */}
            {(authMode === 'register' || (authMode === 'login' && loginType === 'password')) && (
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
            )}

            {/* 确认密码输入 - 仅注册模式显示 */}
            {authMode === 'register' && (
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

            {/* 忘记密码链接 - 仅密码登录模式显示 */}
            {authMode === 'login' && loginType === 'password' && (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => handleLoginTypeSwitch('code')}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    忘记密码？使用验证码登录
                  </button>
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {authMode === 'login' ? '登录中...' : '注册中...'}
                </div>
              ) : (
                authMode === 'login' ? '登录' : '注册'
              )}
            </button>
          </form>

          {/* 模式切换 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {authMode === 'login' ? '还没有账户？' : '已有账户？'}
              <button
                onClick={handleSwitchMode}
                disabled={isLoading}
                className="ml-1 text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
              >
                {authMode === 'login' ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>

          {/* 注册模式的额外说明 */}
          {authMode === 'register' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                注册需要验证邮箱，请确保邮箱地址正确。<br/>
                注册即表示您同意我们的服务条款和隐私政策。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 