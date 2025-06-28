/**
 * API密钥和连通性测试脚本
 */
require('dotenv').config();
const { OpenAI } = require('openai');

async function testOpenAIAPI() {
  console.log('🔍 开始API密钥和连通性测试...\n');
  
  // 1. 测试环境变量读取
  const envApiKey = process.env.OPENAI_API_KEY;
  console.log('📋 环境变量API密钥:');
  console.log('   - 存在:', envApiKey ? '✅ 是' : '❌ 否');
  console.log('   - 长度:', envApiKey ? envApiKey.length : 0);
  console.log('   - 前缀:', envApiKey ? envApiKey.substring(0, 10) + '...' : '无');
  console.log('   - 后缀:', envApiKey ? '...' + envApiKey.slice(-10) : '无');
  console.log('');

  if (!envApiKey) {
    console.log('❌ 未找到OPENAI_API_KEY，测试终止');
    return;
  }

  // 2. 测试OpenAI客户端初始化
  let openai;
  try {
    openai = new OpenAI({ 
      apiKey: envApiKey,
      timeout: 30000 // 30秒超时
    });
    console.log('✅ OpenAI客户端初始化成功');
  } catch (error) {
    console.log('❌ OpenAI客户端初始化失败:', error.message);
    return;
  }

  // 3. 测试gpt-4o模型连通性
  console.log('🧠 开始测试gpt-4o模型连通性...');
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: '你好，这是一个API连通性测试。请简单回复"测试成功"。'
        }
      ],
      max_tokens: 50,
      temperature: 0
    });

    console.log('✅ gpt-4o API调用成功!');
    console.log('📝 响应内容:', response.choices[0].message.content);
    console.log('📊 使用tokens:', response.usage);
    
  } catch (error) {
    console.log('❌ gpt-4o API调用失败:');
    console.log('   - 错误类型:', error.constructor.name);
    console.log('   - 错误消息:', error.message);
    console.log('   - 状态码:', error.status || '无');
    console.log('   - 详细信息:', error.error || '无');
  }

  // 4. 测试gpt-3.5-turbo作为备选
  console.log('\n🧠 开始测试gpt-3.5-turbo模型连通性...');
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: '这是备选模型测试，请回复"备选测试成功"。'
        }
      ],
      max_tokens: 50,
      temperature: 0
    });

    console.log('✅ gpt-3.5-turbo API调用成功!');
    console.log('📝 响应内容:', response.choices[0].message.content);
    
  } catch (error) {
    console.log('❌ gpt-3.5-turbo API调用失败:', error.message);
  }

  console.log('\n🏁 API测试完成');
}

// 运行测试
testOpenAIAPI().catch(error => {
  console.error('💥 测试脚本执行失败:', error);
}); 