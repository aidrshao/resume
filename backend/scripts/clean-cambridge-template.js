/**
 * 清理剑桥经典模板HTML中的script标签
 * 因为React环境下script标签不会执行，而且我们已经在组件中注册了helper
 */

require('dotenv').config();
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }
});

async function cleanCambridgeTemplate() {
  try {
    console.log('🧹 清理剑桥经典模板HTML...');
    
    // 获取剑桥经典模板
    const template = await knex('templates').where('name', '剑桥经典').first();
    
    if (!template) {
      console.log('❌ 未找到剑桥经典模板');
      return;
    }
    
    console.log('📋 找到模板:', {
      id: template.id,
      name: template.name,
      htmlLength: template.html_content?.length || 0
    });
    
    // 清理HTML中的script标签
    let cleanedHtml = template.html_content;
    
    // 移除script标签及其内容
    cleanedHtml = cleanedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // 移除多余的空行
    cleanedHtml = cleanedHtml.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    console.log('🔧 清理结果:', {
      原始长度: template.html_content.length,
      清理后长度: cleanedHtml.length,
      减少字符数: template.html_content.length - cleanedHtml.length
    });
    
    // 更新模板
    await knex('templates')
      .where('id', template.id)
      .update({
        html_content: cleanedHtml.trim(),
        updated_at: new Date()
      });
    
    console.log('✅ 剑桥经典模板HTML已清理完成');
    console.log('💡 script标签已移除，helper已在前端组件中注册');
    
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
  } finally {
    await knex.destroy();
  }
}

cleanCambridgeTemplate(); 