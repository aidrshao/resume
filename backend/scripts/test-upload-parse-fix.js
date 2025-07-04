/**
 * 测试脚本：验证简历上传解析的紧急修复
 * 目标：确保AI解析结果能正确保存为基础简历
 */

const knex = require('knex')(require('../knexfile.js'));
const TaskQueueService = require('../services/taskQueueService');
const path = require('path');
const fs = require('fs');

console.log('🧪 [TEST] 开始测试简历上传解析修复...');

async function testUploadParseFix() {
  const testStartTime = Date.now();
  
  try {
    // 1. 查找测试用户
    console.log('👤 [TEST] 查找测试用户...');
    const testUser = await knex('users').where('email', 'test@example.com').first();
    
    if (!testUser) {
      console.error('❌ [TEST] 未找到测试用户，请先运行 init-test-users.js');
      return;
    }
    
    console.log('✅ [TEST] 找到测试用户:', { id: testUser.id, email: testUser.email });
    
    // 2. 清理现有基础简历（如果存在）
    console.log('🧹 [TEST] 清理现有基础简历...');
    const deletedCount = await knex('resumes')
      .where('user_id', testUser.id)
      .where('is_base', true)
      .del();
    console.log(`🗑️ [TEST] 清理了 ${deletedCount} 条现有基础简历`);
    
    // 3. 创建测试简历文件
    console.log('📄 [TEST] 创建测试简历文件...');
    const testResumeContent = `
邵俊的简历

个人信息：
姓名：邵俊
邮箱：shaojun@example.com
电话：138-8888-8888
地址：北京市朝阳区

工作经历：
2023年1月 - 至今
腾讯科技有限公司
前端开发工程师
- 负责React项目开发
- 优化用户体验
- 团队协作开发

教育背景：
2019年9月 - 2023年6月
清华大学
计算机科学与技术
学士学位

技能：
- JavaScript, React, Vue.js
- Node.js, Express
- PostgreSQL, MongoDB
- Git, Docker
    `;
    
    const testFilePath = path.join(__dirname, '../../test-files/test-resume-fix.txt');
    fs.writeFileSync(testFilePath, testResumeContent);
    console.log('✅ [TEST] 测试文件创建完成:', testFilePath);
    
    // 4. 创建解析任务
    console.log('🚀 [TEST] 创建简历解析任务...');
    const taskQueueService = new TaskQueueService();
    
    const taskData = {
      filePath: testFilePath,
      fileType: 'txt',
      originalName: 'test-resume-fix.txt',
      userId: testUser.id
    };
    
    const taskId = await taskQueueService.createTask('resume_parse', taskData, testUser.id);
    console.log('✅ [TEST] 任务创建成功，任务ID:', taskId);
    
    // 5. 等待任务完成
    console.log('⏳ [TEST] 等待任务完成...');
    let taskStatus;
    let attempts = 0;
    const maxAttempts = 60; // 最多等待60秒
    
    do {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
      taskStatus = await taskQueueService.getTaskStatus(taskId);
      attempts++;
      
      console.log(`📊 [TEST] 第${attempts}次检查 - 任务状态: ${taskStatus.status}, 进度: ${taskStatus.progress}%`);
      
      if (taskStatus.message) {
        console.log(`📝 [TEST] 任务消息: ${taskStatus.message}`);
      }
      
      if (attempts >= maxAttempts) {
        console.error('❌ [TEST] 任务超时，停止等待');
        break;
      }
    } while (taskStatus.status === 'pending' || taskStatus.status === 'processing');
    
    // 6. 检查任务结果
    console.log('🔍 [TEST] 检查任务结果...');
    console.log('📊 [TEST] 最终任务状态:', {
      status: taskStatus.status,
      progress: taskStatus.progress,
      message: taskStatus.message
    });
    
    if (taskStatus.status !== 'completed') {
      console.error('❌ [TEST] 任务未成功完成');
      console.error('❌ [TEST] 错误信息:', taskStatus.error_message);
      return;
    }
    
    console.log('✅ [TEST] 任务完成！');
    
    // 7. 验证基础简历是否保存
    console.log('🔍 [TEST] 验证基础简历是否保存...');
    const baseResume = await knex('resumes')
      .where('user_id', testUser.id)
      .where('is_base', true)
      .first();
    
    if (!baseResume) {
      console.error('❌ [TEST] 基础简历未保存！修复失败！');
      return;
    }
    
    console.log('🎉 [TEST] 基础简历保存成功！');
    console.log('📋 [TEST] 基础简历信息:', {
      id: baseResume.id,
      title: baseResume.title,
      source: baseResume.source,
      created_at: baseResume.created_at
    });
    
    // 8. 验证简历数据内容
    console.log('🔍 [TEST] 验证简历数据内容...');
    const resumeData = JSON.parse(baseResume.resume_data);
    
    console.log('📊 [TEST] 简历数据结构:', {
      hasPersonalInfo: !!resumeData.personalInfo,
      hasProfile: !!resumeData.profile,
      hasWorkExperience: !!resumeData.workExperience,
      hasEducation: !!resumeData.education,
      userName: resumeData.personalInfo?.name || resumeData.profile?.name
    });
    
    if (resumeData.personalInfo?.name === '邵俊' || resumeData.profile?.name === '邵俊') {
      console.log('✅ [TEST] 简历数据验证成功！用户姓名正确解析');
    } else {
      console.warn('⚠️ [TEST] 简历数据验证警告：用户姓名未正确解析');
    }
    
    // 9. 清理测试文件
    console.log('🧹 [TEST] 清理测试文件...');
    try {
      fs.unlinkSync(testFilePath);
      console.log('✅ [TEST] 测试文件清理完成');
    } catch (cleanupError) {
      console.warn('⚠️ [TEST] 测试文件清理失败:', cleanupError.message);
    }
    
    const testDuration = Date.now() - testStartTime;
    console.log(`🎉 [TEST] 测试完成！总耗时: ${(testDuration/1000).toFixed(1)}秒`);
    console.log('🎉 [TEST] 简历上传解析修复验证成功！');
    
  } catch (error) {
    const testDuration = Date.now() - testStartTime;
    console.error('❌ [TEST] 测试失败:', {
      error: error.message,
      duration: testDuration + 'ms',
      stack: error.stack
    });
  } finally {
    process.exit(0);
  }
}

