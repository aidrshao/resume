#!/usr/bin/env node

/**
 * 运行完整数据迁移的简化脚本
 * 用于生产环境一键部署
 */

const CompleteDataMigrator = require('./complete-data-migration');

async function main() {
  console.log('🚀 启动完整数据迁移...');
  console.log('=' .repeat(50));
  
  try {
    const migrator = new CompleteDataMigrator();
    await migrator.migrate();
    
    console.log('✅ 数据迁移成功完成');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

// 运行迁移
main(); 