/**
 * 现有数据迁移脚本：在现有表结构上工作
 * 
 * 功能：
 * 1. 使用现有的resume_data字段存储统一格式数据
 * 2. 不需要修改表结构
 * 3. 完成数据格式转换和验证
 * 
 * 使用方法：
 * node backend/scripts/migrate-existing-data.js
 */

const knex = require('../config/database');
const { convertToUnifiedSchema, validateUnifiedSchema } = require('../schemas/schema');
const fs = require('fs');
const path = require('path');

class ExistingDataMigrator {
  constructor() {
    this.stats = {
      totalRecords: 0,
      processedRecords: 0,
      successRecords: 0,
      failedRecords: 0,
      startTime: new Date(),
      endTime: null
    };
    this.errors = [];
    this.batchSize = 50;
  }

  /**
   * 执行迁移
   */
  async migrate() {
    console.log('🚀 [EXISTING_DATA_MIGRATOR] 开始现有数据迁移');
    console.log('=' .repeat(60));

    try {
      // 1. 检查数据库连接
      await this.checkDatabaseConnection();

      // 2. 准备迁移
      await this.prepareMigration();

      // 3. 执行数据转换
      await this.processData();

      // 4. 生成报告
      await this.generateReport();

      console.log('✅ [MIGRATOR] 数据迁移完成');
      return true;

    } catch (error) {
      console.error('❌ [MIGRATOR] 迁移失败:', error);
      this.errors.push({
        type: 'MIGRATION_ERROR',
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
      return false;
    }
  }

  /**
   * 检查数据库连接
   */
  async checkDatabaseConnection() {
    console.log('🔍 [MIGRATOR] 检查数据库连接...');
    
    try {
      await knex.raw('SELECT 1');
      console.log('✅ [MIGRATOR] 数据库连接正常');

      const hasTable = await knex.schema.hasTable('resumes');
      if (!hasTable) {
        throw new Error('resumes表不存在');
      }
      console.log('✅ [MIGRATOR] resumes表存在');

    } catch (error) {
      console.error('❌ [MIGRATOR] 数据库连接检查失败:', error.message);
      throw error;
    }
  }

  /**
   * 准备迁移
   */
  async prepareMigration() {
    console.log('🔍 [MIGRATOR] 准备迁移...');

    // 获取总记录数
    const totalCount = await knex('resumes').count('* as count').first();
    this.stats.totalRecords = parseInt(totalCount.count);

    console.log(`📊 [MIGRATOR] 发现 ${this.stats.totalRecords} 条记录需要处理`);

    // 检查现有字段
    const hasResumeData = await knex.schema.hasColumn('resumes', 'resume_data');
    if (!hasResumeData) {
      throw new Error('resume_data字段不存在，无法进行迁移');
    }

    console.log('✅ [MIGRATOR] 准备工作完成');
  }

  /**
   * 处理数据
   */
  async processData() {
    console.log('🔄 [MIGRATOR] 开始数据处理...');

    let offset = 0;
    let batchCount = 0;

    while (offset < this.stats.totalRecords) {
      batchCount++;
      console.log(`📦 [MIGRATOR] 处理第 ${batchCount} 批，记录 ${offset + 1}-${Math.min(offset + this.batchSize, this.stats.totalRecords)}`);

      // 获取批次数据
      const records = await knex('resumes')
        .select('id', 'resume_data', 'updated_at')
        .offset(offset)
        .limit(this.batchSize);

      // 处理每条记录
      for (const record of records) {
        await this.processRecord(record);
      }

      offset += this.batchSize;
      
      // 批次间休息
      await this.sleep(100);
    }

    console.log('✅ [MIGRATOR] 数据处理完成');
  }

  /**
   * 处理单条记录
   */
  async processRecord(record) {
    this.stats.processedRecords++;
    
    try {
      console.log(`🔄 [MIGRATOR] 处理记录 ID: ${record.id}`);

      // 获取现有数据
      let existingData = record.resume_data;
      if (!existingData) {
        console.log(`⚠️ [MIGRATOR] 记录 ${record.id} 没有resume_data，跳过`);
        return;
      }

      // 转换数据格式
      const unifiedData = convertToUnifiedSchema(existingData);
      
      // 验证转换结果
      const validation = validateUnifiedSchema(unifiedData);
      if (!validation.valid) {
        throw new Error(`数据验证失败: ${validation.error}`);
      }

      // 创建新的数据结构，包含原始数据和统一格式数据
      const newResumeData = {
        // 保留原始数据
        original: existingData,
        // 添加统一格式数据
        unified: unifiedData,
        // 添加元数据
        metadata: {
          migrated: true,
          migrationDate: new Date().toISOString(),
          version: '2.1'
        }
      };

      // 更新数据库
      await knex('resumes')
        .where('id', record.id)
        .update({
          resume_data: JSON.stringify(newResumeData),
          updated_at: new Date()
        });

      this.stats.successRecords++;
      console.log(`✅ [MIGRATOR] 记录 ${record.id} 处理成功`);

    } catch (error) {
      this.stats.failedRecords++;
      console.error(`❌ [MIGRATOR] 记录 ${record.id} 处理失败:`, error.message);
      
      this.errors.push({
        type: 'RECORD_ERROR',
        recordId: record.id,
        message: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * 生成报告
   */
  async generateReport() {
    this.stats.endTime = new Date();
    const duration = this.stats.endTime - this.stats.startTime;

    console.log('\n📊 [MIGRATOR] 迁移报告');
    console.log('=' .repeat(60));
    console.log(`总记录数: ${this.stats.totalRecords}`);
    console.log(`处理记录数: ${this.stats.processedRecords}`);
    console.log(`成功记录数: ${this.stats.successRecords}`);
    console.log(`失败记录数: ${this.stats.failedRecords}`);
    console.log(`成功率: ${this.stats.processedRecords > 0 ? Math.round((this.stats.successRecords / this.stats.processedRecords) * 100) : 0}%`);
    console.log(`耗时: ${Math.round(duration / 1000)}秒`);

    // 保存详细报告
    const reportData = {
      summary: this.stats,
      errors: this.errors,
      timestamp: new Date().toISOString()
    };

    const reportsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportFile = path.join(reportsDir, `existing-data-migration-report-${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));

    console.log(`📄 [MIGRATOR] 详细报告已保存到: ${reportFile}`);
    console.log('=' .repeat(60));
  }

  /**
   * 休眠函数
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 主函数
async function main() {
  console.log('🚀 启动现有数据迁移...');
  
  const migrator = new ExistingDataMigrator();
  const success = await migrator.migrate();
  
  // 关闭数据库连接
  await knex.destroy();
  
  if (success) {
    console.log('🎉 迁移成功完成！');
    process.exit(0);
  } else {
    console.error('❌ 迁移失败！');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ [MAIN] 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = ExistingDataMigrator; 