/**
 * 自动化设置脚本
 * 在服务器启动前自动运行数据库迁移和种子数据
 */

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 执行命令: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ 命令执行成功: ${command} ${args.join(' ')}`);
        resolve();
      } else {
        console.error(`❌ 命令执行失败: ${command} ${args.join(' ')}, 退出码: ${code}`);
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ 命令执行错误: ${error.message}`);
      reject(error);
    });
  });
}

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库连接...');
    const knex = require('knex');
    const config = require('../knexfile.js');
    
    const db = knex(config.development);
    await db.raw('SELECT 1');
    await db.destroy();
    
    console.log('✅ 数据库连接正常');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

async function autoSetup() {
  try {
    console.log('🚀 开始自动化设置...');
    console.log('📅 时间:', new Date().toISOString());
    
    // 检查数据库连接
    const dbConnected = await checkDatabase();
    if (!dbConnected) {
      throw new Error('数据库连接失败，请检查数据库配置');
    }
    
    // 运行数据库迁移
    console.log('🔄 执行数据库迁移...');
    await runCommand('npm', ['run', 'migrate']);
    
    // 运行种子数据
    console.log('🌱 插入种子数据...');
    await runCommand('npm', ['run', 'seed']);

    // ===== 新增：保证 templates 表存在 =====
    console.log('🔍 [AUTO_SETUP] 验证 templates 表是否存在...');
    const knexLib = require('knex');
    const knexConf = require('../knexfile');
    const currentEnv = process.env.NODE_ENV || 'development';
    const db = knexLib(knexConf[currentEnv]);
    const hasTemplatesTable = await db.schema.hasTable('templates');

    if (!hasTemplatesTable) {
      console.log('⚠️  [AUTO_SETUP] templates 表不存在，重新执行数据库迁移...');
      // 再次执行迁移以确保新加入的迁移文件被应用
      await runCommand('npx', ['knex', 'migrate:latest']);
    } else {
      console.log('✅ [AUTO_SETUP] templates 表已存在');
    }
    await db.destroy();
    // ===== 新增结束 =====

    console.log('✅ 自动化设置完成!');
    console.log('🎉 数据库迁移和种子数据已就绪');
    
  } catch (error) {
    console.error('❌ 自动化设置失败:', error.message);
    console.error('💡 请手动运行以下命令解决问题:');
    console.error('   npm run migrate');
    console.error('   npm run seed');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  autoSetup();
}

module.exports = { autoSetup, checkDatabase }; 