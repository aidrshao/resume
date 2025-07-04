/**
 * 数据迁移脚本：将现有简历数据转换为统一格式
 * 
 * 使用方法：
 * node backend/scripts/migrate-to-unified-schema.js
 */

const knex = require('../config/database');
const { convertToUnifiedSchema, validateUnifiedSchema } = require('../schemas/schema');
const { Resume } = require('../models/Resume');

class DataMigrator {
  constructor() {
    this.totalRecords = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.errors = [];
  }

  /**
   * 执行数据迁移
   */
  async migrate() {
    console.log('🚀 [DATA_MIGRATION] 开始统一数据范式迁移');
    console.log('🚀 [DATA_MIGRATION] 时间:', new Date().toISOString());
    
    try {
      // 1. 检查数据库连接
      await this.checkDatabase();
      
      // 2. 检查表结构
      await this.checkTableStructure();
      
      // 3. 获取需要迁移的数据
      const records = await this.getRecordsToMigrate();
      
      // 4. 执行迁移
      await this.migrateRecords(records);
      
      // 5. 生成报告
      this.generateReport();
      
      console.log('✅ [DATA_MIGRATION] 迁移完成');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ [DATA_MIGRATION] 迁移失败:', error);
      process.exit(1);
    }
  }

  /**
   * 检查数据库连接
   */
  async checkDatabase() {
    try {
      await knex.raw('SELECT 1');
      console.log('✅ [DATABASE] 数据库连接正常');
    } catch (error) {
      throw new Error(`数据库连接失败: ${error.message}`);
    }
  }

  /**
   * 检查表结构
   */
  async checkTableStructure() {
    try {
      const hasUnifiedData = await knex.schema.hasColumn('resumes', 'unified_data');
      const hasSchemaVersion = await knex.schema.hasColumn('resumes', 'schema_version');
      
      if (!hasUnifiedData || !hasSchemaVersion) {
        throw new Error('表结构未更新，请先运行数据库迁移: npm run migrate');
      }
      
      console.log('✅ [TABLE_STRUCTURE] 表结构检查通过');
    } catch (error) {
      throw new Error(`表结构检查失败: ${error.message}`);
    }
  }

  /**
   * 获取需要迁移的记录
   */
  async getRecordsToMigrate() {
    try {
      // 查找所有需要迁移的记录（unified_data为空或schema_version不是2.1的）
      const records = await knex('resumes')
        .where(function() {
          this.whereNull('unified_data')
            .orWhere('schema_version', '!=', '2.1')
            .orWhereNull('schema_version');
        })
        .select('id', 'user_id', 'title', 'unified_data', 'schema_version', 'created_at');

      this.totalRecords = records.length;
      console.log(`📊 [RECORDS] 找到 ${this.totalRecords} 条需要迁移的记录`);
      
      return records;
    } catch (error) {
      throw new Error(`获取记录失败: ${error.message}`);
    }
  }

  /**
   * 迁移记录
   */
  async migrateRecords(records) {
    console.log('🔄 [MIGRATION] 开始迁移记录...');
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const progress = `${i + 1}/${records.length}`;
      
      try {
        await this.migrateRecord(record, progress);
        this.successCount++;
      } catch (error) {
        this.errorCount++;
        this.errors.push({
          recordId: record.id,
          userId: record.user_id,
          title: record.title,
          error: error.message
        });
        console.error(`❌ [RECORD_${record.id}] 迁移失败:`, error.message);
      }
      
      // 进度显示
      if ((i + 1) % 10 === 0 || i === records.length - 1) {
        const percentage = Math.round(((i + 1) / records.length) * 100);
        console.log(`📈 [PROGRESS] ${progress} (${percentage}%)`);
      }
    }
  }

  /**
   * 迁移单条记录
   */
  async migrateRecord(record, progress) {
    console.log(`🔄 [RECORD_${record.id}] [${progress}] 开始迁移: "${record.title}"`);
    
    // 获取原始数据
    const rawData = await this.getRawData(record.id);
    
    if (!rawData) {
      console.log(`⚠️ [RECORD_${record.id}] 无原始数据，使用空模板`);
    }

    // 转换为统一格式
    const unifiedData = convertToUnifiedSchema(rawData);
    
    // 验证数据
    const validation = validateUnifiedSchema(unifiedData);
    if (!validation.valid) {
      throw new Error(`数据验证失败: ${validation.error}`);
    }

    // 更新数据库
    await knex('resumes')
      .where('id', record.id)
      .update({
        unified_data: JSON.stringify(unifiedData),
        schema_version: '2.1',
        updated_at: knex.fn.now()
      });

    console.log(`✅ [RECORD_${record.id}] 迁移成功 - 用户: ${unifiedData.profile.name || '未知'}`);
  }

  /**
   * 获取原始数据
   */
  async getRawData(recordId) {
    try {
      // 尝试从不同字段获取数据
      const result = await knex('resumes')
        .where('id', recordId)
        .select('unified_data')
        .first();
      
      if (!result) {
        return null;
      }

      // 如果已经有unified_data，直接返回
      if (result.unified_data) {
        return result.unified_data;
      }

      return null;
    } catch (error) {
      console.error(`获取原始数据失败 (记录ID: ${recordId}):`, error);
      return null;
    }
  }

  /**
   * 生成迁移报告
   */
  generateReport() {
    console.log('\n📊 [MIGRATION_REPORT] 迁移报告');
    console.log('='.repeat(50));
    console.log(`总记录数: ${this.totalRecords}`);
    console.log(`成功迁移: ${this.successCount}`);
    console.log(`失败记录: ${this.errorCount}`);
    console.log(`成功率: ${this.totalRecords > 0 ? Math.round((this.successCount / this.totalRecords) * 100) : 0}%`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ 失败记录详情:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. 记录ID: ${error.recordId}, 用户ID: ${error.userId}`);
        console.log(`   标题: ${error.title}`);
        console.log(`   错误: ${error.error}`);
      });
    }
    
    console.log('='.repeat(50));
  }
}

// 主函数
async function main() {
  const migrator = new DataMigrator();
  await migrator.migrate();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ [MAIN] 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = DataMigrator; 