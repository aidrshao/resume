const axios = require('axios');

async function checkResumeWithToken() {
    try {
        console.log('🔍 使用token检查简历...\n');
        
        // 使用已知的token
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1MTYwMjgwOSwiZXhwIjoxNzUyMjA3NjA5fQ.GIn5oVZ-nBW1VhYBwJCo2pGfw6dxZpuDrNTEeLbNGlk';
        
        console.log('✅ 使用token:', token.substring(0, 20) + '...');
        
        // 获取简历列表
        console.log('📄 获取简历列表...');
        const resumesResponse = await axios.get('http://localhost:8000/api/resumes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📄 简历数量:', resumesResponse.data.data.length);
        console.log('📄 简历列表:', resumesResponse.data.data.map(r => `ID:${r.id} - ${r.title}`));
        
        // 查找ID为21的简历
        const target = resumesResponse.data.data.find(r => r.id === 21);
        if (!target) {
            console.log('❌ 未找到ID为21的简历');
            
            // 检查最新的简历
            if (resumesResponse.data.data.length > 0) {
                const latest = resumesResponse.data.data[0];
                console.log(`🔍 检查最新简历 ID:${latest.id} - ${latest.title}`);
                
                const resumeResponse = await axios.get(`http://localhost:8000/api/resumes/${latest.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const resume = resumeResponse.data.data;
                console.log('📊 最新简历详情:');
                console.log(`- ID: ${resume.id}`);
                console.log(`- 标题: ${resume.title}`);
                console.log(`- 状态: ${resume.status}`);
                console.log(`- 创建时间: ${resume.created_at}`);
                
                if (resume.resume_data) {
                    console.log('📊 解析后的数据存在');
                    if (resume.resume_data.profile) {
                        const profile = resume.resume_data.profile;
                        console.log('个人信息:');
                        console.log(`- 姓名: ${profile.name}`);
                        console.log(`- 邮箱: ${profile.email}`);
                        console.log(`- 电话: ${profile.phone}`);
                        
                        if (profile.name === '邵俊' && 
                            profile.email === '346935824@qq.com' && 
                            profile.phone === '13767918257') {
                            console.log('✅ 这是您的真实信息！');
                        } else {
                            console.log('❌ 这不是您的真实信息');
                        }
                    } else {
                        console.log('❌ 缺少profile字段');
                    }
                } else {
                    console.log('❌ 缺少resume_data');
                }
                
                if (resume.generation_log) {
                    console.log(`📝 原始文本长度: ${resume.generation_log.length}`);
                    console.log('原始文本内容:');
                    console.log(resume.generation_log);
                }
            }
            return;
        }
        
        console.log(`🎯 找到目标简历 ID:${target.id} - ${target.title}`);
        
        // 获取ID为21的简历详情
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
        if (error.response?.status === 401) {
            console.log('🔄 Token可能已过期，请重新生成');
        }
    }
}

checkResumeWithToken(); 