require('dotenv').config();
const OpenAI = require('openai');

async function testAgictoAPI() {
  console.log('🔧 测试agicto API调用...');
  
  // 检查密钥
  console.log('📋 使用的密钥:');
  console.log('  AGICTO_API_KEY:', process.env.AGICTO_API_KEY ? `${process.env.AGICTO_API_KEY.substring(0,10)}...${process.env.AGICTO_API_KEY.slice(-10)}` : 'undefined');
  
  // 创建客户端
  const client = new OpenAI({
    apiKey: process.env.AGICTO_API_KEY,
    baseURL: "https://api.agicto.cn/v1",
    timeout: 10000
  });
  
  try {
    console.log('🚀 发送测试请求...');
    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: "你好，简单回复即可" }],
      model: "deepseek-v3",
      max_tokens: 50
    });
    
    console.log('✅ API调用成功!');
    console.log('📤 响应:', response.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ API调用失败:');
    console.error('  错误消息:', error.message);
    if (error.response) {
      console.error('  响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAgictoAPI();
