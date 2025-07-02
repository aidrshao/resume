/**
 * 前端性能测试脚本
 * 测试简历页面的加载性能
 */

const puppeteer = require('puppeteer');

async function testFrontendPerformance() {
  console.log('🚀 [性能测试] 开始前端性能测试...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 监听控制台输出
    page.on('console', msg => {
      if (msg.text().includes('[LOAD_RESUMES]') || 
          msg.text().includes('[FRONTEND_PERFORMANCE]') || 
          msg.text().includes('[AXIOS_REQUEST]')) {
        console.log('📊 [浏览器控制台]', msg.text());
      }
    });
    
    // 监听网络请求
    page.on('response', response => {
      if (response.url().includes('/api/resumes')) {
        console.log(`📡 [网络请求] ${response.url()}: ${response.status()} (${response.headers()['content-length'] || 'unknown'} bytes)`);
      }
    });
    
    console.log('🌐 [性能测试] 开始加载页面: http://localhost:3016/resumes');
    const startTime = Date.now();
    
    // 导航到简历页面
    await page.goto('http://localhost:3016/resumes', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`✅ [性能测试] 页面加载完成，总耗时: ${totalTime}ms`);
    
    // 等待一段时间让页面完全渲染
    await page.waitForTimeout(2000);
    
    // 检查页面内容
    const pageTitle = await page.title();
    console.log(`📄 [页面检查] 页面标题: ${pageTitle}`);
    
    // 检查是否有错误信息
    const errorElements = await page.$$('[class*="error"]');
    if (errorElements.length > 0) {
      console.log(`❌ [页面检查] 发现 ${errorElements.length} 个错误元素`);
    } else {
      console.log(`✅ [页面检查] 没有发现错误元素`);
    }
    
    // 性能评级
    let rating = '🟢 优秀';
    if (totalTime > 500) rating = '🟡 良好';
    if (totalTime > 1000) rating = '🟠 需优化';
    if (totalTime > 2000) rating = '🔴 较差';
    
    console.log(`📊 [性能评级] ${rating} - 页面加载时间: ${totalTime}ms`);
    
    return {
      totalTime,
      rating,
      success: true
    };
    
  } catch (error) {
    console.error('❌ [性能测试] 测试失败:', error.message);
    return {
      totalTime: null,
      rating: '🔴 失败',
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// 运行测试
if (require.main === module) {
  testFrontendPerformance()
    .then(result => {
      console.log('\n📋 [测试结果]');
      console.log('─'.repeat(50));
      console.log(`状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
      console.log(`耗时: ${result.totalTime ? result.totalTime + 'ms' : 'N/A'}`);
      console.log(`评级: ${result.rating}`);
      if (result.error) {
        console.log(`错误: ${result.error}`);
      }
      console.log('─'.repeat(50));
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ [测试脚本] 执行失败:', error);
      process.exit(1);
    });
}

module.exports = testFrontendPerformance; 