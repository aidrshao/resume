/**
 * 完整数据迁移脚本：将现有简历数据转换为统一格式
 * 
 * 功能：
 * 1. 检查数据库连接和表结构
 * 2. 获取所有需要迁移的简历记录
 * 3. 使用convertToUnifiedSchema函数转换数据格式
 * 4. 更新数据库中的unified_data字段和schema_version
 * 5. 生成详细的迁移报告
 * 
 * 使用方法：
 * node backend/scripts/complete-data-migration.js
 * 
 * 或者在package.json中添加脚本：
 * "migrate:data": "node backend/scripts/complete-data-migration.js"
 */

const knex = require('../config/database');
const fs = require('fs');
const path = require('path');

// 导入转换函数 - 使用require而不是import以兼容Node.js
const schemaPath = path.join(__dirname, '../schemas/schema.js');

// 动态导入schema模块
let convertToUnifiedSchema, validateUnifiedSchema, EMPTY_UNIFIED_RESUME;

// 在运行时动态加载模块
async function loadSchemaModule() {
  try {
    // 尝试使用require（如果是CommonJS格式）
    const schemaModule = require('../schemas/schema');
    convertToUnifiedSchema = schemaModule.convertToUnifiedSchema;
    validateUnifiedSchema = schemaModule.validateUnifiedSchema;
    EMPTY_UNIFIED_RESUME = schemaModule.EMPTY_UNIFIED_RESUME;
  } catch (error) {
    // 如果require失败，尝试使用动态import（ES模块）
    const schemaModule = await import('../schemas/schema.js');
    convertToUnifiedSchema = schemaModule.convertToUnifiedSchema;
    validateUnifiedSchema = schemaModule.validateUnifiedSchema;
    EMPTY_UNIFIED_RESUME = schemaModule.EMPTY_UNIFIED_RESUME;
  }
}

class CompleteDataMigrator {
  constructor() {
    this.totalRecords = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
    this.errors = [];
    this.migrationLog = [];
    this.startTime = new Date();
  }

  /**
   * 执行完整数据迁移
   */
  async migrate() {
    console.log('🚀 [COMPLETE_MIGRATION] 开始完整数据迁移');
    console.log('🚀 [COMPLETE_MIGRATION] 时间:', this.startTime.toISOString());
    console.log('=' .repeat(60));
    
    try {
      // 0. 加载schema模块
      await loadSchemaModule();
      console.log('✅ [SCHEMA] Schema模块加载成功');
      
      // 1. 检查数据库连接
      await this.checkDatabase();
      
      // 2. 检查表结构
      await this.checkTableStructure();
      
      // 3. 创建备份
      await this.createBackup();
      
      // 4. 获取需要迁移的数据
      const records = await this.getRecordsToMigrate();
      
      // 5. 执行迁移
      await this.migrateRecords(records);
      
      // 6. 验证迁移结果
      await this.validateMigrationResults();
      
      // 7. 生成报告
      await this.generateReport();
      
      console.log('✅ [COMPLETE_MIGRATION] 迁移完成');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ [COMPLETE_MIGRATION] 迁移失败:', error);
      await this.rollbackOnError();
      process.exit(1);
    }
  }

  /**
   * 检查数据库连接
   */
  async checkDatabase() {
    try {
      await knex.raw('SELECT 1');
      const dbInfo = await knex.raw('SELECT version() as version');
      console.log('✅ [DATABASE] 数据库连接正常');
      console.log(`📊 [DATABASE] 数据库版本: ${dbInfo.rows[0].version.split(' ')[0]}`);
    } catch (error) {
      throw new Error(`数据库连接失败: ${error.message}`);
    }
  }

