require('dotenv').config();

console.log('🔧 环境变量测试:');
console.log('📋 AGICTO_API_KEY:', process.env.AGICTO_API_KEY ? `${process.env.AGICTO_API_KEY.substring(0, 10)}...` : 'undefined');
console.log('📋 AGICTO_API_KEY 长度:', process.env.AGICTO_API_KEY ? process.env.AGICTO_API_KEY.length : 0);
console.log('📋 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'undefined');
console.log('📋 OPENAI_API_KEY 长度:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);

// 测试agicto连接
const OpenAI = require('openai');

async function testAgicto() {
  try {
    console.log('\n🚀 测试agicto连接...');
    const client = new OpenAI({
      apiKey: process.env.AGICTO_API_KEY,
      baseURL: "https://api.agicto.cn/v1",
      timeout: 10000
    });
    
    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: "你好" }],
      model: "deepseek-v3",
      max_tokens: 50
    });
    
    console.log('✅ agicto连接成功!');
    console.log('📤 响应:', response.choices[0].message.content);
  } catch (error) {
    console.log('❌ agicto连接失败:', error.message);
  }
}

testAgicto();
