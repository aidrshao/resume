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
    const extractId = `PDF_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      console.log(`📄 [${extractId}] =================== 开始PDF文本提取 ===================`);
      console.log(`📄 [${extractId}] 文件路径:`, filePath);
      
      // 检查文件是否存在
      const fs = require('fs');
      const fileExists = fs.existsSync(filePath);
      console.log(`📄 [${extractId}] 文件是否存在:`, fileExists);
      
      if (!fileExists) {
        throw new Error(`PDF文件不存在: ${filePath}`);
      }
      
      const fileStats = fs.statSync(filePath);
      console.log(`📄 [${extractId}] 文件大小:`, fileStats.size, 'bytes');
      console.log(`📄 [${extractId}] 文件修改时间:`, fileStats.mtime);
      
      // 读取文件缓冲区
      console.log(`📄 [${extractId}] 开始读取文件缓冲区...`);
      const dataBuffer = fs.readFileSync(filePath);
      console.log(`📄 [${extractId}] 缓冲区大小:`, dataBuffer.length, 'bytes');
      console.log(`📄 [${extractId}] 缓冲区前20字节:`, dataBuffer.slice(0, 20));
      
      // 检查PDF文件头
      const pdfHeader = dataBuffer.slice(0, 4).toString();
      console.log(`📄 [${extractId}] PDF文件头:`, pdfHeader);
      
      if (!pdfHeader.startsWith('%PDF')) {
        console.warn(`⚠️ [${extractId}] 警告：文件头不是标准PDF格式`);
      }
      
      // 使用pdf-parse解析
      console.log(`📄 [${extractId}] 开始PDF解析...`);
      const parseStartTime = Date.now();
      
      const data = await pdfParse(dataBuffer);
      
      const parseEndTime = Date.now();
      const parseDuration = parseEndTime - parseStartTime;
      
      console.log(`📄 [${extractId}] PDF解析完成:`);
      console.log(`📄 [${extractId}] - 解析耗时:`, parseDuration, 'ms');
      console.log(`📄 [${extractId}] - 页面数量:`, data.numpages);
      console.log(`📄 [${extractId}] - 文本长度:`, data.text.length);
      console.log(`📄 [${extractId}] - 信息对象:`, data.info);
      console.log(`📄 [${extractId}] - 元数据:`, data.metadata);
      
      if (data.text.length === 0) {
        console.warn(`⚠️ [${extractId}] 警告：提取的文本长度为0`);
      }
      
      if (data.text.length < 50) {
        console.warn(`⚠️ [${extractId}] 警告：提取的文本内容过少（<50字符）`);
        console.log(`📄 [${extractId}] 完整提取文本:`, JSON.stringify(data.text));
      } else {
        console.log(`📄 [${extractId}] 文本前200字符:`, data.text.substring(0, 200));
        console.log(`📄 [${extractId}] 文本后200字符:`, data.text.substring(Math.max(0, data.text.length - 200)));
      }
      
      console.log(`✅ [${extractId}] PDF文本提取成功`);
      return data.text;
      
    } catch (error) {
      console.error(`❌ [${extractId}] PDF文本提取失败:`);
      console.error(`❌ [${extractId}] - 错误类型:`, error.constructor.name);
      console.error(`❌ [${extractId}] - 错误信息:`, error.message);
      console.error(`❌ [${extractId}] - 错误堆栈:`, error.stack);
      throw new Error('PDF文件解析失败');
    }
  }

  /**
   * 从Word文档提取文本
   * @param {string} filePath - Word文档路径
   * @returns {Promise<string>} 提取的文本
   */
  static async extractTextFromWord(filePath) {
    const extractId = `WORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      console.log(`📄 [${extractId}] =================== 开始Word文档文本提取 ===================`);
      console.log(`📄 [${extractId}] 文件路径:`, filePath);
      
      // 检查文件是否存在
      const fs = require('fs');
      const fileExists = fs.existsSync(filePath);
      console.log(`📄 [${extractId}] 文件是否存在:`, fileExists);
      
      if (!fileExists) {
        throw new Error(`Word文档不存在: ${filePath}`);
      }
      
      const fileStats = fs.statSync(filePath);
      console.log(`📄 [${extractId}] 文件大小:`, fileStats.size, 'bytes');
      console.log(`📄 [${extractId}] 文件修改时间:`, fileStats.mtime);
      
      // 检查文件扩展名
      const path = require('path');
      const fileExt = path.extname(filePath).toLowerCase();
      console.log(`📄 [${extractId}] 文件扩展名:`, fileExt);
      
      // 使用mammoth解析
      console.log(`📄 [${extractId}] 开始Word文档解析...`);
      const parseStartTime = Date.now();
      
      const result = await mammoth.extractRawText({ path: filePath });
      
      const parseEndTime = Date.now();
      const parseDuration = parseEndTime - parseStartTime;
      
      console.log(`📄 [${extractId}] Word文档解析完成:`);
      console.log(`📄 [${extractId}] - 解析耗时:`, parseDuration, 'ms');
      console.log(`📄 [${extractId}] - 文本长度:`, result.value.length);
      console.log(`📄 [${extractId}] - 消息数量:`, result.messages.length);
      
      if (result.messages.length > 0) {
        console.log(`📄 [${extractId}] 解析消息:`);
        result.messages.forEach((msg, index) => {
          console.log(`📄 [${extractId}] - 消息${index + 1}:`, msg.type, msg.message);
        });
      }
      
      if (result.value.length === 0) {
        console.warn(`⚠️ [${extractId}] 警告：提取的文本长度为0`);
      }
      
      if (result.value.length < 50) {
        console.warn(`⚠️ [${extractId}] 警告：提取的文本内容过少（<50字符）`);
        console.log(`📄 [${extractId}] 完整提取文本:`, JSON.stringify(result.value));
      } else {
        console.log(`📄 [${extractId}] 文本前200字符:`, result.value.substring(0, 200));
        console.log(`📄 [${extractId}] 文本后200字符:`, result.value.substring(Math.max(0, result.value.length - 200)));
      }
      
      console.log(`✅ [${extractId}] Word文档文本提取成功`);
      return result.value;
      
    } catch (error) {
      console.error(`❌ [${extractId}] Word文档文本提取失败:`);
      console.error(`❌ [${extractId}] - 错误类型:`, error.constructor.name);
      console.error(`❌ [${extractId}] - 错误信息:`, error.message);
      console.error(`❌ [${extractId}] - 错误堆栈:`, error.stack);
      throw new Error('Word文档解析失败');
    }
  }

  /**
   * 从TXT文件提取文本
   * @param {string} filePath - TXT文件路径
   * @returns {Promise<string>} 提取的文本
   */
  static async extractTextFromTXT(filePath) {
    const extractId = `TXT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      console.log(`📄 [${extractId}] =================== 开始TXT文件文本提取 ===================`);
      console.log(`📄 [${extractId}] 文件路径:`, filePath);
      
      // 检查文件是否存在
      const fs = require('fs');
      const fileExists = fs.existsSync(filePath);
      console.log(`📄 [${extractId}] 文件是否存在:`, fileExists);
      
      if (!fileExists) {
        throw new Error(`TXT文件不存在: ${filePath}`);
      }
      
      const fileStats = fs.statSync(filePath);
      console.log(`📄 [${extractId}] 文件大小:`, fileStats.size, 'bytes');
      console.log(`📄 [${extractId}] 文件修改时间:`, fileStats.mtime);
      
      // 读取文件内容
      console.log(`📄 [${extractId}] 开始读取TXT文件...`);
      const readStartTime = Date.now();
      
      const text = fs.readFileSync(filePath, 'utf8');
      
      const readEndTime = Date.now();
      const readDuration = readEndTime - readStartTime;
      
      console.log(`📄 [${extractId}] TXT文件读取完成:`);
      console.log(`📄 [${extractId}] - 读取耗时:`, readDuration, 'ms');
      console.log(`📄 [${extractId}] - 文本长度:`, text.length);
      
      if (text.length === 0) {
        console.warn(`⚠️ [${extractId}] 警告：提取的文本长度为0`);
      }
      
      if (text.length < 50) {
        console.warn(`⚠️ [${extractId}] 警告：提取的文本内容过少（<50字符）`);
        console.log(`📄 [${extractId}] 完整提取文本:`, JSON.stringify(text));
      } else {
        console.log(`📄 [${extractId}] 文本前200字符:`, text.substring(0, 200));
        console.log(`📄 [${extractId}] 文本后200字符:`, text.substring(Math.max(0, text.length - 200)));
      }
      
      console.log(`✅ [${extractId}] TXT文件文本提取成功`);
      return text;
      
    } catch (error) {
      console.error(`❌ [${extractId}] TXT文件文本提取失败:`);
      console.error(`❌ [${extractId}] - 错误类型:`, error.constructor.name);
      console.error(`❌ [${extractId}] - 错误信息:`, error.message);
      console.error(`❌ [${extractId}] - 错误堆栈:`, error.stack);
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
    const saveId = `SAVE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    console.log(`💾 [${saveId}] =================== 开始保存基础简历 ===================`);
    console.log(`📊 [${saveId}] 输入参数检查:`);
    console.log(`📊 [${saveId}] - userId:`, userId, typeof userId);
    console.log(`📊 [${saveId}] - hasOriginalText:`, !!originalText);
    console.log(`📊 [${saveId}] - originalText长度:`, originalText ? originalText.length : 0);
    console.log(`📊 [${saveId}] - hasUnifiedData:`, !!unifiedData);
    console.log(`📊 [${saveId}] - unifiedData类型:`, typeof unifiedData);
    console.log(`📊 [${saveId}] - hasProfile:`, !!(unifiedData && unifiedData.profile));

    if (unifiedData && unifiedData.profile) {
      console.log(`📊 [${saveId}] - profile内容:`);
      console.log(`📊 [${saveId}]   - 姓名:`, unifiedData.profile.name || '(空)');
      console.log(`📊 [${saveId}]   - 邮箱:`, unifiedData.profile.email || '(空)');
      console.log(`📊 [${saveId}]   - 手机:`, unifiedData.profile.phone || '(空)');
      console.log(`📊 [${saveId}]   - 位置:`, unifiedData.profile.location || '(空)');
      console.log(`📊 [${saveId}]   - 简介:`, unifiedData.profile.summary || '(空)');
    }

    if (unifiedData) {
      console.log(`📊 [${saveId}] - 其他数据:`);
      console.log(`📊 [${saveId}]   - 工作经历数量:`, unifiedData.workExperience?.length || 0);
      console.log(`📊 [${saveId}]   - 教育经历数量:`, unifiedData.education?.length || 0);
      console.log(`📊 [${saveId}]   - 技能数量:`, unifiedData.skills?.length || 0);
      console.log(`📊 [${saveId}]   - 项目经历数量:`, unifiedData.projectExperience?.length || 0);
      console.log(`📊 [${saveId}]   - 自定义部分数量:`, unifiedData.customSections?.length || 0);
    }

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

      // 🔧 关键监控点：查询现有基础简历
      console.log(`🔍 [${saveId}] =================== 查询现有基础简历 ===================`);
      const queryStartTime = Date.now();
      
      const existingBaseResume = await Resume.findBaseResumeByUserId(userId);
      
      const queryEndTime = Date.now();
      const queryDuration = queryEndTime - queryStartTime;
      
      console.log(`🔍 [${saveId}] 基础简历查询完成:`);
      console.log(`🔍 [${saveId}] - 查询耗时:`, queryDuration, 'ms');
      console.log(`🔍 [${saveId}] - 找到现有基础简历:`, !!existingBaseResume);
      
      if (existingBaseResume) {
        console.log(`🔍 [${saveId}] - 现有简历详情:`);
        console.log(`🔍 [${saveId}]   - ID:`, existingBaseResume.id);
        console.log(`🔍 [${saveId}]   - 标题:`, existingBaseResume.title);
        console.log(`🔍 [${saveId}]   - 来源:`, existingBaseResume.source);
        console.log(`🔍 [${saveId}]   - 状态:`, existingBaseResume.status);
        console.log(`🔍 [${saveId}]   - 创建时间:`, existingBaseResume.created_at);
        console.log(`🔍 [${saveId}]   - 更新时间:`, existingBaseResume.updated_at);
        console.log(`🔍 [${saveId}]   - 是否基础简历:`, existingBaseResume.is_base);
        console.log(`🔍 [${saveId}]   - content长度:`, (existingBaseResume.content || '').length);
        console.log(`🔍 [${saveId}]   - unified_data长度:`, (existingBaseResume.unified_data || '').length);
        console.log(`🔍 [${saveId}]   - resume_data长度:`, (existingBaseResume.resume_data || '').length);
        console.log(`🔍 [${saveId}]   - generation_log长度:`, (existingBaseResume.generation_log || '').length);
      }
      
      let savedResume;
      const resumeTitle = `${unifiedData.profile.name || '用户'}的基础简历`;
      
      if (existingBaseResume) {
        // 🔧 关键监控点：更新现有基础简历
        console.log(`🔄 [${saveId}] =================== 更新现有基础简历 ===================`);
        console.log(`🔄 [${saveId}] 更新简历ID:`, existingBaseResume.id);
        
        const updateData = {
          title: resumeTitle,
          content: JSON.stringify(unifiedData),      // 🔧 修复：使用content字段保存结构化数据
          generation_log: originalText,              // 保存原始文本到generation_log
          unified_data: unifiedData,                 // 使用统一数据格式
          source: 'ai_parsed',
          updated_at: new Date()
        };
        
        console.log(`🔄 [${saveId}] 准备更新的数据:`);
        console.log(`🔄 [${saveId}] - 标题:`, updateData.title);
        console.log(`🔄 [${saveId}] - content长度:`, updateData.content.length);
        console.log(`🔄 [${saveId}] - generation_log长度:`, updateData.generation_log.length);
        console.log(`🔄 [${saveId}] - unified_data类型:`, typeof updateData.unified_data);
        console.log(`🔄 [${saveId}] - 来源:`, updateData.source);
        
        const updateStartTime = Date.now();
        
        await Resume.update(existingBaseResume.id, updateData);
        
        const updateEndTime = Date.now();
        const updateDuration = updateEndTime - updateStartTime;
        
        console.log(`🔄 [${saveId}] 简历更新完成:`);
        console.log(`🔄 [${saveId}] - 更新耗时:`, updateDuration, 'ms');
        
        // 重新获取更新后的简历
        const refetchStartTime = Date.now();
        savedResume = await Resume.findById(existingBaseResume.id);
        const refetchEndTime = Date.now();
        const refetchDuration = refetchEndTime - refetchStartTime;
        
        console.log(`🔄 [${saveId}] 重新获取简历完成:`);
        console.log(`🔄 [${saveId}] - 重新获取耗时:`, refetchDuration, 'ms');
        console.log(`🔄 [${saveId}] - 更新后标题:`, savedResume.title);
        
        console.log(`✅ [${saveId}] 基础简历更新成功`);
      } else {
        // 🔧 关键监控点：创建新的基础简历
        console.log(`➕ [${saveId}] =================== 创建新的基础简历 ===================`);
        
        const resumeInfo = {
          user_id: userId,
          title: resumeTitle,
          content: JSON.stringify(unifiedData),      // 🔧 修复：使用content字段保存结构化数据
          generation_log: originalText,              // 保存原始文本到generation_log
          unified_data: unifiedData,                 // 使用统一数据格式
          template_id: 1,                            // 默认模板
          source: 'ai_parsed',
          is_base: true,                             // 标记为基础简历
          status: 'draft'
        };

        console.log(`➕ [${saveId}] 准备创建的数据:`);
        console.log(`➕ [${saveId}] - 用户ID:`, resumeInfo.user_id);
        console.log(`➕ [${saveId}] - 标题:`, resumeInfo.title);
        console.log(`➕ [${saveId}] - content长度:`, resumeInfo.content.length);
        console.log(`➕ [${saveId}] - generation_log长度:`, resumeInfo.generation_log.length);
        console.log(`➕ [${saveId}] - unified_data类型:`, typeof resumeInfo.unified_data);
        console.log(`➕ [${saveId}] - 模板ID:`, resumeInfo.template_id);
        console.log(`➕ [${saveId}] - 来源:`, resumeInfo.source);
        console.log(`➕ [${saveId}] - 是否基础简历:`, resumeInfo.is_base);
        console.log(`➕ [${saveId}] - 状态:`, resumeInfo.status);

        const createStartTime = Date.now();
        
        savedResume = await Resume.create(resumeInfo);
        
        const createEndTime = Date.now();
        const createDuration = createEndTime - createStartTime;
        
        console.log(`➕ [${saveId}] 简历创建完成:`);
        console.log(`➕ [${saveId}] - 创建耗时:`, createDuration, 'ms');
        console.log(`➕ [${saveId}] - 新简历ID:`, savedResume.id);
        console.log(`➕ [${saveId}] - 创建后标题:`, savedResume.title);
        
        console.log(`✅ [${saveId}] 基础简历创建成功`);
      }

      // 🔧 关键监控点：保存用户详细信息
      console.log(`👤 [${saveId}] =================== 保存用户详细信息 ===================`);
      const profileStartTime = Date.now();
      
      await this.saveUserProfileFromUnified(userId, unifiedData);
      
      const profileEndTime = Date.now();
      const profileDuration = profileEndTime - profileStartTime;
      
      console.log(`👤 [${saveId}] 用户详细信息保存完成:`);
      console.log(`👤 [${saveId}] - 保存耗时:`, profileDuration, 'ms');
      console.log(`✅ [${saveId}] 用户详细信息保存成功`);

      // 🔧 最终验证：检查保存结果
      console.log(`🔍 [${saveId}] =================== 最终验证保存结果 ===================`);
      const finalResume = await Resume.findById(savedResume.id);
      
      console.log(`🔍 [${saveId}] 最终简历验证:`);
      console.log(`🔍 [${saveId}] - ID:`, finalResume.id);
      console.log(`🔍 [${saveId}] - 标题:`, finalResume.title);
      console.log(`🔍 [${saveId}] - content类型:`, typeof finalResume.content);
      console.log(`🔍 [${saveId}] - content长度:`, (finalResume.content || '').length);
      console.log(`🔍 [${saveId}] - unified_data类型:`, typeof finalResume.unified_data);
      console.log(`🔍 [${saveId}] - resume_data类型:`, typeof finalResume.resume_data);
      
      // 尝试解析保存的数据
      try {
        const parsedUnifiedData = typeof finalResume.unified_data === 'string' 
          ? JSON.parse(finalResume.unified_data) 
          : finalResume.unified_data;
        
        console.log(`🔍 [${saveId}] unified_data解析成功:`);
        console.log(`🔍 [${saveId}] - 姓名:`, parsedUnifiedData.profile?.name || '(空)');
        console.log(`🔍 [${saveId}] - 手机:`, parsedUnifiedData.profile?.phone || '(空)');
        console.log(`🔍 [${saveId}] - 邮箱:`, parsedUnifiedData.profile?.email || '(空)');
        console.log(`🔍 [${saveId}] - 工作经历数量:`, parsedUnifiedData.workExperience?.length || 0);
        console.log(`🔍 [${saveId}] - 教育经历数量:`, parsedUnifiedData.education?.length || 0);
        console.log(`🔍 [${saveId}] - 技能数量:`, parsedUnifiedData.skills?.length || 0);
        
      } catch (parseError) {
        console.error(`❌ [${saveId}] unified_data解析失败:`, parseError.message);
        console.error(`❌ [${saveId}] 原始unified_data:`, finalResume.unified_data);
      }

      console.log(`🎯 [${saveId}] =================== 基础简历保存完成 ===================`);
      return savedResume;
      
    } catch (error) {
      console.error(`❌ [${saveId}] 保存基础简历失败:`);
      console.error(`❌ [${saveId}] - 错误类型:`, error.constructor.name);
      console.error(`❌ [${saveId}] - 错误信息:`, error.message);
      console.error(`❌ [${saveId}] - 错误堆栈:`, error.stack);
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