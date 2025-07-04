const axios = require('axios');

async function checkResumeViaAPI() {
    try {
        console.log('🔍 通过API检查ID为21的简历...\n');
        
        // 首先登录获取token
        const loginResponse = await axios.post('http://localhost:8000/api/auth/login', {
            email: 'test@test.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功');
        
        // 获取简历详情
        const resumeResponse = await axios.get('http://localhost:8000/api/resumes/21', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const resume = resumeResponse.data.data;
        
        console.log(`📄 简历基本信息:`);
        console.log(`- ID: ${resume.id}`);
        console.log(`- 标题: ${resume.title}`);
        console.log(`- 状态: ${resume.status}`);
        console.log(`- 创建时间: ${resume.created_at}`);
        console.log('');
        
        console.log(`📊 解析后的数据 (resume_data):`)
        console.log('====================================');
        if (resume.resume_data) {
            console.log(JSON.stringify(resume.resume_data, null, 2));
        } else {
            console.log('(空)');
        }
        console.log('====================================\n');
        
        console.log(`📝 原始文本内容 (generation_log):`)
        console.log('====================================');
        console.log(resume.generation_log || '(空)');
        console.log('====================================\n');
        
        // 检查解析逻辑
        if (resume.resume_data && resume.resume_data.profile) {
            const profile = resume.resume_data.profile;
            console.log(`🧐 详细分析:`);
            console.log(`- 解析出的姓名: "${profile.name}"`);
            console.log(`- 解析出的邮箱: "${profile.email}"`);
            console.log(`- 解析出的电话: "${profile.phone}"`);
            console.log('');
            
            console.log(`🎯 期望信息:`);
            console.log(`- 期望姓名: "邵俊"`);
            console.log(`- 期望邮箱: "346935824@qq.com"`);
            console.log(`- 期望电话: "13767918257"`);
            console.log('');
            
            if (profile.name === '邵俊' && 
                profile.email === '346935824@qq.com' && 
                profile.phone === '13767918257') {
                console.log('✅ 数据完全匹配，解析正确！');
            } else {
                console.log('❌ 数据不匹配，可能是AI解析问题');
                
                // 检查原始文本是否包含正确信息
                const originalText = resume.generation_log || '';
                console.log('\n🔍 检查原始文本是否包含正确信息:');
                console.log(`- 包含"邵俊": ${originalText.includes('邵俊')}`);
                console.log(`- 包含"346935824@qq.com": ${originalText.includes('346935824@qq.com')}`);
                console.log(`- 包含"13767918257": ${originalText.includes('13767918257')}`);
                
                if (originalText.includes('邵俊') && 
                    originalText.includes('346935824@qq.com') && 
                    originalText.includes('13767918257')) {
                    console.log('✅ 原始文本包含正确信息，问题在AI解析环节');
                } else {
                    console.log('❌ 原始文本就不包含正确信息，问题在上传环节');
                }
            }
        } else {
            console.log('❌ 缺少profile字段');
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.response?.data?.message || error.message);
    }
}

checkResumeViaAPI(); 