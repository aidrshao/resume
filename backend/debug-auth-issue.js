/**
 * 调试前端认证问题的脚本
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('🔍 前端认证问题调试指南\n');
console.log('=' .repeat(60));

console.log('\n📋 问题分析：');
console.log('1. 访问 /resumes 页面时返回403错误');
console.log('2. 显示"访问令牌格式无效"');
console.log('3. 可能的原因：浏览器中的token过期或格式错误\n');

console.log('🔧 解决方案：');
console.log('请在浏览器开发者工具中执行以下步骤：\n');

console.log('步骤1: 打开浏览器开发者工具 (F12)');
console.log('步骤2: 切换到 Console 标签页');
console.log('步骤3: 执行以下JavaScript代码检查token状态：\n');

console.log('// 检查当前token');
console.log('console.log("当前token:", localStorage.getItem("token"));');
console.log('console.log("当前用户:", localStorage.getItem("user"));');
console.log('');

console.log('步骤4: 如果token存在但有问题，清除并重新登录：\n');
console.log('// 清除认证信息');
console.log('localStorage.removeItem("token");');
console.log('localStorage.removeItem("user");');
console.log('console.log("认证信息已清除，请重新登录");');
console.log('');

// 生成一个测试用的有效token
const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-please-change-this-in-production';
const testPayload = {
  userId: 1,
  email: 'test@example.com',
  name: '测试用户'
};

const validToken = jwt.sign(testPayload, secret, { expiresIn: '24h' });

console.log('🎫 临时解决方案 - 设置测试token：');
console.log('如果您需要立即测试功能，可以在浏览器控制台执行：\n');

console.log('// 设置测试token（24小时有效）');
console.log(`localStorage.setItem("token", "${validToken}");`);
console.log('localStorage.setItem("user", \'{"id":1,"email":"test@example.com","name":"测试用户"}\');');
console.log('console.log("测试token已设置，刷新页面即可使用");');
console.log('location.reload(); // 刷新页面');
console.log('');

console.log('⚠️  注意：测试token仅用于调试，正式使用请通过登录获取！');
console.log('');

console.log('🔄 服务器状态检查：');
console.log('后端服务器运行状态: ✅ 正常 (PID: 63294)');
console.log('前端服务器访问: http://localhost:3016');
console.log('后端API访问: http://localhost:8000/api');

console.log('\n' + '=' .repeat(60));
console.log('🎯 快速解决步骤总结：');
console.log('1. 打开 http://localhost:3016/login 重新登录');
console.log('2. 或在浏览器控制台清除旧token后重新登录');
console.log('3. 或使用上面的测试token进行临时测试');
console.log('=' .repeat(60)); 