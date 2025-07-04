const knex = require('knex')(require('../knexfile').development);

async function checkId21() {
    try {
        console.log('🔍 检查ID 21的记录...\n');

        const resume = await knex('resumes')
            .where('id', 21)
            .first();

        if (!resume) {
            console.log('❌ 没有找到ID 21的记录');
            return;
        }

        console.log('📋 ID 21简历记录详情:');
        console.log('- ID:', resume.id);
        console.log('- 标题:', resume.title);
        console.log('- 状态:', resume.status);
        console.log('- 创建时间:', resume.created_at);
        console.log('- resume_data长度:', resume.resume_data?.length || 0);
        console.log('- generation_log长度:', resume.generation_log?.length || 0);
        console.log('');

        if (resume.generation_log && resume.generation_log.length > 0) {
            console.log('📝 原始简历文本:');
            console.log('=' .repeat(60));
            console.log(resume.generation_log);
            console.log('=' .repeat(60));
            console.log('');
            
            // 检查是否包含您的真实信息
            if (resume.generation_log.includes('邵俊') && 
                resume.generation_log.includes('346935824@qq.com') &&
                resume.generation_log.includes('13767918257')) {
                console.log('🎉 ✅ 确认：原始文本包含您的真实信息！');
                console.log('- 包含姓名：邵俊');
                console.log('- 包含邮箱：346935824@qq.com');
                console.log('- 包含电话：13767918257');
                console.log('');
                console.log('📊 分析结论：');
                console.log('✅ 原始文本正确保存');
                console.log('❌ 但是AI解析后的结构化数据没有保存到resume_data字段');
                console.log('🔧 问题出现在：ResumeParseService.saveBaseResume 方法');
            } else {
                console.log('❌ 原始文本不包含您的真实信息');
            }
        } else {
            console.log('❌ generation_log为空');
        }

        if (resume.resume_data && resume.resume_data.length > 0) {
            console.log('📊 resume_data内容:');
            console.log(resume.resume_data);
        } else {
            console.log('❌ resume_data为空 - 这是问题的关键！');
        }

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    } finally {
        await knex.destroy();
    }
}

checkId21();