  /**
   * 检查表结构
   */
  async checkTableStructure() {
    try {
      // 检查resumes表是否存在
      const hasTable = await knex.schema.hasTable('resumes');
      if (!hasTable) {
        throw new Error('resumes表不存在');
      }

      // 检查必要字段
      const hasUnifiedData = await knex.schema.hasColumn('resumes', 'unified_data');
      const hasSchemaVersion = await knex.schema.hasColumn('resumes', 'schema_version');
      
      if (!hasUnifiedData || !hasSchemaVersion) {
        console.log('⚠️ [TABLE_STRUCTURE] 缺少必要字段，尝试创建...');
        await this.createMissingColumns();
      }
      
      console.log('✅ [TABLE_STRUCTURE] 表结构检查通过');
    } catch (error) {
      throw new Error(`表结构检查失败: ${error.message}`);
    }
  }

  /**
   * 创建缺失的列
   */
  async createMissingColumns() {
    try {
      await knex.schema.alterTable('resumes', function(table) {
        const hasUnifiedData = knex.schema.hasColumn('resumes', 'unified_data');
        const hasSchemaVersion = knex.schema.hasColumn('resumes', 'schema_version');
        
        if (!hasUnifiedData) {
          table.jsonb('unified_data').nullable().comment('统一格式的简历数据');
          console.log('✅ [TABLE_STRUCTURE] 创建unified_data字段');
        }
        
        if (!hasSchemaVersion) {
          table.string('schema_version', 10).defaultTo('1.0').comment('数据结构版本');
          console.log('✅ [TABLE_STRUCTURE] 创建schema_version字段');
        }
      });
    } catch (error) {
      throw new Error(`创建缺失列失败: ${error.message}`);
    }
  }

  /**
   * 创建数据备份
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupTable = `resumes_backup_${timestamp.slice(0, 19)}`;
      
      // 创建备份表
      await knex.raw(`CREATE TABLE ${backupTable} AS SELECT * FROM resumes`);
      
      console.log(`✅ [BACKUP] 数据备份创建成功: ${backupTable}`);
      this.migrationLog.push(`备份表: ${backupTable}`);
    } catch (error) {
      console.warn(`⚠️ [BACKUP] 备份创建失败: ${error.message}`);
      // 备份失败不中断迁移，但记录警告
    }
  }

  /**
   * 获取需要迁移的记录
   */
  async getRecordsToMigrate() {
    try {
      // 查找所有需要迁移的记录
      const records = await knex('resumes')
        .where(function() {
          this.whereNull('schema_version')
            .orWhere('schema_version', '!=', '2.1')
            .orWhereNull('unified_data');
        })
        .select('id', 'user_id', 'title', 'unified_data', 'schema_version', 'created_at', 'updated_at');

      this.totalRecords = records.length;
      console.log(`📊 [RECORDS] 找到 ${this.totalRecords} 条需要迁移的记录`);
      
      if (this.totalRecords === 0) {
        console.log('ℹ️ [RECORDS] 没有需要迁移的记录');
        return [];
      }

      // 显示记录分布
      const versionStats = await knex('resumes')
        .select('schema_version')
        .count('* as count')
        .groupBy('schema_version');
      
      console.log('📊 [RECORDS] 当前版本分布:');
      versionStats.forEach(stat => {
        console.log(`   ${stat.schema_version || 'null'}: ${stat.count} 条`);
      });
      
      return records;
    } catch (error) {
      throw new Error(`获取记录失败: ${error.message}`);
    }
  }

