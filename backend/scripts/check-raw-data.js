const knex = require('knex')(require('../knexfile').development);

async function checkRawData() {
    try {
        console.log('🔍 直接查看数据库原始数据...\n');

        // 查看ID 21的原始数据
        const result = await knex.raw('SELECT id, title, resume_data, generation_log, created_at, updated_at FROM resumes WHERE id = 21');
        
        console.log('📊 查询结果:');
        console.log('- 查询返回行数:', result.rows.length);
        
        if (result.rows.length > 0) {
            const row = result.rows[0];
            console.log('\n📋 原始数据:');
            console.log('- ID:', row.id);
            console.log('- 标题:', row.title);
            console.log('- resume_data类型:', typeof row.resume_data);
            console.log('- resume_data值:', row.resume_data);
            console.log('- generation_log长度:', row.generation_log?.length || 0);
            console.log('- created_at:', row.created_at);
            console.log('- updated_at:', row.updated_at);
            
            if (row.resume_data === null) {
                console.log('\n❌ resume_data为NULL');
            } else if (row.resume_data === '') {
                console.log('\n❌ resume_data为空字符串');
            } else if (row.resume_data === undefined) {
                console.log('\n❌ resume_data为undefined');
            } else {
                console.log('\n✅ resume_data有值:', row.resume_data);
            }
        }

        // 尝试手动插入测试数据
        console.log('\n🔧 尝试手动插入测试数据...');
        
        const testData = JSON.stringify({
            profile: {
                name: '测试用户',
                email: 'test@test.com',
                phone: '12345678901'
            }
        });
        
        const updateResult = await knex.raw(
            'UPDATE resumes SET resume_data = ? WHERE id = 21 RETURNING id, title, resume_data',
            [testData]
        );
        
        console.log('✅ 手动更新完成');
        console.log('📊 更新结果:');
        if (updateResult.rows.length > 0) {
            const updatedRow = updateResult.rows[0];
            console.log('- ID:', updatedRow.id);
            console.log('- 标题:', updatedRow.title);
            console.log('- resume_data:', updatedRow.resume_data);
            console.log('- resume_data长度:', updatedRow.resume_data?.length || 0);
        }

    } catch (error) {
        console.error('\n❌ 检查失败:', error.message);
        console.error('错误详情:', error);
    } finally {
        await knex.destroy();
    }
}

checkRawData();
