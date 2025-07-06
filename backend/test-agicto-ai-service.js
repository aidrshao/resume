/**
 * agicto.cn AI服务专项测试
 * 测试密钥、连接、提示词和整个AI服务流程
 */

require('dotenv').config();
const OpenAI = require('openai');

class AgictoAITester {
  constructor() {
    // 检查API密钥 - 使用OPENAI_API_KEY以保持与项目配置一致
    this.hasAgictoKey = !!(process.env.OPENAI_API_KEY);
    
    console.log('🔍 [AGICTO_TEST] 初始化测试环境');
    console.log('🔍 [AGICTO_TEST] OPENAI_API_KEY 是否存在:', this.hasAgictoKey);
    
    if (!this.hasAgictoKey) {
      console.error('❌ [AGICTO_TEST] 未找到OPENAI_API_KEY，请确保.env文件中配置了密钥');
      process.exit(1);
    }

    // 显示密钥信息（脱敏）
    const keyPreview = process.env.OPENAI_API_KEY.substring(0, 8) + '...' + process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 8);
    console.log('🔍 [AGICTO_TEST] API密钥预览:', keyPreview);

    // 初始化agicto客户端
    this.agictoClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.agicto.cn/v1",
      timeout: 30000,
      maxRetries: 2
    });
    
    console.log('✅ [AGICTO_TEST] agicto.cn客户端初始化成功');
  }

  /**
   * 检查响应是否包含错误
   * @param {Object} response - API响应对象
   * @returns {boolean} 是否有错误
   */
  hasError(response) {
    if (response?.error) {
      console.error('❌ [API_ERROR] 发现错误响应:', response.error);
      return true;
    }
    return false;
  }

  /**
   * 安全地提取响应内容
   * @param {Object} response - API响应对象
   * @returns {string} 提取的内容
   */
  extractResponseContent(response) {
    console.log('🔍 [DEBUG] 响应对象键值:', Object.keys(response || {}));
    
    // 首先检查是否有错误
    if (this.hasError(response)) {
      throw new Error(`API错误: ${response.error.message}`);
    }
    
    // 尝试不同的响应结构
    if (response?.choices?.[0]?.message?.content) {
      console.log('✅ [DEBUG] 使用OpenAI标准格式: choices[0].message.content');
      return response.choices[0].message.content;
    }
    
    if (response?.choice?.message?.content) {
      console.log('✅ [DEBUG] 使用单数格式: choice.message.content');
      return response.choice.message.content;
    }
    
    if (response?.message?.content) {
      console.log('✅ [DEBUG] 使用简化格式: message.content');
      return response.message.content;
    }
    
    if (response?.content) {
      console.log('✅ [DEBUG] 使用直接格式: content');
      return response.content;
    }
    
    if (response?.data?.choices?.[0]?.message?.content) {
      console.log('✅ [DEBUG] 使用包装格式: data.choices[0].message.content');
      return response.data.choices[0].message.content;
    }
    
    if (response?.text) {
      console.log('✅ [DEBUG] 使用文本格式: text');
      return response.text;
    }
    
    if (response?.response) {
      console.log('✅ [DEBUG] 使用响应格式: response');
      return response.response;
    }
    
    // 如果都不匹配，抛出错误
    console.error('❌ [DEBUG] 无法识别响应格式');
    console.error('❌ [DEBUG] 完整响应结构:', JSON.stringify(response, null, 2));
    throw new Error('无法从响应中提取内容');
  }

  /**
   * 安全地提取使用统计信息
   * @param {Object} response - API响应对象
   * @returns {Object} 使用统计信息
   */
  extractUsageInfo(response) {
    if (response?.usage) {
      return response.usage;
    }
    if (response?.data?.usage) {
      return response.data.usage;
    }
    return null;
  }

  /**
   * 安全地提取模型信息
   * @param {Object} response - API响应对象
   * @returns {string} 模型名称
   */
  extractModelInfo(response) {
    if (response?.model) {
      return response.model;
    }
    if (response?.data?.model) {
      return response.data.model;
    }
    return '未知模型';
  }

  /**
   * 测试1：基本连接测试
   */
  async testBasicConnection() {
    console.log('\n🧪 [测试1] 开始基本连接测试...');
    
    try {
      const startTime = Date.now();
      
      const response = await this.agictoClient.chat.completions.create({
        model: "deepseek-v3",
        messages: [
          {
            role: "user",
            content: "你好，请回复：连接成功"
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      });

      const duration = Date.now() - startTime;
      const content = this.extractResponseContent(response);
      const usage = this.extractUsageInfo(response);
      const model = this.extractModelInfo(response);
      
      console.log('✅ [测试1] 连接成功！');
      console.log('✅ [测试1] 响应时间:', duration + 'ms');
      console.log('✅ [测试1] 响应内容:', content);
      console.log('✅ [测试1] 使用模型:', model);
      console.log('✅ [测试1] Token使用情况:', usage);

      return true;
    } catch (error) {
      console.error('❌ [测试1] 连接失败:', error.message);
      console.error('❌ [测试1] 错误详情:', error.response?.data || error);
      return false;
    }
  }

  /**
   * 测试2：简单聊天功能测试
   */
  async testChatFunction() {
    console.log('\n🧪 [测试2] 开始聊天功能测试...');
    
    try {
      const startTime = Date.now();
      
      const response = await this.agictoClient.chat.completions.create({
        model: "deepseek-v3",
        messages: [
          {
            role: "user",
            content: "请用中文回答：什么是人工智能？请用一句话概括。"
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      const duration = Date.now() - startTime;
      const content = this.extractResponseContent(response);
      const usage = this.extractUsageInfo(response);
      
      console.log('✅ [测试2] 聊天功能正常！');
      console.log('✅ [测试2] 响应时间:', duration + 'ms');
      console.log('✅ [测试2] 响应内容:', content);
      console.log('✅ [测试2] Token使用情况:', usage);

      return true;
    } catch (error) {
      console.error('❌ [测试2] 聊天功能失败:', error.message);
      console.error('❌ [测试2] 错误详情:', error.response?.data || error);
      return false;
    }
  }

  /**
   * 测试3：简历解析提示词测试
   */
  async testResumeParsingPrompt() {
    console.log('\n🧪 [测试3] 开始简历解析提示词测试...');
    
    const testResumeText = `
姓名：张三
电话：13800138000
邮箱：zhangsan@example.com
地址：北京市朝阳区

教育背景：
2017-2021 北京大学 计算机科学与技术 本科 GPA: 3.8

工作经验：
2021-2024 腾讯科技有限公司 软件工程师
- 负责微信小程序后端开发
- 完成用户管理系统重构，提升性能30%
- 协助团队完成多个重要项目

技能：
- 编程语言：JavaScript, Python, Java
- 框架：React, Node.js, Spring Boot
- 数据库：MySQL, MongoDB
`;

    const systemPrompt = `你是一个专业的简历解析助手。请将以下简历文本解析为标准化的JSON格式。

要求：
1. 输出标准的JSON格式
2. 包含所有重要信息：个人信息、教育背景、工作经验、技能等
3. 确保JSON格式完全正确，可以直接解析
4. 如果某些信息缺失，用空字符串或空数组填充

JSON结构示例：
{
  "profile": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "title": "",
    "summary": ""
  },
  "workExperience": [
    {
      "company": "",
      "position": "",
      "startDate": "",
      "endDate": "",
      "description": "",
      "achievements": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "major": "",
      "startDate": "",
      "endDate": "",
      "gpa": ""
    }
  ],
  "skills": [
    {
      "category": "",
      "items": []
    }
  ]
}

请严格按照JSON格式输出，不要添加任何额外的文字说明。`;

    try {
      const startTime = Date.now();
      
      const response = await this.agictoClient.chat.completions.create({
        model: "deepseek-v3",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `请解析以下简历：\n${testResumeText}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      const duration = Date.now() - startTime;
      const content = this.extractResponseContent(response);
      const usage = this.extractUsageInfo(response);
      
      console.log('✅ [测试3] 简历解析响应成功！');
      console.log('✅ [测试3] 响应时间:', duration + 'ms');
      console.log('✅ [测试3] Token使用情况:', usage);
      console.log('✅ [测试3] 原始响应长度:', content.length, '字符');
      
      // 尝试解析JSON
      try {
        const parsedJSON = JSON.parse(content);
        console.log('✅ [测试3] JSON解析成功！');
        console.log('✅ [测试3] 解析后的数据结构:');
        console.log(JSON.stringify(parsedJSON, null, 2));
        
        // 验证关键字段
        const profile = parsedJSON.profile;
        if (profile && profile.name && profile.email && profile.phone) {
          console.log('✅ [测试3] 关键个人信息提取成功');
          console.log('  - 姓名:', profile.name);
          console.log('  - 邮箱:', profile.email);
          console.log('  - 电话:', profile.phone);
        } else {
          console.log('⚠️ [测试3] 个人信息提取不完整');
        }
        
        if (parsedJSON.education && parsedJSON.education.length > 0) {
          console.log('✅ [测试3] 教育背景提取成功');
          console.log('  - 学校:', parsedJSON.education[0].institution);
          console.log('  - 专业:', parsedJSON.education[0].major);
        }
        
        if (parsedJSON.workExperience && parsedJSON.workExperience.length > 0) {
          console.log('✅ [测试3] 工作经验提取成功');
          console.log('  - 公司:', parsedJSON.workExperience[0].company);
          console.log('  - 职位:', parsedJSON.workExperience[0].position);
        }
        
        return true;
      } catch (jsonError) {
        console.error('❌ [测试3] JSON解析失败:', jsonError.message);
        console.error('❌ [测试3] 原始响应内容:');
        console.error(content);
        return false;
      }
      
    } catch (error) {
      console.error('❌ [测试3] 简历解析失败:', error.message);
      console.error('❌ [测试3] 错误详情:', error.response?.data || error);
      return false;
    }
  }

  /**
   * 测试4：复杂提示词测试
   */
  async testComplexPrompt() {
    console.log('\n🧪 [测试4] 开始复杂提示词测试...');
    
    const complexPrompt = `
你是一个专业的简历优化顾问。请基于以下简历内容，提供详细的优化建议。

简历内容：
姓名：李四
职位：前端开发工程师
经验：2年
技能：HTML, CSS, JavaScript

请从以下几个方面提供建议：
1. 简历结构优化
2. 技能描述改进
3. 工作经验突出
4. 项目经验补充
5. 整体表现力提升

请用中文回答，并提供具体的修改建议。每个建议都要包含：
- 问题分析
- 改进方案
- 预期效果

要求回答条理清晰，重点突出。
`;

    try {
      const startTime = Date.now();
      
      const response = await this.agictoClient.chat.completions.create({
        model: "deepseek-v3",
        messages: [
          {
            role: "user",
            content: complexPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      const duration = Date.now() - startTime;
      const content = this.extractResponseContent(response);
      const usage = this.extractUsageInfo(response);
      
      console.log('✅ [测试4] 复杂提示词响应成功！');
      console.log('✅ [测试4] 响应时间:', duration + 'ms');
      console.log('✅ [测试4] 响应内容长度:', content.length, '字符');
      console.log('✅ [测试4] Token使用情况:', usage);
      
      // 检查响应质量
      if (content.length > 200) {
        console.log('✅ [测试4] 响应内容丰富');
      } else {
        console.log('⚠️ [测试4] 响应内容偏短');
      }
      
      // 检查是否包含关键词
      const keywords = ['建议', '优化', '改进', '简历', '技能'];
      const foundKeywords = keywords.filter(keyword => content.includes(keyword));
      console.log('✅ [测试4] 找到相关关键词:', foundKeywords.length + '/' + keywords.length);
      
      console.log('✅ [测试4] 响应内容预览:');
      console.log(content.substring(0, 300) + '...');
      
      return true;
    } catch (error) {
      console.error('❌ [测试4] 复杂提示词测试失败:', error.message);
      console.error('❌ [测试4] 错误详情:', error.response?.data || error);
      return false;
    }
  }

  /**
   * 测试5：并发请求测试
   */
  async testConcurrentRequests() {
    console.log('\n🧪 [测试5] 开始并发请求测试...');
    
    const requests = [
      {
        model: "deepseek-v3",
        messages: [{ role: "user", content: "请说：测试1" }],
        max_tokens: 20
      },
      {
        model: "deepseek-v3",
        messages: [{ role: "user", content: "请说：测试2" }],
        max_tokens: 20
      },
      {
        model: "deepseek-v3",
        messages: [{ role: "user", content: "请说：测试3" }],
        max_tokens: 20
      }
    ];

    try {
      const startTime = Date.now();
      
      const promises = requests.map(request => 
        this.agictoClient.chat.completions.create(request)
      );
      
      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      console.log('✅ [测试5] 并发请求成功！');
      console.log('✅ [测试5] 总耗时:', duration + 'ms');
      console.log('✅ [测试5] 成功请求数:', responses.length);
      
      responses.forEach((response, index) => {
        const content = this.extractResponseContent(response);
        console.log(`✅ [测试5] 响应${index + 1}:`, content);
      });
      
      return true;
    } catch (error) {
      console.error('❌ [测试5] 并发请求失败:', error.message);
      console.error('❌ [测试5] 错误详情:', error.response?.data || error);
      return false;
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('\n🚀 [AGICTO_TEST] 开始agicto.cn AI服务全面测试\n');
    
    const results = [];
    const startTime = Date.now();
    
    // 执行所有测试
    results.push(await this.testBasicConnection());
    results.push(await this.testChatFunction());
    results.push(await this.testResumeParsingPrompt());
    results.push(await this.testComplexPrompt());
    results.push(await this.testConcurrentRequests());
    
    const totalDuration = Date.now() - startTime;
    const passedTests = results.filter(result => result === true).length;
    const totalTests = results.length;
    const passRate = Math.round((passedTests / totalTests) * 100);
    
    // 输出测试结果汇总
    console.log('\n📊 [AGICTO_TEST] 测试结果汇总');
    console.log('==========================================');
    console.log('✅ 通过测试:', passedTests);
    console.log('❌ 失败测试:', totalTests - passedTests);
    console.log('📈 通过率:', passRate + '%');
    console.log('⏱️ 总耗时:', totalDuration + 'ms');
    
    if (passRate === 100) {
      console.log('🎉 [AGICTO_TEST] 所有测试通过！agicto.cn AI服务工作正常');
    } else if (passRate >= 80) {
      console.log('⚠️ [AGICTO_TEST] 大部分测试通过，少量问题需要关注');
    } else {
      console.log('⚠️ [AGICTO_TEST] 部分测试失败，请检查相关问题');
    }
    
    return passRate;
  }
}

// 主函数
async function main() {
  try {
    const tester = new AgictoAITester();
    const result = await tester.runAllTests();
    
    process.exit(result === 100 ? 0 : 1);
  } catch (error) {
    console.error('💥 [AGICTO_TEST] 测试执行失败:', error);
    process.exit(1);
  }
}

// 运行测试
main();

module.exports = AgictoAITester; 