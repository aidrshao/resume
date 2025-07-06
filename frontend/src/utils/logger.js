/**
 * 前端日志服务
 * 将日志同时输出到console和发送到后端
 */

class Logger {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/api';
    this.sessionId = this.generateSessionId();
    this.logQueue = [];
    this.isOnline = navigator.onLine;
    
    // 监听网络状态
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushLogs();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // 定期发送日志
    setInterval(() => {
      this.flushLogs();
    }, 5000);
    
    // 页面卸载时发送剩余日志
    window.addEventListener('beforeunload', () => {
      this.flushLogs(true);
    });
  }
  
  generateSessionId() {
    return 'frontend_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    return logEntry;
  }
  
  async sendToBackend(logEntry) {
    try {
      if (!this.isOnline) {
        this.logQueue.push(logEntry);
        return;
      }
      
      const response = await fetch(`${this.apiUrl}/logs/frontend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
        keepalive: true,
        timeout: 5000 // 5秒超时
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      // 如果发送失败，加入队列
      this.logQueue.push(logEntry);
      
      // 增强错误处理，避免循环日志
      if (error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('⚠️ [LOGGER] 后端服务暂时不可用，日志已加入队列');
      } else if (error.message.includes('Failed to fetch')) {
        console.warn('⚠️ [LOGGER] 网络请求失败，日志已加入队列');
      } else {
        console.warn('⚠️ [LOGGER] 发送日志失败，日志已加入队列:', error.message);
      }
    }
  }
  
  flushLogs(force = false) {
    if (this.logQueue.length === 0) return;
    
    if (!this.isOnline && !force) return;
    
    const logsToSend = [...this.logQueue];
    this.logQueue = [];
    
    logsToSend.forEach(log => {
      this.sendToBackend(log);
    });
  }
  
  log(level, message, data = null) {
    const logEntry = this.formatMessage(level, message, data);
    
    // 输出到console
    const consoleMessage = `[${level.toUpperCase()}] ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMessage, data);
        break;
      case 'warn':
        console.warn(consoleMessage, data);
        break;
      case 'info':
        console.info(consoleMessage, data);
        break;
      case 'debug':
        console.log(consoleMessage, data);
        break;
      default:
        console.log(consoleMessage, data);
    }
    
    // 发送到后端
    this.sendToBackend(logEntry);
  }
  
  debug(message, data) {
    this.log('debug', message, data);
  }
  
  info(message, data) {
    this.log('info', message, data);
  }
  
  warn(message, data) {
    this.log('warn', message, data);
  }
  
  error(message, data) {
    this.log('error', message, data);
  }
  
  // 特殊方法：记录用户操作
  userAction(action, details) {
    this.info(`🎯 [USER_ACTION] ${action}`, details);
  }
  
  // 特殊方法：记录API调用
  apiCall(method, url, status, duration, data) {
    const message = `🌐 [API_CALL] ${method.toUpperCase()} ${url} - ${status} (${duration}ms)`;
    this.info(message, data);
  }
  
  // 特殊方法：记录认证相关
  auth(action, details) {
    this.info(`🔐 [AUTH] ${action}`, details);
  }
  
  // 特殊方法：记录错误
  authError(message, error) {
    this.error(`❌ [AUTH_ERROR] ${message}`, {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

// 创建全局logger实例
const logger = new Logger();

// 捕获全局错误
window.addEventListener('error', (event) => {
  logger.error('🚨 [GLOBAL_ERROR] 未捕获的错误', {
    message: event.error?.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

// 捕获Promise rejection
window.addEventListener('unhandledrejection', (event) => {
  logger.error('🚨 [UNHANDLED_REJECTION] 未处理的Promise拒绝', {
    reason: event.reason,
    promise: event.promise
  });
});

export default logger; 