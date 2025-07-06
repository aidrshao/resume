/**
 * 直接测试agicto.cn API的原始HTTP请求
 */

const https = require('https');

async function testAgictoRaw() {
  console.log('🧪 [RAW_TEST] 直接测试agicto.cn API');
  
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 [RAW_TEST] API密钥:', apiKey ? `${apiKey.substr(0, 10)}...` : '未设置');
  
  const postData = JSON.stringify({
    model: "deepseek-v3",
    messages: [
      {
        role: "user",
        content: "你好，请简单回复一个JSON: {\"test\": \"success\"}"
      }
    ],
    temperature: 0.1,
    max_tokens: 100
  });

  const options = {
    hostname: 'api.agicto.cn',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('📡 [RAW_TEST] 发送请求到:', `https://${options.hostname}${options.path}`);
  console.log('📝 [RAW_TEST] 请求头:', {
    'Content-Type': options.headers['Content-Type'],
    'Authorization': `Bearer ${apiKey.substr(0, 10)}...`,
    'Content-Length': options.headers['Content-Length']
  });

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      const duration = Date.now() - startTime;
      console.log('📊 [RAW_TEST] 响应状态:', res.statusCode);
      console.log('📊 [RAW_TEST] 响应头:', res.headers);
      console.log('⏱️ [RAW_TEST] 响应时间:', duration + 'ms');

      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📄 [RAW_TEST] 响应数据长度:', data.length);
        console.log('📄 [RAW_TEST] 响应数据:', data);
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log('✅ [RAW_TEST] JSON解析成功');
            console.log('🎯 [RAW_TEST] AI回复:', parsed.choices?.[0]?.message?.content);
            resolve(true);
          } catch (parseError) {
            console.log('❌ [RAW_TEST] JSON解析失败:', parseError.message);
            resolve(false);
          }
        } else {
          console.log('❌ [RAW_TEST] HTTP错误状态:', res.statusCode);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.error('❌ [RAW_TEST] 请求错误:', error.message);
      console.error('⏱️ [RAW_TEST] 失败时间:', duration + 'ms');
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('⏰ [RAW_TEST] 请求超时');
      req.destroy();
      resolve(false);
    });

    req.setTimeout(10000); // 10秒超时
    req.write(postData);
    req.end();
  });
}

// 检查环境变量
require('dotenv').config();

testAgictoRaw().then(success => {
  if (success) {
    console.log('🎉 [RAW_TEST] agicto.cn API测试成功');
  } else {
    console.log('💔 [RAW_TEST] agicto.cn API测试失败');
    console.log('💡 [RAW_TEST] 建议检查API密钥或联系agicto.cn技术支持');
  }
  process.exit(success ? 0 : 1);
}); 