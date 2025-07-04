const axios = require('axios');

async function testLogin() {
    try {
        console.log('🔍 测试不同用户登录...\n');
        
        // 测试用户1
        try {
            const response1 = await axios.post('http://localhost:8000/api/auth/login', {
                email: 'admin@admin.com',
                password: 'admin123'
            });
            console.log('✅ admin@admin.com 登录成功');
            console.log('Token:', response1.data.data.token.substring(0, 20) + '...');
            
            // 获取简历列表
            const resumesResponse = await axios.get('http://localhost:8000/api/resumes', {
                headers: {
                    'Authorization': `Bearer ${response1.data.data.token}`
                }
            });
            
            console.log('📄 简历数量:', resumesResponse.data.data.length);
            
            if (resumesResponse.data.data.length > 0) {
                console.log('📄 第一个简历:', resumesResponse.data.data[0]);
                
                // 获取第一个简历的详情
                const resumeId = resumesResponse.data.data[0].id;
                const resumeResponse = await axios.get(`http://localhost:8000/api/resumes/${resumeId}`, {
                    headers: {
                        'Authorization': `Bearer ${response1.data.data.token}`
                    }
                });
                
                console.log('📊 简历详情:', resumeResponse.data.data);
            }
            
            return response1.data.data.token;
            
        } catch (error) {
            console.log('❌ admin@admin.com 登录失败');
        }
        
        // 测试用户2
        try {
            const response2 = await axios.post('http://localhost:8000/api/auth/login', {
                email: 'test@test.com',
                password: 'test123'
            });
            console.log('✅ test@test.com 登录成功');
            return response2.data.data.token;
        } catch (error) {
            console.log('❌ test@test.com 登录失败');
        }
        
        console.log('❌ 所有用户登录都失败了');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testLogin(); 