/**
 * 测试认证流程和定制简历获取
 */

require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3016';

async function testAuthFlow() {
    console.log('🔐 开始测试认证流程...\n');

    try {
        // 1. 测试登录获取有效token
        console.log('1️⃣ 尝试登录获取有效token...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'user@example.com',
            password: 'password123'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ 登录成功');
            const token = loginResponse.data.data.token;
            console.log('📝 Token:', token.substring(0, 50) + '...');
            console.log('');
            
            // 2. 测试用有效token获取定制简历
            console.log('2️⃣ 使用有效token获取定制简历...');
            const resumeResponse = await axios.get(`${BASE_URL}/api/customized-resumes/5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (resumeResponse.data.success) {
                console.log('✅ 获取定制简历成功');
                console.log('📄 简历标题:', resumeResponse.data.data.base_resume_title);
                console.log('🎯 目标职位:', resumeResponse.data.data.job_title);
                console.log('');
            } else {
                console.log('❌ 获取定制简历失败:', resumeResponse.data.message);
            }
            
            // 3. 测试通过前端代理访问
            console.log('3️⃣ 通过前端代理访问...');
            const proxyResponse = await axios.get(`${FRONTEND_URL}/api/customized-resumes/5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (proxyResponse.data.success) {
                console.log('✅ 代理访问成功');
            } else {
                console.log('❌ 代理访问失败:', proxyResponse.data.message);
            }
            
        } else {
            console.log('❌ 登录失败:', loginResponse.data.message);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('📝 错误详情:', error.response.data);
        }
    }
}

// 测试用户创建
async function createTestUser() {
    console.log('👤 创建测试用户...');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, {
            email: 'user@example.com',
            password: 'password123'
        });
        
        if (response.data.success) {
            console.log('✅ 测试用户创建成功');
        } else {
            console.log('⚠️ 用户可能已存在:', response.data.message);
        }
    } catch (error) {
        console.log('⚠️ 用户创建失败（可能已存在）:', error.response?.data?.message || error.message);
    }
}

async function main() {
    await createTestUser();
    await testAuthFlow();
}

main(); 