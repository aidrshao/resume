/**
 * AI服务
 * 集成DeepSeek和GPT-4o模型，提供文本生成和简历优化功能
 */

const OpenAI = require('openai');
const AIPrompt = require('../models/AIPrompt');

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
    const startTime = Date.now();
    const requestId = `AI_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    console.log(`🚀 [AI_CALL] ==> 开始AI文本生成`);
    console.log(`🚀 [AI_CALL] 请求ID: ${requestId}`);
    console.log(`🚀 [AI_CALL] 时间: ${new Date().toISOString()}`);
    console.log(`🚀 [AI_CALL] 模型: ${model}`);
    console.log(`🚀 [AI_CALL] 提示词长度: ${prompt.length} 字符`);
    
    const defaultOptions = {
      temperature: 0.7,
      max_tokens: 4000,
      timeout: parseInt(process.env.AI_TIMEOUT) || 120000, // 生产环境优化: 2分钟
      maxRetries: parseInt(process.env.AI_MAX_RETRIES) || 2, // 最大重试次数
      requestTimeout: parseInt(process.env.AI_REQUEST_TIMEOUT) || 90000, // 单次请求超时
      connectionTimeout: parseInt(process.env.AI_CONNECTION_TIMEOUT) || 30000, // 连接超时
      ...options
    };

    console.log(`🚀 [AI_CALL] 配置参数:`, {
      temperature: defaultOptions.temperature,
      max_tokens: defaultOptions.max_tokens,
      timeout: defaultOptions.timeout + 'ms',
      requestTimeout: defaultOptions.requestTimeout + 'ms',
      connectionTimeout: defaultOptions.connectionTimeout + 'ms',
      maxRetries: defaultOptions.maxRetries,
      environment: process.env.NODE_ENV || 'development'
    });

    const errors = {};
    let attemptCount = 0;

    // 重试机制包装器
    const callWithRetry = async (apiCall, serviceName, maxRetries = defaultOptions.maxRetries) => {
      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        const attemptStartTime = Date.now();
        attemptCount++;
        
        try {
          console.log(`🔄 [AI_CALL] ${serviceName} 第${attempt}次尝试 (总第${attemptCount}次)`);
          
          const result = await apiCall();
          
          const attemptDuration = Date.now() - attemptStartTime;
          console.log(`✅ [AI_CALL] ${serviceName} 第${attempt}次尝试成功，耗时: ${attemptDuration}ms`);
          
          return result;
          
        } catch (error) {
          const attemptDuration = Date.now() - attemptStartTime;
          console.error(`❌ [AI_CALL] ${serviceName} 第${attempt}次尝试失败，耗时: ${attemptDuration}ms`);
          console.error(`❌ [AI_CALL] 错误详情:`, error.message);
          
          if (attempt === maxRetries + 1) {
            throw error; // 最后一次尝试，直接抛出错误
          }
          
          // 指数退避重试延迟
          const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`⏳ [AI_CALL] ${serviceName} ${retryDelay}ms后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    };

    // === 优先使用agicto.cn代理服务 ===
    try {
      console.log(`🎯 [AI_CALL] 步骤1: 尝试agicto.cn代理服务`);
      const agictoStartTime = Date.now();
      
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
        // 使用Promise.race实现超时控制
        const apiPromise = this.agictoClient.chat.completions.create({
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

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`agicto API超时 (${defaultOptions.timeout}ms)`)), defaultOptions.timeout);
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);

        // 验证响应
        if (response.error) {
          throw new Error(`agicto API错误: ${response.error.message}`);
        }

        if (!response.choices || response.choices.length === 0) {
          throw new Error('agicto API返回空响应');
        }

        return response.choices[0].message.content;
      }, 'agicto', defaultOptions.maxRetries);

      const agictoDuration = Date.now() - agictoStartTime;
      const totalDuration = Date.now() - startTime;
      
      console.log(`✅ [AI_CALL] agicto.cn调用成功！`);
      console.log(`⏱️ [AI_PERFORMANCE] 性能统计:`);
      console.log(`  - agicto调用耗时: ${agictoDuration}ms`);
      console.log(`  - 总耗时: ${totalDuration}ms`);
      console.log(`  - 尝试次数: ${attemptCount}`);
      console.log(`  - 响应长度: ${result.length} 字符`);
      console.log(`  - 平均速度: ${(result.length / (totalDuration / 1000)).toFixed(1)} 字符/秒`);

      return result;
      
    } catch (agictoError) {
      const agictoFailDuration = Date.now() - startTime;
      errors.agicto = `agicto失败 (${agictoFailDuration}ms): ${agictoError.message}`;
      console.warn(`⚠️ [AI_CALL] agicto.cn代理失败，耗时: ${agictoFailDuration}ms`);
      console.warn(`⚠️ [AI_CALL] 错误: ${agictoError.message}`);
      console.warn(`⚠️ [AI_CALL] 切换到官方OpenAI API...`);
    }

    // === 备用: 官方OpenAI API ===
    try {
      console.log(`🔄 [AI_CALL] 步骤2: 尝试官方OpenAI API备用服务`);
      const openaiStartTime = Date.now();
      
      let fallbackModel;
      if (model === 'deepseek') {
        fallbackModel = 'gpt-3.5-turbo'; // DeepSeek使用gpt-3.5-turbo作为备用
      } else if (model === 'gpt') {
        fallbackModel = 'gpt-4o'; // GPT使用gpt-4o
      }

      console.log(`🔄 [AI_CALL] 备用模型: ${fallbackModel}`);

      const result = await callWithRetry(async () => {
        // 增加官方API的超时时间
        const extendedTimeout = defaultOptions.timeout * 1.5;
        
        const apiPromise = this.openaiClient.chat.completions.create({
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

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`OpenAI API超时 (${extendedTimeout}ms)`)), extendedTimeout);
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);

        if (!response.choices || response.choices.length === 0) {
          throw new Error('OpenAI API返回空响应');
        }

        return response.choices[0].message.content;
      }, 'OpenAI', Math.max(1, defaultOptions.maxRetries - 1)); // 备用API减少重试次数

      const openaiDuration = Date.now() - openaiStartTime;
      const totalDuration = Date.now() - startTime;
      
      console.log(`✅ [AI_CALL] 官方OpenAI API调用成功！`);
      console.log(`⏱️ [AI_PERFORMANCE] 性能统计:`);
      console.log(`  - OpenAI调用耗时: ${openaiDuration}ms`);
      console.log(`  - 总耗时(含agicto失败): ${totalDuration}ms`);
      console.log(`  - 总尝试次数: ${attemptCount}`);
      console.log(`  - 响应长度: ${result.length} 字符`);
      console.log(`  - 平均速度: ${(result.length / (totalDuration / 1000)).toFixed(1)} 字符/秒`);

      return result;
        
    } catch (openaiError) {
      const openaiFailDuration = Date.now() - startTime;
      errors.openai = `OpenAI失败 (${openaiFailDuration}ms): ${openaiError.message}`;
      console.error(`❌ [AI_CALL] 官方OpenAI API失败，耗时: ${openaiFailDuration}ms`);
      console.error(`❌ [AI_CALL] 错误: ${openaiError.message}`);
    }

    // === 所有API都失败 ===
    const totalFailDuration = Date.now() - startTime;
    console.error(`❌ [AI_CALL] 所有AI服务都失败！`);
    console.error(`❌ [AI_CALL] 总耗时: ${totalFailDuration}ms`);
    console.error(`❌ [AI_CALL] 总尝试次数: ${attemptCount}`);
    console.error(`❌ [AI_CALL] 错误汇总:`, errors);
    
    // 根据错误类型构造更友好的错误信息
    let userFriendlyError = 'AI服务暂时不可用';
    if (Object.values(errors).some(err => err.includes('超时'))) {
      userFriendlyError = `AI处理超时 (总耗时${(totalFailDuration/1000).toFixed(1)}秒)，请稍后重试或简化输入内容`;
    } else if (Object.values(errors).some(err => err.includes('网络'))) {
      userFriendlyError = 'AI服务网络连接异常，请检查网络连接后重试';
    } else if (Object.values(errors).some(err => err.includes('quota') || err.includes('limit'))) {
      userFriendlyError = 'AI服务配额不足，请联系管理员';
    }
    
    throw new Error(`${userFriendlyError}。详细错误: agicto(${errors.agicto}) + openai(${errors.openai})`);
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