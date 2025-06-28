/**
 * AI服务
 * 集成DeepSeek和GPT-4o模型，提供文本生成和简历优化功能
 */

const OpenAI = require('openai');

class AIService {
  constructor() {
    // 初始化DeepSeek客户端
    this.deepseekClient = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || "your-deepseek-api-key",
      baseURL: "https://api.agicto.cn/v1"
    });

    // 初始化GPT客户端
    this.gptClient = new OpenAI({
      apiKey: process.env.GPT_API_KEY || process.env.OPENAI_API_KEY || "your-gpt-api-key",
      baseURL: "https://api.agicto.cn/v1"
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
    try {
      const defaultOptions = {
        temperature: 0.7,
        max_tokens: 4000,
        ...options
      };

      let client, modelName;
      
      if (model === 'deepseek') {
        client = this.deepseekClient;
        modelName = 'deepseek-v3';
      } else if (model === 'gpt') {
        client = this.gptClient;
        modelName = 'gpt-4o-2024-11-20';
      } else {
        throw new Error(`不支持的模型类型: ${model}`);
      }

      const response = await client.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: modelName,
        ...defaultOptions
      });

      console.log('AI API响应:', JSON.stringify(response, null, 2));

      // 检查是否有错误
      if (response.error) {
        console.error('AI API调用失败:', response.error);
        throw new Error(`AI API调用失败: ${response.error.message || 'Unknown error'}`);
      }

      if (!response.choices || response.choices.length === 0) {
        throw new Error('AI API返回空响应');
      }

      return response.choices[0].message.content;
      
    } catch (error) {
      console.error(`AI生成失败 (${model}):`, error);
      throw new Error(`AI服务调用失败: ${error.message}`);
    }
  }

  /**
   * 简历内容优化
   * @param {Object} resumeData - 简历数据
   * @param {string} targetCompany - 目标公司
   * @param {string} targetPosition - 目标岗位
   * @param {string} jobDescription - 岗位描述
   * @returns {Promise<Object>} 优化后的简历数据
   */
  async optimizeResumeForJob(resumeData, targetCompany, targetPosition, jobDescription) {
    const prompt = `
作为一名专业的简历优化专家，请根据目标岗位要求优化以下简历内容。

目标公司：${targetCompany}
目标岗位：${targetPosition}
岗位描述：
${jobDescription}

当前简历数据：
${JSON.stringify(resumeData, null, 2)}

请按照以下要求优化简历：

1. 个人简介优化：
   - 突出与目标岗位相关的技能和经验
   - 体现对目标公司和行业的了解
   - 展现职业目标与岗位的匹配度

2. 工作经历优化：
   - 重新组织工作描述，突出相关经验
   - 量化工作成果，使用具体数据
   - 调整技能标签，匹配岗位要求

3. 项目经历优化：
   - 突出与目标岗位相关的项目
   - 详细描述技术栈和解决方案
   - 强调项目成果和影响

4. 技能优化：
   - 重新排序技能，优先展示相关技能
   - 添加岗位要求的关键技能（如果简历中有体现）
   - 移除不相关的技能

请返回优化后的完整简历数据，保持原有的JSON结构，并在最后添加一个optimizations字段，说明具体做了哪些优化。

返回格式：
{
  "personalInfo": { ... },
  "educations": [ ... ],
  "workExperiences": [ ... ],
  "projects": [ ... ],
  "skills": [ ... ],
  "languages": [ ... ],
  "optimizations": [
    "优化说明1",
    "优化说明2",
    ...
  ]
}

只返回JSON，不要包含任何解释文字。
`;

    try {
      const response = await this.generateText(prompt, 'gpt', {
        temperature: 0.3, // 降低随机性，保持优化的一致性
        max_tokens: 6000
      });

      // 解析优化后的简历数据
      let optimizedData;
      try {
        const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        optimizedData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('简历优化结果JSON解析失败:', parseError);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          optimizedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI返回的简历优化结果不是有效的JSON格式');
        }
      }

      return optimizedData;

    } catch (error) {
      console.error('简历优化失败:', error);
      throw new Error('简历AI优化失败');
    }
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