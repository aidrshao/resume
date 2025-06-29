require('dotenv').config();
const { aiService } = require('./services/aiService');

async function testResumeParseCall() {
  console.log('🔧 测试简历解析的AI调用...');
  
  // 使用和resumeParseService.js相同的prompt模板
  const testText = `
李绍强
基础信息Information
姓名：李绍强电话：18822891686
现居：深圳市邮箱：1157114535@qq.com
学历：全日制本科状态：离职
毕业院校：太原科技大学机械专业
...
`;

  const prompt = `
请将以下简历文本内容解析并结构化为JSON格式。

文本内容：
${testText}

请严格按照以下JSON格式返回，包含所有可能的字段：

{
  "personalInfo": {
    "name": "姓名",
    "phone": "电话号码",
    "email": "邮箱地址",
    "location": "居住地址",
    "summary": "个人简介",
    "objective": "求职意向"
  },
  // ... 其他字段
}

重要提取规则：
1. 个人信息是最重要的，请务必仔细提取姓名、电话、邮箱
2. 只返回JSON格式，不要包含任何其他文字

现在开始解析：
`;

  try {
    console.log('🚀 发送请求，文本长度:', testText.length);
    console.log('🔑 使用的API key:', aiService.agictoClient.apiKey ? `${aiService.agictoClient.apiKey.substring(0,10)}...` : 'undefined');
    
    const response = await aiService.generateText(prompt, 'deepseek', {
      temperature: 0.3,
      max_tokens: 6000
    });
    
    console.log('✅ 请求成功!');
    console.log('📤 响应长度:', response.length);
    console.log('📤 响应预览:', response.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ 请求失败:');
    console.error('  错误消息:', error.message);
    console.error('  错误堆栈:', error.stack);
  }
}

testResumeParseCall();
