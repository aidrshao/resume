/**
 * OCR质量测试脚本
 * 测试优化后的OCR配置对中文PDF识别的改善效果
 */

const path = require('path');
const ResumeParseTaskHandler = require('./services/v2/resumeParseTaskHandler');

class OCRQualityTester {
  constructor() {
    this.handler = new ResumeParseTaskHandler();
  }

  /**
   * 测试PDF文本提取质量
   * @param {string} testFilePath - 测试PDF文件路径
   */
  async testPDFExtraction(testFilePath) {
    try {
      console.log('🧪 [OCR_TEST] =================== OCR质量测试开始 ===================');
      console.log('📁 [OCR_TEST] 测试文件:', testFilePath);
      
      const startTime = Date.now();
      
      // 测试文本提取
      const extractedText = await this.handler.extractFromPDF(testFilePath);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 分析提取结果
      const analysis = this.analyzeExtractionQuality(extractedText);
      
      console.log('📊 [OCR_TEST] =================== 测试结果 ===================');
      console.log('⏱️ [OCR_TEST] 处理耗时:', duration, 'ms');
      console.log('📏 [OCR_TEST] 文本长度:', extractedText.length);
      console.log('🔤 [OCR_TEST] 中文字符数:', analysis.chineseChars);
      console.log('📈 [OCR_TEST] 中文占比:', (analysis.chineseRatio * 100).toFixed(1) + '%');
      console.log('🈳 [OCR_TEST] 空格密度:', (analysis.spaceDensity * 100).toFixed(1) + '%');
      console.log('✨ [OCR_TEST] 整体质量:', analysis.overallQuality);
      
      console.log('\\n📝 [OCR_TEST] 文本样本 (前300字符):');
      console.log('「' + extractedText.substring(0, 300) + '」');
      
      console.log('\\n🔍 [OCR_TEST] 常见错误检查:');
      this.checkCommonOCRErrors(extractedText);
      
      return {
        success: true,
        duration,
        textLength: extractedText.length,
        analysis,
        extractedText: extractedText.substring(0, 500) // 返回前500字符用于检查
      };
      
    } catch (error) {
      console.error('❌ [OCR_TEST] 测试失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 分析文本提取质量
   * @param {string} text - 提取的文本
   * @returns {Object} 质量分析结果
   */
  analyzeExtractionQuality(text) {
    const totalChars = text.length;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const chineseRatio = totalChars > 0 ? chineseChars / totalChars : 0;
    const spaces = (text.match(/\\s/g) || []).length;
    const spaceDensity = totalChars > 0 ? spaces / totalChars : 0;
    
    // 计算整体质量分数 (0-100)
    let qualityScore = 0;
    
    // 基础长度分数 (0-30分)
    if (totalChars >= 1000) qualityScore += 30;
    else if (totalChars >= 500) qualityScore += 20;
    else if (totalChars >= 100) qualityScore += 10;
    
    // 中文比例分数 (0-30分)
    if (chineseRatio >= 0.6) qualityScore += 30;
    else if (chineseRatio >= 0.4) qualityScore += 20;
    else if (chineseRatio >= 0.2) qualityScore += 10;
    
    // 空格密度分数 (0-20分) - 空格越少越好
    if (spaceDensity <= 0.1) qualityScore += 20;
    else if (spaceDensity <= 0.2) qualityScore += 15;
    else if (spaceDensity <= 0.3) qualityScore += 10;
    else if (spaceDensity <= 0.4) qualityScore += 5;
    
    // 结构完整性分数 (0-20分)
    const hasName = /[\\u4e00-\\u9fa5]{2,4}/.test(text); // 有中文姓名
    const hasContact = /(电话|邮箱|微信|手机)/.test(text); // 有联系方式
    const hasExperience = /(工作|经验|公司|职位)/.test(text); // 有工作经验
    const hasEducation = /(学校|大学|学历|专业)/.test(text); // 有教育背景
    
    const structureScore = [hasName, hasContact, hasExperience, hasEducation]
      .filter(Boolean).length * 5;
    qualityScore += structureScore;
    
    let overallQuality = '较差';
    if (qualityScore >= 80) overallQuality = '优秀';
    else if (qualityScore >= 60) overallQuality = '良好';
    else if (qualityScore >= 40) overallQuality = '一般';
    
    return {
      totalChars,
      chineseChars,
      chineseRatio,
      spaceDensity,
      qualityScore,
      overallQuality,
      hasName,
      hasContact,
      hasExperience,
      hasEducation
    };
  }

  /**
   * 检查常见OCR错误
   * @param {string} text - 提取的文本
   */
  checkCommonOCRErrors(text) {
    const errorPatterns = [
      { name: '中文字符分离', pattern: /[\\u4e00-\\u9fa5]\\s+[\\u4e00-\\u9fa5]/, example: '张 三' },
      { name: '数字字母混淆', pattern: /[0-9][a-zA-Z][0-9]|[a-zA-Z][0-9][a-zA-Z]/, example: '1o0, l1' },
      { name: '标点符号异常', pattern: /\\s[，。！？；：]/g, example: ' ，' },
      { name: '连续空格', pattern: /\\s{3,}/g, example: '   ' },
      { name: '字符替换错误', pattern: /[0oO][0-9]|[1lI][0-9]/, example: 'o0, l1' }
    ];
    
    errorPatterns.forEach(error => {
      const matches = text.match(error.pattern);
      if (matches) {
        console.log(`⚠️ [OCR_TEST] 发现${error.name}: ${matches.length}处 (例: ${error.example})`);
        console.log(`   示例位置: "${matches[0]}"`);
      } else {
        console.log(`✅ [OCR_TEST] 无${error.name}`);
      }
    });
  }

  /**
   * 运行完整测试套件
   */
  async runFullTest() {
    console.log('🚀 [OCR_TEST] 开始OCR质量测试...');
    
    // 测试用例：如果有测试PDF文件的话
    const testFiles = [
      'uploads/v2/resumes/', // 检查是否有实际的PDF文件
    ];
    
    // 列出测试目录中的PDF文件
    const fs = require('fs');
    const testDir = 'uploads/v2/resumes/';
    
    try {
      const files = fs.readdirSync(testDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf')).slice(0, 3); // 测试前3个PDF
      
      if (pdfFiles.length === 0) {
        console.log('⚠️ [OCR_TEST] 未找到测试PDF文件，请先上传一些PDF简历');
        return;
      }
      
      console.log(`📁 [OCR_TEST] 找到 ${pdfFiles.length} 个PDF文件进行测试`);
      
      for (const pdfFile of pdfFiles) {
        const filePath = path.join(testDir, pdfFile);
        console.log(`\\n🧪 [OCR_TEST] 测试文件: ${pdfFile}`);
        
        const result = await this.testPDFExtraction(filePath);
        
        if (result.success) {
          console.log(`✅ [OCR_TEST] ${pdfFile} 测试完成`);
        } else {
          console.log(`❌ [OCR_TEST] ${pdfFile} 测试失败:`, result.error);
        }
        
        console.log('\\n' + '='.repeat(80));
      }
      
    } catch (error) {
      console.error('❌ [OCR_TEST] 测试目录访问失败:', error.message);
    }
  }
}

// 直接运行测试
async function runTest() {
  const tester = new OCRQualityTester();
  await tester.runFullTest();
}

// 如果直接运行此脚本
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = OCRQualityTester; 