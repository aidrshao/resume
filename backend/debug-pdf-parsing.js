/**
 * PDF解析调试脚本
 * 专门用于调试邵俊简历PDF解析问题
 */

const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

async function debugPDFParsing() {
  console.log('🔍 =================== PDF解析调试开始 ===================');
  
  // 寻找最近上传的PDF文件
  const uploadsDir = path.join(__dirname, 'uploads');
  console.log('📁 上传目录:', uploadsDir);
  
  if (!fs.existsSync(uploadsDir)) {
    console.error('❌ uploads目录不存在');
    return;
  }
  
  // 获取所有PDF文件
  const files = fs.readdirSync(uploadsDir)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stats.size,
        mtime: stats.mtime
      };
    })
    .sort((a, b) => b.mtime - a.mtime); // 按修改时间降序排序
  
  console.log('📄 找到的PDF文件:');
  files.forEach((file, index) => {
    console.log(`📄 ${index + 1}. ${file.name}`);
    console.log(`   📁 路径: ${file.path}`);
    console.log(`   📊 大小: ${file.size} bytes`);
    console.log(`   🕐 修改时间: ${file.mtime}`);
    console.log('');
  });
  
  if (files.length === 0) {
    console.error('❌ 没有找到PDF文件');
    return;
  }
  
  // 测试最新的PDF文件
  const testFile = files[0];
  console.log(`🎯 测试文件: ${testFile.name}`);
  console.log(`📁 完整路径: ${testFile.path}`);
  
  try {
    // 步骤1：检查文件是否存在
    console.log('🔍 =================== 步骤1：文件存在性检查 ===================');
    const fileExists = fs.existsSync(testFile.path);
    console.log('📄 文件是否存在:', fileExists);
    
    if (!fileExists) {
      console.error('❌ 文件不存在');
      return;
    }
    
    // 步骤2：读取文件基本信息
    console.log('🔍 =================== 步骤2：文件基本信息 ===================');
    const fileStats = fs.statSync(testFile.path);
    console.log('📊 文件大小:', fileStats.size, 'bytes');
    console.log('📅 创建时间:', fileStats.birthtime);
    console.log('📅 修改时间:', fileStats.mtime);
    console.log('🔐 文件权限:', fileStats.mode.toString(8));
    
    // 步骤3：读取文件缓冲区
    console.log('🔍 =================== 步骤3：读取文件缓冲区 ===================');
    const dataBuffer = fs.readFileSync(testFile.path);
    console.log('📊 缓冲区大小:', dataBuffer.length, 'bytes');
    console.log('📄 前20字节:', dataBuffer.slice(0, 20));
    console.log('📄 前20字节(hex):', dataBuffer.slice(0, 20).toString('hex'));
    console.log('📄 前50字节(string):', dataBuffer.slice(0, 50).toString());
    
    // 步骤4：检查PDF文件头
    console.log('🔍 =================== 步骤4：PDF文件头检查 ===================');
    const pdfHeader = dataBuffer.slice(0, 8).toString();
    console.log('📄 PDF文件头:', JSON.stringify(pdfHeader));
    console.log('🔍 是否以%PDF开头:', pdfHeader.startsWith('%PDF'));
    
    if (!pdfHeader.startsWith('%PDF')) {
      console.error('❌ 警告：文件头不是标准PDF格式');
      console.log('📄 完整文件头(前100字节):', dataBuffer.slice(0, 100).toString());
    }
    
    // 步骤5：尝试PDF解析
    console.log('🔍 =================== 步骤5：PDF解析测试 ===================');
    const parseStartTime = Date.now();
    
    console.log('⏳ 开始PDF解析...');
    const data = await pdfParse(dataBuffer);
    
    const parseEndTime = Date.now();
    const parseDuration = parseEndTime - parseStartTime;
    
    console.log('✅ PDF解析完成！');
    console.log('⏱️ 解析耗时:', parseDuration, 'ms');
    console.log('📊 页面数量:', data.numpages);
    console.log('📊 文本长度:', data.text.length);
    console.log('📄 信息对象:', JSON.stringify(data.info, null, 2));
    console.log('📄 元数据:', data.metadata ? JSON.stringify(data.metadata, null, 2) : '无');
    
    // 步骤6：分析提取的文本
    console.log('🔍 =================== 步骤6：文本内容分析 ===================');
    if (data.text.length === 0) {
      console.error('❌ 严重问题：提取的文本长度为0！');
    } else if (data.text.length < 50) {
      console.warn('⚠️ 警告：提取的文本内容过少（<50字符）');
      console.log('📄 完整文本内容:', JSON.stringify(data.text));
    } else {
      console.log('✅ 文本提取正常');
      console.log('📄 文本前200字符:');
      console.log(data.text.substring(0, 200));
      console.log('');
      console.log('📄 文本后200字符:');
      console.log(data.text.substring(Math.max(0, data.text.length - 200)));
    }
    
    // 步骤7：字符分析
    console.log('🔍 =================== 步骤7：字符详细分析 ===================');
    const lines = data.text.split('\n');
    console.log('📊 总行数:', lines.length);
    console.log('📊 非空行数:', lines.filter(line => line.trim().length > 0).length);
    console.log('📊 纯空白字符数:', (data.text.match(/\s/g) || []).length);
    console.log('📊 字母数字字符数:', (data.text.match(/[a-zA-Z0-9\u4e00-\u9fa5]/g) || []).length);
    
    // 显示前10行非空内容
    const nonEmptyLines = lines.filter(line => line.trim().length > 0).slice(0, 10);
    console.log('📄 前10行非空内容:');
    nonEmptyLines.forEach((line, index) => {
      console.log(`${index + 1}: ${line.trim()}`);
    });
    
    console.log('🎯 =================== 调试完成 ===================');
    
  } catch (error) {
    console.error('❌ =================== PDF解析错误 ===================');
    console.error('❌ 错误类型:', error.constructor.name);
    console.error('❌ 错误信息:', error.message);
    console.error('❌ 错误堆栈:', error.stack);
  }
}

// 运行调试
debugPDFParsing().catch(console.error); 