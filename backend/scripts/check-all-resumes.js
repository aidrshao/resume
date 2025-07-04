const knex = require('knex')(require('../knexfile').development);

async function checkAllResumes() {
    try {
        console.log('🔍 检查所有简历记录...\n');

        const allResumes = await knex('resumes')
            .where('user_id', 2)
            .orderBy('created_at', 'desc')
            .limit(10);

        if (allResumes.length === 0) {
            console.log('❌ 没有找到简历记录');
            return;
        }

        console.log(`📋 找到 ${allResumes.length} 条简历记录:\n`);

        for (const resume of allResumes) {
            console.log(`📄 简历 ID: ${resume.id}`);
            console.log(`- 标题: ${resume.title}`);
            console.log(`- 状态: ${resume.status}`);
            console.log(`- 创建时间: ${resume.created_at}`);
            
            let resumeDataExists = false;
            let resumeDataContent = null;
            
            if (resume.resume_data) {
                if (typeof resume.resume_data === 'string') {
                    resumeDataExists = resume.resume_data.length > 0;
                    console.log(`- resume_data长度: ${resume.resume_data.length} (字符串)`);
                } else if (typeof resume.resume_data === 'object') {
                    resumeDataExists = Object.keys(resume.resume_data).length > 0;
                    resumeDataContent = resume.resume_data;
                    console.log(`- resume_data字段数: ${Object.keys(resume.resume_data).length} (对象)`);
                }
            } else {
                console.log(`- resume_data: 空`);
            }
            
            console.log(`- generation_log长度: ${resume.generation_log?.length || 0}`);
            
            if (resumeDataExists) {
                try {
                    let parsedData;
                    if (typeof resume.resume_data === 'string') {
                        parsedData = JSON.parse(resume.resume_data);
                    } else {
                        parsedData = resume.resume_data;
                    }
                    
                    console.log(`✅ resume_data存在并可解析`);
                    
                    if (parsedData.profile) {
                        console.log(`  个人信息:`);
                        console.log(`  - 姓名: ${parsedData.profile.name || '未找到'}`);
                        console.log(`  - 邮箱: ${parsedData.profile.email || '未找到'}`);
                        console.log(`  - 电话: ${parsedData.profile.phone || '未找到'}`);
                        
                        if (parsedData.profile.name === '邵俊' && 
                            parsedData.profile.email === '346935824@qq.com' &&
                            parsedData.profile.phone === '13767918257') {
                            console.log(`  🎉 ✅ 这是您的真实信息！`);
                        } else {
                            console.log(`  ❌ 这不是您的真实信息`);
                        }
                    } else {
                        console.log(`  ❌ profile字段缺失`);
                    }
                    
                } catch (parseError) {
                    console.log(`❌ resume_data解析失败: ${parseError.message}`);
                }
            } else {
                console.log(`❌ resume_data为空或无效`);
            }
            
            console.log(`${'='.repeat(60)}\n`);
        }

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    } finally {
        await knex.destroy();
    }
}

checkAllResumes();
