const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function testPDFParsing() {
  try {
    // 测试文件路径（你需要把你的PDF文件放在这里）
    const testFile = path.join(__dirname, 'test-resume.pdf');
    
    console.log('📄 开始测试PDF解析...');
    console.log('📄 文件路径:', testFile);
    
    // 检查文件是否存在
    if (!fs.existsSync(testFile)) {
      console.log('❌ 测试文件不存在，请将你的PDF文件复制到backend目录并重命名为test-resume.pdf');
      return;
    }
    
    // 读取文件
    const dataBuffer = fs.readFileSync(testFile);
    console.log('📄 文件大小:', dataBuffer.length, 'bytes');
    
    // 解析PDF
    const data = await pdf(dataBuffer);
    
    console.log('📄 PDF解析结果:');
    console.log('  - 页数:', data.numpages);
    console.log('  - 文本长度:', data.text?.length || 0);
    console.log('  - 前500个字符:', data.text?.substring(0, 500) || '(无文本内容)');
    
    if (!data.text || data.text.trim().length === 0) {
      console.log('❌ 这个PDF文件可能是扫描件或图片格式，无法提取文本内容');
      console.log('❌ 需要使用OCR（光学字符识别）技术来处理此类文件');
    } else {
      console.log('✅ PDF文件包含可提取的文本内容');
    }
    
  } catch (error) {
    console.error('❌ PDF解析测试失败:', error);
  }
}

testPDFParsing(); 