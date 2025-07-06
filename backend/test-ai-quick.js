/**
 * 快速AI测试 - 验证JSON解析修复
 */

const { aiService } = require('./services/aiService');

async function quickTest() {
  console.log('🚀 [快速测试] 开始');
  
  try {
    const prompt = `解析这个简历信息为JSON:
邵俊, shaojun@test.com, 13800138000

返回格式:
{
  "profile": {
    "name": "邵俊",
    "email": "shaojun@test.com", 
    "phone": "13800138000"
  }
}`;

    console.log('🔑 [快速测试] API密钥:', process.env.OPENAI_API_KEY ? '已设置(新密钥)' : '未设置');
    
    const result = await aiService.generateText(prompt, 'deepseek', {
      temperature: 0.1,
      max_tokens: 200,
      timeout: 10000  // 10秒超时
    });
    
    console.log('✅ [快速测试] AI调用成功');
    console.log('📄 [快速测试] 原始返回:', result);
    
    // 测试JSON解析修复
    try {
      let cleaned = result
        .replace(/```json\n?|\n?```/g, '') 
        .replace(/^[^{]*/, '') 
        .replace(/[^}]*$/, '') 
        .trim();
      
      console.log('🧹 [快速测试] 清理后:', cleaned);
      
      const parsed = JSON.parse(cleaned);
      console.log('✅ [快速测试] JSON解析成功!');
      console.log('👤 [快速测试] 姓名:', parsed.profile?.name);
      
    } catch (parseError) {
      console.log('❌ [快速测试] JSON解析失败:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ [快速测试] 失败:', error.message);
  }
  
  console.log('🏁 [快速测试] 完成');
}

quickTest(); 