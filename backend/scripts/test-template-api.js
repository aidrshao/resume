#!/usr/bin/env node

/**
 * 测试模板API接口
 * 功能：测试获取模板列表和单个模板详情的API接口
 * 创建时间：2025-01-10
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/templates`;

/**
 * 测试获取模板列表接口
 * GET /api/templates
 */
async function testGetTemplatesList() {
    console.log('\n🔍 [测试] 获取模板列表接口');
    console.log('='.repeat(50));
    
    try {
        const response = await axios.get(API_URL);
        
        console.log('✅ 响应状态:', response.status);
        console.log('✅ 响应数据结构:', {
            success: response.data.success,
            dataType: Array.isArray(response.data.data) ? 'Array' : typeof response.data.data,
            dataLength: response.data.data?.length || 0,
            message: response.data.message
        });
        
        if (response.data.data && response.data.data.length > 0) {
            console.log('✅ 第一个模板的字段:', Object.keys(response.data.data[0]));
            console.log('✅ 第一个模板示例:', response.data.data[0]);
            
            // 验证字段
            const firstTemplate = response.data.data[0];
            const expectedFields = ['id', 'name', 'thumbnail_url'];
            const actualFields = Object.keys(firstTemplate);
            
            const hasRequiredFields = expectedFields.every(field => actualFields.includes(field));
            const hasUnwantedFields = actualFields.includes('html_content') || actualFields.includes('css_content');
            
            if (hasRequiredFields && !hasUnwantedFields) {
                console.log('✅ 字段验证通过：只包含 id, name, thumbnail_url');
            } else {
                console.log('❌ 字段验证失败：');
                console.log('  - 期望字段:', expectedFields);
                console.log('  - 实际字段:', actualFields);
                console.log('  - 是否包含不需要的字段:', hasUnwantedFields);
            }
        }
        
        return response.data.data;
        
    } catch (error) {
        console.error('❌ 获取模板列表失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
        return null;
    }
}

/**
 * 测试获取单个模板详情接口
 * GET /api/templates/:id
 */
async function testGetTemplateById(templateId) {
    console.log('\n🔍 [测试] 获取单个模板详情接口');
    console.log('='.repeat(50));
    
    try {
        const response = await axios.get(`${API_URL}/${templateId}`);
        
        console.log('✅ 响应状态:', response.status);
        console.log('✅ 响应数据结构:', {
            success: response.data.success,
            dataType: typeof response.data.data,
            message: response.data.message
        });
        
        if (response.data.data) {
            const template = response.data.data;
            const templateFields = Object.keys(template);
            console.log('✅ 模板字段:', templateFields);
            
            // 验证必需字段
            const requiredFields = ['id', 'name', 'html_content', 'css_content'];
            const hasRequiredFields = requiredFields.every(field => templateFields.includes(field));
            
            if (hasRequiredFields) {
                console.log('✅ 字段验证通过：包含所有必需字段');
                console.log('✅ html_content 长度:', template.html_content?.length || 0);
                console.log('✅ css_content 长度:', template.css_content?.length || 0);
            } else {
                console.log('❌ 字段验证失败：');
                console.log('  - 期望字段:', requiredFields);
                console.log('  - 实际字段:', templateFields);
            }
            
            // 显示模板基本信息
            console.log('✅ 模板基本信息:', {
                id: template.id,
                name: template.name,
                status: template.status,
                category: template.category,
                is_premium: template.is_premium
            });
        }
        
        return response.data.data;
        
    } catch (error) {
        console.error('❌ 获取模板详情失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
        return null;
    }
}

/**
 * 主测试函数
 */
async function runTests() {
    console.log('🚀 开始测试简历模板API接口');
    console.log('🔗 API地址:', API_URL);
    
    // 测试获取模板列表
    const templatesList = await testGetTemplatesList();
    
    if (templatesList && templatesList.length > 0) {
        // 测试获取单个模板详情
        const firstTemplateId = templatesList[0].id;
        await testGetTemplateById(firstTemplateId);
    } else {
        console.log('⚠️  没有模板数据，跳过单个模板测试');
    }
    
    console.log('\n🎉 测试完成！');
}

// 运行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testGetTemplatesList,
    testGetTemplateById
}; 