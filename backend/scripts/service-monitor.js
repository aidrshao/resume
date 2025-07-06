#!/usr/bin/env node

/**
 * 服务监控脚本
 * 监控后端服务状态，自动检测和修复问题
 */

const http = require('http');
const { exec } = require('child_process');
const path = require('path');

class ServiceMonitor {
  constructor() {
    this.config = {
      host: 'localhost',
      port: process.env.PORT || 8000,
      checkInterval: 30000, // 30秒
      maxFailures: 3,
      autoFix: process.argv.includes('--auto-fix'),
      verbose: process.argv.includes('--verbose')
    };
    
    this.failures = 0;
    this.isRunning = true;
    this.lastStatus = 'unknown';
  }

  /**
   * 记录日志
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '✅ [MONITOR]',
      'warn': '⚠️ [MONITOR]',
      'error': '❌ [MONITOR]',
      'success': '🎉 [MONITOR]'
    }[level] || '📝 [MONITOR]';
    
    console.log(`${prefix} ${timestamp} ${message}`);
    if (data && this.config.verbose) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * 检查服务状态
   */
  async checkService() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: this.config.host,
        port: this.config.port,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.success) {
              resolve({ status: 'healthy', data: response });
            } else {
              resolve({ status: 'unhealthy', error: 'API返回错误' });
            }
          } catch (error) {
            resolve({ status: 'unhealthy', error: '响应格式错误' });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ status: 'down', error: error.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'timeout', error: '请求超时' });
      });

      req.end();
    });
  }

  /**
   * 检查端口是否被占用
   */
  async checkPort() {
    return new Promise((resolve) => {
      exec(`lsof -i :${this.config.port}`, (error, stdout) => {
        if (error) {
          resolve({ occupied: false });
        } else {
          const lines = stdout.trim().split('\n');
          const processes = lines.slice(1).map(line => {
            const parts = line.split(/\s+/);
            return {
              process: parts[0],
              pid: parts[1],
              user: parts[2]
            };
          });
          resolve({ occupied: true, processes });
        }
      });
    });
  }

  /**
   * 自动修复服务
   */
  async autoFix() {
    this.log('warn', '开始自动修复服务...');
    
    try {
      // 1. 检查端口占用
      const portStatus = await this.checkPort();
      if (portStatus.occupied) {
        this.log('info', '发现端口被占用，正在终止进程...');
        for (const proc of portStatus.processes) {
          if (proc.process.includes('node')) {
            exec(`kill -9 ${proc.pid}`, (error) => {
              if (!error) {
                this.log('info', `已终止进程 ${proc.pid}`);
              }
            });
          }
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 2. 尝试启动服务
      this.log('info', '正在启动服务...');
      const startCommand = 'cd ' + path.dirname(__dirname) + ' && npm run start:safe';
      
      exec(startCommand, (error, stdout, stderr) => {
        if (error) {
          this.log('error', '启动服务失败', { error: error.message, stderr });
        } else {
          this.log('success', '服务启动命令已执行');
        }
      });

      // 3. 等待服务启动
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // 4. 验证修复结果
      const result = await this.checkService();
      if (result.status === 'healthy') {
        this.log('success', '自动修复成功，服务已恢复正常');
        this.failures = 0;
        return true;
      } else {
        this.log('error', '自动修复失败，请手动检查服务状态');
        return false;
      }

    } catch (error) {
      this.log('error', '自动修复过程中发生错误', { error: error.message });
      return false;
    }
  }

  /**
   * 开始监控
   */
  async start() {
    this.log('info', `开始监控服务 http://${this.config.host}:${this.config.port}`);
    this.log('info', `检查间隔: ${this.config.checkInterval / 1000}秒`);
    this.log('info', `自动修复: ${this.config.autoFix ? '开启' : '关闭'}`);
    
    const monitor = async () => {
      if (!this.isRunning) return;

      const result = await this.checkService();
      const currentTime = new Date().toISOString();

      if (result.status === 'healthy') {
        if (this.lastStatus !== 'healthy') {
          this.log('success', '服务状态恢复正常');
        } else if (this.config.verbose) {
          this.log('info', '服务运行正常', {
            uptime: result.data?.uptime,
            memory: result.data?.memory?.rss
          });
        }
        this.failures = 0;
        this.lastStatus = 'healthy';
      } else {
        this.failures++;
        this.lastStatus = 'unhealthy';
        
        this.log('error', `服务检查失败 (${this.failures}/${this.config.maxFailures})`, {
          status: result.status,
          error: result.error
        });

        if (this.failures >= this.config.maxFailures) {
          if (this.config.autoFix) {
            const fixed = await this.autoFix();
            if (fixed) {
              this.failures = 0;
            }
          } else {
            this.log('warn', '达到失败阈值，建议手动检查服务状态');
            this.log('info', '可以运行以下命令进行修复:');
            this.log('info', '  npm run quick-fix');
            this.log('info', '  或启用自动修复: node scripts/service-monitor.js --auto-fix');
          }
        }
      }

      setTimeout(monitor, this.config.checkInterval);
    };

    // 开始监控
    monitor();

    // 处理进程信号
    process.on('SIGINT', () => {
      this.log('info', '收到退出信号，停止监控...');
      this.isRunning = false;
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.log('info', '收到终止信号，停止监控...');
      this.isRunning = false;
      process.exit(0);
    });
  }
}

// 使用示例
if (require.main === module) {
  const monitor = new ServiceMonitor();
  monitor.start().catch(error => {
    console.error('❌ [MONITOR] 监控启动失败:', error);
    process.exit(1);
  });
}

module.exports = ServiceMonitor; 