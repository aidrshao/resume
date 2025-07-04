const knex = require('knex')(require('../knexfile').development);

async function checkTableStructure() {
    try {
        console.log('🔍 检查resumes表结构...\n');

        // 查看表结构
        const columns = await knex.raw("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'resumes' ORDER BY ordinal_position");
        
        console.log('📋 resumes表的所有字段:');
        columns.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? '可空' : '不可空'})`);
        });
        
        console.log('\n🔍 关键字段检查:');
        console.log('- resume_data字段存在:', columns.rows.some(col => col.column_name === 'resume_data'));
        console.log('- unified_data字段存在:', columns.rows.some(col => col.column_name === 'unified_data'));
        console.log('- content字段存在:', columns.rows.some(col => col.column_name === 'content'));
        console.log('- generation_log字段存在:', columns.rows.some(col => col.column_name === 'generation_log'));

    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    } finally {
        await knex.destroy();
    }
}

checkTableStructure();
