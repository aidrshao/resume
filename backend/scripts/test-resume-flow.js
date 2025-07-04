/**
 * 完整的简历预览流程测试
 * 测试从登录到获取专属简历、模板选择的完整流程
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

/**
 * 测试完整的简历预览流程
 */
async function testResumePreviewFlow() {
  console.log('🚀 开始测试简历预览流程...\n');
  
  let token = null;
  
  try {
    // 步骤1: 获取测试用户token
    console.log('1️⃣ 尝试登录获取token...');
    
    // 尝试多个测试用户
    const testUsers = [
      { email: 'admin@admin.com', password: 'admin123' },
      { email: 'test@test.com', password: 'test123' },
      { email: 'user@test.com', password: 'password123' }
    ];
    
    for (const user of testUsers) {
      try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, user);
        if (loginResponse.data.success) {
          token = loginResponse.data.data.token;
          console.log(`✅ 登录成功: ${user.email}`);
          console.log(`📝 Token: ${token.substring(0, 20)}...`);
          break;
        }
      } catch (error) {
        console.log(`❌ ${user.email} 登录失败`);
      }
    }
    
    if (!token) {
      console.error('❌ 所有测试用户登录失败，无法继续测试');
      return;
    }
    
    // 步骤2: 获取专属简历列表
    console.log('\n2️⃣ 获取专属简历列表...');
    const customizedResumesResponse = await axios.get(`${BASE_URL}/customized-resumes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📊 专属简历列表响应:', {
      success: customizedResumesResponse.data.success,
      count: customizedResumesResponse.data.data?.length || 0
    });
    
    if (!customizedResumesResponse.data.success || customizedResumesResponse.data.data.length === 0) {
      console.log('⚠️ 没有专属简历，无法测试详情获取');
      return;
    }
    
    // 步骤3: 获取第一个专属简历的详情
    const firstResumeId = customizedResumesResponse.data.data[0].id;
    console.log(`\n3️⃣ 获取专属简历详情 (ID: ${firstResumeId})...`);
    
    const resumeDetailResponse = await axios.get(`${BASE_URL}/customized-resumes/${firstResumeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📊 专属简历详情响应:', {
      success: resumeDetailResponse.data.success,
      hasData: !!resumeDetailResponse.data.data,
      hasOptimizedData: !!resumeDetailResponse.data.data?.optimized_data,
      dataKeys: resumeDetailResponse.data.data ? Object.keys(resumeDetailResponse.data.data) : 'N/A'
    });
    
    if (resumeDetailResponse.data.data?.optimized_data) {
      console.log('📋 优化数据结构:', {
        profile: resumeDetailResponse.data.data.optimized_data.profile ? {
          name: resumeDetailResponse.data.data.optimized_data.profile.name,
          keys: Object.keys(resumeDetailResponse.data.data.optimized_data.profile)
        } : 'N/A',
        workExperience: resumeDetailResponse.data.data.optimized_data.workExperience?.length || 0,
        education: resumeDetailResponse.data.data.optimized_data.education?.length || 0,
        skills: resumeDetailResponse.data.data.optimized_data.skills?.length || 0
      });
    }
    
    // 步骤4: 获取模板列表
    console.log('\n4️⃣ 获取模板列表...');
    const templatesResponse = await axios.get(`${BASE_URL}/templates`);
    
    console.log('📊 模板列表响应:', {
      success: templatesResponse.data.success,
      count: templatesResponse.data.data?.length || 0,
      templates: templatesResponse.data.data?.map(t => ({ id: t.id, name: t.name })) || []
    });
    
    if (!templatesResponse.data.success || templatesResponse.data.data.length === 0) {
      console.log('⚠️ 没有可用模板');
      return;
    }
    
    // 步骤5: 获取第一个模板的详情
    const firstTemplateId = templatesResponse.data.data[0].id;
    console.log(`\n5️⃣ 获取模板详情 (ID: ${firstTemplateId})...`);
    
    const templateDetailResponse = await axios.get(`${BASE_URL}/templates/${firstTemplateId}`);
    
    console.log('📊 模板详情响应:', {
      success: templateDetailResponse.data.success,
      hasData: !!templateDetailResponse.data.data,
      templateName: templateDetailResponse.data.data?.name || 'N/A',
      hasHtmlContent: !!templateDetailResponse.data.data?.html_content,
      hasCssContent: !!templateDetailResponse.data.data?.css_content,
      htmlLength: templateDetailResponse.data.data?.html_content?.length || 0,
      cssLength: templateDetailResponse.data.data?.css_content?.length || 0
    });
    
    // 步骤6: 模拟前端的数据处理
    console.log('\n6️⃣ 模拟前端数据处理...');
    
    const resumeData = resumeDetailResponse.data.data.optimized_data || resumeDetailResponse.data.data.optimizedData;
    const templateData = templateDetailResponse.data.data;
    
    console.log('🔍 前端数据状态检查:', {
      hasResumeData: !!resumeData,
      hasTemplateData: !!templateData,
      resumeDataValid: resumeData && typeof resumeData === 'object' && resumeData.profile,
      templateDataValid: templateData && templateData.html_content && templateData.css_content,
      readyForRender: !!(resumeData && templateData && resumeData.profile && templateData.html_content)
    });
    
    if (resumeData && resumeData.profile) {
      console.log('👤 简历数据预览:', {
        name: resumeData.profile.name,
        email: resumeData.profile.email,
        phone: resumeData.profile.phone
      });
    }
    
    console.log('\n✅ 简历预览流程测试完成！');
    
    // 返回测试数据供进一步调试
    return {
      token,
      resumeId: firstResumeId,
      templateId: firstTemplateId,
      resumeData,
      templateData
    };
    
  } catch (error) {
    console.error('❌ 测试流程失败:', error.message);
    if (error.response) {
      console.error('📊 错误响应:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    console.error('📊 错误详情:', error.stack);
  }
}

// 运行测试
testResumePreviewFlow().then(result => {
  if (result) {
    console.log('\n🎯 测试结果可用于进一步调试');
  }
}).catch(error => {
  console.error('❌ 测试脚本执行失败:', error);
}); 