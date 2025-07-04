/**
 * 简历解析服务
 * 负责解析PDF和Word文档，提取文本并进行结构化识别
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { aiService } = require('./aiService');

class ResumeParseService {
  /**
   * 解析简历文件
   * @param {string} filePath - 文件路径
   * @param {string} fileType - 文件类型 (pdf, docx, doc)
   * @returns {Promise<Object>} 解析结果
   */
  static async parseResumeFile(filePath, fileType) {
    try {
      console.log(`📄 开始解析简历文件: ${filePath}, 类型: ${fileType}`);
      
      // 🔒 参数安全检查：如果fileType无效，则根据文件扩展名自动推断类型
      if (!fileType || typeof fileType !== 'string') {
        console.warn('⚠️ [RESUME_PARSING] fileType无效，自动根据文件扩展名推断');
        const inferredExt = path.extname(filePath).toLowerCase();
        switch (inferredExt) {
          case '.pdf':
            fileType = 'pdf';
            break;
          case '.docx':
            fileType = 'docx';
            break;
          case '.doc':
            fileType = 'doc';
            break;
          case '.txt':
            fileType = 'txt';
            break;
          default:
            fileType = '';
        }
      }
      
      // 第一步：提取纯文本
      let extractedText = '';
      
      switch (fileType.toLowerCase()) {
        case 'pdf':
          extractedText = await this.extractTextFromPDF(filePath);
          break;
        case 'docx':
        case 'doc':
          extractedText = await this.extractTextFromWord(filePath);
          break;
        case 'txt':
          extractedText = await this.extractTextFromTXT(filePath);
          break;
        default:
          throw new Error(`不支持的文件类型: ${fileType}`);
      }
      
      console.log(`📝 文本提取完成，长度: ${extractedText.length}`);
      
      // 第二步：使用AI进行结构化识别
      const structuredData = await this.structureResumeText(extractedText);
      
      console.log('🧠 AI结构化识别完成');
      
      return {
        success: true,
        extractedText,
        structuredData
      };
      
    } catch (error) {
      console.error('❌ 简历解析失败:', error);
      return {
        success: false,
        error: error.message,
        extractedText: '',
        structuredData: null
      };
    }
  }

  /**
   * 从PDF文件提取文本
   * @param {string} filePath - PDF文件路径
   * @returns {Promise<string>} 提取的文本
   */
  static async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF文本提取失败:', error);
      throw new Error('PDF文件解析失败');
    }
  }

  /**
   * 从Word文档提取文本
   * @param {string} filePath - Word文档路径
   * @returns {Promise<string>} 提取的文本
   */
  static async extractTextFromWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Word文档文本提取失败:', error);
      throw new Error('Word文档解析失败');
    }
  }

  /**
   * 从TXT文件提取文本
   * @param {string} filePath - TXT文件路径
   * @returns {Promise<string>} 提取的文本
   */
  static async extractTextFromTXT(filePath) {
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      return text;
    } catch (error) {
      console.error('TXT文件读取失败:', error);
      throw new Error('TXT文件读取失败');
    }
  }

  /**
   * 使用AI对简历文本进行结构化识别
   * @param {string} text - 简历文本
   * @returns {Promise<Object>} 结构化数据
   */
  static async structureResumeText(text) {
    const AIPrompt = require('../models/AIPrompt');
    
    let prompt;
    let modelType = 'deepseek';
    let modelConfig = {};
    
    try {
      // 从提示词管理系统获取简历解析提示词
      const promptData = await AIPrompt.getRenderedPrompt('resume_parsing', {
        resumeText: text
      });

      console.log(`✅ [RESUME_PARSING] 使用提示词: ${promptData.name}`);
      console.log(`📊 [RESUME_PARSING] 模型: ${promptData.model_type}`);

      prompt = promptData.renderedTemplate;
      modelType = promptData.model_type;
      modelConfig = promptData.model_config || {};

    } catch (promptError) {
      console.error('❌ [RESUME_PARSING] 获取提示词失败:', promptError.message);
      console.warn('🔄 [RESUME_PARSING] 回退到默认简历解析提示词');
      
      // 回退到硬编码提示词（使用新的统一格式）
      prompt = `角色：你是一个专业的简历解析专家，请仔细分析以下简历文本，提取所有可能的结构化信息。

简历文本内容：
${text}

解析步骤：

识别个人基本信息： 姓名、手机、邮箱、地址、个人简介、作品集、领英等。

识别教育背景： 学校、专业、学位、时间等。

识别工作经历： 公司、职位、时间、详细工作描述等。每个经历单独提取。

识别项目经验： 项目名称、角色、时间、详细项目描述、项目链接等。

识别技能信息： 编程语言、技术栈、工具、软技能等。

识别其他信息： 对于无法归类的模块（如获奖、出版物），提取其标题和内容。

重要提取规则：

完整性： 必须完整提取工作和项目经历的详细描述，并用\\n分隔要点，存入description字段。

分类： 尽可能将技能按类别分组。无法归类的其他信息放入customSections。

格式： 只返回一个严格遵循以下UNIFIED_RESUME_SCHEMA格式的JSON对象，不要包含任何其他文字。

返回JSON格式：

{
  "profile": { "name": "string", "email": "string", "phone": "string", "location": "string", "portfolio": "string", "linkedin": "string", "summary": "string" },
  "workExperience": [ { "company": "string", "position": "string", "duration": "string", "description": "string" } ],
  "projectExperience": [ { "name": "string", "role": "string", "duration": "string", "description": "string", "url": "string" } ],
  "education": [ { "school": "string", "degree": "string", "major": "string", "duration": "string" } ],
  "skills": [ { "category": "string", "details": "string" } ],
  "customSections": [ { "title": "string", "content": "string" } ]
}

现在，请开始解析。`;
    }

    try {
      console.log('🧠 开始AI结构化识别，文本长度:', text.length);
      const response = await aiService.generateText(prompt, modelType, {
        temperature: 0.3, // 降低随机性，提高准确性
        max_tokens: 6000,
        timeout: parseInt(process.env.RESUME_AI_TIMEOUT) || 180000, // 简历解析专用超时: 3分钟
        maxRetries: parseInt(process.env.RESUME_MAX_RETRIES) || 3 // 简历解析专用重试次数
      });
      
      console.log('🤖 AI原始响应:', response.substring(0, 500) + '...');
      
      // 🔧 增强版JSON解析（多重容错处理）
      let structuredData;
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
        
        structuredData = JSON.parse(cleanedResponse);
        console.log('✅ 基础JSON解析成功');
        
      } catch (parseError) {
        console.error('❌ 基础JSON解析失败:', parseError.message);
        console.error('❌ 错误位置:', parseError.message.match(/position (\d+)/)?.[1] || '未知');
        
        try {
          // 步骤2：智能JSON修复
          console.log('🔧 开始智能JSON修复...');
          let fixedJson = this.smartFixJSON(rawContent);
          
          structuredData = JSON.parse(fixedJson);
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
              
              structuredData = JSON.parse(extractedJson);
              console.log('✅ JSON片段解析成功');
            } else {
              throw new Error('无法提取有效的JSON结构');
            }
            
          } catch (extractError) {
            console.error('❌ JSON片段解析失败:', extractError.message);
            console.error('📝 AI原始响应:', rawContent.substring(0, 1000) + '...');
            
            // 步骤4：创建默认结构
            console.warn('⚠️ 所有解析方法失败，创建基础结构');
            structuredData = this.createFallbackStructure();
          }
        }
      }
      
      // 验证必要字段
      if (!structuredData.profile) {
        console.warn('⚠️ [RESUME_PARSING] 未找到个人信息，添加默认结构');
        structuredData.profile = {};
      }
      
      console.log('📊 提取的个人信息:', JSON.stringify(structuredData.profile, null, 2));
      
      return structuredData;
      
    } catch (error) {
      console.error('💥 AI结构化识别失败:', error);
      throw new Error('简历内容结构化识别失败: ' + error.message);
    }
  }

  /**
   * 🔧 智能JSON修复
   * @param {string} rawContent - 原始内容
   * @returns {string} 修复后的JSON字符串
   */
  static smartFixJSON(rawContent) {
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
   * 🔧 修复常见JSON错误
   * @param {string} jsonStr - JSON字符串
   * @returns {string} 修复后的JSON字符串
   */
  static repairCommonJSONErrors(jsonStr) {
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
    
    // 添加缺失的闭合括号
    for (let i = 0; i < (openBrackets - closeBrackets); i++) {
      repaired += ']';
    }
    for (let i = 0; i < (openBraces - closeBraces); i++) {
      repaired += '}';
    }
    
    console.log('🔧 [JSON修复] 常见错误修复完成');
    return repaired;
  }

  /**
   * 创建降级数据结构（当AI解析失败时使用）
   * @returns {Object} 降级数据结构
   */
  static createFallbackStructure() {
    return {
      profile: {
        name: null,
        phone: null,
        email: null,
        location: null,
        summary: '简历解析遇到技术问题，请手动填写个人信息',
        portfolio: null,
        linkedin: null
      },
      education: [],
      workExperience: [],
      projectExperience: [],
      skills: [],
      customSections: [],
      _parseError: true,
      _errorMessage: 'AI返回的JSON格式存在问题，已创建默认结构'
    };
  }

  /**
   * 获取默认空简历数据结构
   * @returns {Object} 空简历数据
   */
  static getEmptyResumeData() {
    return {
      profile: {
        name: '',
        phone: '',
        email: '',
        location: '',
        portfolio: '',
        linkedin: '',
        summary: ''
      },
      workExperience: [],
      projectExperience: [],
      education: [],
      skills: [],
      customSections: []
    };
  }

  /**
   * 转换为兼容格式（用于向后兼容）
   * @param {Object} data 统一格式数据
   * @returns {Object} 兼容格式数据
   */
  static convertToCompatibleFormat(data) {
    return {
      profile: {
        name: data.profile?.name || null,
        phone: data.profile?.phone || null,
        email: data.profile?.email || null,
        location: data.profile?.location || null,
        portfolio: data.profile?.portfolio || null,
        linkedin: data.profile?.linkedin || null,
        summary: data.profile?.summary || null
      },
      education: Array.isArray(data.education) ? data.education.map(edu => ({
        school: edu.school || '',
        degree: edu.degree || '',
        major: edu.major || '',
        duration: edu.duration || '',
        gpa: edu.gpa || ''
      })) : [],
      workExperience: Array.isArray(data.workExperience) ? data.workExperience.map(work => ({
        company: work.company || '',
        position: work.position || '',
        duration: work.duration || '',
        description: work.description || ''
      })) : [],
      projectExperience: Array.isArray(data.projectExperience) ? data.projectExperience.map(project => ({
        name: project.name || '',
        role: project.role || '',
        duration: project.duration || '',
        description: project.description || '',
        url: project.url || ''
      })) : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      customSections: Array.isArray(data.customSections) ? data.customSections : []
    };
  }

  /**
   * 格式化日期
   * @param {string} dateStr - 日期字符串
   * @returns {string|null} 格式化后的日期
   */
  static formatDate(dateStr) {
    if (!dateStr) return null;
    
    // 尝试各种日期格式的匹配和转换
    const datePatterns = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/,  // YYYY-MM-DD
      /(\d{4})-(\d{1,2})/,           // YYYY-MM
      /(\d{4})年(\d{1,2})月/,        // YYYY年MM月
      /(\d{4})\.(\d{1,2})/,          // YYYY.MM
      /(\d{1,2})\/(\d{4})/,          // MM/YYYY
    ];
    
    for (const pattern of datePatterns) {
      const match = dateStr.match(pattern);
      if (match) {
        if (pattern.source.includes('年')) {
          return `${match[1]}-${match[2].padStart(2, '0')}`;
        } else if (pattern.source.includes('/') && match.length === 3) {
          return `${match[2]}-${match[1].padStart(2, '0')}`;
        } else {
          return match[0];
        }
      }
    }
    
    return dateStr; // 如果无法匹配，返回原始字符串
  }

  /**
   * 保存基础简历（统一格式）
   * @param {number} userId - 用户ID
   * @param {string} originalText - 原始文本
   * @param {Object} unifiedData - 统一格式的简历数据
   * @returns {Promise<Object>} 保存的简历对象
   */
  static async saveBaseResume(userId, originalText, unifiedData) {
    console.log('💾 [SAVE_BASE_RESUME] 开始保存基础简历...');
    console.log('📊 [SAVE_BASE_RESUME] 参数检查:', {
      userId,
      hasOriginalText: !!originalText,
      hasUnifiedData: !!unifiedData,
      hasProfile: !!(unifiedData && unifiedData.profile)
    });

    try {
      const { Resume } = require('../models/Resume');
      
      // 验证用户ID
      if (!userId || isNaN(userId)) {
        throw new Error('用户ID无效');
      }
      
      // 验证数据格式
      if (!unifiedData || !unifiedData.profile) {
        throw new Error('简历数据格式无效：缺少profile字段');
      }

      // 查询现有基础简历
      console.log('🔍 [SAVE_BASE_RESUME] 查询用户现有基础简历...');
      const existingBaseResume = await Resume.findBaseResumeByUserId(userId);
      
      let savedResume;
      const resumeTitle = `${unifiedData.profile.name || '用户'}的基础简历`;
      
      if (existingBaseResume) {
        // 更新现有基础简历
        console.log('🔄 [SAVE_BASE_RESUME] 更新现有基础简历，ID:', existingBaseResume.id);
        
        const updateData = {
          title: resumeTitle,
          generation_log: originalText, // 🔧 临时使用generation_log保存原始文本
          resume_data: JSON.stringify(unifiedData), // 手动转换为JSON字符串
          source: 'ai_parsed',
          updated_at: new Date()
        };
        
        await Resume.update(existingBaseResume.id, updateData);
        savedResume = await Resume.findById(existingBaseResume.id);
        
        console.log('✅ [SAVE_BASE_RESUME] 基础简历更新成功');
      } else {
        // 创建新的基础简历
        console.log('➕ [SAVE_BASE_RESUME] 创建新的基础简历...');
        
        const resumeInfo = {
          user_id: userId,
          title: resumeTitle,
          generation_log: originalText, // 🔧 临时使用generation_log保存原始文本
          resume_data: JSON.stringify(unifiedData), // 手动转换为JSON字符串
          template_id: 1, // 默认模板
          source: 'ai_parsed',
          is_base: true, // 标记为基础简历
          status: 'draft'
        };

        savedResume = await Resume.create(resumeInfo);
        console.log('✅ [SAVE_BASE_RESUME] 基础简历创建成功，ID:', savedResume.id);
      }

      // 保存用户详细信息
      console.log('👤 [SAVE_BASE_RESUME] 保存用户详细信息...');
      await this.saveUserProfileFromUnified(userId, unifiedData);
      console.log('✅ [SAVE_BASE_RESUME] 用户详细信息保存成功');

      return savedResume;
    } catch (error) {
      console.error('❌ [SAVE_BASE_RESUME] 保存基础简历失败:', error.message);
      throw error;
    }
  }

  /**
   * 从统一格式数据保存用户详细信息
   * @param {number} userId - 用户ID
   * @param {Object} unifiedData - 统一格式简历数据
   */
  static async saveUserProfileFromUnified(userId, unifiedData) {
    const knex = require('../config/database');
    
    try {
      const profile = unifiedData.profile || {};
      
      // 准备用户详细信息数据
      const userProfileData = {
        user_id: userId,
        full_name: profile.name || null,
        phone: profile.phone || null,
        email: profile.email || null,
        location: profile.location || null,
        portfolio_url: profile.portfolio || null,
        linkedin_url: profile.linkedin || null,
        summary: profile.summary || null,
        updated_at: new Date()
      };

      // 查询是否已存在用户详细信息
      const existingProfile = await knex('user_profiles')
        .where('user_id', userId)
        .first();

      if (existingProfile) {
        // 更新现有记录
        await knex('user_profiles')
          .where('user_id', userId)
          .update(userProfileData);
        console.log('✅ [USER_PROFILE] 用户详细信息更新成功');
      } else {
        // 创建新记录
        userProfileData.created_at = new Date();
        await knex('user_profiles').insert(userProfileData);
        console.log('✅ [USER_PROFILE] 用户详细信息创建成功');
      }
    } catch (error) {
      console.error('❌ [USER_PROFILE] 保存用户详细信息失败:', error.message);
      // 这里不抛出错误，避免影响主要的简历保存流程
      console.warn('⚠️ [USER_PROFILE] 继续简历保存流程...');
    }
  }
}

module.exports = ResumeParseService; 