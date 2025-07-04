/**
 * 统一数据范式测试脚本
 * 
 * 验证以下功能：
 * 1. 数据库表结构是否正确
 * 2. 数据转换函数是否正常工作
 * 3. Resume模型是否支持新格式
 * 4. 向后兼容性是否正常
 * 
 * 使用方法：
 * node backend/scripts/test-unified-schema.js
 */

const knex = require('../config/database');
const { Resume } = require('../models/Resume');
const { 
  convertToUnifiedSchema, 
  validateUnifiedSchema, 
  EMPTY_UNIFIED_RESUME,
  UNIFIED_RESUME_SCHEMA 
} = require('../schemas/schema');

class UnifiedSchemaTests {
  constructor() {
    this.passedTests = 0;
    this.failedTests = 0;
    this.results = [];
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 [UNIFIED_SCHEMA_TESTS] 开始统一数据范式测试');
    console.log('🧪 [UNIFIED_SCHEMA_TESTS] 时间:', new Date().toISOString());
    console.log('='.repeat(60));

    try {
      // 测试1: 数据库连接和表结构
      await this.testDatabaseStructure();
      
      // 测试2: 数据转换函数
      await this.testDataConversion();
      
      // 测试3: 数据验证函数
      await this.testDataValidation();
      
      // 测试4: Resume模型功能
      await this.testResumeModel();
      
      // 测试5: 向后兼容性
      await this.testBackwardCompatibility();
      
      // 生成测试报告
      this.generateReport();
      
    } catch (error) {
      console.error('❌ [TESTS] 测试执行失败:', error);
      process.exit(1);
    }
  }

  /**
   * 测试数据库表结构
   */
  async testDatabaseStructure() {
    console.log('\n📊 [TEST_1] 测试数据库表结构');
    
    try {
      // 检查数据库连接
      await this.assert('数据库连接', async () => {
        await knex.raw('SELECT 1');
        return true;
      });

      // 检查unified_data字段
      await this.assert('unified_data字段存在', async () => {
        return await knex.schema.hasColumn('resumes', 'unified_data');
      });

      // 检查schema_version字段
      await this.assert('schema_version字段存在', async () => {
        return await knex.schema.hasColumn('resumes', 'schema_version');
      });

      // 检查字段类型
      await this.assert('unified_data字段类型为JSONB', async () => {
        const columns = await knex('information_schema.columns')
          .select('data_type')
          .where('table_name', 'resumes')
          .where('column_name', 'unified_data')
          .first();
        
        return columns && columns.data_type === 'jsonb';
      });

    } catch (error) {
      console.error('数据库结构测试失败:', error);
    }
  }

  /**
   * 测试数据转换函数
   */
  async testDataConversion() {
    console.log('\n🔄 [TEST_2] 测试数据转换函数');

    try {
      // 测试空数据转换
      await this.assert('空数据转换', () => {
        const result = convertToUnifiedSchema(null);
        return result && result.profile && result.workExperience;
      });

      // 测试字符串JSON转换
      await this.assert('JSON字符串转换', () => {
        const testData = JSON.stringify({
          name: "测试用户",
          email: "test@example.com",
          workExperience: [{
            company: "测试公司",
            position: "测试岗位",
            duration: "2020-2023",
            description: "测试工作描述"
          }]
        });
        
        const result = convertToUnifiedSchema(testData);
        return result.profile.name === "测试用户" && 
               result.profile.email === "test@example.com" &&
               result.workExperience.length === 1;
      });

      // 测试对象转换
      await this.assert('对象数据转换', () => {
        const testData = {
          personalInfo: {
            name: "张三",
            email: "zhang@example.com",
            phone: "13800138000"
          },
          workExperiences: [{
            company: "ABC公司",
            position: "前端工程师",
            duration: "2021-至今",
            description: "负责前端开发"
          }],
          skills: ["JavaScript", "React", "Vue"]
        };
        
        const result = convertToUnifiedSchema(testData);
        return result.profile.name === "张三" && 
               result.workExperience.length === 1 &&
               result.skills.length === 1;
      });

      // 测试旧格式兼容性
      await this.assert('旧格式兼容性转换', () => {
        const oldData = {
          name: "李四",
          email: "li@example.com",
          work_experience: [{
            employer: "XYZ公司",
            title: "后端工程师",
            period: "2019-2022",
            responsibilities: "负责后端开发"
          }],
          education: [{
            university: "北京大学",
            degree: "本科",
            field: "计算机科学",
            time: "2015-2019"
          }]
        };
        
        const result = convertToUnifiedSchema(oldData);
        return result.profile.name === "李四" &&
               result.workExperience[0].company === "XYZ公司" &&
               result.education[0].school === "北京大学";
      });

    } catch (error) {
      console.error('数据转换测试失败:', error);
    }
  }

