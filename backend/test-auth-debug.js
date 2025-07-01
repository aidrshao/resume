/**
 * 测试JWT认证功能
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const authUtils = require('./utils/auth');

function testJWTAuth() {
  try {
    console.log('🔐 测试JWT认证功能...\n');
    
    // 1. 生成token
    const testPayload = {
      userId: 1,
      email: 'test@example.com',
      name: '测试用户'
    };
    
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-please-change-this-in-production';
    console.log('🔑 JWT密钥前10位:', secret.substring(0, 10) + '...');
    
    const token = jwt.sign(testPayload, secret, { expiresIn: '24h' });
    console.log('✅ Token生成成功');
    console.log('📋 Token长度:', token.length);
    console.log('🎫 Token前50位:', token.substring(0, 50) + '...');
    
    // 2. 验证token
    console.log('\n🔍 验证Token...');
    try {
      const decoded = jwt.verify(token, secret);
      console.log('✅ Token验证成功');
      console.log('📋 解码内容:', decoded);
    } catch (verifyError) {
      console.error('❌ Token验证失败:', verifyError.message);
      return;
    }
    
    // 3. 测试authUtils（如果存在）
    console.log('\n🛠️ 测试authUtils...');
    try {
      if (authUtils && authUtils.verifyToken) {
        const utilsDecoded = authUtils.verifyToken(token);
        console.log('✅ authUtils验证成功');
        console.log('📋 authUtils解码内容:', utilsDecoded);
      } else {
        console.log('⚠️ authUtils.verifyToken不存在');
      }
    } catch (utilsError) {
      console.error('❌ authUtils验证失败:', utilsError.message);
    }
    
    // 4. 模拟认证中间件
    console.log('\n🔒 模拟认证中间件...');
    const mockReq = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    
    const authHeader = mockReq.headers.authorization;
    const extractedToken = authHeader && authHeader.split(' ')[1];
    
    console.log('📤 请求头:', authHeader ? 'Bearer ***' : '无');
    console.log('🎫 提取的token长度:', extractedToken ? extractedToken.length : 0);
    console.log('🔍 Token匹配:', extractedToken === token ? '✅' : '❌');
    
    if (extractedToken) {
      try {
        const middlewareDecoded = jwt.verify(extractedToken, secret);
        console.log('✅ 中间件验证成功');
        console.log('👤 用户信息:', {
          id: middlewareDecoded.userId,
          email: middlewareDecoded.email
        });
      } catch (middlewareError) {
        console.error('❌ 中间件验证失败:', middlewareError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testJWTAuth(); 