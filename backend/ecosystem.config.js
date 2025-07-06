/**
 * PM2 Ecosystem Configuration
 * 提供健壮的进程管理和监控
 */

module.exports = {
  apps: [{
    name: 'resume-backend',
    script: 'server.js',
    cwd: __dirname,
    
    // 实例和集群配置
    instances: 1,
    exec_mode: 'fork',
    
    // 日志配置
    log_file: './logs/pm2-combined.log',
    out_file: './logs/pm2-out.log',
    error_file: './logs/pm2-error.log',
    pid_file: './logs/pm2.pid',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // 自动重启策略
    watch: false, // 生产环境不建议开启文件监控
    ignore_watch: ['node_modules', 'logs', 'uploads', 'temp'],
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    
    // 环境变量
    env: {
      NODE_ENV: 'development',
      PORT: 8000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    
    // 健康检查
    health_check_grace_period: 3000,
    
    // 其他配置
    node_args: '--max-old-space-size=1024',
    source_map_support: true,
    
    // 启动延迟
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000,
    
    // 错误处理
    autorestart: true,
    restart_delay: 1000,
    
    // 监控配置
    monitoring: false, // 如果有PM2 Plus可以启用
  }],
  
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/resume.git',
      path: '/var/www/resume',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 