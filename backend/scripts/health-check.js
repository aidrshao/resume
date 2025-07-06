#!/usr/bin/env node

/**
 * 健康检查脚本
 * 监控后端服务状态，在必要时进行自动修复
 */

const http = require('http');
const { exec } = require('child_process');

const CONFIG = {
  host: 'localhost',
  port: process.env.PORT || 8000,
  timeout: 5000,
  maxFailures: 3,
  checkInterval: 30000, // 30秒检查一次
  endpoints: [
    '/api/health',
    '/api/v2/tasks/test/status' // 需要认证，但会返回错误而不是拒绝连接
  ]
};

class HealthChecker {
  constructor() {
    this.failures = 0;
    this.lastCheckTime = null;
    this.isRunning = false;
  }

  /**
   * 检查单个端点
   */
  checkEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: CONFIG.host,
        port: CONFIG.port,
        path: endpoint,
        method: 'GET',
        timeout: CONFIG.timeout,
        headers: {
          'User-Agent': 'HealthChecker/1.0',
          'Accept': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            endpoint,
            status: res.statusCode,
            data: data.slice(0, 200), // 只保留前200字符
            success: res.statusCode < 500
          });
        });
      });

      req.on('error', (error) => {
        reject({
          endpoint,
          error: error.message,
          success: false
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject({
          endpoint,
          error: 'Request timeout',
          success: false
        });
      });

      req.end();
    });
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    console.log(`🏥 [HEALTH_CHECK] 开始健康检查 - ${new Date().toISOString()}`);
    
    const results = [];
    let successCount = 0;

    for (const endpoint of CONFIG.endpoints) {
      try {
        const result = await this.checkEndpoint(endpoint);
        results.push(result);
        if (result.success) {
          successCount++;
        }
        console.log(`  ${result.success ? '✅' : '❌'} ${endpoint} - ${result.status || 'ERROR'}`);
      } catch (error) {
        results.push(error);
        console.log(`  ❌ ${endpoint} - ${error.error}`);
      }
    }

    const healthStatus = {
      timestamp: new Date().toISOString(),
      success: successCount > 0,
      successCount,
      totalChecks: CONFIG.endpoints.length,
      results
    };

    if (healthStatus.success) {
      this.failures = 0;
      console.log(`✅ [HEALTH_CHECK] 健康检查通过 (${successCount}/${CONFIG.endpoints.length})`);
    } else {
      this.failures++;
      console.log(`❌ [HEALTH_CHECK] 健康检查失败 (失败次数: ${this.failures}/${CONFIG.maxFailures})`);
      
      if (this.failures >= CONFIG.maxFailures) {
        await this.attemptRecovery();
      }
    }

    this.lastCheckTime = Date.now();
    return healthStatus;
  }

  /**
   * 尝试恢复服务
   */
  async attemptRecovery() {
    console.log('🚨 [RECOVERY] 服务连续失败，尝试恢复...');
    
    try {
      // 检查PM2进程状态
      const pm2Status = await this.checkPM2Status();
      console.log('📊 [RECOVERY] PM2状态:', pm2Status);

      // 尝试重启服务
      console.log('🔄 [RECOVERY] 尝试重启服务...');
      await this.restartService();
      
      // 等待服务启动
      console.log('⏳ [RECOVERY] 等待服务启动...');
      await this.sleep(10000); // 等待10秒
      
      // 重新检查
      const recoveryCheck = await this.performHealthCheck();
      if (recoveryCheck.success) {
        console.log('✅ [RECOVERY] 服务恢复成功');
        this.failures = 0;
      } else {
        console.log('❌ [RECOVERY] 服务恢复失败');
      }
      
    } catch (error) {
      console.error('💥 [RECOVERY] 恢复过程中出错:', error.message);
    }
  }

  /**
   * 检查PM2状态
   */
  checkPM2Status() {
    return new Promise((resolve) => {
      exec('pm2 jlist', (error, stdout, stderr) => {
        if (error) {
          resolve({ error: error.message, pm2Available: false });
          return;
        }
        
        try {
          const processes = JSON.parse(stdout);
          const resumeApp = processes.find(p => p.name === 'resume-backend');
          resolve({
            pm2Available: true,
            processFound: !!resumeApp,
            status: resumeApp?.pm2_env?.status,
            restarts: resumeApp?.pm2_env?.restart_time,
            memory: resumeApp?.pm2_env?.memory,
            uptime: resumeApp?.pm2_env?.pm_uptime
          });
        } catch (parseError) {
          resolve({ error: 'Failed to parse PM2 output', pm2Available: true });
        }
      });
    });
  }

  /**
   * 重启服务
   */
  restartService() {
    return new Promise((resolve, reject) => {
      // 首先尝试PM2重启
      exec('pm2 restart resume-backend', (error, stdout, stderr) => {
        if (!error) {
          console.log('✅ [RECOVERY] PM2重启成功');
          resolve();
          return;
        }

        console.log('⚠️ [RECOVERY] PM2重启失败，尝试直接启动...');
        
        // PM2重启失败，尝试直接启动
        exec('cd /Users/shaojun/Github/resume/backend && npm start', { detached: true }, (startError) => {
          if (startError) {
            reject(new Error(`重启失败: ${startError.message}`));
          } else {
            console.log('✅ [RECOVERY] 直接启动成功');
            resolve();
          }
        });
      });
    });
  }

  /**
   * 休眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 启动监控
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ [HEALTH_CHECK] 健康检查已在运行中');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 [HEALTH_CHECK] 启动健康监控 - 检查间隔: ${CONFIG.checkInterval/1000}秒`);
    console.log(`🎯 [HEALTH_CHECK] 监控目标: ${CONFIG.host}:${CONFIG.port}`);
    console.log(`📡 [HEALTH_CHECK] 检查端点: ${CONFIG.endpoints.join(', ')}`);

    // 立即执行一次检查
    this.performHealthCheck();

    // 设置定期检查
    this.interval = setInterval(() => {
      this.performHealthCheck();
    }, CONFIG.checkInterval);

    // 优雅关闭处理
    process.on('SIGINT', () => {
      console.log('\n🛑 [HEALTH_CHECK] 收到中断信号，停止健康检查...');
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 [HEALTH_CHECK] 收到终止信号，停止健康检查...');
      this.stop();
      process.exit(0);
    });
  }

  /**
   * 停止监控
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 [HEALTH_CHECK] 健康监控已停止');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const checker = new HealthChecker();
  
  // 解析命令行参数
  const args = process.argv.slice(2);
  if (args.includes('--once')) {
    // 只执行一次检查
    checker.performHealthCheck().then(result => {
      console.log('\n📋 [HEALTH_CHECK] 检查完成');
      process.exit(result.success ? 0 : 1);
    });
  } else {
    // 启动持续监控
    checker.start();
  }
}

module.exports = HealthChecker; 