/**
 * 测试获取简历列表API
 */

const jwt = require('jsonwebtoken');
const { Resume } = require('../models/Resume');
const knex = require('../config/database');

async function testGetResumes() {
  try {
    console.log('🔍 [TEST] 开始测试获取简历列表功能...');
    
    // 1. 测试数据库连接
    console.log('📊 [TEST] 测试数据库连接...');
    await knex.raw('SELECT 1');
    console.log('✅ [TEST] 数据库连接正常');
    
    // 2. 查询用户ID为2的简历
    const userId = 2;
    console.log(`🔍 [TEST] 查询用户ID ${userId} 的简历列表...`);
    
    try {
      const resumes = await Resume.findListByUserId(userId);
      console.log('✅ [TEST] 查询成功！');
      console.log(`📊 [TEST] 返回简历数量: ${resumes.length}`);
      
      if (resumes.length > 0) {
        console.log('📋 [TEST] 第一条简历信息:');
        console.log(JSON.stringify(resumes[0], null, 2));
      }
      
      return resumes;
    } catch (error) {
      console.error('❌ [TEST] Resume.findListByUserId 调用失败:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ [TEST] 测试失败:', error);
    throw error;
  }
}

// 直接运行测试
if (require.main === module) {
  testGetResumes()
    .then(() => {
      console.log('✅ [TEST] 所有测试通过');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ [TEST] 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testGetResumes }; 