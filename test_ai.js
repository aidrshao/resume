const { aiService } = require('./backend/services/aiService');

async function testAI() {
  try {
    console.log('测试AI服务...');
    
    const testPrompt = `
请分析以下简历文本，提取姓名和电话：

张三
手机：13800138000
邮箱：zhangsan@example.com

请返回JSON格式：
{
  "name": "姓名",
  "phone": "电话"
}
`;

    const response = await aiService.generateText(testPrompt, 'deepseek');
    console.log('AI响应:', response);
    
  } catch (error) {
    console.error('AI测试失败:', error);
  }
}

testAI(); 