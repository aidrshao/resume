/**
 * React应用入口文件
 * 渲染主应用组件到DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// 临时移除StrictMode来测试性能
// 生产环境下StrictMode不会造成重复请求
root.render(<App />); 