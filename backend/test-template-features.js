/**
 * 模板功能测试脚本
 * 测试模板预览和PDF生成的完整流程
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:8000/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoidXNlcjJAZXhhbXBsZS5jb20iLCJuYW1lIjoi6YK15L-KIiwiaWF0IjoxNzUxNDE4MjA4LCJleHAiOjE3NTIwMjMwMDh9.hweJulSAXElfUIYLCqYpvDc5_Eo8EeHfnI2E4yAyRZQ';
const RESUME_ID = 2;

async function testTemplateFeatures() {
  console.log('🧪 开始测试模板功能...\n');

  try {
    // 1. 测试获取模板列表
    console.log('1️⃣ 测试获取模板列表...');
    const templatesResponse = await axios.get(`${API_BASE_URL}/resume-render/templates`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    if (templatesResponse.data.success) {
      console.log(`✅ 成功获取 ${templatesResponse.data.data.length} 个模板`);
      templatesResponse.data.data.forEach(template => {
        console.log(`   - ${template.name} (ID: ${template.id})`);
      });
    } else {
      console.log('❌ 获取模板列表失败:', templatesResponse.data.message);
      return;
    }

    const templates = templatesResponse.data.data;
    console.log('');

    // 2. 测试每个模板的预览功能
    console.log('2️⃣ 测试模板预览功能...');
    for (const template of templates.slice(0, 3)) { // 只测试前3个模板
      try {
        console.log(`   测试模板: ${template.name}`);
        
        const previewResponse = await axios.post(`${API_BASE_URL}/resume-render/preview`, {
          resumeId: RESUME_ID,
          templateId: template.id
        }, {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (previewResponse.data.success) {
          const htmlLength = previewResponse.data.data.html.length;
          console.log(`   ✅ 预览生成成功，HTML长度: ${htmlLength} 字符`);
          
          // 检查HTML内容是否包含关键信息
          const html = previewResponse.data.data.html;
          const hasName = html.includes('邵俊');
          const hasWork = html.includes('工作经历');
          const hasEducation = html.includes('教育背景');
          const hasSkills = html.includes('专业技能');
          
          console.log(`   📊 内容检查: 姓名${hasName ? '✅' : '❌'} 工作经历${hasWork ? '✅' : '❌'} 教育背景${hasEducation ? '✅' : '❌'} 技能${hasSkills ? '✅' : '❌'}`);
        } else {
          console.log(`   ❌ 预览生成失败: ${previewResponse.data.message}`);
        }
      } catch (error) {
        console.log(`   ❌ 预览测试出错: ${error.message}`);
      }
    }
    console.log('');

    // 3. 测试PDF生成功能
    console.log('3️⃣ 测试PDF生成功能...');
    const testTemplate = templates[0]; // 使用第一个模板测试PDF
    
    try {
      console.log(`   测试模板: ${testTemplate.name}`);
      
      const pdfResponse = await axios.post(`${API_BASE_URL}/resume-render/pdf`, {
        resumeId: RESUME_ID,
        templateId: testTemplate.id,
        options: {
          format: 'A4',
          margin: {
            top: '10mm',
            right: '10mm',
            bottom: '10mm',
            left: '10mm'
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (pdfResponse.data.success) {
        console.log(`   ✅ PDF生成成功`);
        console.log(`   📄 文件名: ${pdfResponse.data.data.filename}`);
        console.log(`   🔗 下载链接: ${pdfResponse.data.data.downloadUrl}`);
        
        // 测试PDF文件是否真实存在
        try {
          const pdfDownloadResponse = await axios.get(`${API_BASE_URL}${pdfResponse.data.data.downloadUrl}`, {
            headers: {
              'Authorization': `Bearer ${TEST_TOKEN}`
            },
            responseType: 'arraybuffer'
          });
          
          if (pdfDownloadResponse.status === 200) {
            const pdfSize = pdfDownloadResponse.data.byteLength;
            console.log(`   📏 PDF文件大小: ${(pdfSize / 1024).toFixed(2)} KB`);
            
            // 保存测试PDF文件
            fs.writeFileSync(`test-generated-${Date.now()}.pdf`, pdfDownloadResponse.data);
            console.log(`   💾 PDF文件已保存到本地`);
          } else {
            console.log(`   ❌ PDF下载失败，状态码: ${pdfDownloadResponse.status}`);
          }
        } catch (downloadError) {
          console.log(`   ❌ PDF下载测试失败: ${downloadError.message}`);
        }
      } else {
        console.log(`   ❌ PDF生成失败: ${pdfResponse.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ PDF测试出错: ${error.message}`);
    }
    console.log('');

    // 4. 测试性能 - 并发预览生成
    console.log('4️⃣ 测试并发预览性能...');
    const startTime = Date.now();
    
    const concurrentPromises = templates.slice(0, 3).map(template => 
      axios.post(`${API_BASE_URL}/resume-render/preview`, {
        resumeId: RESUME_ID,
        templateId: template.id
      }, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }).catch(error => ({ error: error.message }))
    );

    const results = await Promise.all(concurrentPromises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = results.filter(result => result.data && result.data.success).length;
    console.log(`   ⚡ 并发预览测试完成`);
    console.log(`   📊 成功: ${successCount}/${results.length} 个模板`);
    console.log(`   ⏱️  总耗时: ${duration}ms`);
    console.log(`   📈 平均耗时: ${(duration / results.length).toFixed(2)}ms/模板`);

    console.log('\n🎉 模板功能测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testTemplateFeatures(); 