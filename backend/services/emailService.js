/**
 * 邮件服务
 * 使用腾讯云SES发送验证码邮件
 */

const tencentcloud = require('tencentcloud-sdk-nodejs');

// 导入客户端models
const SesClient = tencentcloud.ses.v20201002.Client;

class EmailService {
  constructor() {
    // 实例化一个认证对象，入参需要传入腾讯云账户secretId，secretKey
    const clientConfig = {
      credential: {
        secretId: process.env.TENCENT_SECRET_ID,
        secretKey: process.env.TENCENT_SECRET_KEY,
      },
      region: process.env.TENCENT_SES_REGION,
      profile: {
        httpProfile: {
          endpoint: "ses.tencentcloudapi.com",
        },
      },
    };
    
    this.client = new SesClient(clientConfig);
    this.templateId = parseInt(process.env.TENCENT_SES_TEMPLATE_ID);
    this.fromEmail = process.env.TENCENT_SES_FROM_EMAIL;
  }

  /**
   * 生成6位数字验证码
   * @returns {string} 验证码
   */
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送验证码邮件
   * @param {string} email - 收件人邮箱
   * @param {string} code - 验证码
   * @param {string} type - 验证类型 ('register', 'login', 'reset_password')
   * @param {string} username - 用户名（可选）
   * @returns {Promise<Object>} 发送结果
   */
  async sendVerificationCode(email, code, type, username = '用户') {
    try {
      console.log(`📧 [EMAIL_SERVICE] 准备发送验证码: ${email}, 类型: ${type}, 验证码: ${code}`);

      // 根据类型设置邮件主题和内容
      const subjects = {
        register: 'AI俊才社 - 注册验证码',
        login: 'AI俊才社 - 登录验证码',
        reset_password: 'AI俊才社 - 重置密码验证码'
      };

      const subject = subjects[type] || 'AI俊才社 - 验证码';

      // 构建请求参数
      const params = {
        FromEmailAddress: this.fromEmail,
        Destination: [email],
        Subject: subject,
        Template: {
          TemplateID: this.templateId,
          TemplateData: JSON.stringify({
            name: username,
            code: code
          })
        },
        TriggerType: 1 // 触发类邮件
      };

      console.log(`📤 [EMAIL_SERVICE] 发送参数:`, {
        to: email,
        subject: subject,
        templateId: this.templateId,
        templateData: { name: username, code: code }
      });

      // 发送邮件
      const response = await this.client.SendEmail(params);
      
      console.log(`✅ [EMAIL_SERVICE] 邮件发送成功: MessageId=${response.MessageId}`);
      
      return {
        success: true,
        messageId: response.MessageId,
        message: '验证码发送成功'
      };

    } catch (error) {
      console.error(`❌ [EMAIL_SERVICE] 邮件发送失败:`, error);
      
      let errorMessage = '邮件发送失败';
      
      // 处理常见的腾讯云错误
      if (error.code) {
        switch (error.code) {
          case 'InvalidParameterValue.TemplateNotMatch':
            errorMessage = '邮件模板配置错误';
            break;
          case 'InvalidParameterValue.TemplateID':
            errorMessage = '邮件模板ID无效';
            break;
          case 'InvalidParameterValue.FromEmailAddress':
            errorMessage = '发件人邮箱地址无效';
            break;
          case 'LimitExceeded.DailyLimit':
            errorMessage = '今日邮件发送量已达上限';
            break;
          case 'UnauthorizedOperation':
            errorMessage = '邮件服务未授权';
            break;
          default:
            errorMessage = `邮件服务错误: ${error.message}`;
        }
      }

      return {
        success: false,
        error: errorMessage,
        code: error.code,
        details: error.message
      };
    }
  }

  /**
   * 批量发送邮件（暂时保留接口，用于未来扩展）
   * @param {Array} emailList - 邮箱列表
   * @param {string} subject - 邮件主题
   * @param {string} content - 邮件内容
   * @returns {Promise<Object>} 发送结果
   */
  async sendBulkEmails(emailList, subject, content) {
    // 未来可以实现批量发送功能
    throw new Error('批量发送功能暂未实现');
  }

  /**
   * 验证邮箱地址格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 测试邮件服务连接
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection() {
    try {
      // 发送测试邮件到配置的邮箱
      const testEmail = '346935824@qq.com'; // 使用你提供的测试邮箱
      const testCode = this.generateCode();
      
      const result = await this.sendVerificationCode(
        testEmail, 
        testCode, 
        'register', 
        '测试用户'
      );
      
      console.log(`🧪 [EMAIL_SERVICE] 测试邮件发送结果:`, result);
      return result;
      
    } catch (error) {
      console.error(`❌ [EMAIL_SERVICE] 测试连接失败:`, error);
      return {
        success: false,
        error: '邮件服务连接测试失败',
        details: error.message
      };
    }
  }
}

module.exports = new EmailService(); 