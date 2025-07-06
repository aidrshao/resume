/**
 * 简单PDF解析测试
 */

const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

async function testPDFParsing() {
  console.log('🔍 =================== 简单PDF解析测试 ===================');
  
  // 创建一个简单的测试PDF内容（实际上这不是有效的PDF，只是为了测试）
  const testText = `
邵俊
手机：13767918257
邮箱：test@example.com
地址：北京市

工作经历：
1. 高级前端工程师 (2020-2023)
   - 负责前端架构设计
   - 技术栈：React, Vue.js

2. 前端开发工程师 (2018-2020)
   - 开发企业级应用
   - 技术栈：JavaScript, CSS

教育经历：
- 本科 计算机科学与技术 (2014-2018)

技能：
- 前端框架：React, Vue.js, Angular
- 编程语言：JavaScript, TypeScript
- 工具：Webpack, Git
`;

  console.log('📄 测试文本内容:');
  console.log(testText);
  console.log('📊 文本长度:', testText.length);
  
  // 尝试检查pdf-parse库是否正常工作
  try {
    console.log('🔍 测试pdf-parse模块加载...');
    console.log('📦 pdf-parse版本:', require('pdf-parse/package.json').version);
    console.log('✅ pdf-parse模块加载成功');
  } catch (error) {
    console.error('❌ pdf-parse模块有问题:', error.message);
    return;
  }
  
  // 检查系统临时目录中是否有最近的文件
  console.log('🔍 =================== 检查系统临时目录 ===================');
  const tmpDirs = ['/tmp', process.env.TMPDIR, process.env.TEMP].filter(Boolean);
  
  for (const tmpDir of tmpDirs) {
    if (fs.existsSync(tmpDir)) {
      console.log(`📁 检查临时目录: ${tmpDir}`);
      try {
        const files = fs.readdirSync(tmpDir)
          .filter(file => file.toLowerCase().includes('pdf') || file.toLowerCase().includes('resume'))
          .slice(0, 5); // 只显示前5个
        
        console.log(`📄 找到相关文件:`, files);
      } catch (error) {
        console.log(`⚠️ 无法读取临时目录: ${error.message}`);
      }
    }
  }
  
  console.log('🎯 =================== 测试完成 ===================');
}

// 运行测试
testPDFParsing().catch(console.error); 