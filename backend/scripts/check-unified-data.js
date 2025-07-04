const knex = require('knex')(require('../knexfile').development);

async function checkUnifiedData() {
    try {
        console.log('🔍 检查unified_data字段...\n');

        // 查看最新记录的unified_data字段
        const latestResumes = await knex('resumes')
            .where('user_id', 2)
            .orderBy('created_at', 'desc')
            .limit(5)
            .select('id', 'title', 'unified_data', 'resume_data', 'created_at');

        for (const resume of latestResumes) {
            console.log(`📄 简历 ID: ${resume.id}`);
            console.log(`- 标题: ${resume.title}`);
            console.log(`- 创建时间: ${resume.created_at}`);
            console.log(`- unified_data长度: ${resume.unified_data?.length || 0}`);
            console.log(`- resume_data长度: ${resume.resume_data?.length || 0}`);
            
            if (resume.unified_data && resume.unified_data.length > 0) {
                try {
                    const parsedData = JSON.parse(resume.unified_data);
                    console.log(`✅ unified_data解析成功`);
                    
                    if (parsedData.profile) {
                        console.log(`  个人信息:`);
                        console.log(`  - 姓名: ${parsedData.profile.name || '未找到'}`);
                        console.log(`  - 邮箱: ${parsedData.profile.email || '未找到'}`);
                        console.log(`  - 电话: ${parsedData.profile.phone || '未找到'}`);
                        
                        if (parsedData.profile.name === '邵俊' && 
                            parsedData.profile.email === '346935824@qq.com' &&
                            parsedData.profile.phone === '13767918257') {
                            console.log(`  🎉 ✅ 修复成功！这是您的真实信息！`);
                        } else {
                            console.log(`  ❌ 这不是您的真实信息`);
                        }
                    } else {
                        console.log(`  ❌ profile字段缺失`);
                    }
                    
                } catch (parseError) {
                    console.log(`❌ unified_data解析失败: ${parseError.message}`);
                }
            } else {
                console.log(`❌ unified_data为空`);
            }
            
            console.log(`${'='.repeat(60)}\n`);
        }

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    } finally {
        await knex.destroy();
    }
}

checkUnifiedData();
