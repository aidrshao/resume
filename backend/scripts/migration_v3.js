/**
 * 数据迁移脚本 - 版本 3.2
 * 将现有简历数据转换为新的统一格式
 * 
 * 执行方式：node backend/scripts/migration_v3.js
 * 
 * 功能：
 * 1. 连接数据库
 * 2. 查询所有需要迁移的简历数据
 * 3. 使用convertToUnifiedSchema函数转换数据格式
 * 4. 更新数据库中的unified_data和schema_version字段
 * 5. 生成迁移报告
 */

const knex = require('knex');
const path = require('path');
const fs = require('fs');
const { convertToUnifiedSchema, validateUnifiedSchema } = require('../schemas/schema');

// 数据库配置
const dbConfig = require('../knexfile');
const db = knex(dbConfig.development);

/**
 * 迁移统计信息
 */
const migrationStats = {
  totalResumes: 0,
  successfulMigrations: 0,
  failedMigrations: 0,
  skippedMigrations: 0,
  errors: []
};

/**
 * 记录迁移日志
 * @param {string} level - 日志级别 (INFO, WARN, ERROR)
 * @param {string} message - 日志消息
 * @param {Object} data - 附加数据
 */
function logMigration(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  console.log(`[${timestamp}] [${level}] ${message}`);
  if (data) {
    console.log('  数据:', JSON.stringify(data, null, 2));
  }
}

/**
 * 转换单个简历数据
 * @param {Object} resume - 简历记录
 * @returns {Object} 转换结果
 */
async function migrateResumeData(resume) {
  try {
    logMigration('INFO', `开始迁移简历 ID: ${resume.id}`);
    
    // 检查是否已经是最新版本
    if (resume.schema_version === '3.2') {
      logMigration('INFO', `简历 ID: ${resume.id} 已经是最新版本，跳过迁移`);
      migrationStats.skippedMigrations++;
      return { success: true, skipped: true };
    }
    
    // 解析现有数据
    let oldData;
    if (typeof resume.unified_data === 'string') {
      try {
        oldData = JSON.parse(resume.unified_data);
      } catch (parseError) {
        logMigration('ERROR', `简历 ID: ${resume.id} 数据解析失败`, { error: parseError.message });
        migrationStats.errors.push({
          resumeId: resume.id,
          error: `数据解析失败: ${parseError.message}`
        });
        return { success: false, error: parseError.message };
      }
    } else if (typeof resume.unified_data === 'object') {
      oldData = resume.unified_data;
    } else {
      logMigration('WARN', `简历 ID: ${resume.id} 没有有效的数据，使用空模板`);
      oldData = null;
    }
    
    // 转换数据格式
    const unifiedData = convertToUnifiedSchema(oldData);
    
    // 验证转换后的数据
    const validation = validateUnifiedSchema(unifiedData);
    if (!validation.valid) {
      logMigration('ERROR', `简历 ID: ${resume.id} 数据验证失败`, { error: validation.error });
      migrationStats.errors.push({
        resumeId: resume.id,
        error: `数据验证失败: ${validation.error}`
      });
      return { success: false, error: validation.error };
    }
    
    // 更新数据库
    await db('resumes')
      .where('id', resume.id)
      .update({
        unified_data: JSON.stringify(unifiedData),
        schema_version: '3.2',
        updated_at: db.fn.now()
      });
    
    logMigration('INFO', `简历 ID: ${resume.id} 迁移成功`);
    migrationStats.successfulMigrations++;
    
    return { success: true, data: unifiedData };
    
  } catch (error) {
    logMigration('ERROR', `简历 ID: ${resume.id} 迁移失败`, { error: error.message });
    migrationStats.errors.push({
      resumeId: resume.id,
      error: error.message
    });
    migrationStats.failedMigrations++;
    return { success: false, error: error.message };
  }
}

/**
 * 执行数据迁移
 */
async function runMigration() {
  try {
    logMigration('INFO', '开始数据迁移 - 版本 3.2');
    
    // 查询所有需要迁移的简历
    const resumes = await db('resumes')
      .select('id', 'unified_data', 'schema_version', 'title', 'user_id')
      .whereNull('schema_version')
      .orWhere('schema_version', '!=', '3.2');
    
    migrationStats.totalResumes = resumes.length;
    
    if (resumes.length === 0) {
      logMigration('INFO', '没有需要迁移的简历数据');
      return;
    }
    
    logMigration('INFO', `找到 ${resumes.length} 条需要迁移的简历记录`);
    
    // 逐个迁移简历数据
    for (let i = 0; i < resumes.length; i++) {
      const resume = resumes[i];
      logMigration('INFO', `处理进度: ${i + 1}/${resumes.length}`);
      
      await migrateResumeData(resume);
      
      // 每处理10条记录暂停一下，避免数据库压力过大
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 生成迁移报告
    await generateMigrationReport();
    
    logMigration('INFO', '数据迁移完成');
    
  } catch (error) {
    logMigration('ERROR', '数据迁移失败', { error: error.message });
    throw error;
  }
}

/**
 * 生成迁移报告
 */
async function generateMigrationReport() {
  const reportData = {
    migrationDate: new Date().toISOString(),
    schemaVersion: '3.2',
    statistics: migrationStats,
    databaseStatus: await getDatabaseStatus()
  };
  
  // 保存报告到文件
  const reportPath = path.join(__dirname, '../logs', `migration-v3-report-${Date.now()}.json`);
  
  // 确保logs目录存在
  const logsDir = path.dirname(reportPath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  // 打印报告摘要
  console.log('\n=== 迁移报告摘要 ===');
  console.log(`总计简历数量: ${migrationStats.totalResumes}`);
  console.log(`成功迁移: ${migrationStats.successfulMigrations}`);
  console.log(`跳过迁移: ${migrationStats.skippedMigrations}`);
  console.log(`失败迁移: ${migrationStats.failedMigrations}`);
  console.log(`错误数量: ${migrationStats.errors.length}`);
  console.log(`详细报告: ${reportPath}`);
  
  if (migrationStats.errors.length > 0) {
    console.log('\n=== 错误详情 ===');
    migrationStats.errors.forEach(error => {
      console.log(`简历 ID ${error.resumeId}: ${error.error}`);
    });
  }
}

/**
 * 获取数据库状态
 */
async function getDatabaseStatus() {
  try {
    const totalCount = await db('resumes').count('id as count').first();
    const v3Count = await db('resumes').where('schema_version', '3.2').count('id as count').first();
    
    return {
      totalResumes: parseInt(totalCount.count),
      v3Resumes: parseInt(v3Count.count),
      migrationProgress: totalCount.count > 0 ? (v3Count.count / totalCount.count * 100).toFixed(2) + '%' : '0%'
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 测试数据库连接
    await db.raw('SELECT 1');
    logMigration('INFO', '数据库连接成功');
    
    // 执行迁移
    await runMigration();
    
    process.exit(0);
    
  } catch (error) {
    logMigration('ERROR', '迁移过程中发生错误', { error: error.message });
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await db.destroy();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  runMigration,
  migrateResumeData,
  convertToUnifiedSchema
}; 