const knex = require('./config/database');

(async () => {
  try {
    console.log('📊 查询简历 resume_data 字段...');
    const resumes = await knex('resumes').select('id', 'title', 'resume_data').limit(3);
    console.log('简历数量:', resumes.length);
    
    resumes.forEach((resume, index) => {
      console.log('\n简历', index + 1, ':');
      console.log('  ID:', resume.id);
      console.log('  Title:', resume.title);
      console.log('  resume_data存在:', !!resume.resume_data);
      console.log('  resume_data类型:', typeof resume.resume_data);
      console.log('  resume_data长度:', resume.resume_data ? resume.resume_data.length : 0);
      if (resume.resume_data && resume.resume_data.length > 0) {
        console.log('  resume_data预览:', resume.resume_data.substring(0, 300));
      }
    });
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await knex.destroy();
  }
})();
