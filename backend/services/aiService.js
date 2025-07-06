/**
 * AI服务
 * 集成DeepSeek和GPT-4o模型，提供文本生成和简历优化功能
 */

const OpenAI = require('openai');
const AIPrompt = require('../models/AIPrompt');

class AIService {
  constructor() {
    // 🔧 修复的配置方案 - 使用OPENAI_API_KEY作为agicto.cn的密钥
    this.hasAgictoKey = !!(process.env.OPENAI_API_KEY);
    this.hasOpenaiKey = false; // 当前只使用agicto.cn代理服务
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    console.log('🤖 [AI_SERVICE] 初始化配置:', {
      hasAgictoKey: this.hasAgictoKey,
      hasOpenaiKey: this.hasOpenaiKey,
      isDevelopment: this.isDevelopment,
      environment: process.env.NODE_ENV || 'development'
    });

    // agicto.cn代理客户端 - 使用OPENAI_API_KEY
    if (this.hasAgictoKey) {
      this.agictoClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY, // 🔧 使用OPENAI_API_KEY
        baseURL: "https://api.agicto.cn/v1",
        timeout: 300000, // 🔧 设置客户端超时为5分钟
        maxRetries: 0 // 🔧 在客户端层面禁用重试，我们在上层处理重试
      });
      console.log('✅ [AI_SERVICE] agicto.cn客户端初始化成功，使用OPENAI_API_KEY');
      console.log('⏰ [AI_SERVICE] agicto.cn客户端超时设置: 5分钟');
    } else {
      console.log('⚠️ [AI_SERVICE] 未配置OPENAI_API_KEY，将跳过agicto.cn服务');
    }

    // 🔧 暂时禁用官方OpenAI客户端，专注使用agicto.cn
    console.log('ℹ️ [AI_SERVICE] 当前配置为仅使用agicto.cn代理服务');

    // 🔧 如果没有配置API密钥，启用开发模式模拟
    if (!this.hasAgictoKey) {
      console.log('🚧 [AI_SERVICE] 无可用API密钥，启用开发模式模拟');
      this.simulationMode = true;
    }
  }

  /**
   * 生成文本
   * @param {string} prompt - 提示词
   * @param {string} model - 模型类型 ('deepseek' | 'gpt')
   * @param {Object} options - 生成选项
   * @returns {Promise<string>} 生成的文本
   */
  async generateText(prompt, model = 'deepseek', options = {}) {
    const startTime = Date.now();
    const requestId = `AI_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    console.log(`🚀 [AI_CALL] ==> 开始AI文本生成`);
    console.log(`🚀 [AI_CALL] 请求ID: ${requestId}`);
    console.log(`🚀 [AI_CALL] 时间: ${new Date().toISOString()}`);
    console.log(`🚀 [AI_CALL] 模型: ${model}`);
    console.log(`🚀 [AI_CALL] 提示词长度: ${prompt.length} 字符`);
    
    // 🔧 彻底禁用模拟模式，绝对不允许返回假数据
    console.log(`🚀 [AI_CALL] 真实AI调用模式，不使用任何模拟数据`);
    
    const defaultOptions = {
      temperature: 0.7,
      max_tokens: 4000,
      timeout: 300000, // 🔧 增加到300秒（5分钟），给复杂简历解析充足时间
      maxRetries: 1, // 保持减少重试次数
      requestTimeout: 240000, // 🔧 增加到240秒（4分钟），匹配AI调用时间
      connectionTimeout: 30000, // 🔧 增加到30秒连接超时
      ...options
    };

    console.log(`🚀 [AI_CALL] 配置参数:`, {
      temperature: defaultOptions.temperature,
      max_tokens: defaultOptions.max_tokens,
      timeout: defaultOptions.timeout + 'ms',
      requestTimeout: defaultOptions.requestTimeout + 'ms',
      maxRetries: defaultOptions.maxRetries,
      hasAgictoKey: this.hasAgictoKey,
      hasOpenaiKey: this.hasOpenaiKey
    });

    // 🔧 添加全局超时保护
    const globalTimeout = new Promise((_, reject) => {
      setTimeout(() => {
        console.error(`⏰ [AI_CALL] 全局超时 (${defaultOptions.timeout}ms)，强制中断`);
        reject(new Error(`AI调用全局超时 (${defaultOptions.timeout}ms)`));
      }, defaultOptions.timeout);
    });

    try {
      // 🔧 使用Promise.race确保全局超时生效
      const result = await Promise.race([
        this.performAIGeneration(prompt, model, defaultOptions, requestId),
        globalTimeout
      ]);

      const totalDuration = Date.now() - startTime;
      console.log(`✅ [AI_CALL] 成功完成，总耗时: ${totalDuration}ms`);
      return result;

    } catch (error) {
      const failDuration = Date.now() - startTime;
      console.error(`❌ [AI_CALL] 失败，耗时: ${failDuration}ms，错误: ${error.message}`);
      
      // 🔧 AI失败时必须报错，绝对不使用模拟数据
      console.error(`❌ [AI_CALL] AI调用失败，拒绝返回模拟数据`);
      throw error;
    }
  }

  /**
   * 执行AI生成（内部方法）
   * @param {string} prompt - 提示词
   * @param {string} model - 模型类型
   * @param {Object} options - 配置选项
   * @param {string} requestId - 请求ID
   * @returns {Promise<string>} 生成结果
   */
  async performAIGeneration(prompt, model, options, requestId) {
    const errors = {};
    let attemptCount = 0;

    // 强化的重试机制包装器
    const callWithRetry = async (apiCall, serviceName, maxRetries = options.maxRetries) => {
      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        const attemptStartTime = Date.now();
        attemptCount++;
        
        try {
          console.log(`🔄 [AI_CALL] ${serviceName} 第${attempt}次尝试`);
          
          // 🔧 为每次尝试添加超时控制
          const attemptTimeout = new Promise((_, reject) => {
            setTimeout(() => {
              console.error(`⏰ [AI_CALL] ${serviceName} 第${attempt}次尝试超时`);
              reject(new Error(`${serviceName} 调用超时`));
            }, options.requestTimeout);
          });

          const result = await Promise.race([apiCall(), attemptTimeout]);
          
          const attemptDuration = Date.now() - attemptStartTime;
          console.log(`✅ [AI_CALL] ${serviceName} 成功，耗时: ${attemptDuration}ms`);
          
          return result;
          
        } catch (error) {
          const attemptDuration = Date.now() - attemptStartTime;
          console.error(`❌ [AI_CALL] ${serviceName} 第${attempt}次失败，耗时: ${attemptDuration}ms`);
          console.error(`❌ [AI_CALL] 错误:`, error.message);
          
          if (attempt === maxRetries + 1) {
            throw error;
          }
          
          // 🔧 快速重试，不等待
          console.log(`🔄 [AI_CALL] ${serviceName} 立即重试第${attempt + 1}次...`);
        }
      }
    };

    // === 优先使用agicto.cn代理服务 ===
    if (this.hasAgictoKey) {
      try {
        console.log(`🎯 [AI_CALL] 步骤1: 尝试agicto.cn代理服务`);
        
        let primaryModel;
        if (model === 'deepseek') {
          primaryModel = 'deepseek-v3';
        } else if (model === 'gpt') {
          primaryModel = 'gpt-4o-2024-11-20';
        } else {
          throw new Error(`不支持的模型类型: ${model}`);
        }

        console.log(`🎯 [AI_CALL] 使用模型: ${primaryModel}`);

        const result = await callWithRetry(async () => {
          const controller = new AbortController();
          // 🔧 移除提前中断逻辑，让SDK的timeout自然处理超时
          // const timeoutId = setTimeout(() => {
          //   console.warn(`⏰ [AI_CALL] agicto API调用即将超时，发送中断信号`);
          //   controller.abort();
          // }, options.requestTimeout - 2000);
          
          try {
            const response = await this.agictoClient.chat.completions.create({
              messages: [{ role: "user", content: prompt }],
              model: primaryModel,
              temperature: options.temperature,
              max_tokens: options.max_tokens
            }, { 
              signal: controller.signal,
              timeout: options.requestTimeout // 🔧 修复：使用完整的请求超时时间，不是连接超时
            });

            // clearTimeout(timeoutId); // 🔧 已移除timeout，无需清理

            // 🔧 优先检查错误字段
            if (response.error) {
              const errorMsg = response.error.message || 'API返回未知错误';
              if (errorMsg.includes('key from the platform')) {
                throw new Error(`API密钥无效: ${errorMsg}`);
              } else {
                throw new Error(`agicto API错误: ${errorMsg}`);
              }
            }

            if (!response.choices || response.choices.length === 0) {
              throw new Error('agicto API返回空响应（无choices字段）');
            }

            return response.choices[0].message.content;
          } catch (error) {
            // clearTimeout(timeoutId); // 🔧 已移除timeout，无需清理
            // 🔧 增强错误处理
            if (error.name === 'AbortError') {
              throw new Error('agicto API调用被中断');
            }
            throw error;
          }
        }, 'agicto', options.maxRetries);

        return result;
        
      } catch (agictoError) {
        errors.agicto = `agicto失败: ${agictoError.message}`;
        console.warn(`⚠️ [AI_CALL] agicto.cn失败: ${agictoError.message}`);
      }
    }

    // === 完全失败 ===
    console.error(`❌ [AI_CALL] agicto.cn AI服务失败`);
    console.error(`❌ [AI_CALL] 错误汇总:`, errors);
    
    // 🔧 修复：移除开发环境下的错误降级逻辑，让AI失败时正确报错
    console.error(`❌ [AI_CALL] AI调用失败，不使用模拟数据掩盖错误`);
    throw new Error(`agicto.cn AI服务不可用: ${JSON.stringify(errors)}`);
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
    console.log('🚀 [RESUME_OPTIMIZATION] 开始简历优化');
    console.log('📊 [RESUME_OPTIMIZATION] 参数:', { targetCompany, targetPosition });
    
    try {
      // 从提示词管理系统获取简历优化提示词
      const promptData = await AIPrompt.getRenderedPrompt('resume_optimization', {
        targetCompany,
        targetPosition,
        jobDescription,
        resumeData: JSON.stringify(resumeData, null, 2),
        userRequirements
      });

      console.log(`✅ [RESUME_OPTIMIZATION] 使用提示词: ${promptData.name}`);
      console.log(`📊 [RESUME_OPTIMIZATION] 模型: ${promptData.model_type}`);

      const prompt = promptData.renderedTemplate;

      // 使用配置的模型类型和参数
      const modelConfig = promptData.model_config || {};
      const response = await this.generateText(prompt, promptData.model_type, {
        temperature: modelConfig.temperature || 0.3,
        max_tokens: modelConfig.max_tokens || 6000,
        timeout: modelConfig.timeout || 150000
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

    } catch (promptError) {
      console.error('❌ [RESUME_OPTIMIZATION] 获取提示词失败:', promptError.message);
      console.warn('🔄 [RESUME_OPTIMIZATION] 回退到默认简历优化提示词');
      
      // 回退到默认的简历优化逻辑
      throw new Error('简历优化提示词不可用，请联系管理员检查提示词配置');
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
      .replace(/(\]|\})(\s*\n\s*)(")/g, '$1,\n    $2')
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
    console.log('🔍 [RESUME_SUGGESTIONS] 开始生成简历建议');
    
    try {
      // 从提示词管理系统获取简历建议提示词
      const promptData = await AIPrompt.getRenderedPrompt('resume_suggestions', {
        resumeData: JSON.stringify(resumeData, null, 2)
      });

      console.log(`✅ [RESUME_SUGGESTIONS] 使用提示词: ${promptData.name}`);
      console.log(`📊 [RESUME_SUGGESTIONS] 模型: ${promptData.model_type}`);

      const prompt = promptData.renderedTemplate;

      // 使用配置的模型类型和参数
      const modelConfig = promptData.model_config || {};
      const response = await this.generateText(prompt, promptData.model_type, {
        temperature: modelConfig.temperature || 0.7,
        max_tokens: modelConfig.max_tokens || 4000,
        timeout: modelConfig.timeout || 120000
      });
      
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

    } catch (promptError) {
      console.error('❌ [RESUME_SUGGESTIONS] 获取提示词失败:', promptError.message);
      console.warn('🔄 [RESUME_SUGGESTIONS] 回退到默认简历建议提示词');
      
      // 回退到默认的简历建议逻辑
      throw new Error('简历建议提示词不可用，请联系管理员检查提示词配置');
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
    console.log('💬 [USER_INFO_CHAT] 开始对话收集用户信息');
    
    try {
      // 从提示词管理系统获取用户信息收集提示词
      const promptData = await AIPrompt.getRenderedPrompt('user_info_collector', {
        collectedInfo: JSON.stringify(collectedInfo, null, 2),
        conversationHistory: JSON.stringify(conversationHistory),
        userMessage
      });

      console.log(`✅ [USER_INFO_CHAT] 使用提示词: ${promptData.name}`);
      console.log(`📊 [USER_INFO_CHAT] 模型: ${promptData.model_type}`);

      const prompt = promptData.renderedTemplate;

      // 使用配置的模型类型和参数
      const modelConfig = promptData.model_config || {};
      const response = await this.generateText(prompt, promptData.model_type, {
        temperature: modelConfig.temperature || 0.6,
        max_tokens: modelConfig.max_tokens || 3000,
        timeout: modelConfig.timeout || 90000
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

    } catch (promptError) {
      console.error('❌ [USER_INFO_CHAT] 获取提示词失败:', promptError.message);
      console.warn('🔄 [USER_INFO_CHAT] 回退到默认用户信息收集提示词');
      
      // 回退到默认的用户信息收集逻辑
      throw new Error('用户信息收集提示词不可用，请联系管理员检查提示词配置');
    }
  }

  // 演示模式代码已删除 - 统一使用真实AI API
}

// 创建单例实例
const aiService = new AIService();

module.exports = { aiService, AIService }; 