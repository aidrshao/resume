/**
 * AI服务
 * 集成DeepSeek和GPT-4o模型，提供文本生成和简历优化功能
 */

const OpenAI = require('openai');

class AIService {
  constructor() {
    // 使用成功验证的简化配置（移除timeout）
    this.agictoClient = new OpenAI({
      apiKey: process.env.AGICTO_API_KEY || "sk-NKLLp5aHrdNddfM5MXFuoagJXutv8QrPtMdnXy8oFEdTrAUk",
      baseURL: "https://api.agicto.cn/v1"
      // 移除timeout设置，使用默认值
    });

    // 备用官方OpenAI客户端
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "your-openai-api-key"
      // 移除timeout设置，使用默认值
    });
  }

  /**
   * 生成文本
   * @param {string} prompt - 提示词
   * @param {string} model - 模型类型 ('deepseek' | 'gpt')
   * @param {Object} options - 生成选项
   * @returns {Promise<string>} 生成的文本
   */
  async generateText(prompt, model = 'deepseek', options = {}) {
    const defaultOptions = {
      temperature: 0.7,
      max_tokens: 4000,
      timeout: 150000, // 增加超时时间到2.5分钟
      ...options
    };

    const errors = {};

    // 优先使用agicto.cn代理服务（更稳定）
    try {
      console.log(`🚀 优先使用agicto.cn代理服务 (${model})`);
      
      let primaryModel;
      if (model === 'deepseek') {
        primaryModel = 'deepseek-v3';
      } else if (model === 'gpt') {
        primaryModel = 'gpt-4o-2024-11-20'; // 使用最新的gpt-4o模型
      } else {
        throw new Error(`不支持的模型类型: ${model}`);
      }

      // 简化的API调用（移除Promise.race超时控制）
      const response = await this.agictoClient.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: primaryModel,
        temperature: defaultOptions.temperature,
        max_tokens: defaultOptions.max_tokens
      });

      console.log('✅ agicto.cn代理服务调用成功');

      // 检查是否有错误
      if (response.error) {
        throw new Error(`agicto API错误: ${response.error.message}`);
      }

      if (!response.choices || response.choices.length === 0) {
        throw new Error('agicto API返回空响应');
      }

      return response.choices[0].message.content;
      
    } catch (agictoError) {
      errors.agicto = `agicto API错误: ${agictoError.response?.data?.error?.message || agictoError.message}`;
      console.warn(`⚠️ agicto.cn代理失败，切换到官方OpenAI API: ${agictoError.message}`);
      
      // 只有当agicto失败时才使用官方OpenAI API
      try {
        console.log(`🔄 使用官方OpenAI API备用服务 (${model})`);
        
        let fallbackModel;
        if (model === 'deepseek') {
          fallbackModel = 'gpt-3.5-turbo'; // DeepSeek使用gpt-3.5-turbo作为备用
        } else if (model === 'gpt') {
          fallbackModel = 'gpt-4o'; // GPT使用gpt-4o
        }

        // 简化的备用API调用
        const response = await this.openaiClient.chat.completions.create({
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          model: fallbackModel,
          temperature: defaultOptions.temperature,
          max_tokens: defaultOptions.max_tokens
        });

        console.log('✅ 官方OpenAI API调用成功');

        if (!response.choices || response.choices.length === 0) {
          throw new Error('OpenAI API返回空响应');
        }

        return response.choices[0].message.content;
        
      } catch (openaiError) {
        errors.openai = openaiError.message;
        console.error(`❌ 官方OpenAI API失败:`, openaiError.message);
      }
    }

    // 所有API都失败了
    console.error(`❌ 所有AI服务都失败了:`, errors);
    throw new Error(`AI服务调用失败: agicto(${errors.agicto}) + openai(${errors.openai})`);
  }

  /**
   * 简历内容优化
   * @param {Object} resumeData - 简历数据
   * @param {string} targetCompany - 目标公司
   * @param {string} targetPosition - 目标岗位
   * @param {string} jobDescription - 岗位描述
   * @param {string} userRequirements - 用户额外要求
   * @returns {Promise<Object>} 优化后的简历数据
   */
  async optimizeResumeForJob(resumeData, targetCompany, targetPosition, jobDescription, userRequirements = '') {
    const prompt = `
你是一位拥有10年+经验的顶级简历优化专家和人力资源顾问。你深度理解不同行业的招聘偏好，善于挖掘候选人的亮点并精准匹配岗位要求。

## 📋 任务目标
为候选人优化简历，使其精准匹配目标岗位，大幅提升面试通过率。

## 🎯 目标岗位信息
- **目标公司**: ${targetCompany}
- **目标岗位**: ${targetPosition}
- **岗位描述**:
${jobDescription}

${userRequirements ? `## 🔥 用户特殊要求
${userRequirements}

` : ''}## 📊 当前简历数据
${JSON.stringify(resumeData, null, 2)}

## 🚀 优化策略与要求

### 1. 🎪 个人简介优化 (核心竞争力展示)
- **关键词匹配**: 精准嵌入岗位JD中的核心关键词和技能要求
- **价值定位**: 用2-3句话突出最匹配的核心竞争力和独特价值
- **成果量化**: 用具体数据展示过往成就 (如: 提升XX%效率、负责XX万用户产品)
- **行业洞察**: 体现对${targetCompany}所在行业和业务的理解
- **职业目标**: 明确表达与该岗位的契合度和发展规划
${userRequirements ? '- **个性化**: 重点突出用户特别强调的技能和经验亮点' : ''}

### 2. 💼 工作经历优化 (经验价值最大化)
- **STAR法则**: 用Situation-Task-Action-Result结构重写经历描述
- **相关性排序**: 将最匹配岗位要求的经历放在前面，调整时间线合理性
- **成果量化**: 每个经历至少包含2-3个量化成果 (数据、百分比、规模等)
- **技能映射**: 确保每段经历都能映射到岗位要求的核心技能
- **问题解决**: 突出解决复杂问题的能力和创新思维
- **团队协作**: 展现领导力和跨部门协作经验
${userRequirements ? '- **重点突出**: 根据用户要求调整经历描述的重点和角度' : ''}

### 3. 🏗️ 项目经历优化 (技术实力展示)
- **项目选择**: 优先展示与目标岗位技术栈和业务场景最匹配的项目
- **技术深度**: 详细描述使用的技术栈、架构设计和解决方案
- **业务价值**: 强调项目对业务的实际价值和影响
- **难点突破**: 重点描述遇到的技术难点和创新解决方案
- **团队角色**: 明确在项目中的角色定位和主要贡献
- **成果展示**: 用数据说话 (性能提升、用户增长、成本节约等)
${userRequirements ? '- **技术匹配**: 特别关注用户要求中提到的项目类型和技术栈' : ''}

### 4. 🛠️ 技能优化 (能力标签精准化)
- **优先级排序**: 将岗位要求的核心技能排在前面
- **技能分层**: 区分核心技能、相关技能和辅助技能
- **熟练度标注**: 对每个技能标注熟练程度 (精通/熟练/了解)
- **删繁就简**: 移除与岗位无关或过时的技能
- **新技能补充**: 基于经历合理推断并添加隐含的相关技能
- **行业适配**: 使用该行业和岗位的标准技能表述
${userRequirements ? '- **用户偏好**: 优先展示和强调用户特别要求的技能' : ''}

### 5. 🎓 教育背景优化
- **相关性**: 突出与岗位相关的专业课程、毕业设计或学术成果
- **成绩亮点**: 如有优异成绩或获奖经历，适当展示
- **持续学习**: 展示相关的培训、认证或自学经历

${userRequirements ? `### 6. 🌟 用户特殊要求处理
- **深度理解**: 仔细分析用户的特殊要求和关注重点
- **全面体现**: 在简历的各个模块中巧妙融入用户要求
- **重点突出**: 确保用户最关心的能力和经验得到充分展现
- **逻辑一致**: 保持整份简历的逻辑一致性和真实性

` : ''}## 📝 输出要求

1. **保持结构**: 严格保持原有JSON格式和字段结构
2. **内容真实**: 在原有经历基础上优化，不编造虚假信息
3. **语言精炼**: 使用简洁有力的专业表述
4. **关键词优化**: 自然融入岗位相关关键词，提高ATS通过率
5. **详细说明**: 在optimizations字段中详细说明每项优化的理由和效果

## 🎯 返回格式

请严格按照以下JSON格式返回，不要包含任何其他文字或解释：

{
  "personalInfo": {
    "name": "姓名",
    "phone": "电话", 
    "email": "邮箱",
    "location": "地址",
    "summary": "重新优化的个人简介，突出与${targetPosition}岗位的匹配度"
  },
  "educations": [...],
  "workExperiences": [...],
  "projects": [...],
  "skills": [...],
  "languages": [...],
  "optimizations": [
    "个人简介：基于${targetCompany}${targetPosition}岗位要求，重新定位核心竞争力...",
    "工作经历：将最相关的XX经历提前，用STAR法则重写描述...",
    "项目经历：突出XX技术栈项目，强调与目标岗位的技术匹配度...",
    "技能优化：重新排序技能标签，优先展示${targetPosition}核心技能...",
    "关键词优化：在各模块中自然融入岗位JD中的关键词...",
    "数据量化：为XX%的经历添加了具体的数据和成果指标..."
  ]
}
`;

    try {
      const response = await this.generateText(prompt, 'gpt', {
        temperature: 0.3, // 降低随机性，保持优化的一致性
        max_tokens: 6000
      });

      // 🔧 解析优化后的简历数据（使用解析简历的成功经验）
      let optimizedData;
      let rawContent = response;
      
      try {
        // 步骤1：基础清理
        console.log('🧹 开始JSON清理和解析...');
        let cleanedResponse = response
          .replace(/```json\n?|\n?```/g, '') // 移除代码块标记
          .replace(/^[^{]*/, '') // 移除开头的非JSON内容
          .replace(/[^}]*$/, '') // 移除结尾的非JSON内容
          .trim();
        
        console.log('📏 清理后JSON长度:', cleanedResponse.length);
        console.log('🔍 JSON开头100字符:', cleanedResponse.substring(0, 100));
        console.log('🔍 JSON结尾100字符:', cleanedResponse.substring(cleanedResponse.length - 100));
        
        optimizedData = JSON.parse(cleanedResponse);
        console.log('✅ 基础JSON解析成功');
        
      } catch (parseError) {
        console.error('❌ 基础JSON解析失败:', parseError.message);
        console.error('❌ 错误位置:', parseError.message.match(/position (\d+)/)?.[1] || '未知');
        
        try {
          // 步骤2：智能JSON修复
          console.log('🔧 开始智能JSON修复...');
          let fixedJson = this.smartFixJSON(rawContent);
          
          optimizedData = JSON.parse(fixedJson);
          console.log('✅ 智能修复解析成功');
          
        } catch (fixError) {
          console.error('❌ 智能修复失败:', fixError.message);
          
          try {
            // 步骤3：提取JSON片段
            console.log('🔧 尝试提取JSON片段...');
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              let extractedJson = jsonMatch[0];
              // 尝试修复常见的JSON错误
              extractedJson = this.repairCommonJSONErrors(extractedJson);
              
              optimizedData = JSON.parse(extractedJson);
              console.log('✅ JSON片段解析成功');
            } else {
              throw new Error('无法提取有效的JSON结构');
            }
            
          } catch (extractError) {
            console.error('❌ JSON片段解析失败:', extractError.message);
            console.error('📝 AI原始响应:', rawContent.substring(0, 1000) + '...');
            
            // 步骤4：使用原始简历数据作为回退
            console.warn('⚠️ 所有解析方法失败，使用原始简历数据');
            optimizedData = {
              ...resumeData,
              optimizations: ['AI优化解析失败，保持原始简历内容'],
              _parseError: true,
              _errorMessage: 'AI返回的JSON格式存在问题，已使用原始数据'
            };
          }
        }
      }
      
      // 验证关键字段
      if (!optimizedData.personalInfo) {
        console.warn('⚠️ 缺少个人信息字段，使用原始数据补充');
        optimizedData.personalInfo = resumeData.personalInfo || {};
      }
      
      console.log('📊 优化后简历字段:', Object.keys(optimizedData));
      console.log('📊 个人信息:', JSON.stringify(optimizedData.personalInfo, null, 2));

      return optimizedData;

    } catch (error) {
      console.error('简历优化失败:', error);
      throw new Error('简历AI优化失败');
    }
  }

  /**
   * 🔧 智能JSON修复（从解析简历的成功经验中学习）
   * @param {string} rawContent - 原始内容
   * @returns {string} 修复后的JSON字符串
   */
  smartFixJSON(rawContent) {
    console.log('🔧 [JSON修复] 开始智能修复...');
    
    // 提取最可能的JSON部分
    let jsonContent = rawContent;
    
    // 查找最外层的大括号
    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
    }
    
    // 修复常见的AI生成JSON问题
    jsonContent = jsonContent
      // 修复多余的逗号
      .replace(/,(\s*[}\]])/g, '$1')
      // 修复缺失的逗号（在对象或数组元素之间）
      .replace(/("\w+":\s*"[^"]*")\s*\n\s*(")/g, '$1,\n    $2')
      .replace(/(\]|\})\s*\n\s*(")/g, '$1,\n    $2')
      // 修复引号问题
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
      // 修复数组末尾的逗号
      .replace(/,(\s*\])/g, '$1')
      // 修复对象末尾的逗号
      .replace(/,(\s*\})/g, '$1');
    
    console.log('🔧 [JSON修复] 基础修复完成');
    return jsonContent;
  }

  /**
   * 🔧 修复常见JSON错误（从解析简历的成功经验中学习）
   * @param {string} jsonStr - JSON字符串
   * @returns {string} 修复后的JSON字符串
   */
  repairCommonJSONErrors(jsonStr) {
    console.log('🔧 [JSON修复] 修复常见错误...');
    
    let repaired = jsonStr;
    
    // 修复1：删除多余的逗号
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    // 修复2：在缺少逗号的地方添加逗号
    repaired = repaired.replace(/("|\]|\})(\s*\n\s*)("|\{|\[)/g, '$1,$2$3');
    
    // 修复3：修复未闭合的字符串
    const stringMatches = repaired.match(/"[^"]*$/gm);
    if (stringMatches) {
      repaired = repaired.replace(/"([^"]*?)$/gm, '"$1"');
    }
    
    // 修复4：修复未闭合的数组或对象
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    
    // 补充缺失的闭合括号
    if (openBraces > closeBraces) {
      repaired += '}'.repeat(openBraces - closeBraces);
    }
    if (openBrackets > closeBrackets) {
      repaired += ']'.repeat(openBrackets - closeBrackets);
    }
    
    console.log('🔧 [JSON修复] 常见错误修复完成');
    return repaired;
  }

  /**
   * 生成简历建议
   * @param {Object} resumeData - 简历数据
   * @returns {Promise<Array>} 建议列表
   */
  async generateResumeSuggestions(resumeData) {
    const prompt = `
请分析以下简历，提供专业的改进建议。

简历数据：
${JSON.stringify(resumeData, null, 2)}

请从以下几个维度分析并提供建议：

1. 内容完整性 - 检查是否缺少重要信息
2. 描述质量 - 工作和项目描述是否清晰、有说服力
3. 技能匹配 - 技能是否与经历匹配
4. 格式规范 - 时间、格式是否规范
5. 亮点挖掘 - 是否充分展现个人优势

请返回JSON格式的建议列表：
{
  "suggestions": [
    {
      "category": "建议类别",
      "priority": "high|medium|low",
      "title": "建议标题",
      "description": "详细建议内容",
      "section": "相关简历部分"
    }
  ]
}

只返回JSON，不要包含任何解释文字。
`;

    try {
      const response = await this.generateText(prompt, 'deepseek');
      
      let suggestions;
      try {
        const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        suggestions = JSON.parse(cleanedResponse);
      } catch (parseError) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI返回的建议不是有效的JSON格式');
        }
      }

      return suggestions.suggestions || [];

    } catch (error) {
      console.error('生成简历建议失败:', error);
      throw new Error('生成简历建议失败');
    }
  }

  /**
   * AI对话收集用户信息
   * @param {Array} conversationHistory - 对话历史
   * @param {string} userMessage - 用户消息
   * @param {Object} collectedInfo - 已收集的信息
   * @returns {Promise<Object>} 对话响应和更新的信息
   */
  async collectUserInfoByChat(conversationHistory, userMessage, collectedInfo = {}) {
    const prompt = `
你是一个专业的简历助手，正在通过对话收集用户的简历信息。

已收集的信息：
${JSON.stringify(collectedInfo, null, 2)}

对话历史：
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

用户最新消息：${userMessage}

请根据对话内容：
1. 提取用户提供的新信息
2. 更新已收集的信息
3. 生成下一个问题或回应

返回JSON格式：
{
  "response": "对用户的回应",
  "updatedInfo": {
    "personalInfo": { ... },
    "educations": [ ... ],
    "workExperiences": [ ... ],
    "projects": [ ... ],
    "skills": [ ... ],
    "languages": [ ... ]
  },
  "nextQuestion": "下一个要问的问题（如果信息收集完成则为null）",
  "isComplete": false,
  "completionPercentage": 0.6
}

注意：
- 保持友好、专业的对话语调
- 每次只问1-2个相关问题，不要让用户感到压力
- 根据用户的回答灵活调整问题顺序
- 如果信息收集完成，设置isComplete为true

只返回JSON，不要包含任何解释文字。
`;

    try {
      const response = await this.generateText(prompt, 'deepseek', {
        temperature: 0.8 // 提高对话的自然性
      });

      let chatResult;
      try {
        const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        chatResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          chatResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI对话返回的不是有效的JSON格式');
        }
      }

      return chatResult;

    } catch (error) {
      console.error('AI对话收集信息失败:', error);
      throw new Error('AI对话服务失败');
    }
  }

  // 演示模式代码已删除 - 统一使用真实AI API
}

// 创建单例实例
const aiService = new AIService();

module.exports = { aiService, AIService }; 