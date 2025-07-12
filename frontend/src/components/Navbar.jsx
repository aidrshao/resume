/**
 * 全局导航栏组件 (v2.0 - 最终版)
 * 核心功能：
 * 1. 区分“已登录”和“未登录”两种状态。
 * 2. 已登录状态下，提供核心功能导航和用户头像下拉菜单。
 * 3. 采用现代化的、响应式的UI设计。
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';


// --- SVG 图标组件 ---
const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const Navbar = () => {
    const { user, logout } = useAuth();
    const isLoggedIn = !!user;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        navigate('/login');
    };

    const LoggedOutNav = () => (
        <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/login" className="text-gray-700 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-md">登录</Link>
            <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">免费注册</Link>
        </div>
    );

    const LoggedInNav = () => {
        if (!user) return null;

        const getInitials = (email) => {
            if (!email) return '?';
            const name = user.name;
            if (name) return name.charAt(0).toUpperCase();
            return email.charAt(0).toUpperCase();
        };

        // 构建头像URL，支持多种格式
        let avatarUrl;
        if (user.avatar_url) {
            // 如果有头像URL，检查是否是完整URL
            avatarUrl = user.avatar_url.startsWith('http') 
                ? user.avatar_url 
                : `http://localhost:8000${user.avatar_url}`;
        } else if (user.avatarUrl) {
            // 兼容旧格式
            avatarUrl = user.avatarUrl.startsWith('http') 
                ? user.avatarUrl 
                : `http://localhost:8000${user.avatarUrl}`;
        } else {
            // 使用默认头像
            avatarUrl = `https://ui-avatars.com/api/?name=${getInitials(user.email)}&background=6366F1&color=FFFFFF&size=100`;
        }

        return (
            <div className="flex items-center justify-between w-full">
                {/* 左侧导航链接 */}
                <div className="hidden md:flex items-center space-x-4 ml-10">
                    <Link to="/resumes" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">我的简历</Link>
                    <Link to="/jobs" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">岗位管理</Link>
                    <Link to="/my-plan" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">我的套餐</Link>
                </div>

                {/* 右侧用户操作区 */}
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        <img className="h-8 w-8 rounded-full object-cover" src={avatarUrl} alt="用户头像" />
                        <ChevronDownIcon />
                    </button>
                    
                    {isMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name || '未设置昵称'}</p>
                                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                </div>
                                <div className="py-1">
                                    <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">个人中心</Link>
                                    <Link to="/my-plan" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">我的套餐与配额</Link>
                                </div>
                                <div className="border-t border-gray-100"></div>
                                <div className="py-1">
                                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-700 hover:bg-gray-100" role="menuitem">
                                        退出登录
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold text-indigo-600">俊才AI</Link>
                    </div>
                    <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
                      {isLoggedIn ? <LoggedInNav /> : <LoggedOutNav />}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 