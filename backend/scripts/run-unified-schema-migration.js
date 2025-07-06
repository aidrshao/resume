/**
 * 一键执行统一数据范式迁移
 * 
 * 这个脚本将按顺序执行：
 * 1. 数据库结构迁移
 * 2. 数据格式转换
 * 
 * 使用方法：
 * node backend/scripts/run-unified-schema-migration.js
 */

const { spawn } = require('child_process');
const path = require('path');

class UnifiedSchemaMigrationRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.backendDir = path.resolve(__dirname, '..');
  }

  /**
   * 执行完整迁移流程
   */
  async runFullMigration() {
    console.log('🚀 [UNIFIED_SCHEMA_MIGRATION] 开始统一数据范式完整迁移');
    console.log('🚀 [UNIFIED_SCHEMA_MIGRATION] 时间:', new Date().toISOString());
    
    try {
      // 步骤1: 执行数据库结构迁移
      console.log('\n📊 [STEP_1] 执行数据库结构迁移...');
      await this.runDatabaseMigration();
      
      // 步骤2: 执行数据格式转换
      console.log('\n🔄 [STEP_2] 执行数据格式转换...');
      await this.runDataMigration();
      
      console.log('\n✅ [UNIFIED_SCHEMA_MIGRATION] 完整迁移成功！');
      console.log('🎉 [UNIFIED_SCHEMA_MIGRATION] 现在您的系统已使用统一数据范式');
      
    } catch (error) {
      console.error('\n❌ [UNIFIED_SCHEMA_MIGRATION] 迁移失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 执行数据库结构迁移
   */
  async runDatabaseMigration() {
    return new Promise((resolve, reject) => {
      const migrationProcess = spawn('npm', ['run', 'migrate'], {
        cwd: this.backendDir,
        stdio: 'inherit'
      });

      migrationProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ [DATABASE_MIGRATION] 数据库结构迁移成功');
          resolve();
        } else {
          reject(new Error(`数据库迁移失败，退出码: ${code}`));
        }
      });

      migrationProcess.on('error', (error) => {
        reject(new Error(`数据库迁移进程错误: ${error.message}`));
      });
    });
  }

  /**
   * 执行数据格式转换
   */
  async runDataMigration() {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'migrate-to-unified-schema.js');
      const dataProcess = spawn('node', [scriptPath], {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      dataProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ [DATA_MIGRATION] 数据格式转换成功');
          resolve();
        } else {
          reject(new Error(`数据格式转换失败，退出码: ${code}`));
        }
      });

      dataProcess.on('error', (error) => {
        reject(new Error(`数据转换进程错误: ${error.message}`));
      });
    });
  }

  /**
   * 仅执行数据库迁移
   */
  async runDatabaseOnly() {
    console.log('📊 [DATABASE_ONLY] 仅执行数据库结构迁移...');
    await this.runDatabaseMigration();
    console.log('✅ [DATABASE_ONLY] 数据库结构迁移完成');
  }

  /**
   * 仅执行数据转换
   */
  async runDataOnly() {
    console.log('🔄 [DATA_ONLY] 仅执行数据格式转换...');
    await this.runDataMigration();
    console.log('✅ [DATA_ONLY] 数据格式转换完成');
  }
}

// 主函数
async function main() {
  const runner = new UnifiedSchemaMigrationRunner();
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--database-only')) {
      await runner.runDatabaseOnly();
    } else if (args.includes('--data-only')) {
      await runner.runDataOnly();
    } else {
      await runner.runFullMigration();
    }
  } catch (error) {
    console.error('❌ [MAIN] 执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('📋 [USAGE] 使用说明:');
  console.log('  完整迁移: node backend/scripts/run-unified-schema-migration.js');
  console.log('  仅数据库: node backend/scripts/run-unified-schema-migration.js --database-only');
  console.log('  仅数据转换: node backend/scripts/run-unified-schema-migration.js --data-only');
  console.log('');
  
  main();
}

module.exports = UnifiedSchemaMigrationRunner; 