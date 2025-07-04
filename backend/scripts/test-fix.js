const fs = require("fs");
const path = require("path");
const ResumeParseService = require("../services/resumeParseService");

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

async function testFix() {
    try {
        console.log("🔧 测试修复后的简历解析功能...\n");

        const testFilePath = path.join(__dirname, "test-fix-resume.txt");
        fs.writeFileSync(testFilePath, MOCK_RESUME_TEXT);
        console.log("✅ 测试文件创建成功\n");

        console.log("🚀 开始解析简历...");
        const result = await ResumeParseService.parseResumeFile(testFilePath, "txt");
        
        console.log("✅ 解析完成！");
        console.log("📊 解析结果概览:");
        console.log("- 文本长度:", result.extractedText?.length || 0);
        console.log("- 结构化数据存在:", !!result.structuredData);
        
        if (result.structuredData && result.structuredData.profile) {
            console.log("\n🎯 关键信息验证:");
            console.log("- 姓名:", result.structuredData.profile.name);
            console.log("- 邮箱:", result.structuredData.profile.email);
            console.log("- 电话:", result.structuredData.profile.phone);
            
            if (result.structuredData.profile.name === "邵俊" && 
                result.structuredData.profile.email === "346935824@qq.com" &&
                result.structuredData.profile.phone === "13767918257") {
                console.log("\n🎉 ✅ 结构化数据正确！包含您的真实信息！");
            } else {
                console.log("\n❌ 结构化数据不正确");
            }
        }

        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }

        console.log("\n🎯 测试完成！现在请检查数据库中的最新记录。");

    } catch (error) {
        console.error("\n❌ 测试失败:", error.message);
    }
}

testFix();

