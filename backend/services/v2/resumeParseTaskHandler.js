/**
 * V2版本简历解析任务处理器
 * 执行文本提取、AI解析、数据转换和结果存储的完整流程
 */

const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const pdf2pic = require('pdf2pic');
const TaskQueueService = require('./taskQueueService');
const AIPrompt = require('../../models/AIPrompt');
const { aiService } = require('../../services/aiService');
const { validateAndCompleteUnifiedFormat } = require('../../utils/dataTransformer');

class ResumeParseTaskHandler {
  constructor(taskQueueService = null) {
    // 使用传入的任务队列服务实例，避免创建重复实例
    this.taskQueue = taskQueueService || new TaskQueueService();
  }

  /**
   * 标准任务处理器接口方法
   * @param {string} taskId - 任务ID
   * @param {Object} taskData - 任务数据
   * @param {string} queueName - 队列名称
   */
  async handleTask(taskId, taskData, queueName) {
    // 委托给现有的process方法
    return await this.process(taskId, taskData);
  }

  /**
   * 处理简历解析任务
   * @param {string} taskId - 任务ID
   * @param {Object} taskData - 任务数据
   */
  async process(taskId, taskData) {
    const startTime = Date.now();
    let currentStep = 0;
    const totalSteps = 5;

    try {
      console.log('🚀 [RESUME_PARSE_HANDLER] ==> 开始处理简历解析任务');
      console.log('🚀 [RESUME_PARSE_HANDLER] 任务ID:', taskId);
      console.log('🚀 [RESUME_PARSE_HANDLER] 文件:', taskData.fileName);
      console.log('🚀 [RESUME_PARSE_HANDLER] 用户ID:', taskData.userId);

      // ========== 步骤日志开始 ==========
      console.log(`[HANDLER_DEBUG] Step 1: Task ${taskId} started processing.`);
      console.log(`[HANDLER_DEBUG] Step 1: Initial task data:`, {
        fileName: taskData.fileName,
        filePath: taskData.filePath,
        fileSize: taskData.fileSize,
        mimetype: taskData.mimetype,
        userId: taskData.userId
      });

      // === 步骤1: 文本提取 ===
      currentStep = 1;
      await this.updateProgress(taskId, currentStep, totalSteps, '正在提取文件内容...');
      
      console.log(`[HANDLER_DEBUG] Step 1: Starting text extraction from file: ${taskData.filePath}`);
      console.log(`[HANDLER_DEBUG] Step 1: File type: ${taskData.mimetype}`);
      
      const extractedText = await this.extractTextFromFile(taskData.filePath, taskData.mimetype);
      
      console.log(`[HANDLER_DEBUG] Step 2: Text extracted successfully. Text length: ${extractedText.length}`);
      console.log(`[HANDLER_DEBUG] Step 2: Text preview (first 200 chars): ${extractedText.substring(0, 200)}`);
      console.log(`[HANDLER_DEBUG] Step 2: Text preview (last 200 chars): ${extractedText.substring(extractedText.length - 200)}`);
      
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('文件内容过少或提取失败，请确保文件包含有效的简历信息');
      }

      console.log('✅ [RESUME_PARSE_HANDLER] 文本提取完成，长度:', extractedText.length);

      // === 步骤2: 获取AI解析提示词 ===
      currentStep = 2;
      await this.updateProgress(taskId, currentStep, totalSteps, '准备AI解析提示词...');
      
      console.log(`[HANDLER_DEBUG] Step 2: Starting to fetch AI parsing prompt`);
      
      const promptData = await this.getParsingPrompt();
      
      console.log(`[HANDLER_DEBUG] Step 3: AI prompt fetched successfully`);
      console.log(`[HANDLER_DEBUG] Step 3: Prompt data details:`, {
        promptLength: promptData.content.length,
        preferredModel: promptData.preferredModel,
        promptPreview: promptData.content.substring(0, 300)
      });
      
      console.log('✅ [RESUME_PARSE_HANDLER] 提示词获取完成');

      // === 步骤3: AI解析 ===
      currentStep = 3;
      await this.updateProgress(taskId, currentStep, totalSteps, 'AI正在分析简历内容...');
      
      console.log(`[HANDLER_DEBUG] Step 3: Preparing to call AI service`);
      
      // 构建完整的Prompt并打印
      const fullPrompt = promptData.content + '\n\n' + extractedText;
      console.log(`[HANDLER_DEBUG] Step 3: Final prompt construction complete`);
      console.log(`[HANDLER_DEBUG] Step 3: Full prompt length: ${fullPrompt.length}`);
      console.log(`[HANDLER_DEBUG] Step 3: Prompt template length: ${promptData.content.length}`);
      console.log(`[HANDLER_DEBUG] Step 3: Extracted text length: ${extractedText.length}`);
      console.log(`[HANDLER_DEBUG] Step 3: Final prompt preview (first 500 chars):`);
      console.log(fullPrompt.substring(0, 500));
      console.log(`[HANDLER_DEBUG] Step 3: Final prompt preview (last 500 chars):`);
      console.log(fullPrompt.substring(fullPrompt.length - 500));
      
      const aiResult = await this.performAIAnalysis(extractedText, promptData);
      
      console.log(`[HANDLER_DEBUG] Step 4: AI call completed. Received raw response.`);
      console.log(`[HANDLER_DEBUG] Step 4: AI result type: ${typeof aiResult}`);
      console.log(`[HANDLER_DEBUG] Step 4: AI result keys: ${Object.keys(aiResult || {})}`);
      console.log(`[HANDLER_DEBUG] Step 4: AI result data size: ${JSON.stringify(aiResult).length} bytes`);
      
      console.log('✅ [RESUME_PARSE_HANDLER] AI解析完成');
      
      // 🔧 增加详细的AI结果诊断日志
      console.log('🔍 [RESUME_PARSE_HANDLER] AI解析结果详细分析:');
      console.log('🔍 [RESUME_PARSE_HANDLER] AI结果数据类型:', typeof aiResult);
      console.log('🔍 [RESUME_PARSE_HANDLER] AI结果是否为对象:', typeof aiResult === 'object' && aiResult !== null);
      console.log('🔍 [RESUME_PARSE_HANDLER] AI结果主要字段:', Object.keys(aiResult || {}));
      console.log('🔍 [RESUME_PARSE_HANDLER] AI解析的个人信息:');
      console.log('  - 姓名:', aiResult?.profile?.name || '未提取到');
      console.log('  - 邮箱:', aiResult?.profile?.email || '未提取到');
      console.log('  - 电话:', aiResult?.profile?.phone || '未提取到');
      console.log('  - 地址:', aiResult?.profile?.location || '未提取到');
      console.log('🔍 [RESUME_PARSE_HANDLER] AI解析的工作经验数量:', aiResult?.workExperience?.length || 0);
      console.log('🔍 [RESUME_PARSE_HANDLER] AI解析的教育背景数量:', aiResult?.education?.length || 0);
      console.log('🔍 [RESUME_PARSE_HANDLER] AI解析的技能数量:', aiResult?.skills?.length || 0);
      console.log('🔍 [RESUME_PARSE_HANDLER] AI原始结果完整数据:', JSON.stringify(aiResult, null, 2));

      // === 步骤4: 数据转换 ===
      currentStep = 4;
      await this.updateProgress(taskId, currentStep, totalSteps, '转换为统一数据格式...');
      
      console.log(`[HANDLER_DEBUG] Step 4: Starting data transformation to unified schema`);
      console.log(`[HANDLER_DEBUG] Step 4: Input data for transformation:`, JSON.stringify(aiResult, null, 2));
      
      console.log('🔄 [RESUME_PARSE_HANDLER] 开始数据转换，输入数据:');
      console.log('🔄 [RESUME_PARSE_HANDLER] 转换前数据:', JSON.stringify(aiResult, null, 2));
      
      const unifiedData = await this.convertToUnifiedSchema(aiResult);
      
      console.log(`[HANDLER_DEBUG] Step 5: Data transformed to unified schema successfully.`);
      console.log(`[HANDLER_DEBUG] Step 5: Unified data type: ${typeof unifiedData}`);
      console.log(`[HANDLER_DEBUG] Step 5: Unified data keys: ${Object.keys(unifiedData || {})}`);
      console.log(`[HANDLER_DEBUG] Step 5: Unified data size: ${JSON.stringify(unifiedData).length} bytes`);
      console.log(`[HANDLER_DEBUG] Step 5: Transformed data:`, JSON.stringify(unifiedData, null, 2));
      
      console.log('✅ [RESUME_PARSE_HANDLER] 数据转换完成');
      
      // 🔧 增加转换后的详细诊断日志
      console.log('🔍 [RESUME_PARSE_HANDLER] 数据转换结果详细分析:');
      console.log('🔍 [RESUME_PARSE_HANDLER] 转换后数据类型:', typeof unifiedData);
      console.log('🔍 [RESUME_PARSE_HANDLER] 转换后主要字段:', Object.keys(unifiedData || {}));
      console.log('🔍 [RESUME_PARSE_HANDLER] 转换后个人信息:');
      console.log('  - 姓名:', unifiedData?.profile?.name || '未转换');
      console.log('  - 邮箱:', unifiedData?.profile?.email || '未转换');
      console.log('  - 电话:', unifiedData?.profile?.phone || '未转换');
      console.log('  - 地址:', unifiedData?.profile?.location || '未转换');
      console.log('🔍 [RESUME_PARSE_HANDLER] 转换后工作经验数量:', unifiedData?.workExperience?.length || 0);
      console.log('🔍 [RESUME_PARSE_HANDLER] 转换后教育背景数量:', unifiedData?.education?.length || 0);
      console.log('🔍 [RESUME_PARSE_HANDLER] 转换后技能数量:', unifiedData?.skills?.length || 0);
      console.log('🔍 [RESUME_PARSE_HANDLER] 转换后完整数据:', JSON.stringify(unifiedData, null, 2));

      // === 步骤5: 存储结果 ===
      currentStep = 5;
      await this.updateProgress(taskId, currentStep, totalSteps, '保存解析结果...');
      
      console.log(`[HANDLER_DEBUG] Step 5: Preparing result object for storage`);
      
      const processingTime = Date.now() - startTime;
      const result = {
        resumeData: unifiedData,
        schemaVersion: '2.1',
        processedAt: new Date().toISOString(),
        processingTime: processingTime,
        metadata: {
          originalText: extractedText,
          extractionMethod: this.getExtractionMethod(taskData.mimetype),
          aiModel: promptData?.preferredModel || 'deepseek',
          fileInfo: {
            name: taskData.fileName,
            size: taskData.fileSize,
            type: taskData.mimetype
          }
        }
      };

      console.log(`[HANDLER_DEBUG] Step 6: Result object prepared, size: ${JSON.stringify(result).length} bytes`);
      console.log(`[HANDLER_DEBUG] Step 6: Saving result to temporary storage with key: task_result_${taskId}`);

      await this.taskQueue.setTaskResult(taskId, result);
      
      console.log(`[HANDLER_DEBUG] Step 6: Result saved to temporary storage successfully.`);
      console.log('✅ [RESUME_PARSE_HANDLER] 结果存储完成');

      console.log(`[HANDLER_DEBUG] Step 7: Preparing to update task status to 'completed'.`);
      
      // 标记任务完成
      await this.taskQueue.setTaskStatus(taskId, {
        status: 'completed',
        progress: 100,
        message: '简历解析完成',
        completedAt: new Date().toISOString(),
        totalTime: processingTime
      });

      console.log(`[HANDLER_DEBUG] Step 7: Task status updated to 'completed' successfully.`);
      
      // 清理临时文件
      await this.cleanupFile(taskData.filePath);

      console.log(`[HANDLER_DEBUG] Step 8: Task processing completed successfully.`);
      console.log(`[HANDLER_DEBUG] Step 8: Final stats - Processing time: ${processingTime}ms, Data size: ${JSON.stringify(unifiedData).length} bytes`);

      console.log('🎉 [RESUME_PARSE_HANDLER] 任务处理完成:', {
        taskId,
        processingTime: processingTime + 'ms',
        dataSize: JSON.stringify(unifiedData).length
      });

    } catch (error) {
      console.error('❌ [RESUME_PARSE_HANDLER] 任务处理失败:', error);
      console.error('❌ [RESUME_PARSE_HANDLER] 错误堆栈:', error.stack);
      console.error('❌ [RESUME_PARSE_HANDLER] 任务数据:', {
        taskId,
        filePath: taskData.filePath,
        fileName: taskData.fileName,
        fileSize: taskData.fileSize,
        mimetype: taskData.mimetype,
        failedAtStep: currentStep,
        totalSteps: totalSteps
      });

      console.error(`[HANDLER_DEBUG] ERROR: Task failed at step ${currentStep}/${totalSteps}`);
      console.error(`[HANDLER_DEBUG] ERROR: Error message: ${error.message}`);
      console.error(`[HANDLER_DEBUG] ERROR: Error stack: ${error.stack}`);

      // 记录错误状态
      await this.taskQueue.setTaskStatus(taskId, {
        status: 'failed',
        progress: Math.round((currentStep / totalSteps) * 100),
        message: '简历解析失败: ' + error.message,
        error: error.message,
        failedAt: new Date().toISOString(),
        failedAtStep: currentStep
      });

      // 清理临时文件
      if (taskData.filePath) {
        await this.cleanupFile(taskData.filePath);
      }

      throw error;
    }
  }

  /**
   * 从文件中提取文本内容
   * @param {string} filePath - 文件路径
   * @param {string} mimetype - 文件MIME类型
   * @returns {Promise<string>} 提取的文本内容
   */
  async extractTextFromFile(filePath, mimetype) {
    try {
      console.log('📄 [TEXT_EXTRACTION] 开始文本提取:', { filePath, mimetype });

      // 检查文件是否存在
      const fileStats = await fs.stat(filePath);
      console.log('📄 [TEXT_EXTRACTION] 文件状态检查:', {
        exists: fileStats.isFile(),
        size: fileStats.size,
        isDirectory: fileStats.isDirectory(),
        path: filePath
      });
      
      if (!fileStats.isFile()) {
        throw new Error('文件不存在或不是有效文件');
      }

      // 🔧 改进文件大小检查
      if (fileStats.size === 0) {
        throw new Error('文件为空，请选择有效的简历文件');
      }

      if (fileStats.size > 50 * 1024 * 1024) { // 50MB限制
        throw new Error('文件过大，请选择小于50MB的文件');
      }

      let extractedText = '';

      console.log('📄 [TEXT_EXTRACTION] 开始根据文件类型提取文本:', mimetype);

      switch (mimetype) {
        case 'application/pdf':
          console.log('📄 [TEXT_EXTRACTION] 开始PDF文本提取...');
          extractedText = await this.extractFromPDF(filePath);
          console.log('📄 [TEXT_EXTRACTION] PDF文本提取完成，长度:', extractedText.length);
          break;
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          console.log('📄 [TEXT_EXTRACTION] 开始Word文档文本提取...');
          extractedText = await this.extractFromWord(filePath);
          console.log('📄 [TEXT_EXTRACTION] Word文本提取完成，长度:', extractedText.length);
          break;
        
        case 'text/plain':
          console.log('📄 [TEXT_EXTRACTION] 开始纯文本文件提取...');
          extractedText = await this.extractFromText(filePath);
          console.log('📄 [TEXT_EXTRACTION] 纯文本提取完成，长度:', extractedText.length);
          break;
        
        default:
          throw new Error(`不支持的文件类型: ${mimetype}`);
      }

      // 🔧 改进文本验证
      if (!extractedText) {
        console.warn('⚠️ [TEXT_EXTRACTION] 文本提取为空，尝试其他方法...');
        
        // 对PDF文件尝试OCR
        if (mimetype === 'application/pdf') {
          console.log('📄 [TEXT_EXTRACTION] 尝试OCR文本提取...');
          extractedText = await this.extractTextWithOCR(filePath);
          console.log('📄 [TEXT_EXTRACTION] OCR提取完成，长度:', extractedText.length);
        }
      }

      // 清理提取的文本
      const cleanedText = this.cleanExtractedText(extractedText);
      console.log('📄 [TEXT_EXTRACTION] 文本清理完成，最终长度:', cleanedText.length);
      console.log('📄 [TEXT_EXTRACTION] 文本开头预览:', cleanedText.substring(0, 200));

      // 🔧 更宽松的文本长度验证
      if (!cleanedText || cleanedText.trim().length < 20) {
        throw new Error(`提取的文本内容过少（${cleanedText?.length || 0}字符），请确保文件包含有效的简历信息。支持的文件格式：PDF、Word文档、纯文本文件。`);
      }

      console.log('✅ [TEXT_EXTRACTION] 文本提取成功');
      return cleanedText;

    } catch (error) {
      console.error('❌ [TEXT_EXTRACTION] 文本提取失败:', error);
      console.error('❌ [TEXT_EXTRACTION] 错误详情:', {
        message: error.message,
        filePath,
        mimetype,
        stack: error.stack
      });
      
      // 🔧 改进错误信息
      if (error.message.includes('ENOENT')) {
        throw new Error('文件不存在，请重新上传文件');
      } else if (error.message.includes('permission')) {
        throw new Error('文件访问权限不足，请重新上传文件');
      } else {
        throw new Error(`文件处理失败: ${error.message}`);
      }
    }
  }

  /**
   * 从PDF文件中提取文本
   * @param {string} filePath - PDF文件路径
   * @returns {Promise<string>} 提取的文本内容
   */
  async extractFromPDF(filePath) {
    try {
      console.log('📄 [PDF_EXTRACTION] 开始PDF文本提取:', filePath);
      
      let extractedText = '';
      let directExtractionSuccessful = false;
      
      try {
        // 🔧 首先尝试多种直接文本提取方法
        console.log('📄 [PDF_EXTRACTION] 尝试方法1: pdf-parse直接提取...');
        
        const fs = await import('fs/promises');
        const pdfBytes = await fs.readFile(filePath);
        console.log('📄 [PDF_EXTRACTION] PDF文件大小:', pdfBytes.length, 'bytes');
        
        // 方法1: 使用pdf-parse（最常用）
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(pdfBytes, {
          max: 10,  // 最多处理10页
          version: 'v1.10.100'
        });

        extractedText = pdfData.text || '';
        console.log('📄 [PDF_EXTRACTION] 方法1完成，提取长度:', extractedText.length);
        console.log('📄 [PDF_EXTRACTION] 页数:', pdfData.numpages);
        
        // 🔧 更智能的质量评估
        const textQuality = this.assessTextQuality(extractedText);
        console.log('📊 [PDF_EXTRACTION] 文本质量评估:', textQuality);
        
        if (textQuality.isGoodQuality) {
          directExtractionSuccessful = true;
          console.log('✅ [PDF_EXTRACTION] 直接提取成功，质量良好');
        } else {
          console.warn('⚠️ [PDF_EXTRACTION] 直接提取质量不佳，考虑使用OCR...');
          
          // 如果文本太少或质量太差，使用OCR
          if (textQuality.length < 100 || textQuality.chineseRatio < 0.3) {
            throw new Error(`文本质量不足：长度${textQuality.length}，中文比例${textQuality.chineseRatio}`);
          }
        }

      } catch (pdfError) {
        console.warn('⚠️ [PDF_EXTRACTION] 直接PDF提取失败:', pdfError.message);
        console.log('📄 [PDF_EXTRACTION] 尝试OCR提取（高质量模式）...');
        
        // 🔧 使用优化的OCR提取
        extractedText = await this.extractTextWithOCR(filePath);
        directExtractionSuccessful = false;
      }

      // 清理文本
      const cleanedText = this.cleanExtractedText(extractedText);
      console.log('📄 [PDF_EXTRACTION] PDF提取完成:');
      console.log('📊 [PDF_EXTRACTION] - 提取方法:', directExtractionSuccessful ? '直接提取' : 'OCR识别');
      console.log('📊 [PDF_EXTRACTION] - 最终长度:', cleanedText.length);
      console.log('📊 [PDF_EXTRACTION] - 文本预览:', cleanedText.substring(0, 200));
      
      return cleanedText;

    } catch (error) {
      console.error('❌ [PDF_EXTRACTION] PDF提取失败:', error);
      throw new Error(`PDF文件处理失败: ${error.message}`);
    }
  }

  /**
   * 评估提取文本的质量
   * @param {string} text - 提取的文本
   * @returns {Object} 质量评估结果
   */
  assessTextQuality(text) {
    const length = text.length;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const chineseRatio = length > 0 ? chineseChars / length : 0;
    const hasStructure = /[，。！？；：、\n]/.test(text);
    const wordDensity = text.split(/\s+/).length / Math.max(1, length);
    
    // 评估是否为好质量
    const isGoodQuality = length >= 100 && 
                         chineseRatio >= 0.3 && 
                         hasStructure && 
                         wordDensity < 0.8; // 避免过多空格分割的文本
    
    return {
      length,
      chineseRatio: Math.round(chineseRatio * 100) / 100,
      hasStructure,
      wordDensity: Math.round(wordDensity * 100) / 100,
      isGoodQuality
    };
  }

  /**
   * 从Word文档提取文本
   * @param {string} filePath - Word文件路径
   * @returns {Promise<string>} 提取的文本
   */
  async extractFromWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error(`Word文档解析失败: ${error.message}`);
    }
  }

  /**
   * 从文本文件提取内容
   * @param {string} filePath - 文本文件路径
   * @returns {Promise<string>} 文本内容
   */
  async extractFromText(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`文本文件读取失败: ${error.message}`);
    }
  }

  /**
   * 使用OCR从PDF中提取文本
   * @param {string} filePath - PDF文件路径
   * @returns {Promise<string>} OCR识别的文本内容
   */
  async extractTextWithOCR(filePath) {
    try {
      console.log('🔍 [OCR_EXTRACTION] 开始OCR文本识别...');
      
      // 🔧 优化配置：提升PDF转图片质量
      const convert = pdf2pic.fromPath(filePath, {
        density: 600,           // 🔧 提升分辨率从300到600 DPI
        saveFilename: 'page',
        savePath: path.join(__dirname, '../../temp/'),
        format: 'png',
        width: 3000,            // 🔧 提升图片尺寸
        height: 3000,
        quality: 100            // 🔧 最高图片质量
      });
      
      // 创建临时目录
      const tempDir = path.join(__dirname, '../../temp/');
      await fs.mkdir(tempDir, { recursive: true });
      
      console.log('🔍 [OCR_EXTRACTION] 正在将PDF转换为图片...');
      
      // 转换前几页（限制处理时间）
      const maxPages = 5; // 最多处理5页
      const pageResults = await convert.bulk(-1, { responseType: 'buffer' });
      
      console.log('🔍 [OCR_EXTRACTION] PDF转换完成，共', pageResults.length, '页');
      
      let allText = '';
      
      // 对每页进行OCR识别
      for (let i = 0; i < Math.min(pageResults.length, maxPages); i++) {
        const pageResult = pageResults[i];
        console.log(`🔍 [OCR_EXTRACTION] 正在识别第${i + 1}页文本...`);
        
        try {
          // 🔧 优化OCR配置
          const ocrResult = await Tesseract.recognize(pageResult.buffer, 'chi_sim+eng', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                console.log(`🔍 [OCR_EXTRACTION] 第${i + 1}页识别进度: ${Math.round(m.progress * 100)}%`);
              }
            },
            // 🔧 增强OCR配置
            tessedit_ocr_engine_mode: 1,        // 使用LSTM OCR引擎
            tessedit_pageseg_mode: 1,           // 自动页面分割，假设单一统一文本块
            tessedit_char_whitelist: null,      // 不限制字符
            preserve_interword_spaces: 0,       // 不保留词间空格
            user_defined_dpi: 600,              // 明确指定DPI
            // 🔧 中文优化配置
            textord_really_old_xheight: 1,      // 改善中文字符高度检测
            textord_min_xheight: 10,            // 最小字符高度
            enable_new_segsearch: 0,            // 关闭新分割搜索
            language_model_ngram_use: 0,        // 关闭N-gram语言模型
            load_system_dawg: 0,                // 不加载系统词典
            load_freq_dawg: 0,                  // 不加载频率词典
            load_unambig_dawg: 0,               // 不加载无歧义词典
            load_punc_dawg: 0,                  // 不加载标点词典
            load_number_dawg: 0,                // 不加载数字词典
            load_bigram_dawg: 0                 // 不加载双字词典
          });
          
          if (ocrResult.data.text) {
            // 🔧 文本后处理：清理OCR产生的多余空格
            let cleanedText = ocrResult.data.text
              .replace(/\s+/g, ' ')                    // 多个空格合并为一个
              .replace(/([^\w\s])\s+([^\w\s])/g, '$1$2') // 移除标点符号间的空格
              .replace(/([一-龯])\s+([一-龯])/g, '$1$2')   // 移除中文字符间的空格
              .replace(/\s*([，。！？；：、])\s*/g, '$1')    // 清理中文标点周围空格
              .trim();
            
            allText += cleanedText + '\n\n';
            console.log(`✅ [OCR_EXTRACTION] 第${i + 1}页识别完成，提取${cleanedText.length}个字符`);
            console.log(`📝 [OCR_EXTRACTION] 第${i + 1}页文本预览:`, cleanedText.substring(0, 100));
          }
        } catch (pageError) {
          console.error(`❌ [OCR_EXTRACTION] 第${i + 1}页识别失败:`, pageError.message);
          // 继续处理下一页
        }
      }
      
      // 清理临时文件
      try {
        await fs.rmdir(tempDir, { recursive: true });
      } catch (cleanupError) {
        console.warn('⚠️ [OCR_EXTRACTION] 清理临时文件失败:', cleanupError.message);
      }
      
      console.log('🎉 [OCR_EXTRACTION] OCR识别完成，总共提取文本长度:', allText.length);
      console.log('📝 [OCR_EXTRACTION] 最终文本预览:', allText.substring(0, 300));
      
      return allText.trim();
      
    } catch (error) {
      console.error('❌ [OCR_EXTRACTION] OCR文本识别失败:', error);
      throw new Error(`OCR识别失败: ${error.message}`);
    }
  }

  /**
   * 清理提取的文本
   * @param {string} text - 原始文本
   * @returns {string} 清理后的文本
   */
  cleanExtractedText(text) {
    if (!text) {
      console.log('🧹 [TEXT_CLEAN] 输入文本为空，返回空字符串');
      return '';
    }

    console.log('🧹 [TEXT_CLEAN] 开始清理文本，原始长度:', text.length);
    console.log('🧹 [TEXT_CLEAN] 原始文本开头:', text.substring(0, 100));

    const cleanedText = text
      // 移除过多的空白字符
      .replace(/\s+/g, ' ')
      // 移除行首行尾空白
      .replace(/^\s+|\s+$/gm, '')
      // 移除过多的换行符
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // 标准化换行符
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // 移除特殊字符
      .replace(/[\x00-\x1F\x7F]/g, '')
      // 最终清理
      .trim();

    console.log('🧹 [TEXT_CLEAN] 清理完成，清理后长度:', cleanedText.length);
    console.log('🧹 [TEXT_CLEAN] 清理后文本开头:', cleanedText.substring(0, 100));
    console.log('🧹 [TEXT_CLEAN] 清理后是否为空:', cleanedText.length === 0);

    return cleanedText;
  }

  /**
   * 获取解析提示词
   * @returns {Promise<Object>} 提示词数据
   */
  async getParsingPrompt() {
    try {
      console.log('🎯 [PROMPT_FETCH] 获取简历解析提示词...');
      
      const prompt = await AIPrompt.findByKey('resume_parsing');
      
      if (!prompt) {
        const errorMessage = '[PROMPT_FETCH_ERROR] Critical error: Prompt with key \'resume_parsing\' not found in the database. Please configure it in the admin panel.';
        console.error('❌ ' + errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ [PROMPT_FETCH] 提示词获取成功:', {
        id: prompt.id,
        key: prompt.key,
        name: prompt.name,
        model_type: prompt.model_type
      });

      return {
        content: prompt.prompt_template,
        preferredModel: prompt.model_type || 'deepseek',
        version: prompt.id
      };

    } catch (error) {
      console.error('❌ [PROMPT_FETCH] 获取提示词失败:', error);
      throw error; // 不再降级，直接抛出错误
    }
  }

  /**
   * 执行AI分析
   * @param {string} text - 简历文本
   * @param {Object} promptData - 提示词数据
   * @returns {Promise<Object>} AI解析结果
   */
  async performAIAnalysis(text, promptData) {
    try {
      console.log('🤖 [AI_ANALYSIS] ==> 开始AI分析...');
      console.log('🤖 [AI_ANALYSIS] 输入文本长度:', text.length);
      console.log('🤖 [AI_ANALYSIS] 文本开头:', text.substring(0, 200));
      
      const fullPrompt = promptData.content + '\n\n' + text;
      const model = promptData.preferredModel || 'deepseek';

      console.log('🤖 [AI_ANALYSIS] 使用模型:', model);
      console.log('🤖 [AI_ANALYSIS] 完整提示词长度:', fullPrompt.length);
      console.log('🤖 [AI_ANALYSIS] 提示词模板长度:', promptData.content.length);

      console.log('🤖 [AI_ANALYSIS] 准备调用AI服务...');
      const startTime = Date.now();
      
      // 🔧 增加超时配置，给长简历充足解析时间
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error('⏰ [AI_ANALYSIS] AI分析超时(350秒)，强制中断');
          reject(new Error('AI分析超时(350秒)'));
        }, 350000); // 🔧 增加到350秒（约6分钟），确保复杂简历能完成解析
      });

      // 🔧 使用更充足的超时配置，确保长简历能正常解析
      const aiPromise = aiService.generateText(fullPrompt, model, {
        temperature: 0.1, // 降低温度确保输出更加一致
        max_tokens: 4000,
        timeout: 300000, // 🔧 增加到300秒（5分钟）
        requestTimeout: 240000, // 🔧 增加到240秒（4分钟）
        connectionTimeout: 30000 // 🔧 增加到30秒
      });

      console.log('🤖 [AI_ANALYSIS] 正在等待AI响应...');
      const aiResponse = await Promise.race([aiPromise, timeoutPromise]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('✅ [AI_ANALYSIS] AI调用完成，耗时:', duration + 'ms');
      console.log('✅ [AI_ANALYSIS] AI响应长度:', aiResponse?.length || 0);
      console.log('✅ [AI_ANALYSIS] AI响应开头:', aiResponse?.substring(0, 300) || '(空响应)');

      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error('AI返回空响应');
      }

      // 解析AI返回的JSON
      let parsedResult;
      try {
        console.log('🤖 [AI_ANALYSIS] 尝试直接JSON解析...');
        parsedResult = JSON.parse(aiResponse);
        console.log('✅ [AI_ANALYSIS] 直接JSON解析成功');
      } catch (parseError) {
        console.warn('⚠️ [AI_ANALYSIS] 直接JSON解析失败:', parseError.message);
        console.log('⚠️ [AI_ANALYSIS] 原始响应长度:', aiResponse?.length || 0);
        console.log('⚠️ [AI_ANALYSIS] 原始响应开头:', aiResponse?.substring(0, 200) || '(空)');
        console.log('⚠️ [AI_ANALYSIS] 原始响应结尾:', aiResponse?.slice(-200) || '(空)');
        console.log('⚠️ [AI_ANALYSIS] 开始智能修复JSON...');
        
        try {
          const fixedJson = this.fixAIJsonResponse(aiResponse);
          console.log('🔧 [AI_ANALYSIS] 修复后的JSON长度:', fixedJson?.length || 0);
          console.log('🔧 [AI_ANALYSIS] 修复后的JSON开头:', fixedJson?.substring(0, 300) || '(空)');
          parsedResult = JSON.parse(fixedJson);
          console.log('✅ [AI_ANALYSIS] 智能修复JSON成功');
        } catch (fixError) {
          console.error('❌ [AI_ANALYSIS] JSON修复也失败:', fixError.message);
          console.error('❌ [AI_ANALYSIS] 修复失败的内容长度:', aiResponse?.length || 0);
          console.error('❌ [AI_ANALYSIS] 修复失败内容开头:', aiResponse?.substring(0, 200) || '(空)');
          
          // 🔧 在JSON解析失败时，抛出明确错误而不是使用默认结构
          throw new Error(`AI返回的JSON格式无效: ${fixError.message}。原始响应: ${aiResponse?.substring(0, 200) || '(空)'}`);
        }
      }

      // 验证必要字段
      if (!parsedResult || typeof parsedResult !== 'object') {
        throw new Error('AI返回的数据格式无效（非对象类型）');
      }

      console.log('✅ [AI_ANALYSIS] AI分析完全成功');
      console.log('✅ [AI_ANALYSIS] 解析结果字段:', Object.keys(parsedResult));
      
      return parsedResult;

    } catch (error) {
      console.error('❌ [AI_ANALYSIS] AI分析失败:', error);
      console.error('❌ [AI_ANALYSIS] 错误堆栈:', error.stack);
      console.error('❌ [AI_ANALYSIS] 错误类型:', error.constructor.name);
      
      // 🔧 AI分析失败时必须抛出错误，不使用默认结构掩盖问题
      console.error('❌ [AI_ANALYSIS] AI分析失败，拒绝使用默认结构掩盖问题');
      throw new Error(`AI简历解析失败: ${error.message}`);
    }
  }

  /**
   * 获取默认简历结构（后备方案）- 仅在极端情况下使用
   * @param {string} text - 原始文本
   * @returns {Object} 默认简历结构
   */
  getDefaultResumeStructure(text) {
    console.log('🔧 [DEFAULT_STRUCTURE] 生成默认简历结构');
    
    // 简单的信息提取
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const phoneMatch = text.match(/\b1[3-9]\d{9}\b/);
    
    // 🔧 修复：尝试更准确地提取姓名（寻找文档开头的中文姓名）
    let extractedName = "未知姓名";
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // 寻找中文姓名模式
      const chineseNameMatch = firstLine.match(/^([^\s\d\(\)（）]{2,4})/);
      if (chineseNameMatch) {
        extractedName = chineseNameMatch[1];
      }
    }
    
    // 🔧 修复：返回与统一格式匹配的字段结构
    return {
      profile: {  // 🔧 修复：使用profile而不是personalInfo
        name: extractedName,
        email: emailMatch ? emailMatch[0] : "",
        phone: phoneMatch ? phoneMatch[0] : "",
        location: "",
        title: "",
        summary: text.substring(0, 200) + "...",
        avatar: "",
        website: "",
        linkedin: "",
        github: ""
      },
      workExperience: [],
      education: [],
      skills: [],
      projects: [],
      languages: [
        { name: "中文", level: "母语" }
      ],
      certifications: [],
      customSections: []
    };
  }

  /**
   * 修复AI返回的JSON
   * @param {string} aiResponse - AI原始响应
   * @returns {string} 修复后的JSON字符串
   */
  fixAIJsonResponse(aiResponse) {
    try {
      console.log('🔧 [JSON_FIX] 开始修复JSON，原始长度:', aiResponse?.length || 0);
      console.log('🔧 [JSON_FIX] 原始开头100字符:', aiResponse?.substring(0, 100) || '(空)');
      
      let cleaned = aiResponse.trim();
      
      // 步骤1：移除markdown代码块标记
      console.log('🔧 [JSON_FIX] 步骤1：移除markdown标记');
      // 移除开头的```json或```
      cleaned = cleaned.replace(/^```(json)?\s*\n?/g, '');
      // 移除结尾的```
      cleaned = cleaned.replace(/\n?```\s*$/g, '');
      
      console.log('🔧 [JSON_FIX] 移除markdown后长度:', cleaned.length);
      console.log('🔧 [JSON_FIX] 移除markdown后开头:', cleaned.substring(0, 100));
      
      // 步骤2：查找JSON边界
      console.log('🔧 [JSON_FIX] 步骤2：查找JSON边界');
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      
      console.log('🔧 [JSON_FIX] JSON开始位置:', jsonStart);
      console.log('🔧 [JSON_FIX] JSON结束位置:', jsonEnd);
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
        console.log('🔧 [JSON_FIX] 提取JSON内容，长度:', cleaned.length);
      }

      // 步骤3：基本清理
      console.log('🔧 [JSON_FIX] 步骤3：基本清理');
      cleaned = cleaned.trim();
      
      // 修复常见的JSON格式问题
      cleaned = cleaned
        // 移除控制字符
        .replace(/[\x00-\x1F\x7F]/g, '')
        // 修复换行符问题（保持JSON中的换行）
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

      console.log('🔧 [JSON_FIX] 修复完成，最终长度:', cleaned.length);
      console.log('🔧 [JSON_FIX] 最终开头100字符:', cleaned.substring(0, 100));
      console.log('🔧 [JSON_FIX] 最终结尾50字符:', cleaned.slice(-50));

      // 步骤4：验证JSON格式
      console.log('🔧 [JSON_FIX] 步骤4：验证JSON格式');
      try {
        JSON.parse(cleaned);
        console.log('✅ [JSON_FIX] JSON验证成功');
      } catch (testError) {
        console.log('⚠️ [JSON_FIX] JSON验证失败:', testError.message);
        console.log('⚠️ [JSON_FIX] 无效JSON的前200字符:', cleaned.substring(0, 200));
        // 不抛出错误，让调用者处理
      }

      return cleaned;
    } catch (error) {
      console.error('❌ [JSON_FIX] JSON修复异常:', error);
      throw new Error('无法修复AI返回的JSON格式');
    }
  }

  /**
   * 转换为统一数据格式
   * @param {Object} aiResult - AI解析结果
   * @returns {Promise<Object>} 统一格式数据
   */
  async convertToUnifiedSchema(aiResult) {
    try {
      console.log('🔄 [SCHEMA_CONVERT] 开始数据格式转换...');

      // 使用现有的数据转换工具
      const unifiedData = validateAndCompleteUnifiedFormat(aiResult);

      console.log('✅ [SCHEMA_CONVERT] 数据格式转换完成');
      
      return unifiedData;

    } catch (error) {
      console.error('❌ [SCHEMA_CONVERT] 数据格式转换失败:', error);
      throw new Error(`数据格式转换失败: ${error.message}`);
    }
  }

  /**
   * 更新任务进度
   * @param {string} taskId - 任务ID
   * @param {number} currentStep - 当前步骤
   * @param {number} totalSteps - 总步骤数
   * @param {string} message - 进度消息
   */
  async updateProgress(taskId, currentStep, totalSteps, message) {
    const progress = Math.round((currentStep / totalSteps) * 100);
    
    await this.taskQueue.setTaskStatus(taskId, {
      status: 'processing',
      progress,
      message,
      currentStep,
      totalSteps
    });

    console.log(`📊 [PROGRESS] ${taskId}: ${progress}% - ${message}`);
  }

  /**
   * 获取提取方法描述
   * @param {string} mimetype - 文件MIME类型
   * @returns {string} 提取方法
   */
  getExtractionMethod(mimetype) {
    const methods = {
      'application/pdf': 'PDF解析',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word文档解析',
      'application/msword': 'Word文档解析',
      'text/plain': '文本文件读取'
    };
    
    return methods[mimetype] || '未知方法';
  }

  /**
   * 清理临时文件
   * @param {string} filePath - 文件路径
   */
  async cleanupFile(filePath) {
    try {
      if (filePath && typeof filePath === 'string') {
        await fs.unlink(filePath);
        console.log('🧹 [CLEANUP] 临时文件已清理:', filePath);
      }
    } catch (error) {
      console.warn('⚠️ [CLEANUP] 清理文件失败:', error.message);
      // 清理失败不影响主流程
    }
  }
}

module.exports = ResumeParseTaskHandler; 