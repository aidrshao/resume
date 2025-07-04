/**
 * 测试AI提示词获取功能
 */

require('dotenv').config();
const AIPrompt = require('../models/AIPrompt');

async function testPromptRetrieval() {
  console.log('🧪 开始测试AI提示词获取功能...\n');

  try {
    // 测试1：获取简历解析提示词
    console.log('📝 测试1：获取简历解析提示词');
    const resumePrompt = await AIPrompt.getRenderedPrompt('resume_parsing', {
      resumeText: '测试简历文本内容...'
    });
    
    console.log(`✅ 提示词名称: ${resumePrompt.name}`);
    console.log(`📊 模型类型: ${resumePrompt.model_type}`);
    console.log(`📝 提示词前500字符: ${resumePrompt.renderedTemplate.substring(0, 500)}...`);
    console.log(`🎯 提示词包含新格式: ${resumePrompt.renderedTemplate.includes('profile') ? '✅ 是' : '❌ 否'}`);
    console.log(`🎯 提示词包含旧格式: ${resumePrompt.renderedTemplate.includes('personalInfo') ? '❌ 是' : '✅ 否'}`);
    
  } catch (error) {
    console.error('❌ 测试1失败:', error.message);
    console.error(error.stack);
  }

  try {
    // 测试2：列出所有可用提示词
    console.log('\n📋 测试2：列出所有可用提示词');
    const allPrompts = await AIPrompt.findAll();
    console.log(`📊 总提示词数量: ${allPrompts.length}`);
    
    allPrompts.forEach(prompt => {
      console.log(`- ${prompt.key}: ${prompt.name} (${prompt.model_type})`);
    });
    
  } catch (error) {
    console.error('❌ 测试2失败:', error.message);
  }

  console.log('\n🎯 测试完成');
  process.exit(0);
}

testPromptRetrieval(); 