/**
 * 用户注册页面
 * 提供用户注册表单和相关功能，支持邮箱验证码注册
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, sendVerificationCode } from '../utils/api';
import { validateRegisterCodeForm, validateSendCodeForm } from '../utils/validation';
import { saveAuthData } from '../utils/auth';

const RegisterPage = () => {
  const navigate = useNavigate();
  
  // 表单状态
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    code: ''
  });
  
  // 表单验证错误
  const [errors, setErrors] = useState({});
  
  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 发送验证码状态
  const [codeSending, setCodeSending] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  
  // 提示信息
  const [message, setMessage] = useState({ type: '', content: '' });

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
   * 处理输入框变化
   * @param {Object} e - 事件对象
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('⌨️ RegisterPage: 输入框变化', { name, value });
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

    // 清除通用提示信息
    if (message.content) {
      setMessage({ type: '', content: '' });
    }
  };

  /**
   * 发送验证码
   */
  const handleSendCode = async () => {
    console.log('📧 RegisterPage: 开始发送验证码', { email: formData.email });
    
    // 验证邮箱格式
    const validation = validateSendCodeForm({ email: formData.email });
    if (!validation.isValid) {
      console.log('❌ RegisterPage: 邮箱验证失败', validation.errors);
      setErrors({ email: validation.errors.email });
      return;
    }

    setCodeSending(true);
    setMessage({ type: '', content: '' });
    setErrors(prev => ({ ...prev, email: '' }));

    try {
      console.log('🌐 RegisterPage: 调用发送验证码API');
      const response = await sendVerificationCode({
        email: formData.email,
        type: 'register'
      });

      console.log('📡 RegisterPage: 发送验证码API响应', response);

      if (response.success) {
        console.log('✅ RegisterPage: 验证码发送成功');
        setMessage({
          type: 'success',
          content: response.message || '验证码已发送到您的邮箱，请注意查收'
        });
        setCodeSent(true);
        setCodeCountdown(60); // 60秒倒计时
      } else {
        console.log('❌ RegisterPage: 验证码发送失败', response);
        setMessage({
          type: 'error',
          content: response.message || '验证码发送失败'
        });
      }
    } catch (error) {
      console.error('❌ RegisterPage: 发送验证码失败:', error);
      setMessage({
        type: 'error',
        content: error.message || '验证码发送失败，请稍后重试'
      });
    } finally {
      setCodeSending(false);
    }
  };

  /**
   * 处理表单提交
   * @param {Object} e - 事件对象
   */
  const handleSubmit = async (e) => {
    console.log('🚀 RegisterPage: handleSubmit 被调用', { formData, isSubmitting });
    e.preventDefault();
    
    // 表单验证
    console.log('📝 RegisterPage: 开始表单验证', formData);
    const validation = validateRegisterCodeForm(formData);
    console.log('✅ RegisterPage: 表单验证结果', validation);
    
    if (!validation.isValid) {
      console.log('❌ RegisterPage: 表单验证失败', validation.errors);
      setErrors(validation.errors);
      return;
    }
    
    console.log('🔄 RegisterPage: 开始API请求');
    setIsSubmitting(true);
    setMessage({ type: '', content: '' });
    
    try {
      console.log('🔑 RegisterPage: 调用注册API');
      const response = await register({
        email: formData.email,
        password: formData.password,
        code: formData.code
      });
      console.log('📡 RegisterPage: API响应', response);
      
      if (response.success) {
        console.log('✅ RegisterPage: 注册成功');
        setMessage({
          type: 'success',
          content: '注册成功！正在跳转到登录页面...'
        });
        
        // 注册成功后跳转到登录页面
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: '注册成功！请登录您的账户',
              email: formData.email
            }
          });
        }, 2000);
      } else {
        console.log('❌ RegisterPage: API返回失败', response);
        setMessage({
          type: 'error',
          content: response.message || '注册失败'
        });
      }
    } catch (error) {
      console.error('❌ RegisterPage: 注册失败:', error);
      setMessage({
        type: 'error',
        content: error.message || '注册失败，请重试'
      });
    } finally {
      console.log('🏁 RegisterPage: 请求完成，设置submitting为false');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          创建新账户
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          已有账户？{' '}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            立即登录
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
                邮箱地址 *
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

            {/* 验证码输入 */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                邮箱验证码 *
              </label>
              <div className="mt-1 flex space-x-3">
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  maxLength="6"
                  value={formData.code}
                  onChange={handleInputChange}
                  className={`appearance-none block flex-1 px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请输入6位验证码"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={codeSending || codeCountdown > 0 || isSubmitting || !formData.email}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white whitespace-nowrap ${
                    codeSending || codeCountdown > 0 || isSubmitting || !formData.email
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {codeSending ? '发送中...' : codeCountdown > 0 ? `${codeCountdown}秒` : '发送验证码'}
                </button>
              </div>
              {errors.code && (
                <p className="mt-2 text-sm text-red-600">{errors.code}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                验证码将发送到您的邮箱，有效期10分钟
              </p>
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码 *
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请输入密码（至少6位）"
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* 确认密码输入 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                确认密码 *
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请再次输入密码"
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* 提交按钮 */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    注册中...
                  </div>
                ) : (
                  '创建账户'
                )}
              </button>
            </div>
          </form>

          {/* 注册说明 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">注册须知</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                • 注册需要验证邮箱，请确保邮箱地址正确<br/>
                • 密码至少6位，建议包含字母和数字<br/>
                • 注册即表示您同意我们的服务条款和隐私政策<br/>
                • 我们承诺保护您的个人信息安全
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 