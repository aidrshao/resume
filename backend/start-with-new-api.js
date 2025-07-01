#!/usr/bin/env node

/**
 * 使用新的API配置启动服务器
 * 临时脚本，用于更新AI服务配置
 */

// 设置新的环境变量
process.env.AGICTO_API_KEY = 'sk-NKLLp5aHrdNddfM5MXFuoagJXutv8QrPtMdnXy8oFEdTrAUk';
process.env.OPENAI_API_KEY = 'sk-NKLLp5aHrdNddfM5MXFuoagJXutv8QrPtMdnXy8oFEdTrAUk';

console.log('🚀 使用新的API配置启动服务器...');
console.log('📡 AGICTO_API_KEY:', process.env.AGICTO_API_KEY.substring(0, 20) + '...');

// 导入并启动服务器
require('./server.js'); 