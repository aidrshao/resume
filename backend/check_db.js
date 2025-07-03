const knex = require('./config/database');

(async () => {
  try {
    console.log('📊 查询简历数据结构...');
    const resumes = await knex('resumes').select('*').limit(3);
    console.log('简历数量:', resumes.length);
    
    resumes.forEach((resume, index) => {
      console.log('\n简历', index + 1, ':');
      console.log('  ID:', resume.id);
      console.log('  Title:', resume.title);
      console.log('  Content存在:', !!resume.content);
      console.log('  Content类型:', typeof resume.content);
      console.log('  Content长度:', resume.content ? resume.content.length : 0);
      console.log('  所有字段:', Object.keys(resume));
    });
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await knex.destroy();
  }
})();
