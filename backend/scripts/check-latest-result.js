const knex = require('knex')(require('../knexfile').development);

async function checkLatestResult() {
    try {
        console.log('🔍 检查最新的简历解析结果...\n');

        // 查找最新的简历记录
        const latestResume = await knex('resumes')
            .where('user_id', 2)
            .orderBy('created_at', 'desc')
            .first();

        if (!latestResume) {
            console.log('❌ 没有找到简历记录');
            return;
        }

        console.log('📋 最新简历记录:');
        console.log('- ID:', latestResume.id);
        console.log('- 标题:', latestResume.title);
        console.log('- 状态:', latestResume.status);
        console.log('- 创建时间:', latestResume.created_at);
        console.log('- resume_data长度:', latestResume.resume_data?.length || 0);
        console.log('- generation_log长度:', latestResume.generation_log?.length || 0);
        console.log('');

        // 检查resume_data
        if (latestResume.resume_data) {
            try {
                const parsedData = JSON.parse(latestResume.resume_data);
                console.log('✅ resume_data解析成功');
                console.log('📊 解析后的数据结构:');
                console.log(JSON.stringify(parsedData, null, 2));
                
                // 验证关键信息
                console.log('\n🔍 关键信息验证:');
                if (parsedData.profile) {
                    console.log('个人信息:');
                    console.log('- 姓名:', parsedData.profile.name || '未找到');
                    console.log('- 邮箱:', parsedData.profile.email || '未找到');
                    console.log('- 电话:', parsedData.profile.phone || '未找到');
                    
                    // 最终验证
                    if (parsedData.profile.name === '邵俊' && 
                        parsedData.profile.email === '346935824@qq.com' &&
                        parsedData.profile.phone === '13767918257') {
                        console.log('\n🎉 ✅ 成功！AI正确解析了您的真实信息！');
                    } else {
                        console.log('\n❌ AI解析的信息不正确，使用了默认或示例数据');
                        console.log('期望: 邵俊, 346935824@qq.com, 13767918257');
                        console.log('实际:', parsedData.profile.name, parsedData.profile.email, parsedData.profile.phone);
                    }
                } else {
                    console.log('❌ profile字段缺失');
                }
                
                if (parsedData.workExperience && Array.isArray(parsedData.workExperience)) {
                    console.log('\n工作经历:');
                    parsedData.workExperience.forEach((work, index) => {
                        console.log(`${index + 1}. ${work.company || '未知公司'} - ${work.position || '未知职位'}`);
                    });
                } else {
                    console.log('\n❌ workExperience字段缺失或不是数组');
                }
                
                if (parsedData.education && Array.isArray(parsedData.education)) {
                    console.log('\n教育背景:');
                    parsedData.education.forEach((edu, index) => {
                        console.log(`${index + 1}. ${edu.school || '未知学校'} - ${edu.major || '未知专业'}`);
                    });
                } else {
                    console.log('\n❌ education字段缺失或不是数组');
                }
                
            } catch (parseError) {
                console.log('❌ resume_data解析失败:', parseError.message);
                console.log('原始数据:', latestResume.resume_data.substring(0, 200) + '...');
            }
        } else {
            console.log('❌ resume_data为空');
        }

        // 检查generation_log（原始文本）
        if (latestResume.generation_log) {
            console.log('\n📝 原始简历文本:');
            console.log(latestResume.generation_log);
        }

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
        console.error('错误详情:', error);
    } finally {
        await knex.destroy();
    }
}

checkLatestResult(); 