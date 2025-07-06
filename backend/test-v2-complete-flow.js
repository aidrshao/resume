/**
 * V2简历解析完整流程测试脚本
 * 模拟从上传到解析的全过程，验证提示词修复效果
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

class V2FlowTester {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.token = null;
    this.testFile = path.join(__dirname, '../test-files/test-resume.txt');
  }

  /**
   * 获取测试用户Token
   */
  async getTestToken() {
    try {
      console.log('🔐 [TEST] 使用保存的测试用户Token...');
      
      // 直接读取保存的token
      if (fs.existsSync('test-token')) {
        this.token = fs.readFileSync('test-token', 'utf8').trim();
        console.log('✅ [TEST] Token获取成功:', this.token.substring(0, 20) + '...');
        return true;
      }
      
      // 如果没有保存的token，尝试登录
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: 'test@test.com',
        password: 'test123456'
      });

      if (response.data.success) {
        this.token = response.data.data.token;
        console.log('✅ [TEST] Token登录获取成功:', this.token.substring(0, 20) + '...');
        return true;
      } else {
        throw new Error('登录失败');
      }
    } catch (error) {
      console.error('❌ [TEST] Token获取失败:', error.message);
      return false;
    }
  }

  /**
   * 创建测试简历文件
   */
  async createTestFile() {
    const testContent = `邵俊 (博士，高级职称)

法国克莱蒙费朗二大博士，巴黎六大概率与金融专业硕士
获得人工智能专业高级工程师职称
索信达控股AI创新中心执行主任兼党支部书记，博士后基地执行主任
广东省金融人工智能工程技术研究中心副主任

联系方式：
邮箱：shaojun@example.com
电话：13800138000
地址：深圳市南山区

工作经历：
2020-至今  索信达控股  AI创新中心执行主任
- 负责人工智能技术研发和产品创新
- 管理20人技术团队，完成多个重大项目
- 年度技术收入增长300%

2018-2020  腾讯科技  高级算法工程师
- 负责推荐系统算法优化
- 提升点击率15%，转化率提升25%

教育背景：
2015-2018  法国克莱蒙费朗第二大学  计算机科学  博士
2013-2015  巴黎第六大学  概率与金融  硕士
2009-2013  清华大学  数学与应用数学  学士

技能专长：
- 编程语言：Python, Java, C++, JavaScript
- 机器学习：TensorFlow, PyTorch, Scikit-learn
- 大数据：Spark, Hadoop, Elasticsearch
- 云计算：AWS, Azure, 阿里云

项目经验：
智能风控系统
- 基于机器学习的金融风控模型
- 降低坏账率30%，提升审批效率50%
- 使用技术：Python, TensorFlow, MySQL

获奖荣誉：
- 2022年 广东省科技进步奖二等奖
- 2021年 深圳市优秀青年科技人才
- 2020年 索信达控股年度技术创新奖

发明专利：
1. 一种基于深度学习的文本分类方法，申请号：CN202111126880.3
2. 智能运维异常检测方法及装置，申请号：CN202210492320.8
3. 特征重要性评估方法、装置、设备和介质，申请号：CN202111500806.3`;

    try {
      const uploadDir = path.join(__dirname, 'uploads/v2/resumes');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(this.testFile, testContent, 'utf8');
      console.log('✅ [TEST] 测试简历文件创建成功:', this.testFile);
      return true;
    } catch (error) {
      console.error('❌ [TEST] 创建测试文件失败:', error.message);
      return false;
    }
  }

  /**
   * 上传简历文件
   */
  async uploadResume() {
    try {
      console.log('📤 [TEST] 开始上传简历文件...');

      const form = new FormData();
      form.append('resume', fs.createReadStream(this.testFile), {
        filename: '测试简历-邵俊.txt',
        contentType: 'text/plain'
      });

      const response = await axios.post(`${this.baseURL}/v2/resumes/parse`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.token}`
        },
        timeout: 10000
      });

      if (response.data.success) {
        const taskId = response.data.data.taskId;
        console.log('✅ [TEST] 文件上传成功，任务ID:', taskId);
        return taskId;
      } else {
        throw new Error('上传失败: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ [TEST] 文件上传失败:', error.message);
      if (error.response) {
        console.error('❌ [TEST] 响应状态:', error.response.status);
        console.error('❌ [TEST] 响应数据:', error.response.data);
      }
      return null;
    }
  }

  /**
   * 监控任务状态
   */
  async monitorTask(taskId) {
    console.log('👀 [TEST] 开始监控任务状态...');
    
    const maxWaitTime = 120000; // 最大等待2分钟
    const pollInterval = 3000; // 每3秒查询一次
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await axios.get(`${this.baseURL}/v2/tasks/${taskId}/status`, {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });

        if (response.data.success) {
          const { status, progress, message } = response.data.data;
          console.log(`📊 [TEST] 任务状态: ${status} (${progress}%) - ${message}`);

          if (status === 'completed') {
            console.log('🎉 [TEST] 任务完成！');
            return await this.getTaskResult(taskId);
          } else if (status === 'failed') {
            console.error('❌ [TEST] 任务失败！');
            return null;
          }
        }
      } catch (error) {
        console.error('❌ [TEST] 查询任务状态失败:', error.message);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    console.error('⏰ [TEST] 任务超时！');
    return null;
  }

  /**
   * 获取任务结果
   */
  async getTaskResult(taskId) {
    try {
      const response = await axios.get(`${this.baseURL}/v2/tasks/${taskId}/result`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.data.success) {
        console.log('✅ [TEST] 获取解析结果成功');
        return response.data.data;
      } else {
        throw new Error('获取结果失败');
      }
    } catch (error) {
      console.error('❌ [TEST] 获取任务结果失败:', error.message);
      return null;
    }
  }

  /**
   * 运行完整测试流程
   */
  async runCompleteTest() {
    console.log('🚀 [TEST] ========== V2简历解析完整流程测试开始 ==========');
    console.log('🚀 [TEST] 测试目标：验证提示词修复效果');
    console.log('🚀 [TEST] 测试时间:', new Date().toISOString());

    try {
      // 步骤1: 创建测试文件
      const fileCreated = await this.createTestFile();
      if (!fileCreated) {
        throw new Error('创建测试文件失败');
      }

      // 步骤2: 获取Token
      const tokenObtained = await this.getTestToken();
      if (!tokenObtained) {
        throw new Error('获取Token失败');
      }

      // 步骤3: 上传文件
      const taskId = await this.uploadResume();
      if (!taskId) {
        throw new Error('文件上传失败');
      }

      // 步骤4: 监控任务
      const result = await this.monitorTask(taskId);
      if (result) {
        console.log('🎉 [TEST] ========== 测试成功完成 ==========');
        console.log('📊 [TEST] 解析结果预览:');
        console.log('  - 姓名:', result.resumeData?.profile?.name || '未解析');
        console.log('  - 邮箱:', result.resumeData?.profile?.email || '未解析');
        console.log('  - 电话:', result.resumeData?.profile?.phone || '未解析');
        console.log('  - 工作经验数量:', result.resumeData?.workExperience?.length || 0);
        console.log('  - 教育背景数量:', result.resumeData?.education?.length || 0);
        console.log('  - 处理时间:', result.processingTime + 'ms');
        console.log('  - AI模型:', result.metadata?.aiModel || '未知');
        console.log('  - 数据完整性:', JSON.stringify(result.resumeData).length + ' bytes');
        return true;
      } else {
        console.error('❌ [TEST] ========== 测试失败 ==========');
        return false;
      }

    } catch (error) {
      console.error('❌ [TEST] 测试流程异常:', error.message);
      return false;
    } finally {
      // 清理测试文件
      try {
        if (fs.existsSync(this.testFile)) {
          fs.unlinkSync(this.testFile);
          console.log('🧹 [TEST] 测试文件已清理');
        }
      } catch (cleanupError) {
        console.warn('⚠️ [TEST] 清理测试文件失败:', cleanupError.message);
      }
    }
  }
}

// 运行测试
(async () => {
  const tester = new V2FlowTester();
  const success = await tester.runCompleteTest();
  process.exit(success ? 0 : 1);
})(); 