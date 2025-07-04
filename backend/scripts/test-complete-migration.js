/**
 * 测试完整数据迁移脚本
 * 验证转换函数和迁移流程
 */

const knex = require('../config/database');
const { convertToUnifiedSchema, validateUnifiedSchema } = require('../schemas/schema');

class MigrationTester {
  constructor() {
    this.testCases = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  /**
   * 运行所有测试
   */
  async runTests() {
    console.log('🧪 [MIGRATION_TEST] 开始测试数据迁移脚本');
    console.log('=' .repeat(60));

    try {
      // 1. 测试数据库连接
      await this.testDatabaseConnection();

      // 2. 测试数据转换函数
      await this.testDataConversion();

      // 3. 测试实际数据库数据
      await this.testDatabaseData();

      // 4. 生成测试报告
      this.generateTestReport();

    } catch (error) {
      console.error('❌ [TEST] 测试失败:', error);
      process.exit(1);
    }
  }

  /**
   * 测试数据库连接
   */
  async testDatabaseConnection() {
    console.log('🔍 [TEST] 测试数据库连接...');
    
    try {
      await knex.raw('SELECT 1');
      this.addTestResult('数据库连接', true, '连接成功');
      
      const hasTable = await knex.schema.hasTable('resumes');
      this.addTestResult('resumes表存在', hasTable, hasTable ? '表存在' : '表不存在');
      
    } catch (error) {
      this.addTestResult('数据库连接', false, error.message);
    }
  }

  /**
   * 测试数据转换函数
   */
  async testDataConversion() {
    console.log('🔍 [TEST] 测试数据转换函数...');

    // 测试用例1: 旧格式个人信息
    const testCase1 = {
      personalInfo: {
        name: "张三",
        email: "zhang@example.com",
        phone: "13800138000"
      },
      workExperiences: [
        {
          company: "ABC公司",
          position: "前端工程师",
          duration: "2020-2023",
          description: "负责前端开发"
        }
      ],
      education: [
        {
          school: "清华大学",
          degree: "学士",
          major: "计算机科学",
          duration: "2016-2020"
        }
      ]
    };

    try {
      const result1 = convertToUnifiedSchema(testCase1);
      const validation1 = validateUnifiedSchema(result1);
      
      this.addTestResult(
        '旧格式转换', 
        validation1.valid && result1.profile.name === "张三",
        validation1.valid ? '转换成功' : validation1.error
      );
    } catch (error) {
      this.addTestResult('旧格式转换', false, error.message);
    }

    // 测试用例2: JSON字符串输入
    const testCase2 = JSON.stringify({
      name: "李四",
      email: "li@example.com",
      skills: ["JavaScript", "Python", "Java"]
    });

    try {
      const result2 = convertToUnifiedSchema(testCase2);
      const validation2 = validateUnifiedSchema(result2);
      
      this.addTestResult(
        'JSON字符串转换',
        validation2.valid && result2.profile.name === "李四",
        validation2.valid ? '转换成功' : validation2.error
      );
    } catch (error) {
      this.addTestResult('JSON字符串转换', false, error.message);
    }

    // 测试用例3: 空数据
    try {
      const result3 = convertToUnifiedSchema(null);
      const validation3 = validateUnifiedSchema(result3);
      
      this.addTestResult(
        '空数据处理',
        validation3.valid,
        validation3.valid ? '转换成功' : validation3.error
      );
    } catch (error) {
      this.addTestResult('空数据处理', false, error.message);
    }

    // 测试用例4: 无效JSON
    try {
      const result4 = convertToUnifiedSchema('{"invalid": json}');
      const validation4 = validateUnifiedSchema(result4);
      
      this.addTestResult(
        '无效JSON处理',
        validation4.valid,
        validation4.valid ? '转换成功' : validation4.error
      );
    } catch (error) {
      this.addTestResult('无效JSON处理', false, error.message);
    }
  }

  /**
   * 测试实际数据库数据
   */
  async testDatabaseData() {
    console.log('🔍 [TEST] 测试数据库实际数据...');

    try {
      // 检查是否有resumes表
      const hasTable = await knex.schema.hasTable('resumes');
      if (!hasTable) {
        this.addTestResult('数据库表测试', false, 'resumes表不存在');
        return;
      }

      // 获取记录总数
      const totalCount = await knex('resumes').count('* as count').first();
      console.log(`📊 [TEST] 数据库中共有 ${totalCount.count} 条简历记录`);

      // 检查字段存在性
      const hasUnifiedData = await knex.schema.hasColumn('resumes', 'unified_data');
      const hasSchemaVersion = await knex.schema.hasColumn('resumes', 'schema_version');

      this.addTestResult('unified_data字段存在', hasUnifiedData, hasUnifiedData ? '字段存在' : '字段不存在');
      this.addTestResult('schema_version字段存在', hasSchemaVersion, hasSchemaVersion ? '字段存在' : '字段不存在');

      if (parseInt(totalCount.count) > 0) {
        // 随机取一条记录进行测试
        const sampleRecord = await knex('resumes')
          .orderByRaw('RANDOM()')
          .limit(1)
          .first();

        if (sampleRecord) {
          console.log(`📊 [TEST] 测试记录ID: ${sampleRecord.id}, 标题: ${sampleRecord.title}`);

          // 测试数据转换
          if (sampleRecord.unified_data) {
            try {
              const data = typeof sampleRecord.unified_data === 'string' 
                ? JSON.parse(sampleRecord.unified_data)
                : sampleRecord.unified_data;
              
              const convertedData = convertToUnifiedSchema(data);
              const validation = validateUnifiedSchema(convertedData);

              this.addTestResult(
                '实际数据转换',
                validation.valid,
                validation.valid ? '转换成功' : validation.error
              );
            } catch (error) {
              this.addTestResult('实际数据转换', false, error.message);
            }
          } else {
            this.addTestResult('实际数据转换', false, '没有unified_data数据');
          }
        }

        // 检查版本分布
        const versionStats = await knex('resumes')
          .select('schema_version')
          .count('* as count')
          .groupBy('schema_version');

        console.log('📊 [TEST] 版本分布:');
        versionStats.forEach(stat => {
          console.log(`   ${stat.schema_version || 'null'}: ${stat.count} 条`);
        });

        const needsMigration = versionStats.find(s => s.schema_version !== '2.1');
        this.addTestResult(
          '需要迁移的数据',
          !!needsMigration,
          needsMigration ? `有${needsMigration.count}条数据需要迁移` : '所有数据都是最新版本'
        );
      }

    } catch (error) {
      this.addTestResult('数据库数据测试', false, error.message);
    }
  }

  /**
   * 添加测试结果
   */
  addTestResult(testName, passed, message) {
    const result = {
      name: testName,
      passed: passed,
      message: message
    };
    
    this.testCases.push(result);
    
    if (passed) {
      this.passedTests++;
      console.log(`✅ [TEST] ${testName}: ${message}`);
    } else {
      this.failedTests++;
      console.log(`❌ [TEST] ${testName}: ${message}`);
    }
  }

  /**
   * 生成测试报告
   */
  generateTestReport() {
    console.log('\n📊 [TEST_REPORT] 测试报告');
    console.log('=' .repeat(60));
    console.log(`总测试数: ${this.testCases.length}`);
    console.log(`通过测试: ${this.passedTests}`);
    console.log(`失败测试: ${this.failedTests}`);
    console.log(`通过率: ${this.testCases.length > 0 ? Math.round((this.passedTests / this.testCases.length) * 100) : 0}%`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testCases
        .filter(test => !test.passed)
        .forEach((test, index) => {
          console.log(`${index + 1}. ${test.name}: ${test.message}`);
        });
    }
    
    console.log('=' .repeat(60));
    
    if (this.failedTests === 0) {
      console.log('🎉 所有测试通过！迁移脚本可以安全使用。');
    } else {
      console.log('⚠️ 有测试失败，请检查问题后再运行迁移。');
    }
  }
}

// 主函数
async function main() {
  const tester = new MigrationTester();
  await tester.runTests();
  
  // 关闭数据库连接
  await knex.destroy();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ [MAIN] 测试脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = MigrationTester; 