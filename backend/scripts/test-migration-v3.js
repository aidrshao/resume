/**
 * 测试数据迁移功能 - 版本 3.2
 * 验证convertToUnifiedSchema函数和数据迁移逻辑
 * 
 * 执行方式：node backend/scripts/test-migration-v3.js
 */

const { convertToUnifiedSchema, validateUnifiedSchema, EMPTY_UNIFIED_RESUME } = require('../schemas/schema');

/**
 * 测试数据样本
 */
const testCases = [
  {
    name: "完整的旧格式数据",
    input: {
      profile: {
        name: "张三",
        email: "zhangsan@example.com",
        phone: "13800138000",
        location: "北京市",
        portfolio: "https://zhangsan.dev",
        linkedin: "https://linkedin.com/in/zhangsan",
        summary: "资深前端开发工程师"
      },
      workExperience: [
        {
          company: "阿里巴巴",
          position: "高级前端工程师",
          duration: "2020-2023",
          description: "负责淘宝前端开发"
        }
      ],
      projectExperience: [
        {
          name: "电商平台",
          role: "技术负责人",
          duration: "2022-2023",
          description: "从零搭建电商平台",
          url: "https://example.com"
        }
      ],
      education: [
        {
          school: "清华大学",
          degree: "本科",
          major: "计算机科学",
          duration: "2016-2020"
        }
      ],
      skills: [
        {
          category: "前端技术",
          details: "React, Vue, Angular"
        }
      ],
      customSections: [
        {
          title: "获奖经历",
          content: "2022年最佳员工"
        }
      ]
    }
  },
  {
    name: "personalInfo格式的旧数据",
    input: {
      personalInfo: {
        name: "李四",
        email: "lisi@example.com",
        phone: "13900139000"
      },
      workExperiences: [
        {
          company: "腾讯",
          position: "后端工程师",
          duration: "2021-2023"
        }
      ],
      projects: [
        {
          title: "微信小程序",
          role: "开发者",
          duration: "2022"
        }
      ],
      skills: ["Java", "Python", "MySQL"]
    }
  },
  {
    name: "空数据",
    input: null
  },
  {
    name: "部分缺失字段",
    input: {
      profile: {
        name: "王五"
      },
      workExperience: []
    }
  }
];

/**
 * 运行单个测试用例
 * @param {Object} testCase - 测试用例
 * @param {number} index - 测试用例索引
 */
function runTestCase(testCase, index) {
  console.log(`\n=== 测试用例 ${index + 1}: ${testCase.name} ===`);
  
  try {
    // 转换数据
    const result = convertToUnifiedSchema(testCase.input);
    
    // 验证结果
    const validation = validateUnifiedSchema(result);
    
    console.log('✅ 转换成功');
    console.log('📊 转换结果:');
    console.log('  - 姓名:', result.profile.name || '(空)');
    console.log('  - 邮箱:', result.profile.email || '(空)');
    console.log('  - 工作经历数量:', result.workExperience.length);
    console.log('  - 项目经历数量:', result.projectExperience.length);
    console.log('  - 教育背景数量:', result.education.length);
    console.log('  - 技能数量:', result.skills.length);
    console.log('  - 自定义模块数量:', result.customSections.length);
    
    if (validation.valid) {
      console.log('✅ 数据验证通过');
    } else {
      console.log('❌ 数据验证失败:', validation.error);
    }
    
    // 显示详细数据（仅在有数据时）
    if (testCase.input && Object.keys(testCase.input).length > 0) {
      console.log('\n📋 详细转换结果:');
      console.log(JSON.stringify(result, null, 2));
    }
    
    return { success: true, result, validation };
    
  } catch (error) {
    console.log('❌ 转换失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 测试数据类型兼容性
 */
function testDataTypeCompatibility() {
  console.log('\n=== 数据类型兼容性测试 ===');
  
  const typeTests = [
    {
      name: "字符串技能数组",
      data: { skills: ["JavaScript", "Python", "Java"] }
    },
    {
      name: "对象技能数组",
      data: { 
        skills: [
          { category: "编程语言", details: "JavaScript, Python" },
          { name: "框架", details: "React, Vue" }
        ]
      }
    },
    {
      name: "混合技能数组",
      data: { 
        skills: [
          "JavaScript",
          { category: "框架", details: "React" },
          { name: "数据库", details: "MySQL" }
        ]
      }
    }
  ];
  
  typeTests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}:`);
    const result = convertToUnifiedSchema(test.data);
    console.log('  转换后技能:', JSON.stringify(result.skills, null, 2));
  });
}

/**
 * 性能测试
 */
function performanceTest() {
  console.log('\n=== 性能测试 ===');
  
  const largeData = {
    profile: { name: "性能测试用户" },
    workExperience: Array(100).fill().map((_, i) => ({
      company: `公司${i}`,
      position: `职位${i}`,
      duration: `2020-202${i % 3}`,
      description: `描述${i}`.repeat(100)
    })),
    skills: Array(50).fill().map((_, i) => `技能${i}`)
  };
  
  const startTime = Date.now();
  const result = convertToUnifiedSchema(largeData);
  const endTime = Date.now();
  
  console.log(`✅ 大数据量转换完成`);
  console.log(`⏱️ 耗时: ${endTime - startTime}ms`);
  console.log(`📊 工作经历数量: ${result.workExperience.length}`);
  console.log(`📊 技能数量: ${result.skills.length}`);
}

/**
 * 主测试函数
 */
function main() {
  console.log('🚀 开始数据迁移功能测试\n');
  
  let successCount = 0;
  let totalCount = testCases.length;
  
  // 运行基本测试用例
  testCases.forEach((testCase, index) => {
    const result = runTestCase(testCase, index);
    if (result.success) {
      successCount++;
    }
  });
  
  // 运行额外测试
  testDataTypeCompatibility();
  performanceTest();
  
  // 显示测试总结
  console.log('\n=== 测试总结 ===');
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`❌ 失败: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有测试通过！数据迁移功能正常');
  } else {
    console.log('⚠️ 部分测试失败，请检查转换逻辑');
  }
  
  // 显示空模板
  console.log('\n=== 空模板结构 ===');
  console.log(JSON.stringify(EMPTY_UNIFIED_RESUME, null, 2));
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  runTestCase,
  testDataTypeCompatibility,
  performanceTest
}; 