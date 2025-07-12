const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');
const auth = require('../middleware/auth'); // 使用普通用户认证

// 所有路由需要用户登录
router.use(auth.authenticateToken);

/**
 * 获取所有可售卖的商品（套餐和加油包）
 * GET /api/billing/products
 */
router.get('/products', BillingController.getProducts);

module.exports = router; 