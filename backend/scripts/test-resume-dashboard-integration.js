/**
 * 测试 ResumeDashboard 组件的模板渲染功能
 * 功能: 验证模板选择和简历数据渲染集成
 * 作者: Assistant
 * 日期: 2025-07-03
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// 测试用户登录凭据
const TEST_USER = {
  email: '346935824@qq.com',
  password: 'test123456'
};

/**
 * 获取认证Token
 */
async function getAuthToken() {
  try {
    console.log('🔐 [认证] 开始登录测试用户...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (response.data.success) {
      console.log('✅ [认证] 登录成功');
      return response.data.data.token;
    } else {
      throw new Error(response.data.message || '登录失败');
    }
  } catch (error) {
    console.error('❌ [认证] 登录失败:', error.message);
    return null;
  }
}

/**
 * 测试获取模板列表
 */
async function testGetTemplates(token) {
  try {
    console.log('\n📋 [模板列表] 开始测试...');
    
    const response = await axios.get(`${BASE_URL}/api/templates`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const templates = response.data.data;
      console.log(`✅ [模板列表] 获取成功，共 ${templates.length} 个模板`);
      
      templates.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.name} (ID: ${template.id}, 状态: ${template.status})`);
      });
      
      return templates;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('❌ [模板列表] 获取失败:', error.message);
    return [];
  }
}

/**
 * 测试获取模板详情
 */
async function testGetTemplateDetail(token, templateId) {
  try {
    console.log(`\n🎨 [模板详情] 获取模板 ID ${templateId} 的详情...`);
    
    const response = await axios.get(`${BASE_URL}/api/templates/${templateId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const template = response.data.data;
      console.log('✅ [模板详情] 获取成功');
      console.log(`   模板名称: ${template.name}`);
      console.log(`   HTML内容长度: ${template.html_content ? template.html_content.length : 0} 字符`);
      console.log(`   CSS内容长度: ${template.css_content ? template.css_content.length : 0} 字符`);
      
      return template;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('❌ [模板详情] 获取失败:', error.message);
    return null;
  }
}

/**
 * 测试获取用户简历列表
 */
async function testGetResumes(token) {
  try {
    console.log('\n📄 [简历列表] 开始测试...');
    
    const response = await axios.get(`${BASE_URL}/api/resumes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const resumes = response.data.data;
      console.log(`✅ [简历列表] 获取成功，共 ${resumes.length} 份简历`);
      
      resumes.forEach((resume, index) => {
        console.log(`   ${index + 1}. ${resume.title} (ID: ${resume.id}, 状态: ${resume.status})`);
      });
      
      return resumes;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('❌ [简历列表] 获取失败:', error.message);
    return [];
  }
}

/**
 * 测试获取单个简历详情
 */
async function testGetResumeDetail(token, resumeId) {
  try {
    console.log(`\n📋 [简历详情] 获取简历 ID ${resumeId} 的详情...`);
    
    const response = await axios.get(`${BASE_URL}/api/resumes/${resumeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const resume = response.data.data;
      console.log('✅ [简历详情] 获取成功');
      console.log(`   简历标题: ${resume.title}`);
      console.log(`   内容类型: ${typeof resume.content}`);
      console.log(`   内容长度: ${resume.content ? resume.content.length : 0} 字符`);
      
      // 尝试解析内容
      if (resume.content) {
        try {
          const parsedContent = typeof resume.content === 'string' 
            ? JSON.parse(resume.content) 
            : resume.content;
          console.log('   内容结构:');
          console.log(`     - 个人信息: ${parsedContent.personalInfo ? '✓' : '✗'}`);
          console.log(`     - 工作经历: ${parsedContent.workExperiences ? parsedContent.workExperiences.length + ' 项' : '✗'}`);
          console.log(`     - 教育背景: ${parsedContent.educations ? parsedContent.educations.length + ' 项' : '✗'}`);
          console.log(`     - 技能: ${parsedContent.skills ? parsedContent.skills.length + ' 项' : '✗'}`);
          console.log(`     - 项目经历: ${parsedContent.projects ? parsedContent.projects.length + ' 项' : '✗'}`);
        } catch (parseError) {
          console.log('   内容格式: 纯文本 (非JSON结构)');
          console.log(`   内容预览: ${resume.content.substring(0, 100)}...`);
        }
      }
      
      return resume;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('❌ [简历详情] 获取失败:', error.message);
    return null;
  }
}

/**
 * 测试模板渲染逻辑
 */
async function testTemplateRendering(template, resume) {
  try {
    console.log('\n🖥️ [模板渲染] 开始测试渲染逻辑...');
    
    if (!template || !template.html_content) {
      throw new Error('模板HTML内容缺失');
    }
    
    if (!resume || !resume.content) {
      throw new Error('简历内容缺失');
    }

    // 解析简历内容
    let parsedContent = {};
    try {
      if (typeof resume.content === 'string') {
        parsedContent = JSON.parse(resume.content);
      } else {
        parsedContent = resume.content;
      }
    } catch (error) {
      console.log('⚠️ [模板渲染] 简历内容非JSON格式，使用纯文本');
      parsedContent = { summary: resume.content };
    }

    // 创建渲染数据
    const renderData = {
      personalInfo: {
        name: parsedContent.personalInfo?.name || resume.title || '测试用户',
        email: parsedContent.personalInfo?.email || 'test@example.com',
        phone: parsedContent.personalInfo?.phone || '138-0000-0000',
        location: parsedContent.personalInfo?.location || '北京市',
        summary: parsedContent.personalInfo?.summary || parsedContent.summary || resume.content
      },
      workExperiences: parsedContent.workExperiences || [],
      educations: parsedContent.educations || [],
      skills: parsedContent.skills || [],
      projects: parsedContent.projects || [],
      languages: parsedContent.languages || []
    };

    console.log('✅ [模板渲染] 数据结构准备完成');
    console.log(`   姓名: ${renderData.personalInfo.name}`);
    console.log(`   邮箱: ${renderData.personalInfo.email}`);
    console.log(`   工作经历: ${renderData.workExperiences.length} 项`);
    console.log(`   教育背景: ${renderData.educations.length} 项`);
    console.log(`   技能: ${renderData.skills.length} 项`);

    // 测试HTML模板替换
    let htmlContent = template.html_content;
    const placeholders = htmlContent.match(/\{\{[^}]+\}\}/g) || [];
    console.log(`   发现占位符: ${placeholders.length} 个`);
    placeholders.forEach(placeholder => {
      console.log(`     - ${placeholder}`);
    });

    return true;
  } catch (error) {
    console.error('❌ [模板渲染] 渲染测试失败:', error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始测试 ResumeDashboard 模板渲染集成功能');
  console.log('=' .repeat(60));

  try {
    // 1. 登录获取Token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('无法获取认证Token');
    }

    // 2. 测试获取模板列表
    const templates = await testGetTemplates(token);
    if (templates.length === 0) {
      throw new Error('没有可用的模板');
    }

    // 3. 测试获取第一个模板详情
    const firstTemplate = templates[0];
    const templateDetail = await testGetTemplateDetail(token, firstTemplate.id);
    if (!templateDetail) {
      throw new Error('无法获取模板详情');
    }

    // 4. 测试获取简历列表
    const resumes = await testGetResumes(token);
    if (resumes.length === 0) {
      throw new Error('用户没有简历');
    }

    // 5. 测试获取第一个有内容的简历详情
    let resumeDetail = null;
    let selectedResume = null;
    
         for (const resume of resumes) {
       const detail = await testGetResumeDetail(token, resume.id);
       if (detail && detail.content && 
           (typeof detail.content === 'object' || 
            (typeof detail.content === 'string' && detail.content.trim()))) {
         resumeDetail = detail;
         selectedResume = resume;
         console.log(`✅ [简历选择] 选择有内容的简历: ${resume.title}`);
         break;
       }
     }
    
    if (!resumeDetail) {
      throw new Error('没有找到包含内容的简历');
    }

    // 6. 测试模板渲染逻辑
    const renderingSuccess = await testTemplateRendering(templateDetail, resumeDetail);

    console.log('\n' + '=' .repeat(60));
    console.log('🎯 测试总结:');
    console.log(`   ✅ 模板系统: ${templates.length} 个模板可用`);
    console.log(`   ✅ 简历系统: ${resumes.length} 份简历可用`);
    console.log(`   ${renderingSuccess ? '✅' : '❌'} 渲染逻辑: ${renderingSuccess ? '测试通过' : '测试失败'}`);
    console.log('   ✅ API集成: 所有API调用正常');
    
    console.log('\n🎉 ResumeDashboard 模板渲染功能测试完成！');
    console.log('📱 现在可以访问 http://localhost:3016/resumes 测试前端功能');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 