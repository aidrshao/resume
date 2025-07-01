#!/usr/bin/env node

/**
 * 生产环境初始化脚本
 * 检查环境并初始化管理员账号
 */

const { initAdmin, listAllUsers, testAdminLogin } = require('./init-admin');

async function checkEnvironment() {
  console.log('🔍 [ENV_CHECK] 检查当前环境配置...');
  
  const env = process.env.NODE_ENV || 'development';
  console.log(`🏷️ [ENV_CHECK] 当前环境: ${env}`);
  
  if (env !== 'production') {
    console.log('⚠️ [ENV_CHECK] 注意：当前不在生产环境');
    console.log('💡 [ENV_CHECK] 如要在生产环境运行，请设置: NODE_ENV=production');
  }
  
  // 检查关键环境变量
  const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
  const missingVars = [];
  
  console.log('🔧 [ENV_CHECK] 检查环境变量:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // 对于敏感信息，只显示前几位
      const displayValue = ['DB_PASSWORD', 'JWT_SECRET'].includes(varName) 
        ? `${value.substring(0, 3)}***` 
        : value;
      console.log(`  ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`  ❌ ${varName}: 未设置`);
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('⚠️ [ENV_CHECK] 缺少以下环境变量:');
    missingVars.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    console.log('💡 [ENV_CHECK] 请在.env文件或环境中设置这些变量');
  }
  
  // 显示数据库连接信息
  try {
    const knexfile = require('../knexfile');
    const config = knexfile[env];
    console.log('🗄️ [ENV_CHECK] 数据库连接配置:');
    console.log(`  主机: ${config.connection.host}`);
    console.log(`  端口: ${config.connection.port}`);
    console.log(`  数据库: ${config.connection.database}`);
    console.log(`  用户: ${config.connection.user}`);
  } catch (error) {
    console.error('❌ [ENV_CHECK] 读取数据库配置失败:', error.message);
  }
}

async function testDatabaseConnection() {
  console.log('🔗 [DB_TEST] 测试数据库连接...');
  
  try {
    const knex = require('../config/database');
    
    // 简单的连接测试
    await knex.raw('SELECT 1 as test');
    console.log('✅ [DB_TEST] 数据库连接成功');
    
    // 检查关键表是否存在
    const tables = ['users', 'task_queue'];
    console.log('📋 [DB_TEST] 检查数据表:');
    
    for (const tableName of tables) {
      try {
        const exists = await knex.schema.hasTable(tableName);
        if (exists) {
          console.log(`  ✅ ${tableName}: 存在`);
        } else {
          console.log(`  ❌ ${tableName}: 不存在`);
        }
      } catch (error) {
        console.log(`  ❌ ${tableName}: 检查失败 - ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ [DB_TEST] 数据库连接失败:', error.message);
    console.log('💡 [DB_TEST] 请检查数据库配置和网络连接');
    return false;
  }
}

async function productionInit() {
  console.log('🚀 [PROD_INIT] 开始生产环境初始化...');
  console.log('=' .repeat(60));
  
  try {
    // 1. 检查环境
    await checkEnvironment();
    console.log('');
    
    // 2. 测试数据库连接
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('数据库连接失败，无法继续初始化');
    }
    console.log('');
    
    // 3. 列出现有用户
    console.log('👥 [PROD_INIT] 查看用户状态...');
    await listAllUsers();
    console.log('');
    
    // 4. 初始化管理员账号
    console.log('👑 [PROD_INIT] 初始化管理员账号...');
    await initAdmin();
    console.log('');
    
    // 5. 测试管理员登录
    console.log('🧪 [PROD_INIT] 验证管理员登录...');
    await testAdminLogin();
    console.log('');
    
    console.log('✅ [PROD_INIT] 生产环境初始化完成！');
    console.log('=' .repeat(60));
    console.log('📝 [PROD_INIT] 管理员登录凭据:');
    console.log('   邮箱: admin@example.com');
    console.log('   密码: admin123456');
    console.log('');
    console.log('🌐 [PROD_INIT] 现在可以通过以下方式访问管理后台:');
    console.log('   - 本地: http://localhost:3016/admin');
    console.log('   - 生产: https://your-domain.com/admin');
    console.log('');
    console.log('⚠️ [PROD_INIT] 安全提醒:');
    console.log('   1. 请尽快修改默认管理员密码');
    console.log('   2. 确保生产环境使用HTTPS');
    console.log('   3. 定期备份数据库');
    
  } catch (error) {
    console.error('❌ [PROD_INIT] 初始化失败:', error.message);
    console.log('');
    console.log('🔧 [PROD_INIT] 故障排除步骤:');
    console.log('   1. 检查数据库是否正在运行');
    console.log('   2. 验证数据库连接参数');
    console.log('   3. 确认数据库用户权限');
    console.log('   4. 检查网络连接');
    console.log('   5. 查看详细错误日志');
    
    process.exit(1);
  } finally {
    // 关闭数据库连接
    try {
      const knex = require('../config/database');
      await knex.destroy();
      console.log('🔌 [PROD_INIT] 数据库连接已关闭');
    } catch (error) {
      // 忽略关闭连接的错误
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  productionInit();
}

module.exports = {
  productionInit,
  checkEnvironment,
  testDatabaseConnection
}; 