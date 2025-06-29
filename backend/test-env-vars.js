// 测试环境变量加载
console.log('🔧 测试环境变量加载...');

console.log('📋 加载.env之前:');
console.log('  AGICTO_API_KEY:', process.env.AGICTO_API_KEY ? `${process.env.AGICTO_API_KEY.substring(0,10)}...` : 'undefined');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0,10)}...${process.env.OPENAI_API_KEY.slice(-10)}` : 'undefined');

// 加载.env文件
require('dotenv').config();

console.log('\n📋 加载.env之后:');
console.log('  AGICTO_API_KEY:', process.env.AGICTO_API_KEY ? `${process.env.AGICTO_API_KEY.substring(0,10)}...` : 'undefined');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0,10)}...${process.env.OPENAI_API_KEY.slice(-10)}` : 'undefined');

// 测试创建OpenAI客户端
const OpenAI = require('openai');

console.log('\n🤖 测试客户端创建:');
try {
  const agictoClient = new OpenAI({
    apiKey: process.env.AGICTO_API_KEY || "fallback-key",
    baseURL: "https://api.agicto.cn/v1"
  });
  console.log('  agictoClient API Key:', process.env.AGICTO_API_KEY ? `${process.env.AGICTO_API_KEY.substring(0,10)}...` : 'undefined');
} catch (error) {
  console.error('  agictoClient创建失败:', error.message);
}
