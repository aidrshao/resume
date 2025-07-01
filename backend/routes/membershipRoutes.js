/**
 * 用户端会员相关路由
 * 定义用户会员功能的所有API端点
 */

const express = require('express');
const router = express.Router();
const MembershipController = require('../controllers/membershipController');
const { authenticateToken } = require('../middleware/auth');

// 健康检查端点（无需认证）
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '会员服务运行正常',
    timestamp: new Date().toISOString(),
    service: 'membership-api'
  });
});

// 获取会员套餐列表（无需认证，允许游客查看）
router.get('/tiers', MembershipController.getMembershipTiers);

// 应用认证中间件到需要登录的路由
router.use(authenticateToken);

// ==================== 会员状态管理 ====================

/**
 * 获取当前用户会员状态
 * GET /api/memberships/status
 */
router.get('/status', MembershipController.getMembershipStatus);

/**
 * 校验用户AI配额
 * POST /api/memberships/check-quota
 */
router.post('/check-quota', MembershipController.checkAIQuota);

// ==================== 订单管理 ====================

/**
 * 创建会员订单
 * POST /api/memberships/orders
 */
router.post('/orders', MembershipController.createMembershipOrder);

/**
 * 获取用户订单历史
 * GET /api/memberships/orders
 */
router.get('/orders', MembershipController.getUserOrders);

/**
 * 激活会员订单（模拟支付成功）
 * POST /api/memberships/orders/:orderId/activate
 * 注：实际项目中这应该是支付回调接口
 */
router.post('/orders/:orderId/activate', MembershipController.activateMembershipOrder);

module.exports = router; 