/**
 * 完整PDF生成测试
 */

require('dotenv').config();
const knexfile = require('./knexfile');
const knex = require('knex')(knexfile.development);
const ResumeRenderController = require('./controllers/resumeRenderController');
const ResumeTemplate = require('./models/ResumeTemplate');
const PDFService = require('./services/pdfService');

async function testFullPDFGeneration() {
  try {
    console.log('🔍 开始完整PDF生成测试...');
    
    // 1. 获取简历数据
    const resume = await knex('resumes').where('id', 2).first();
    if (!resume) {
      console.log('❌ 简历不存在');
      return;
    }
    
    console.log('📄 简历基本信息:');
    console.log('- ID:', resume.id);
    console.log('- 标题:', resume.title);
    console.log('- 用户ID:', resume.user_id);
    
    // 2. 获取模板
    const template = await ResumeTemplate.findById(1);
    if (!template) {
      console.log('❌ 模板不存在');
      return;
    }
    
    console.log('🎨 模板信息:');
    console.log('- ID:', template.id);
    console.log('- 名称:', template.name);
    
    // 3. 格式化数据
    console.log('\n🔧 开始数据格式化...');
    const formattedData = ResumeRenderController.formatResumeData(resume);
    
    console.log('\n✅ 格式化结果总结:');
    console.log('👤 姓名:', formattedData.name);
    console.log('📝 简介长度:', formattedData.summary ? formattedData.summary.length : 0);
    console.log('💼 工作经历数量:', formattedData.experience.length);
    console.log('🎓 教育背景数量:', formattedData.education.length);
    console.log('⚡ 技能数量:', formattedData.skills.length);
    console.log('🚀 项目数量:', formattedData.projects.length);
    
    // 显示详细信息
    if (formattedData.experience.length > 0) {
      console.log('\n💼 工作经历详情:');
      formattedData.experience.slice(0, 3).forEach((exp, index) => {
        console.log(`${index + 1}. ${exp.company} - ${exp.position}`);
        console.log(`   时间: ${exp.startDate} - ${exp.endDate}`);
        console.log(`   描述长度: ${exp.description ? exp.description.length : 0} 字符`);
        console.log(`   成就数量: ${exp.achievements ? exp.achievements.length : 0}`);
      });
      if (formattedData.experience.length > 3) {
        console.log(`   ... 还有 ${formattedData.experience.length - 3} 个工作经历`);
      }
    }
    
    if (formattedData.education.length > 0) {
      console.log('\n🎓 教育背景详情:');
      formattedData.education.forEach((edu, index) => {
        console.log(`${index + 1}. ${edu.school} - ${edu.degree} (${edu.major})`);
        console.log(`   时间: ${edu.startDate} - ${edu.endDate}`);
      });
    }
    
    if (formattedData.skills.length > 0) {
      console.log('\n⚡ 技能详情 (前10个):');
      formattedData.skills.slice(0, 10).forEach((skill, index) => {
        console.log(`${index + 1}. ${skill.name} (${skill.category})`);
      });
      if (formattedData.skills.length > 10) {
        console.log(`   ... 还有 ${formattedData.skills.length - 10} 个技能`);
      }
    }
    
    // 4. 生成HTML
    console.log('\n🌐 生成HTML内容...');
    const htmlContent = ResumeRenderController.generateHtmlFromConfig(formattedData, template);
    console.log('HTML长度:', htmlContent.length, '字符');
    
    // 5. 生成PDF
    console.log('\n📄 生成PDF...');
    const pdfBuffer = await PDFService.generatePDF(htmlContent);
    console.log('PDF大小:', pdfBuffer.length, '字节');
    
    // 6. 保存PDF文件
    const fs = require('fs');
    const outputPath = './test-output.pdf';
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log('✅ PDF已保存到:', outputPath);
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await knex.destroy();
    process.exit(0);
  }
}

testFullPDFGeneration(); 