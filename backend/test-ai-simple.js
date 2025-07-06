/**
 * 简单的AI测试脚本 - 验证API密钥是否工作
 */

const { aiService } = require('./services/aiService');

async function testAI() {
  console.log('🚀 [AI测试] 开始测试AI服务');
  
  try {
    const testPrompt = `请将以下简历信息解析为JSON格式:

邵俊 （博士，高级职称）
邮箱: shaojun@example.com
电话: 13800138000

请返回JSON格式，包含profile字段，格式如下：
{
  "profile": {
    "name": "姓名",
    "email": "邮箱",
    "phone": "电话"
  }
}`;

    console.log('📝 [AI测试] 测试提示词长度:', testPrompt.length);
    console.log('🔑 [AI测试] API密钥状态:', process.env.OPENAI_API_KEY ? '已设置' : '未设置');
    
    const startTime = Date.now();
    const result = await aiService.generateText(testPrompt, 'deepseek', {
      temperature: 0.1,
      max_tokens: 500,
      timeout: 30000
    });
    
    const duration = Date.now() - startTime;
    
    console.log('✅ [AI测试] AI调用成功，耗时:', duration + 'ms');
    console.log('📄 [AI测试] 返回结果长度:', result?.length || 0);
    console.log('📄 [AI测试] 返回结果:');
    console.log(result);
    
    // 尝试解析JSON（清理markdown标记）
    try {
      // 🔧 清理AI返回的markdown代码块标记
      let cleanedResult = result
        .replace(/```json\n?|\n?```/g, '') // 移除```json```标记
        .replace(/^[^{]*/, '') // 移除开头的非JSON内容
        .replace(/[^}]*$/, '') // 移除结尾的非JSON内容
        .trim();
      
      console.log('🧹 [AI测试] 清理后的JSON:', cleanedResult);
      
      const parsed = JSON.parse(cleanedResult);
      console.log('✅ [AI测试] JSON解析成功');
      console.log('👤 [AI测试] 解析的姓名:', parsed.profile?.name);
      console.log('📧 [AI测试] 解析的邮箱:', parsed.profile?.email);
    } catch (parseError) {
      console.log('❌ [AI测试] JSON解析失败:', parseError.message);
      console.log('📝 [AI测试] 原始返回内容:', result?.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error('❌ [AI测试] AI调用失败:', error.message);
    console.error('❌ [AI测试] 错误类型:', error.constructor.name);
    console.error('❌ [AI测试] 错误堆栈:', error.stack);
  }
}

testAI(); 