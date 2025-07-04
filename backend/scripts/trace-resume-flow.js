const fs = require('fs');
const path = require('path');
const knex = require('knex')(require('../knexfile').development);
const { Resume } = require('../models/Resume');
const ResumeParseService = require('../services/resumeParseService');

// 您的真实简历数据
const MOCK_RESUME_TEXT = `
邵俊
邮箱：346935824@qq.com
电话：13767918257
职位：索信达控股AI创新中心主任
技能：cursor
荣誉：国家信息标准委员会突出贡献专家
教育：法国巴黎六大

工作经历：
索信达控股AI创新中心主任 (2020-至今)
- 负责AI技术研发和创新
- 领导团队开发智能解决方案
- 参与国家标准制定工作

教育背景：
法国巴黎六大 计算机科学 硕士 (2018-2020)
`;

const TEST_USER_ID = 2;

async function traceResumeFlow() {
    console.log('🔍 开始追踪简历解析全流程...\n');
    
    try {
        // 步骤1: 准备测试文件
        console.log('📁 [步骤1] 准备测试文件...');
        const testFilePath = path.join(__dirname, 'test-resume.txt');
        fs.writeFileSync(testFilePath, MOCK_RESUME_TEXT);
        console.log(`✅ 测试文件已创建: ${testFilePath}`);
        console.log(`📄 文件内容长度: ${MOCK_RESUME_TEXT.length} 字符\n`);

        // 步骤2: 模拟文件上传和解析
        console.log('📤 [步骤2] 模拟文件上传和解析...');
        console.log('🔍 调用 ResumeParseService.parseResumeFile...');
        const parseResult = await ResumeParseService.parseResumeFile(testFilePath, 'txt');
        
        console.log('✅ 文件解析完成！');
        console.log('📊 解析结果概览:');
        console.log('- 提取的文本长度:', parseResult.extractedText?.length || 0);
        console.log('- 结构化数据字段数量:', Object.keys(parseResult.structuredData || {}).length);
        console.log('');

        // 步骤3: 检查结构化数据
        console.log('🔍 [步骤3] 检查结构化数据...');
        const structuredData = parseResult.structuredData;
        
        if (structuredData) {
            console.log('✅ 结构化数据存在');
            console.log('📋 数据结构:');
            console.log(JSON.stringify(structuredData, null, 2));
            
            // 验证关键字段
            console.log('\n🔍 验证关键字段:');
            
            if (structuredData.profile) {
                console.log('✅ profile字段存在');
                console.log('  - 姓名:', structuredData.profile.name || '未找到');
                console.log('  - 邮箱:', structuredData.profile.email || '未找到');  
                console.log('  - 电话:', structuredData.profile.phone || '未找到');
                console.log('  - 职位:', structuredData.profile.title || '未找到');
                
                // 关键检查：是否是您的真实信息
                if (structuredData.profile.name === '邵俊' && 
                    structuredData.profile.email === '346935824@qq.com' &&
                    structuredData.profile.phone === '13767918257') {
                    console.log('🎉 ✅ 成功！AI正确解析了您的真实信息！');
                } else {
                    console.log('❌ 警告：AI解析的信息不正确，使用了默认或示例数据');
                }
            } else {
                console.log('❌ profile字段缺失');
            }
            
            if (structuredData.workExperience && Array.isArray(structuredData.workExperience)) {
                console.log('✅ workExperience字段存在，长度:', structuredData.workExperience.length);
                structuredData.workExperience.forEach((work, index) => {
                    console.log(`  工作${index + 1}: ${work.company || '未知公司'} - ${work.position || '未知职位'}`);
                });
            } else {
                console.log('❌ workExperience字段缺失或不是数组');
            }
            
            if (structuredData.education && Array.isArray(structuredData.education)) {
                console.log('✅ education字段存在，长度:', structuredData.education.length);
                structuredData.education.forEach((edu, index) => {
                    console.log(`  教育${index + 1}: ${edu.school || '未知学校'} - ${edu.major || '未知专业'}`);
                });
            } else {
                console.log('❌ education字段缺失或不是数组');
            }
            
        } else {
            console.log('❌ 结构化数据为空');
        }

        // 步骤4: 模拟保存到数据库
        console.log('\n💾 [步骤4] 模拟保存到数据库...');
        try {
            const savedResumeId = await ResumeParseService.saveBaseResume(
                TEST_USER_ID,
                parseResult.extractedText,
                structuredData
            );
            
            console.log('✅ 简历已保存到数据库');
            console.log('📝 保存的简历ID:', savedResumeId);
            
            // 步骤5: 验证数据库中的数据
            console.log('\n🔍 [步骤5] 验证数据库中的数据...');
            const savedResume = await Resume.findById(savedResumeId);
            
            if (savedResume) {
                console.log('✅ 从数据库读取简历成功');
                console.log('📋 数据库中的简历信息:');
                console.log('- ID:', savedResume.id);
                console.log('- 标题:', savedResume.title);
                console.log('- 状态:', savedResume.status);
                console.log('- 创建时间:', savedResume.created_at);
                console.log('- resume_data长度:', savedResume.resume_data?.length || 0);
                
                // 解析resume_data
                if (savedResume.resume_data) {
                    try {
                        const parsedData = JSON.parse(savedResume.resume_data);
                        console.log('✅ resume_data解析成功');
                        console.log('📊 解析后的数据预览:');
                        
                        if (parsedData.profile) {
                            console.log('  个人信息:');
                            console.log('  - 姓名:', parsedData.profile.name || '未找到');
                            console.log('  - 邮箱:', parsedData.profile.email || '未找到');
                            console.log('  - 电话:', parsedData.profile.phone || '未找到');
                            
                            // 最终验证
                            if (parsedData.profile.name === '邵俊' && 
                                parsedData.profile.email === '346935824@qq.com' &&
                                parsedData.profile.phone === '13767918257') {
                                console.log('\n🎉🎉🎉 最终验证通过！');
                                console.log('✅ 数据库中保存的是您的真实信息！');
                                console.log('✅ 整个解析流程工作正常！');
                            } else {
                                console.log('\n❌ 最终验证失败！');
                                console.log('❌ 数据库中保存的不是您的真实信息');
                                console.log('❌ 可能存在数据覆盖或默认值问题');
                            }
                        }
                        
                    } catch (parseError) {
                        console.log('❌ resume_data解析失败:', parseError.message);
                    }
                } else {
                    console.log('❌ resume_data为空');
                }
                
            } else {
                console.log('❌ 从数据库读取简历失败');
            }
            
        } catch (saveError) {
            console.error('❌ 保存到数据库失败:', saveError.message);
        }

        // 清理测试文件
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
            console.log('\n🧹 测试文件已清理');
        }

        console.log('\n🎯 流程追踪完成！');
        console.log('\n📋 总结:');
        console.log('1. 如果看到 "🎉🎉🎉 最终验证通过！"，说明整个流程正常');
        console.log('2. 如果看到 "❌ 最终验证失败！"，说明存在数据覆盖问题');
        console.log('3. 请检查上面的详细日志找出具体问题所在');

    } catch (error) {
        console.error('\n💥 流程追踪失败:', error.message);
        console.error('错误详情:', error);
    } finally {
        await knex.destroy();
    }
}

// 运行流程追踪
traceResumeFlow(); 