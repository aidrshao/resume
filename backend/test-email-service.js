/**
 * 邮件服务测试脚本
 * 检查邮件服务配置和连接状态
 */

require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 [EMAIL_TEST] 开始测试邮件服务...');
  
  // 检查环境变量
  console.log('📋 [EMAIL_TEST] 检查环境变量配置:');
  console.log('  TENCENT_SECRET_ID:', process.env.TENCENT_SECRET_ID ? '已配置' : '❌ 未配置');
  console.log('  TENCENT_SECRET_KEY:', process.env.TENCENT_SECRET_KEY ? '已配置' : '❌ 未配置');
  console.log('  TENCENT_SES_REGION:', process.env.TENCENT_SES_REGION || '❌ 未配置');
  console.log('  TENCENT_SES_FROM_EMAIL:', process.env.TENCENT_SES_FROM_EMAIL || '❌ 未配置');
  console.log('  TENCENT_SES_TEMPLATE_ID:', process.env.TENCENT_SES_TEMPLATE_ID || '❌ 未配置');
  
  // 检查emailService对象
  console.log('\n🔍 [EMAIL_TEST] 检查邮件服务对象:');
  console.log('  emailService类型:', typeof emailService);
  console.log('  generateCode方法:', typeof emailService.generateCode);
  console.log('  sendVerificationCode方法:', typeof emailService.sendVerificationCode);
  console.log('  isValidEmail方法:', typeof emailService.constructor.isValidEmail);
  
  // 测试验证码生成
  console.log('\n🔢 [EMAIL_TEST] 测试验证码生成:');
  try {
    const code = emailService.generateCode();
    console.log('  生成的验证码:', code);
    console.log('  验证码长度:', code.length);
    console.log('  验证码类型:', typeof code);
  } catch (error) {
    console.error('  ❌ 验证码生成失败:', error.message);
  }
  
  // 测试邮箱格式验证
  console.log('\n📧 [EMAIL_TEST] 测试邮箱格式验证:');
  const testEmails = [
    '346935824@qq.com',
    'jun.shao15@gmail.com',
    'invalid-email',
    'test@',
    '@test.com'
  ];
  
  testEmails.forEach(email => {
    try {
      const isValid = emailService.constructor.isValidEmail(email);
      console.log(`  ${email}: ${isValid ? '✅ 有效' : '❌ 无效'}`);
    } catch (error) {
      console.error(`  ${email}: ❌ 验证异常:`, error.message);
    }
  });
  
  // 测试邮件发送（如果环境变量配置完整）
  const hasAllConfig = process.env.TENCENT_SECRET_ID && 
                      process.env.TENCENT_SECRET_KEY && 
                      process.env.TENCENT_SES_FROM_EMAIL && 
                      process.env.TENCENT_SES_TEMPLATE_ID;
  
  if (hasAllConfig) {
    console.log('\n📤 [EMAIL_TEST] 测试邮件发送:');
    try {
      const result = await emailService.sendVerificationCode(
        '346935824@qq.com',
        '123456',
        'register'
      );
      console.log('  发送结果:', result);
    } catch (error) {
      console.error('  ❌ 邮件发送测试失败:', error);
    }
  } else {
    console.log('\n⚠️ [EMAIL_TEST] 跳过邮件发送测试（环境变量未完整配置）');
  }
  
  console.log('\n✅ [EMAIL_TEST] 邮件服务测试完成');
}

// 运行测试
testEmailService().catch(error => {
  console.error('💥 [EMAIL_TEST] 测试过程中发生错误:', error);
  process.exit(1);
}); 