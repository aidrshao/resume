/**
 * PDF生成服务
 * 使用Puppeteer将HTML简历转换为PDF格式
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PDFService {
  /**
   * 将HTML转换为PDF
   * @param {string} html - HTML内容
   * @param {Object} options - PDF生成选项
   * @returns {Promise<Buffer>} PDF文件缓冲区
   */
  static async generatePDF(html, options = {}) {
    let browser = null;
    
    try {
      console.log('🚀 [PDFService] 开始生成PDF...');
      
      // 启动浏览器 (使用系统Chrome)
      browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Mac系统Chrome路径
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // 设置页面内容
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded']
      });

      // 等待字体和图片加载
      await page.evaluateHandle('document.fonts.ready');
      
      // PDF生成选项 - 增加边距避免内容被截断
      const pdfOptions = {
        format: options.format || 'A4',
        printBackground: true,
        margin: options.margin || {
          top: '20mm',    // 增加顶部边距
          right: '15mm',  // 增加右边距  
          bottom: '20mm', // 增加底部边距
          left: '15mm'    // 增加左边距
        },
        // 确保内容完整显示
        preferCSSPageSize: false,
        ...options.pdfOptions
      };

      console.log('📄 [PDFService] 生成PDF选项:', pdfOptions);
      
      // 生成PDF
      const pdfBuffer = await page.pdf(pdfOptions);
      
      console.log('✅ [PDFService] PDF生成成功，大小:', pdfBuffer.length, 'bytes');
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ [PDFService] PDF生成失败:', error);
      throw new Error(`PDF生成失败: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * 保存PDF到文件
   * @param {Buffer} pdfBuffer - PDF缓冲区
   * @param {string} filename - 文件名
   * @param {string} directory - 保存目录
   * @returns {Promise<string>} 文件路径
   */
  static async savePDFToFile(pdfBuffer, filename, directory = 'uploads/pdfs') {
    try {
      const uploadsDir = path.join(__dirname, '..', directory);
      
      // 确保目录存在
      await fs.mkdir(uploadsDir, { recursive: true });
      
      // 确保文件名有.pdf扩展名
      if (!filename.endsWith('.pdf')) {
        filename += '.pdf';
      }
      
      const filePath = path.join(uploadsDir, filename);
      
      // 写入文件
      await fs.writeFile(filePath, pdfBuffer);
      
      console.log('💾 [PDFService] PDF已保存到:', filePath);
      
      return filePath;
    } catch (error) {
      console.error('❌ [PDFService] 保存PDF失败:', error);
      throw new Error(`保存PDF失败: ${error.message}`);
    }
  }

  /**
   * 生成简历PDF并保存
   * @param {string} html - 简历HTML
   * @param {string} resumeTitle - 简历标题
   * @param {number} userId - 用户ID
   * @param {Object} options - 生成选项
   * @returns {Promise<Object>} 生成结果
   */
  static async generateResumePDF(html, resumeTitle, userId, options = {}) {
    try {
      console.log('📋 [PDFService] 开始生成简历PDF:', resumeTitle);
      
      // 生成PDF
      const pdfBuffer = await this.generatePDF(html, options);
      
      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const safeTitle = resumeTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const filename = `resume_${userId}_${safeTitle}_${timestamp}.pdf`;
      
      // 保存文件
      const filePath = await this.savePDFToFile(pdfBuffer, filename);
      
      return {
        success: true,
        filePath,
        filename,
        fileSize: pdfBuffer.length,
        downloadUrl: `/resume-render/download/${filename}`
      };
      
    } catch (error) {
      console.error('❌ [PDFService] 生成简历PDF失败:', error);
      throw error;
    }
  }

  /**
   * 检查浏览器是否可用
   * @returns {Promise<boolean>} 是否可用
   */
  static async checkBrowserAvailable() {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      await browser.close();
      return true;
    } catch (error) {
      console.warn('⚠️ [PDFService] 浏览器不可用:', error.message);
      return false;
    }
  }
}

module.exports = PDFService; 