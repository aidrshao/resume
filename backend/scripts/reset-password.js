#!/usr/bin/env node
/**
 * 通用重置用户密码脚本
 * 用法:
 *   node reset-password.js user@example.com NewPass123
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { db: knex } = require('../config/database');

async function main() {
  const [email, newPassword] = process.argv.slice(2);
  if (!email || !newPassword) {
    console.error('用法: node reset-password.js <email> <newPassword>');
    process.exit(1);
  }

  try {
    console.log(`🔄 开始重置用户密码: ${email}`);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await knex('users').where({ email }).update({ password_hash: passwordHash, updated_at: knex.fn.now() });

    if (result === 0) {
      console.error('❌ 未找到用户, 请确认邮箱是否正确');
      process.exit(1);
    }

    console.log('✅ 密码重置成功!');
  } catch (err) {
    console.error('❌ 重置失败:', err.message);
  } finally {
    await knex.destroy();
  }
}

main(); 