  /**
   * 测试数据验证函数
   */
  async testDataValidation() {
    console.log('\n✅ [TEST_3] 测试数据验证函数');

    try {
      // 测试有效数据验证
      await this.assert('有效数据验证通过', () => {
        const validData = {
          profile: {
            name: "测试用户",
            email: "test@example.com",
            phone: "",
            location: "",
            portfolio: "",
            linkedin: "",
            summary: ""
          },
          workExperience: [],
          projectExperience: [],
          education: [],
          skills: [],
          customSections: []
        };
        
        const result = validateUnifiedSchema(validData);
        return result.valid === true;
      });

      // 测试无效数据验证
      await this.assert('无效数据验证失败', () => {
        const invalidData = {
          // 缺少profile字段
          workExperience: [],
          education: []
        };
        
        const result = validateUnifiedSchema(invalidData);
        return result.valid === false && result.error.includes('profile');
      });

      // 测试字段类型验证
      await this.assert('字段类型验证', () => {
        const invalidData = {
          profile: {
            name: "测试",
            email: "test@example.com"
          },
          workExperience: "应该是数组",  // 错误类型
          education: []
        };
        
        const result = validateUnifiedSchema(invalidData);
        return result.valid === false && result.error.includes('workExperience');
      });

    } catch (error) {
      console.error('数据验证测试失败:', error);
    }
  }

  /**
   * 测试Resume模型功能
   */
  async testResumeModel() {
    console.log('\n📝 [TEST_4] 测试Resume模型功能');

    try {
      // 测试模型连接
      await this.assert('Resume模型数据库连接', async () => {
        return await Resume.testConnection();
      });

      // 测试enrichResumeData方法
      await this.assert('enrichResumeData方法', () => {
        const testResume = {
          id: 999,
          unified_data: JSON.stringify({
            profile: { name: "测试用户", email: "test@example.com" },
            workExperience: [],
            education: [],
            skills: [],
            projectExperience: [],
            customSections: []
          }),
          schema_version: "2.1"
        };
        
        const result = Resume.enrichResumeData(testResume);
        return result && 
               result.unified_data.profile.name === "测试用户" &&
               result.content.profile.name === "测试用户";
      });

      // 测试旧数据处理
      await this.assert('旧数据enrichResumeData处理', () => {
        const oldResume = {
          id: 998,
          resume_data: JSON.stringify({
            name: "旧格式用户",
            email: "old@example.com",
            workExperiences: [{
              company: "旧公司",
              position: "旧职位",
              duration: "2020-2021",
              description: "旧描述"
            }]
          })
        };
        
        const result = Resume.enrichResumeData(oldResume);
        return result && 
               result.unified_data.profile.name === "旧格式用户" &&
               result.workExperience.length === 1;
      });

    } catch (error) {
      console.error('Resume模型测试失败:', error);
    }
  }

  /**
   * 测试向后兼容性
   */
  async testBackwardCompatibility() {
    console.log('\n🔄 [TEST_5] 测试向后兼容性');

    try {
      // 测试EMPTY_UNIFIED_RESUME结构
      await this.assert('默认空模板结构正确', () => {
        const validation = validateUnifiedSchema(EMPTY_UNIFIED_RESUME);
        return validation.valid;
      });

      // 测试schema结构完整性
      await this.assert('UNIFIED_RESUME_SCHEMA定义完整', () => {
        return UNIFIED_RESUME_SCHEMA &&
               UNIFIED_RESUME_SCHEMA.profile &&
               UNIFIED_RESUME_SCHEMA.workExperience &&
               UNIFIED_RESUME_SCHEMA.education &&
               UNIFIED_RESUME_SCHEMA.skills &&
               UNIFIED_RESUME_SCHEMA.projectExperience &&
               UNIFIED_RESUME_SCHEMA.customSections;
      });

      // 测试旧API兼容性
      await this.assert('旧API字段兼容性', () => {
        const testData = {
          id: 1,
          unified_data: JSON.stringify(EMPTY_UNIFIED_RESUME)
        };
        
        const result = Resume.enrichResumeData(testData);
        
        // 检查是否同时包含新旧字段
        return result.unified_data && 
               result.content && 
               result.resume_data;
      });

    } catch (error) {
      console.error('向后兼容性测试失败:', error);
    }
  }

  /**
   * 断言辅助函数
   */
  async assert(testName, testFunction) {
    try {
      const result = await testFunction();
      if (result) {
        console.log(`  ✅ ${testName}`);
        this.passedTests++;
        this.results.push({ name: testName, status: 'PASS' });
      } else {
        console.log(`  ❌ ${testName}`);
        this.failedTests++;
        this.results.push({ name: testName, status: 'FAIL', error: '断言返回false' });
      }
    } catch (error) {
      console.log(`  ❌ ${testName}: ${error.message}`);
      this.failedTests++;
      this.results.push({ name: testName, status: 'ERROR', error: error.message });
    }
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    console.log('\n📊 [TEST_REPORT] 测试报告');
    console.log('='.repeat(60));
    console.log(`总测试数: ${this.passedTests + this.failedTests}`);
    console.log(`通过测试: ${this.passedTests}`);
    console.log(`失败测试: ${this.failedTests}`);
    console.log(`成功率: ${this.passedTests + this.failedTests > 0 ? Math.round((this.passedTests / (this.passedTests + this.failedTests)) * 100) : 0}%`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ 失败测试详情:');
      this.results
        .filter(result => result.status !== 'PASS')
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.name}: ${result.error || result.status}`);
        });
      
      console.log('\n⚠️ 建议检查以上失败的测试项目');
    } else {
      console.log('\n🎉 所有测试通过！统一数据范式实施成功！');
    }
    
    console.log('='.repeat(60));
  }
}

// 主函数
async function main() {
  const tests = new UnifiedSchemaTests();
  await tests.runAllTests();
  
  // 根据测试结果设置退出码
  process.exit(tests.failedTests > 0 ? 1 : 0);
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ [MAIN] 测试脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = UnifiedSchemaTests; 