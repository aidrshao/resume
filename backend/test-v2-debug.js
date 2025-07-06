/**
 * V2简历解析流程完整测试脚本
 * 测试从结果获取API开始到前端跳转的整个流程
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const BASE_URL = 'http://localhost:8000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc1MTcxMDcyOCwiZXhwIjoxNzUyMzE1NTI4fQ.uZQrqhHDGEG9KWG6GUCwOXNXhQM1fFXFQJC7pFNDgTY';

// 测试用的任务ID（你需要替换为实际的任务ID）
const TEST_TASK_ID = ''; // 这里需要填入一个真实的任务ID

/**
 * 测试任务状态查询
 */
async function testTaskStatus(taskId) {
    console.log('\n=== 测试任务状态查询 ===');
    try {
        const response = await axios.get(`${BASE_URL}/api/v2/tasks/${taskId}/status`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        });
        
        console.log('✅ 任务状态查询成功:', {
            success: response.data.success,
            status: response.data.data?.status,
            progress: response.data.data?.progress,
            message: response.data.data?.message
        });
        
        return response.data;
    } catch (error) {
        console.error('❌ 任务状态查询失败:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message
        });
        throw error;
    }
}

/**
 * 测试任务结果获取
 */
async function testTaskResult(taskId) {
    console.log('\n=== 测试任务结果获取 ===');
    try {
        const response = await axios.get(`${BASE_URL}/api/v2/tasks/${taskId}/result`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        });
        
        console.log('✅ 任务结果获取成功:', {
            success: response.data.success,
            message: response.data.message,
            hasResumeData: !!(response.data.data?.resume_data),
            resumeDataKeys: response.data.data?.resume_data ? Object.keys(response.data.data.resume_data) : [],
            profileExists: !!(response.data.data?.resume_data?.profile)
        });
        
        // 详细日志
        if (response.data.data?.resume_data) {
            console.log('📊 简历数据结构:', JSON.stringify(response.data.data.resume_data, null, 2));
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ 任务结果获取失败:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            errorCode: error.response?.data?.error_code
        });
        throw error;
    }
}

/**
 * 测试数据保存
 */
async function testSaveResume(resumeData) {
    console.log('\n=== 测试数据保存 ===');
    try {
        const response = await axios.post(`${BASE_URL}/api/resumes/save-base`, {
            content: resumeData
        }, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 数据保存成功:', {
            success: response.data.success,
            resumeId: response.data.data?.resumeId
        });
        
        return response.data;
    } catch (error) {
        console.error('❌ 数据保存失败:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message
        });
        throw error;
    }
}

/**
 * 主测试函数
 */
async function runTest() {
    console.log('🚀 开始V2简历解析流程测试...');
    
    if (!TEST_TASK_ID) {
        console.error('❌ 请先设置TEST_TASK_ID变量');
        return;
    }
    
    try {
        // 1. 测试任务状态查询
        const statusResult = await testTaskStatus(TEST_TASK_ID);
        
        if (statusResult.data?.status !== 'completed') {
            console.warn('⚠️ 任务尚未完成，无法测试结果获取');
            return;
        }
        
        // 2. 测试任务结果获取
        const resultData = await testTaskResult(TEST_TASK_ID);
        
        if (resultData.data?.resume_data) {
            // 3. 测试数据保存
            await testSaveResume(resultData.data.resume_data);
        }
        
        console.log('\n✅ 所有测试完成！');
        
    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
    }
}

// 如果直接运行脚本
if (require.main === module) {
    runTest();
}

module.exports = { testTaskStatus, testTaskResult, testSaveResume }; 