// 运行测试
testUploadParseFix().catch(console.error);

/**
 * 测试AI提示词获取功能
 */

require('dotenv').config();
const AIPrompt = require('../models/AIPrompt');

async function testPromptRetrieval() {
  console.log('🧪 开始测试AI提示词获取功能...\n');

  try {
    // 测试1：获取简历解析提示词
    console.log('📝 测试1：获取简历解析提示词');
    const resumePrompt = await AIPrompt.getRenderedPrompt('resume_parsing', {
      resumeText: '测试简历文本内容...'
    });
    
    console.log(`✅ 提示词名称: ${resumePrompt.name}`);
    console.log(`📊 模型类型: ${resumePrompt.model_type}`);
    console.log(`📝 提示词前500字符: ${resumePrompt.renderedTemplate.substring(0, 500)}...`);
    console.log(`🎯 提示词包含新格式: ${resumePrompt.renderedTemplate.includes('profile') ? '✅ 是' : '❌ 否'}`);
    console.log(`🎯 提示词包含旧格式: ${resumePrompt.renderedTemplate.includes('personalInfo') ? '❌ 是' : '✅ 否'}`);
    
  } catch (error) {
    console.error('❌ 测试1失败:', error.message);
    console.error(error.stack);
  }

  try {
    // 测试2：列出所有可用提示词
    console.log('\n📋 测试2：列出所有可用提示词');
    const allPrompts = await AIPrompt.findAll();
    console.log(`📊 总提示词数量: ${allPrompts.length}`);
    
    allPrompts.forEach(prompt => {
      console.log(`- ${prompt.key}: ${prompt.name} (${prompt.model_type})`);
    });
    
  } catch (error) {
    console.error('❌ 测试2失败:', error.message);
  }

  console.log('\n🎯 测试完成');
  process.exit(0);
}

testPromptRetrieval(); 