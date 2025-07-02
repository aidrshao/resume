/**
 * 管理员路由
 * 定义所有管理员相关的API路由
 */

const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { adminAuth, superAdminAuth } = require('../middleware/adminAuth');
const AdminAIPromptController = require('../controllers/adminAIPromptController');

// ==================== 认证相关路由 ====================

/**
 * 管理员登录
 * POST /api/admin/auth/login
 */
router.post('/auth/login', AdminController.login);

/**
 * 获取管理员个人信息（别名路由，兼容性）
 * GET /api/admin/auth/me
 */
router.get('/auth/me', adminAuth, AdminController.getProfile);

/**
 * 获取管理员个人信息
 * GET /api/admin/profile
 */
router.get('/profile', adminAuth, AdminController.getProfile);

// ==================== 仪表板相关路由 ====================

/**
 * 获取仪表板统计数据
 * GET /api/admin/dashboard/stats
 */
router.get('/dashboard/stats', adminAuth, AdminController.getStatistics);

// ==================== 管理员账号管理 ====================

/**
 * 获取管理员列表
 * GET /api/admin/admins
 */
router.get('/admins', superAdminAuth, AdminController.getAdmins);

/**
 * 创建管理员账号
 * POST /api/admin/admins
 */
router.post('/admins', superAdminAuth, AdminController.createAdminAccount);

// ==================== 会员套餐管理 ====================

/**
 * 获取会员套餐列表
 * GET /api/admin/membership-tiers
 * 查询参数: page, limit, activeOnly
 */
router.get('/membership-tiers', adminAuth, AdminController.getMembershipTiers);

/**
 * 创建会员套餐
 * POST /api/admin/membership-tiers
 */
router.post('/membership-tiers', adminAuth, AdminController.createMembershipTier);

/**
 * 更新会员套餐
 * PUT /api/admin/membership-tiers/:id
 */
router.put('/membership-tiers/:id', adminAuth, AdminController.updateMembershipTier);

/**
 * 删除会员套餐
 * DELETE /api/admin/membership-tiers/:id
 */
router.delete('/membership-tiers/:id', adminAuth, AdminController.deleteMembershipTier);

/**
 * 切换套餐启用状态
 * PATCH /api/admin/membership-tiers/:id/toggle
 */
router.patch('/membership-tiers/:id/toggle', adminAuth, AdminController.toggleTierStatus);

// ==================== 用户会员管理 ====================

/**
 * 获取用户会员列表
 * GET /api/admin/user-memberships
 * 查询参数: page, limit, status, userId
 */
router.get('/user-memberships', adminAuth, AdminController.getUserMemberships);

/**
 * 为用户开通会员
 * POST /api/admin/user-memberships
 */
router.post('/user-memberships', adminAuth, AdminController.activateUserMembership);

/**
 * 更新用户会员状态
 * PUT /api/admin/user-memberships/:id
 */
router.put('/user-memberships/:id', adminAuth, AdminController.updateUserMembership);

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 * GET /api/admin/users
 * 查询参数: page, limit, keyword
 */
router.get('/users', adminAuth, AdminController.getUsers);

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
router.get('/users/:id', adminAuth, AdminController.getUserDetail);

/**
 * 更新用户信息
 * PUT /api/admin/users/:id
 */
router.put('/users/:id', adminAuth, AdminController.updateUser);

/**
 * 更新用户状态
 * PUT /api/admin/users/:id/status
 */
router.put('/users/:id/status', adminAuth, AdminController.updateUserStatus);

// ==================== 配额管理 ====================

/**
 * 获取用户配额
 * GET /api/admin/users/:id/quotas
 */
router.get('/users/:id/quotas', adminAuth, AdminController.getUserQuotas);

/**
 * 重置用户配额
 * POST /api/admin/users/:id/quotas/reset
 */
router.post('/users/:id/quotas/reset', adminAuth, AdminController.resetUserQuotas);

/**
 * 为用户开通会员
 * POST /api/admin/grant-membership
 */
router.post('/grant-membership', adminAuth, AdminController.grantMembership);

/**
 * 为用户分配配额
 * POST /api/admin/assign-quota
 */
router.post('/assign-quota', adminAuth, AdminController.assignQuota);

/**
 * 更新用户配额限制
 * PUT /api/admin/users/:id/quotas/:quotaType
 */
// router.put('/users/:id/quotas/:quotaType', adminAuth, AdminController.updateUserQuotaLimit);

/**
 * 获取配额使用统计
 * GET /api/admin/quotas/statistics
 */
// router.get('/quotas/statistics', adminAuth, AdminController.getQuotaStatistics);

// ==================== 操作日志管理 ====================

/**
 * 获取操作日志列表
 * GET /api/admin/action-logs
 */
// router.get('/action-logs', adminAuth, AdminController.getActionLogs);

/**
 * 获取操作统计
 * GET /api/admin/action-logs/statistics
 */
// router.get('/action-logs/statistics', adminAuth, AdminController.getActionStatistics);

// ==================== 系统统计 ====================

/**
 * 获取系统统计信息
 * GET /api/admin/statistics
 */
router.get('/statistics', adminAuth, AdminController.getStatistics);

// ==================== AI提示词管理 ====================

/**
 * 获取AI提示词类别列表
 * GET /api/admin/ai-prompts/categories
 */
router.get('/ai-prompts/categories', AdminAIPromptController.getCategories);

/**
 * 测试渲染AI提示词
 * POST /api/admin/ai-prompts/test-render
 */
router.post('/ai-prompts/test-render', AdminAIPromptController.testRender);

/**
 * 批量操作AI提示词
 * POST /api/admin/ai-prompts/batch
 */
router.post('/ai-prompts/batch', AdminAIPromptController.batchOperation);

/**
 * 获取所有AI提示词
 * GET /api/admin/ai-prompts
 */
router.get('/ai-prompts', AdminAIPromptController.getAllPrompts);

/**
 * 获取单个AI提示词
 * GET /api/admin/ai-prompts/:id
 */
router.get('/ai-prompts/:id', AdminAIPromptController.getPromptById);

/**
 * 创建AI提示词
 * POST /api/admin/ai-prompts
 */
router.post('/ai-prompts', AdminAIPromptController.createPrompt);

/**
 * 更新AI提示词
 * PUT /api/admin/ai-prompts/:id
 */
router.put('/ai-prompts/:id', AdminAIPromptController.updatePrompt);

/**
 * 删除AI提示词
 * DELETE /api/admin/ai-prompts/:id
 */
router.delete('/ai-prompts/:id', AdminAIPromptController.deletePrompt);

// ==================== 错误处理 ====================

/**
 * 路由错误处理中间件
 */
router.use((error, req, res, next) => {
  console.error('❌ [ADMIN_ROUTES] 路由错误:', error);
  
  // 如果已经发送了响应头，交给默认错误处理器
  if (res.headersSent) {
    return next(error);
  }

  // 数据库错误
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      success: false,
      message: '数据已存在，无法重复创建'
    });
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      success: false,
      message: '关联数据不存在'
    });
  }

  // 验证错误
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // 默认服务器错误
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

module.exports = router; 