  /**
   * 迁移所有记录
   */
  async migrateRecords(records) {
    if (records.length === 0) {
      return;
    }

    console.log('🔄 [MIGRATION] 开始迁移记录...');
    console.log('-'.repeat(60));
    
    // 分批处理以避免内存问题
    const batchSize = 50;
    const batches = Math.ceil(records.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, records.length);
      const batch = records.slice(start, end);
      
      console.log(`📦 [BATCH] 处理批次 ${batchIndex + 1}/${batches} (记录 ${start + 1}-${end})`);
      
      for (let i = 0; i < batch.length; i++) {
        const record = batch[i];
        const globalIndex = start + i;
        const progress = `${globalIndex + 1}/${records.length}`;
        
        try {
          const result = await this.migrateRecord(record, progress);
          if (result.skipped) {
            this.skippedCount++;
          } else {
            this.successCount++;
          }
        } catch (error) {
          this.errorCount++;
          this.errors.push({
            recordId: record.id,
            userId: record.user_id,
            title: record.title,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          console.error(`❌ [RECORD_${record.id}] 迁移失败:`, error.message);
        }
        
        // 进度显示
        if ((globalIndex + 1) % 10 === 0 || globalIndex === records.length - 1) {
          const percentage = Math.round(((globalIndex + 1) / records.length) * 100);
          console.log(`📈 [PROGRESS] ${progress} (${percentage}%)`);
        }
      }
      
      // 批次间暂停，避免数据库压力
      if (batchIndex < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * 迁移单条记录
   */
  async migrateRecord(record, progress) {
    console.log(`🔄 [RECORD_${record.id}] [${progress}] 开始迁移: "${record.title}"`);
    
    // 获取原始数据
    const rawData = await this.getRawData(record);
    
    if (!rawData) {
      console.log(`⚠️ [RECORD_${record.id}] 无原始数据，跳过迁移`);
      return { skipped: true };
    }

    // 检查是否已经是统一格式
    if (this.isAlreadyUnified(rawData)) {
      console.log(`ℹ️ [RECORD_${record.id}] 数据已是统一格式，仅更新版本号`);
      await this.updateSchemaVersion(record.id);
      return { skipped: false };
    }

    // 转换为统一格式
    console.log(`🔄 [RECORD_${record.id}] 转换数据格式...`);
    const unifiedData = convertToUnifiedSchema(rawData);
    
    // 验证转换结果
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

    const userName = unifiedData.profile?.name || '未知';
    console.log(`✅ [RECORD_${record.id}] 迁移成功 - 用户: ${userName}`);
    
    return { skipped: false };
  }

  /**
   * 获取原始数据
   */
  async getRawData(record) {
    try {
      // 从unified_data字段获取数据
      if (record.unified_data) {
        return record.unified_data;
      }

      // 如果unified_data为空，尝试从其他可能的字段获取
      const fullRecord = await knex('resumes')
        .where('id', record.id)
        .select('*')
        .first();

      if (!fullRecord) {
        return null;
      }

      // 检查可能的数据字段
      const possibleFields = ['resume_data', 'content', 'data'];
      for (const field of possibleFields) {
        if (fullRecord[field]) {
          console.log(`📊 [RECORD_${record.id}] 从${field}字段获取数据`);
          return fullRecord[field];
        }
      }

      return null;
    } catch (error) {
      console.error(`获取原始数据失败 (记录ID: ${record.id}):`, error);
      return null;
    }
  }

  /**
   * 检查数据是否已经是统一格式
   */
  isAlreadyUnified(data) {
    try {
      let parsedData = data;
      if (typeof data === 'string') {
        parsedData = JSON.parse(data);
      }

      // 检查是否包含统一格式的必要字段
      return parsedData && 
             typeof parsedData.profile === 'object' &&
             Array.isArray(parsedData.workExperience) &&
             Array.isArray(parsedData.education) &&
             Array.isArray(parsedData.skills);
    } catch (error) {
      return false;
    }
  }

  /**
   * 仅更新schema版本
   */
  async updateSchemaVersion(recordId) {
    await knex('resumes')
      .where('id', recordId)
      .update({
        schema_version: '2.1',
        updated_at: knex.fn.now()
      });
  }

  /**
   * 验证迁移结果
   */
  async validateMigrationResults() {
    try {
      console.log('🔍 [VALIDATION] 验证迁移结果...');
      
      // 检查迁移后的数据统计
      const stats = await knex('resumes')
        .select('schema_version')
        .count('* as count')
        .groupBy('schema_version');

      console.log('📊 [VALIDATION] 迁移后版本分布:');
      stats.forEach(stat => {
        console.log(`   ${stat.schema_version || 'null'}: ${stat.count} 条`);
      });

      // 检查是否有unified_data为空的记录
      const emptyUnifiedData = await knex('resumes')
        .whereNull('unified_data')
        .count('* as count')
        .first();

      if (parseInt(emptyUnifiedData.count) > 0) {
        console.warn(`⚠️ [VALIDATION] 发现 ${emptyUnifiedData.count} 条记录的unified_data为空`);
      } else {
        console.log('✅ [VALIDATION] 所有记录都有unified_data');
      }

      // 随机验证几条记录的数据格式
      const sampleRecords = await knex('resumes')
        .where('schema_version', '2.1')
        .limit(5)
        .select('id', 'unified_data');

      let validSamples = 0;
      for (const record of sampleRecords) {
        try {
          const data = typeof record.unified_data === 'string' 
            ? JSON.parse(record.unified_data) 
            : record.unified_data;
          
          const validation = validateUnifiedSchema(data);
          if (validation.valid) {
            validSamples++;
          } else {
            console.warn(`⚠️ [VALIDATION] 记录 ${record.id} 验证失败: ${validation.error}`);
          }
        } catch (error) {
          console.warn(`⚠️ [VALIDATION] 记录 ${record.id} 解析失败: ${error.message}`);
        }
      }

      console.log(`✅ [VALIDATION] 样本验证通过率: ${validSamples}/${sampleRecords.length}`);
      
    } catch (error) {
      console.error('❌ [VALIDATION] 验证过程失败:', error);
    }
  }

  /**
   * 错误回滚
   */
  async rollbackOnError() {
    console.log('🔄 [ROLLBACK] 检查是否需要回滚...');
    // 这里可以实现回滚逻辑，比如从备份表恢复数据
    // 现在只记录错误信息
    if (this.errors.length > 0) {
      console.error('❌ [ROLLBACK] 迁移过程中发生错误，请检查错误日志');
    }
  }

  /**
   * 生成迁移报告
   */
  async generateReport() {
    const endTime = new Date();
    const duration = (endTime - this.startTime) / 1000;

    console.log('\n📊 [MIGRATION_REPORT] 迁移报告');
    console.log('=' .repeat(60));
    console.log(`开始时间: ${this.startTime.toISOString()}`);
    console.log(`结束时间: ${endTime.toISOString()}`);
    console.log(`总耗时: ${duration.toFixed(2)} 秒`);
    console.log(`总记录数: ${this.totalRecords}`);
    console.log(`成功迁移: ${this.successCount}`);
    console.log(`跳过记录: ${this.skippedCount}`);
    console.log(`失败记录: ${this.errorCount}`);
    
    if (this.totalRecords > 0) {
      const successRate = Math.round(((this.successCount + this.skippedCount) / this.totalRecords) * 100);
      console.log(`成功率: ${successRate}%`);
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ 失败记录详情:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. 记录ID: ${error.recordId}, 用户ID: ${error.userId}`);
        console.log(`   标题: ${error.title}`);
        console.log(`   错误: ${error.error}`);
        console.log(`   时间: ${error.timestamp}`);
      });
    }
    
    console.log('=' .repeat(60));

    // 保存报告到文件
    await this.saveReportToFile({
      startTime: this.startTime,
      endTime: endTime,
      duration: duration,
      totalRecords: this.totalRecords,
      successCount: this.successCount,
      skippedCount: this.skippedCount,
      errorCount: this.errorCount,
      errors: this.errors,
      migrationLog: this.migrationLog
    });
  }

  /**
   * 保存报告到文件
   */
  async saveReportToFile(report) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(__dirname, `../logs/migration-report-${timestamp.slice(0, 19)}.json`);
      
      // 确保logs目录存在
      const logsDir = path.dirname(reportPath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 [REPORT] 详细报告已保存到: ${reportPath}`);
    } catch (error) {
      console.error('⚠️ [REPORT] 保存报告文件失败:', error.message);
    }
  }
}

// 主函数
async function main() {
  const migrator = new CompleteDataMigrator();
  await migrator.migrate();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ [MAIN] 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = CompleteDataMigrator; 