const knex = require('knex')(require('../knexfile').development);

// 模拟结构化数据
const mockData = {
  profile: {
    name: '邵俊',
    email: '346935824@qq.com',
    phone: '13767918257',
    summary: '索信达控股AI创新中心主任'
  },
  workExperience: [
    {
      company: '索信达控股',
      position: 'AI创新中心主任',
      duration: '2020-至今',
      description: '负责AI技术研发和创新'
    }
  ],
  education: [
    {
      school: '法国巴黎六大',
      degree: '硕士',
      major: '计算机科学',
      duration: '2018-2020'
    }
  ]
};

async function testDirectUpdate() {
    try {
        console.log('🔧 直接测试数据库更新功能...\n');

        console.log('📊 要保存的数据:');
        console.log(JSON.stringify(mockData, null, 2));
        console.log('');

        // 直接使用knex更新ID 21的记录
        console.log('💾 开始直接更新数据库...');
        const result = await knex('resumes')
            .where('id', 21)
            .update({
                resume_data: JSON.stringify(mockData),
                updated_at: new Date()
            })
            .returning('*');

        console.log('✅ 更新成功！受影响的行数:', result.length);

        // 验证更新结果
        console.log('\n🔍 验证更新结果...');
        const updatedResume = await knex('resumes')
            .where('id', 21)
            .first();

        console.log('📋 更新后的记录:');
        console.log('- ID:', updatedResume.id);
        console.log('- 标题:', updatedResume.title);
        console.log('- resume_data长度:', updatedResume.resume_data?.length || 0);
        console.log('- generation_log长度:', updatedResume.generation_log?.length || 0);

        if (updatedResume.resume_data && updatedResume.resume_data.length > 0) {
            try {
                const parsedData = JSON.parse(updatedResume.resume_data);
                console.log('\n✅ resume_data解析成功');
                console.log('📊 解析的数据:');
                console.log('- 姓名:', parsedData.profile?.name);
                console.log('- 邮箱:', parsedData.profile?.email);
                console.log('- 电话:', parsedData.profile?.phone);
                
                if (parsedData.profile?.name === '邵俊' && 
                    parsedData.profile?.email === '346935824@qq.com' &&
                    parsedData.profile?.phone === '13767918257') {
                    console.log('\n🎉 ✅ 测试成功！数据库可以正确保存JSON数据！');
                    console.log('🔧 这说明问题在于Resume模型的处理逻辑');
                } else {
                    console.log('\n❌ 数据不正确');
                }
                
            } catch (parseError) {
                console.log('\n❌ resume_data解析失败:', parseError.message);
            }
        } else {
            console.log('\n❌ resume_data仍然为空');
        }

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        console.error('错误详情:', error);
    } finally {
        await knex.destroy();
    }
}

testDirectUpdate(); 