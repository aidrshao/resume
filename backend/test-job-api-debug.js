/**
 * 调试API控制器脚本
 */

require('dotenv').config();
const JobPosition = require('./models/JobPosition');

async function testControllerLogic() {
  try {
    console.log('🔍 调试控制器逻辑...\n');
    
    // 模拟req.user对象
    const mockUser = { id: 1 };
    
    // 模拟req.query对象
    const mockQuery = {
      page: 1,
      limit: 3
    };
    
    console.log('👤 模拟用户:', mockUser);
    console.log('🔍 模拟查询参数:', mockQuery);
    
    // 构建过滤条件和分页参数（模拟控制器逻辑）
    const filters = {};
    const pagination = {
      page: parseInt(mockQuery.page),
      limit: parseInt(mockQuery.limit)
    };
    
    console.log('\n📋 处理后的参数:');
    console.log('filters:', filters);
    console.log('pagination:', pagination);
    
    // 调用模型方法
    console.log('\n💾 调用JobPosition.getJobsByUserId...');
    const result = await JobPosition.getJobsByUserId(mockUser.id, filters, pagination);
    
    console.log('📊 结果:', result);
    
    if (result.success) {
      console.log('✅ 控制器逻辑模拟成功');
      console.log(`📈 返回岗位数量: ${result.data.jobs.length}`);
      console.log('📄 分页信息:', result.data.pagination);
    } else {
      console.log('❌ 控制器逻辑模拟失败');
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

testControllerLogic(); 