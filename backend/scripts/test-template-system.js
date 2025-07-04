/**
 * 模板管理系统测试脚本
 * 功能：测试模板CRUD操作和API端点
 * 使用方法：node scripts/test-template-system.js
 */

require('dotenv').config();
const Template = require('../models/Template');
const axios = require('axios');

/**
 * 测试数据
 */
const testTemplateData = {
  name: '测试模板',
  html_content: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>简历模板</title>
    </head>
    <body>
        <div class="resume-container">
            <h1>{{name}}</h1>
            <p>邮箱：{{email}}</p>
            <p>电话：{{phone}}</p>
        </div>
    </body>
    </html>
  `,
  css_content: `
    .resume-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        font-family: Arial, sans-serif;
    }
    h1 {
        color: #333;
        border-bottom: 2px solid #007bff;
        padding-bottom: 10px;
    }
    p {
        margin: 10px 0;
        color: #666;
    }
  `,
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  is_premium: false,
  status: 'draft',
  category: 'general',
  description: '这是一个测试用的简历模板',
  sort_order: 1
};

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始模板管理系统测试...\n');
  
  const templateModel = new Template();
  let testTemplateId = null;
  
  try {
    // 测试1: 创建模板
    console.log('📝 测试1: 创建模板');
    const createdTemplate = await templateModel.createTemplate(testTemplateData);
    testTemplateId = createdTemplate.id;
    console.log('✅ 模板创建成功:', {
      id: createdTemplate.id,
      name: createdTemplate.name,
      status: createdTemplate.status
    });
    
    // 测试2: 获取单个模板
    console.log('\n📖 测试2: 获取单个模板');
    const retrievedTemplate = await templateModel.getTemplateById(testTemplateId);
    console.log('✅ 模板获取成功:', {
      id: retrievedTemplate.id,
      name: retrievedTemplate.name,
      hasHtmlContent: !!retrievedTemplate.html_content,
      hasCssContent: !!retrievedTemplate.css_content
    });
    
    // 测试3: 更新模板
    console.log('\n✏️ 测试3: 更新模板');
    const updatedTemplate = await templateModel.updateTemplate(testTemplateId, {
      name: '更新后的测试模板',
      status: 'published',
      is_premium: true
    });
    console.log('✅ 模板更新成功:', {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      status: updatedTemplate.status,
      is_premium: updatedTemplate.is_premium
    });
    
    // 测试4: 获取已发布模板列表
    console.log('\n📋 测试4: 获取已发布模板列表');
    const publishedTemplates = await templateModel.getPublishedTemplates();
    console.log('✅ 已发布模板获取成功:', {
      count: publishedTemplates.length,
      templates: publishedTemplates.map(t => ({ id: t.id, name: t.name, status: t.status }))
    });
    
    // 测试5: 获取管理员模板列表（分页）
    console.log('\n📊 测试5: 获取管理员模板列表');
    const adminTemplates = await templateModel.getAllTemplates({ page: 1, limit: 10 });
    console.log('✅ 管理员模板列表获取成功:', {
      count: adminTemplates.templates.length,
      pagination: adminTemplates.pagination
    });
    
    // 测试6: 更新排序
    console.log('\n🔢 测试6: 更新模板排序');
    const sortedTemplate = await templateModel.updateSortOrder(testTemplateId, 10);
    console.log('✅ 模板排序更新成功:', {
      id: sortedTemplate.id,
      sort_order: sortedTemplate.sort_order
    });
    
    // 测试7: 获取分类列表
    console.log('\n📂 测试7: 获取分类列表');
    const categories = await templateModel.getCategories();
    console.log('✅ 分类列表获取成功:', categories);
    
    // 测试8: 获取统计信息
    console.log('\n📈 测试8: 获取统计信息');
    const statistics = await templateModel.getStatistics();
    console.log('✅ 统计信息获取成功:', statistics);
    
    // 测试9: 批量更新状态
    console.log('\n🔄 测试9: 批量更新状态');
    const batchResult = await templateModel.batchUpdateStatus([testTemplateId], 'archived');
    console.log('✅ 批量状态更新成功:', {
      updatedCount: batchResult
    });
    
    // 测试10: 删除模板
    console.log('\n🗑️ 测试10: 删除模板');
    const deleteResult = await templateModel.deleteTemplate(testTemplateId);
    console.log('✅ 模板删除成功:', {
      deleted: deleteResult
    });
    
    console.log('\n🎉 所有模板管理测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    
    // 清理：如果测试失败，尝试删除创建的测试数据
    if (testTemplateId) {
      try {
        await templateModel.deleteTemplate(testTemplateId);
        console.log('🧹 测试数据清理完成');
      } catch (cleanupError) {
        console.error('⚠️ 清理测试数据失败:', cleanupError);
      }
    }
    
    process.exit(1);
  }
}

/**
 * API端点测试
 */
async function testAPIEndpoints() {
  console.log('\n🔗 测试API端点...');
  
  const baseURL = process.env.API_BASE_URL || 'http://localhost:8000/api';
  
  try {
    // 测试获取已发布模板
    console.log('📡 测试 GET /templates');
    const publishedResponse = await axios.get(`${baseURL}/templates`);
    console.log('✅ API响应正常:', {
      status: publishedResponse.status,
      success: publishedResponse.data.success,
      dataLength: publishedResponse.data.data?.length || 0
    });
    
    console.log('🎉 API端点测试通过！');
    
  } catch (error) {
    console.error('❌ API测试失败:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// 执行测试
if (require.main === module) {
  runTests()
    .then(() => testAPIEndpoints())
    .then(() => {
      console.log('\n✨ 模板管理系统测试完成！');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testAPIEndpoints
};

/**
 * 测试模板系统完整流程
 * 验证模板API和渲染功能
 */

const BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3016';

async function testTemplateSystem() {
    console.log('🧪 开始测试模板系统...\n');

    try {
        // 1. 测试直接访问后端API
        console.log('1️⃣ 测试直接访问后端API...');
        const directResponse = await axios.get(`${BASE_URL}/api/templates`);
        console.log('✅ 直接访问成功:', directResponse.data);
        console.log('');

        // 2. 测试通过前端代理访问
        console.log('2️⃣ 测试通过前端代理访问...');
        const proxyResponse = await axios.get(`${FRONTEND_URL}/api/templates`);
        console.log('✅ 代理访问成功:', proxyResponse.data);
        console.log('');

        // 3. 测试获取模板详情
        if (directResponse.data.success && directResponse.data.data.length > 0) {
            const templateId = directResponse.data.data[0].id;
            console.log('3️⃣ 测试获取模板详情...');
            
            const detailResponse = await axios.get(`${BASE_URL}/api/templates/${templateId}`);
            console.log('✅ 获取模板详情成功');
            console.log('📋 模板信息:', {
                id: detailResponse.data.data.id,
                name: detailResponse.data.data.name,
                hasHtmlContent: !!detailResponse.data.data.html_content,
                hasCssContent: !!detailResponse.data.data.css_content,
                status: detailResponse.data.data.status
            });
            console.log('');
        }

        // 4. 测试带Authorization头的请求
        console.log('4️⃣ 测试带Authorization头的请求...');
        const authResponse = await axios.get(`${BASE_URL}/api/templates`, {
            headers: {
                'Authorization': 'Bearer test-token-123456'
            }
        });
        console.log('✅ 带Authorization头的请求成功:', authResponse.data);
        console.log('');

        console.log('🎉 所有测试通过！模板系统工作正常！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('📋 响应状态:', error.response.status);
            console.error('📋 响应数据:', error.response.data);
        }
    }
}

// 运行测试
testTemplateSystem(); 