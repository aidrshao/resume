/**
 * 日志路由 - 接收前端日志
 */

const express = require('express');
const router = express.Router();

/**
 * 接收前端日志
 */
router.post('/frontend', async (req, res) => {
  try {
    const { timestamp, level, message, data, sessionId, url, userAgent } = req.body;
    
    // 格式化日志消息
    const logMessage = `🖥️ [FRONTEND_LOG] ${message}`;
    const logData = {
      timestamp,
      level,
      sessionId,
      url,
      userAgent,
      data
    };
    
    // 根据日志级别输出到不同的console方法
    switch (level) {
      case 'error':
        console.error(logMessage);
        if (data) console.error('📊 [FRONTEND_DATA]', JSON.stringify(logData, null, 2));
        break;
      case 'warn':
        console.warn(logMessage);
        if (data) console.warn('📊 [FRONTEND_DATA]', JSON.stringify(logData, null, 2));
        break;
      case 'info':
        console.info(logMessage);
        if (data) console.info('📊 [FRONTEND_DATA]', JSON.stringify(logData, null, 2));
        break;
      case 'debug':
        console.log(logMessage);
        if (data) console.log('📊 [FRONTEND_DATA]', JSON.stringify(logData, null, 2));
        break;
      default:
        console.log(logMessage);
        if (data) console.log('📊 [FRONTEND_DATA]', JSON.stringify(logData, null, 2));
    }
    
    res.json({ success: true, message: '日志已记录' });
  } catch (error) {
    console.error('❌ [LOG_ROUTE] 记录前端日志失败:', error);
    res.status(500).json({ success: false, message: '日志记录失败' });
  }
});

/**
 * 批量接收前端日志
 */
router.post('/frontend/batch', async (req, res) => {
  try {
    const { logs } = req.body;
    
    if (!Array.isArray(logs)) {
      return res.status(400).json({ success: false, message: '日志格式错误' });
    }
    
    logs.forEach(log => {
      const { timestamp, level, message, data, sessionId, url, userAgent } = log;
      
      const logMessage = `🖥️ [FRONTEND_BATCH] ${message}`;
      const logData = {
        timestamp,
        level,
        sessionId,
        url,
        userAgent,
        data
      };
      
      switch (level) {
        case 'error':
          console.error(logMessage);
          if (data) console.error('📊 [FRONTEND_BATCH_DATA]', JSON.stringify(logData, null, 2));
          break;
        case 'warn':
          console.warn(logMessage);
          if (data) console.warn('📊 [FRONTEND_BATCH_DATA]', JSON.stringify(logData, null, 2));
          break;
        case 'info':
          console.info(logMessage);
          if (data) console.info('📊 [FRONTEND_BATCH_DATA]', JSON.stringify(logData, null, 2));
          break;
        case 'debug':
          console.log(logMessage);
          if (data) console.log('📊 [FRONTEND_BATCH_DATA]', JSON.stringify(logData, null, 2));
          break;
        default:
          console.log(logMessage);
          if (data) console.log('📊 [FRONTEND_BATCH_DATA]', JSON.stringify(logData, null, 2));
      }
    });
    
    res.json({ success: true, message: `已记录 ${logs.length} 条日志` });
  } catch (error) {
    console.error('❌ [LOG_ROUTE] 批量记录前端日志失败:', error);
    res.status(500).json({ success: false, message: '批量日志记录失败' });
  }
});

module.exports = router; 