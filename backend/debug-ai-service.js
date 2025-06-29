console.log('🔧 调试aiService实例化和使用...');

// 步骤1: 检查初始环境变量
console.log('\n📋 步骤1 - 检查初始环境变量:');
console.log('  AGICTO_API_KEY:', process.env.AGICTO_API_KEY ? 'exists' : 'undefined');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0,10)}...${process.env.OPENAI_API_KEY.slice(-10)}` : 'undefined');

// 步骤2: 加载.env文件  
console.log('\n📋 步骤2 - 加载.env文件:');
require('dotenv').config();
console.log('  AGICTO_API_KEY:', process.env.AGICTO_API_KEY ? `${process.env.AGICTO_API_KEY.substring(0,10)}...${process.env.AGICTO_API_KEY.slice(-10)}` : 'undefined');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0,10)}...${process.env.OPENAI_API_KEY.slice(-10)}` : 'undefined');

// 步骤3: 导入aiService模块（这会触发单例创建）
console.log('\n📋 步骤3 - 导入aiService模块:');
const { aiService } = require('./services/aiService');
console.log('  aiService实例已创建');

// 步骤4: 检查内部客户端的密钥
console.log('\n📋 步骤4 - 检查内部客户端配置:');
console.log('  agictoClient API key:', aiService.agictoClient.apiKey ? `${aiService.agictoClient.apiKey.substring(0,10)}...${aiService.agictoClient.apiKey.slice(-10)}` : 'undefined');
console.log('  openaiClient API key:', aiService.openaiClient.apiKey ? `${aiService.openaiClient.apiKey.substring(0,10)}...${aiService.openaiClient.apiKey.slice(-10)}` : 'undefined');

// 步骤5: 测试generateText方法
console.log('\n📋 步骤5 - 测试generateText方法:');
aiService.generateText('你好，简单回复即可', 'deepseek', { max_tokens: 50 })
  .then(response => {
    console.log('✅ generateText成功:', response);
  })
  .catch(error => {
    console.error('❌ generateText失败:', error.message);
  });
