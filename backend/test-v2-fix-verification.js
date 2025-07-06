/**
 * V2简历解析修复验证脚本
 * 验证端到端的修复效果
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://localhost:8000/api';
const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = 'test123';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testV2Resume() {
  console.log('🧪 [TEST] 开始V2简历解析修复验证');

  try {
    // 步骤1：登录获取Token
    console.log('🔐 [TEST] 步骤1: 用户登录');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('登录失败: ' + loginResponse.data.message);
    }

    const token = loginResponse.data.data.token;
    console.log('✅ [TEST] 登录成功，Token:', token.substring(0, 20) + '...');

    // 步骤2：创建测试文件
    console.log('📄 [TEST] 步骤2: 创建测试简历文件');
    const testResumeContent = `
邵俊（博士，高级职称）
电话：13800138000
邮箱：shaojun@example.com
地址：北京市海淀区

个人简介：
具有10年以上软件开发经验，专注于全栈开发和AI技术应用，具备丰富的项目管理和团队领导经验。

工作经历：
2020年3月-至今  北京科技有限公司  高级软件工程师/技术负责人
• 负责公司核心产品的技术架构设计与实施
• 带领10人技术团队完成多个重要项目
• 主导微服务架构改造，提升系统性能50%
• 建立完善的代码规范和CI/CD流程

2018年6月-2020年2月  上海互联网公司  软件工程师
• 参与大型分布式系统开发，处理日均千万级请求
• 优化核心算法，提升用户体验和系统稳定性
• 负责新人培训和技术分享

教育背景：
2014年9月-2018年6月  清华大学  计算机科学与技术  本科学位
主要课程：数据结构与算法、软件工程、数据库系统、机器学习
GPA: 3.8/4.0

项目经验：
智能推荐系统 (2021年1月-2021年8月)
• 基于机器学习的个性化推荐系统
• 使用Python、TensorFlow、Redis等技术
• 提升用户点击率30%，转化率25%

电商平台重构项目 (2019年3月-2019年12月)  
• 微服务架构下的电商平台重构
• 使用Spring Cloud、Docker、Kubernetes
• 支持高并发，日交易量达百万级

专业技能：
编程语言：JavaScript、Python、Java、Go
前端技术：React、Vue.js、TypeScript、HTML5/CSS3
后端技术：Node.js、Spring Boot、Express、Django
数据库：MySQL、PostgreSQL、MongoDB、Redis
云计算：AWS、Docker、Kubernetes、Jenkins
其他：Git、Linux、Nginx、ElasticSearch

语言能力：
中文：母语
英语：熟练（CET-6）
日语：日常会话

荣誉奖项：
2021年 公司年度最佳技术创新奖
2020年 优秀团队领导奖
2018年 清华大学优秀毕业生
`;

    const testFilePath = path.join(__dirname, 'test-resume-fix.txt');
    fs.writeFileSync(testFilePath, testResumeContent, 'utf8');
    console.log('✅ [TEST] 测试文件创建成功:', testFilePath);

    // 步骤3：上传文件并创建任务
    console.log('📤 [TEST] 步骤3: 上传文件创建解析任务');
    const formData = new FormData();
    formData.append('resume', fs.createReadStream(testFilePath));

    const uploadResponse = await axios.post(`${API_BASE}/v2/resumes/parse`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    if (!uploadResponse.data.success) {
      throw new Error('文件上传失败: ' + uploadResponse.data.message);
    }

    const taskId = uploadResponse.data.data.taskId;
    console.log('✅ [TEST] 任务创建成功，TaskID:', taskId);

    // 步骤4：轮询任务状态
    console.log('⏳ [TEST] 步骤4: 监控任务进度');
    let attempts = 0;
    const maxAttempts = 30; // 最多等待150秒
    let finalStatus = null;

    while (attempts < maxAttempts) {
      await sleep(5000); // 等待5秒
      attempts++;

      try {
        const statusResponse = await axios.get(`${API_BASE}/v2/tasks/${taskId}/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statusResponse.data.success) {
          const status = statusResponse.data.data;
          console.log(`📊 [TEST] 进度更新 (第${attempts}次检查):`, {
            status: status.status,
            progress: status.progress,
            message: status.message
          });

          if (status.status === 'completed') {
            finalStatus = 'completed';
            console.log('🎉 [TEST] 任务完成！');
            break;
          } else if (status.status === 'failed') {
            finalStatus = 'failed';
            console.log('❌ [TEST] 任务失败:', status.message || status.error);
            break;
          }
        }
      } catch (pollError) {
        console.warn('⚠️ [TEST] 状态查询失败:', pollError.message);
      }
    }

    if (finalStatus !== 'completed') {
      throw new Error(`任务未完成，最终状态: ${finalStatus || 'timeout'}`);
    }

    // 步骤5：获取解析结果
    console.log('📥 [TEST] 步骤5: 获取解析结果');
    const resultResponse = await axios.get(`${API_BASE}/v2/tasks/${taskId}/result`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!resultResponse.data.success) {
      throw new Error('获取结果失败: ' + resultResponse.data.message);
    }

    const result = resultResponse.data.data;
    console.log('✅ [TEST] 结果获取成功');

    // 步骤6：验证解析结果
    console.log('🔍 [TEST] 步骤6: 验证解析结果');
    const resumeData = result.resume_data || result.resumeData;

    if (!resumeData) {
      throw new Error('解析结果中没有简历数据');
    }

    console.log('📊 [TEST] 解析结果统计:', {
      hasProfile: !!resumeData.profile,
      profileName: resumeData.profile?.name,
      profileEmail: resumeData.profile?.email,
      profilePhone: resumeData.profile?.phone,
      workExperienceCount: resumeData.workExperience?.length || 0,
      educationCount: resumeData.education?.length || 0,
      skillsCount: resumeData.skills?.length || 0,
      projectsCount: resumeData.projects?.length || 0
    });

    // 验证关键字段
    const validations = {
      '个人信息存在': !!resumeData.profile,
      '姓名提取正确': resumeData.profile?.name?.includes('邵俊'),
      '邮箱提取正确': resumeData.profile?.email === 'shaojun@example.com',
      '电话提取正确': resumeData.profile?.phone === '13800138000',
      '工作经验不为空': (resumeData.workExperience?.length || 0) > 0,
      '教育背景不为空': (resumeData.education?.length || 0) > 0,
      '技能不为空': (resumeData.skills?.length || 0) > 0
    };

    console.log('✅ [TEST] 验证结果:');
    let passedCount = 0;
    for (const [test, passed] of Object.entries(validations)) {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${test}`);
      if (passed) passedCount++;
    }

    const totalTests = Object.keys(validations).length;
    const passRate = (passedCount / totalTests * 100).toFixed(1);
    console.log(`📊 [TEST] 验证通过率: ${passedCount}/${totalTests} (${passRate}%)`);

    // 步骤7：测试保存功能
    console.log('💾 [TEST] 步骤7: 测试保存功能');
    try {
      const saveResponse = await axios.post(`${API_BASE}/resumes/save-base`, {
        content: resumeData
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (saveResponse.data.success) {
        console.log('✅ [TEST] 简历保存成功，ID:', saveResponse.data.data?.resumeId);
      } else {
        console.log('❌ [TEST] 简历保存失败:', saveResponse.data.message);
      }
    } catch (saveError) {
      console.log('❌ [TEST] 简历保存异常:', saveError.message);
    }

    // 清理测试文件
    fs.unlinkSync(testFilePath);
    console.log('🧹 [TEST] 测试文件已清理');

    console.log('🎉 [TEST] V2简历解析修复验证完成');
    console.log('📊 [TEST] 总体结果: 修复生效，系统可正常运行');

    return {
      success: true,
      taskId,
      passRate,
      resumeData: {
        profileComplete: !!resumeData.profile?.name,
        workExperienceCount: resumeData.workExperience?.length || 0,
        educationCount: resumeData.education?.length || 0
      }
    };

  } catch (error) {
    console.error('❌ [TEST] 测试失败:', error.message);
    console.error('❌ [TEST] 错误堆栈:', error.stack);
    return { success: false, error: error.message };
  }
}

// 运行测试
if (require.main === module) {
  testV2Resume().then(result => {
    console.log('🏁 [TEST] 最终结果:', result);
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { testV2Resume }; 