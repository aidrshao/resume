/**
 * 初始化简历模板数据脚本
 * 将3个HTML模板信息插入到resume_templates表中
 */

require('dotenv').config();
const knex = require('knex');
const knexConfig = require('../knexfile');

// 获取当前环境的数据库配置
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];
const db = knex(config);

// 模板数据
const resumeTemplates = [
  {
    id: 1,
    name: '简约蓝色风格',
    description: '干净简洁的蓝色主题简历模板，适合各类职位申请',
    template_key: 'simple-blue',
    file_path: 'backend/templates/resume/simple-blue.html',
    preview_image: '/images/templates/simple-blue-preview.jpg',
    category: 'professional',
    is_active: true,
    sort_order: 1,
    features: JSON.stringify([
      '简洁布局',
      '蓝色主题',
      '专业外观',
      '易于阅读'
    ]),
    suitable_for: JSON.stringify([
      '技术岗位',
      '管理职位',
      '应届毕业生',
      '通用职位'
    ])
  },
  {
    id: 2,
    name: '创意绿色风格',
    description: '具有创意感的绿色侧边栏布局，适合设计和创意类职位',
    template_key: 'creative-green',
    file_path: 'backend/templates/resume/creative-green.html',
    preview_image: '/images/templates/creative-green-preview.jpg',
    category: 'creative',
    is_active: true,
    sort_order: 2,
    features: JSON.stringify([
      '侧边栏布局',
      '绿色主题',
      '创意设计',
      '视觉突出'
    ]),
    suitable_for: JSON.stringify([
      '设计师',
      '创意工作',
      '市场营销',
      '媒体行业'
    ])
  },
  {
    id: 3,
    name: '商务深色风格',
    description: '专业的深色主题简历模板，现代感强，适合高级职位',
    template_key: 'business-dark',
    file_path: 'backend/templates/resume/business-dark.html',
    preview_image: '/images/templates/business-dark-preview.jpg',
    category: 'business',
    is_active: true,
    sort_order: 3,
    features: JSON.stringify([
      '深色主题',
      '现代设计',
      '商务风格',
      '高端大气'
    ]),
    suitable_for: JSON.stringify([
      '高级管理',
      '金融行业',
      '咨询顾问',
      '商务岗位'
    ])
  }
];

/**
 * 初始化简历模板数据
 */
async function initResumeTemplates() {
  try {
    console.log('🚀 开始初始化简历模板数据...');
    
    // 检查表是否存在
    const hasTable = await db.schema.hasTable('resume_templates');
    if (!hasTable) {
      console.log('❌ resume_templates 表不存在，请先运行数据库迁移');
      process.exit(1);
    }
    
    // 检查现有数据
    const existingTemplates = await db('resume_templates').count('id as count').first();
    const templateCount = parseInt(existingTemplates.count);
    
    console.log(`📊 当前数据库中有 ${templateCount} 个模板`);
    
    if (templateCount > 0) {
      console.log('⚠️  数据库中已存在模板数据');
      
      // 显示现有模板
      const templates = await db('resume_templates')
        .select('id', 'name', 'template_key', 'is_active')
        .orderBy('sort_order');
      
      console.log('📋 现有模板列表:');
      templates.forEach(template => {
        console.log(`   - ${template.id}: ${template.name} (${template.template_key}) - ${template.is_active ? '启用' : '禁用'}`);
      });
      
      // 询问是否要更新
      console.log('\n选择操作:');
      console.log('1. 跳过初始化 (保持现有数据)');
      console.log('2. 更新现有模板数据');
      console.log('3. 删除现有数据并重新初始化');
      
      return;
    }
    
    // 插入模板数据
    console.log('📝 插入新的模板数据...');
    
    for (const template of resumeTemplates) {
      await db('resume_templates').insert({
        ...template,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      console.log(`✅ 已插入模板: ${template.name}`);
    }
    
    console.log('\n🎉 简历模板数据初始化完成！');
    
    // 验证插入结果
    const finalCount = await db('resume_templates').count('id as count').first();
    console.log(`📊 最终模板数量: ${finalCount.count}`);
    
    // 显示所有模板
    const allTemplates = await db('resume_templates')
      .select('id', 'name', 'template_key', 'category', 'is_active')
      .orderBy('sort_order');
    
    console.log('\n📋 所有模板列表:');
    allTemplates.forEach(template => {
      console.log(`   - ${template.id}: ${template.name} (${template.template_key}) [${template.category}] - ${template.is_active ? '启用' : '禁用'}`);
    });
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

/**
 * 更新现有模板数据
 */
async function updateExistingTemplates() {
  try {
    console.log('🔄 更新现有模板数据...');
    
    for (const template of resumeTemplates) {
      const existing = await db('resume_templates')
        .where('template_key', template.template_key)
        .first();
      
      if (existing) {
        await db('resume_templates')
          .where('template_key', template.template_key)
          .update({
            name: template.name,
            description: template.description,
            file_path: template.file_path,
            preview_image: template.preview_image,
            category: template.category,
            features: template.features,
            suitable_for: template.suitable_for,
            sort_order: template.sort_order,
            updated_at: db.fn.now()
          });
        console.log(`✅ 已更新模板: ${template.name}`);
      } else {
        await db('resume_templates').insert({
          ...template,
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        });
        console.log(`✅ 已插入新模板: ${template.name}`);
      }
    }
    
    console.log('🎉 模板数据更新完成！');
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    throw error;
  }
}

/**
 * 重新初始化 (删除现有数据)
 */
async function reinitializeTemplates() {
  try {
    console.log('🗑️  删除现有模板数据...');
    await db('resume_templates').del();
    
    console.log('📝 插入新的模板数据...');
    await initResumeTemplates();
    
  } catch (error) {
    console.error('❌ 重新初始化失败:', error.message);
    throw error;
  }
}

// 处理命令行参数
const action = process.argv[2];

switch (action) {
  case 'update':
    updateExistingTemplates().then(() => process.exit(0));
    break;
  case 'reset':
    reinitializeTemplates().then(() => process.exit(0));
    break;
  case 'force':
    // 强制重新初始化
    reinitializeTemplates().then(() => process.exit(0));
    break;
  default:
    initResumeTemplates().then(() => process.exit(0));
} 