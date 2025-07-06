const jwt = require('jsonwebtoken');
require('dotenv').config();

// 使用用户ID 2（从之前的日志中看到的）
const userId = 2;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成新的token，7天有效期
const token = jwt.sign(
  { userId: userId },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('生成的新token:');
console.log(token);
console.log('');
console.log('用户ID:', userId);
console.log('有效期: 7天');

module.exports = token; 