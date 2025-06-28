require('dotenv').config();
const knex = require('./config/database');

async function testDatabase() {
  try {
    console.log('🔍 测试数据库连接...');
    console.log('📋 环境变量:');
    console.log('  DB_HOST:', process.env.DB_HOST);
    console.log('  DB_PORT:', process.env.DB_PORT);
    console.log('  DB_NAME:', process.env.DB_NAME);
    console.log('  DB_USER:', process.env.DB_USER);
    console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');

    // 测试数据库连接
    const result = await knex.raw('SELECT version();');
    console.log('✅ 数据库连接成功!');
    console.log('📊 PostgreSQL版本:', result.rows[0].version);

    // 测试 users 表
    const userCount = await knex('users').count('* as count');
    console.log('👤 用户表记录数:', userCount[0].count);

    // 测试 email_verifications 表
    const emailVerificationCount = await knex('email_verifications').count('* as count');
    console.log('📧 邮箱验证记录数:', emailVerificationCount[0].count);

    // 关闭连接
    await knex.destroy();
    console.log('✅ 数据库测试完成');

  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('🔧 详细错误:', error);
    process.exit(1);
  }
}

testDatabase(); 