/**
 * 简单的agicto.cn AI服务验证脚本
 * 按照官方模板格式
 */

require('dotenv').config();
const OpenAI = require('openai');

async function testAgictoAPI() {
  console.log('🧪 开始agicto.cn API简单测试...');
  
  // 检查API密钥
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ 未找到OPENAI_API_KEY环境变量');
    process.exit(1);
  }
  
  const keyPreview = process.env.OPENAI_API_KEY.substring(0, 8) + '...' + process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 8);
  console.log('🔑 API密钥预览:', keyPreview);
  
  // 按照agicto官方模板创建客户端
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.agicto.cn/v1"
  });
  
  try {
    console.log('📡 发送测试请求...');
    
    const chat_completion = await client.chat.completions.create({
      messages: [
        {
          "role": "user",
          "content": "你好",
        }
      ],
      model: "gpt-4o-2024-11-20",
    });
    
    console.log('✅ 请求成功！');
    console.log('📝 响应内容:', chat_completion.choices[0].message.content);
    console.log('🔧 使用模型:', chat_completion.model);
    console.log('📊 Token使用:', chat_completion.usage);
    
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    
    if (error.response) {
      console.error('❌ 错误状态:', error.response.status);
      console.error('❌ 错误数据:', error.response.data);
    }
    
    if (error.message.includes('401') || error.message.includes('invalid_request_error')) {
      console.error('💡 提示: 请检查你的API密钥是否正确');
    }
  }
}

// 运行测试
testAgictoAPI(); 