/**
 * 用户端会员控制器
 * 处理用户会员相关的业务逻辑
 */

const MembershipTier = require('../models/MembershipTier');
const UserMembership = require('../models/UserMembership');
const User = require('../models/User');
const knex = require('../config/database');

class MembershipController {
  /**
   * 获取会员套餐列表（用户端）
   * GET /api/memberships/tiers
   */
  static async getMembershipTiers(req, res) {
    try {
      const result = await MembershipTier.findAll({
        activeOnly: true,
        limit: 100 // 用户端不需要分页，一次性返回所有启用的套餐
      });

      res.json({
        success: true,
        data: result.data,
        message: '获取会员套餐列表成功'
      });

    } catch (error) {
      console.error('❌ [GET_MEMBERSHIP_TIERS] 获取失败:', error.message);
      res.status(500).json({
        success: false,
        message: '获取会员套餐列表失败'
      });
    }
  }

  /**
   * 获取当前用户会员状态
   * GET /api/memberships/status
   */
  static async getMembershipStatus(req, res) {
    try {
      const userId = req.user.userId;

      // 获取当前有效会员信息
      const membership = await UserMembership.getCurrentMembership(userId);

      // 计算会员状态
      let membershipInfo = {
        hasMembership: false,
        isActive: false,
        tierName: '免费用户',
        remainingAiQuota: 0,
        totalAiQuota: 0,
        endDate: null,
        quotaResetDate: null,
        templateAccessLevel: 'basic',
        features: []
      };

      if (membership) {
        membershipInfo = {
          hasMembership: true,
          isActive: membership.status === 'active',
          tierName: membership.tier_name || '免费用户',
          remainingAiQuota: membership.remaining_ai_quota || 0,
          totalAiQuota: membership.ai_resume_quota || 0,
          endDate: membership.end_date,
          quotaResetDate: membership.quota_reset_date,
          templateAccessLevel: membership.template_access_level || 'basic',
          features: membership.features ? JSON.parse(membership.features) : []
        };
      }

      res.json({
        success: true,
        data: membershipInfo,
        message: '获取会员状态成功'
      });

    } catch (error) {
      console.error('❌ [GET_MEMBERSHIP_STATUS] 获取失败:', error.message);
      res.status(500).json({
        success: false,
        message: '获取会员状态失败'
      });
    }
  }

  /**
   * 创建会员订单
   * POST /api/memberships/orders
   */
  static async createMembershipOrder(req, res) {
    try {
      const userId = req.user.userId;
      const { membershipTierId, paymentMethod = 'alipay' } = req.body;

      // 验证必填字段
      if (!membershipTierId) {
        return res.status(400).json({
          success: false,
          message: '请选择会员套餐'
        });
      }

      // 验证套餐是否存在
      const tier = await MembershipTier.findById(parseInt(membershipTierId));
      if (!tier || !tier.is_active) {
        return res.status(404).json({
          success: false,
          message: '会员套餐不存在或已停用'
        });
      }

      // 生成订单号
      const orderNumber = `MB${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // 计算金额
      const originalAmount = parseFloat(tier.original_price);
      const discountAmount = tier.reduction_price ? originalAmount - parseFloat(tier.reduction_price) : 0;
      const finalAmount = tier.reduction_price ? parseFloat(tier.reduction_price) : originalAmount;

      // 创建订单
      const [order] = await knex('membership_orders').insert({
        order_number: orderNumber,
        user_id: userId,
        membership_tier_id: parseInt(membershipTierId),
        original_amount: originalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        status: 'pending',
        payment_method: paymentMethod,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }).returning('*');

      res.status(201).json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.order_number,
          finalAmount: order.final_amount,
          paymentMethod: order.payment_method,
          tierName: tier.name
        },
        message: '订单创建成功'
      });

    } catch (error) {
      console.error('❌ [CREATE_ORDER] 创建失败:', error.message);
      res.status(500).json({
        success: false,
        message: '创建订单失败'
      });
    }
  }

  /**
   * 模拟支付成功并激活会员
   * POST /api/memberships/orders/:orderId/activate
   * 注：实际项目中这应该是支付回调接口
   */
  static async activateMembershipOrder(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.userId;
      const { transactionId } = req.body;

      // 获取订单信息
      const order = await knex('membership_orders')
        .leftJoin('membership_tiers', 'membership_orders.membership_tier_id', 'membership_tiers.id')
        .select(
          'membership_orders.*',
          'membership_tiers.name as tier_name',
          'membership_tiers.duration_days',
          'membership_tiers.ai_resume_quota'
        )
        .where('membership_orders.id', parseInt(orderId))
        .where('membership_orders.user_id', userId)
        .first();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: '订单状态无效，无法激活'
        });
      }

      // 开始事务
      await knex.transaction(async (trx) => {
        // 1. 更新订单状态
        await trx('membership_orders')
          .where('id', order.id)
          .update({
            status: 'paid',
            payment_transaction_id: transactionId || `MOCK_${Date.now()}`,
            paid_at: knex.fn.now(),
            updated_at: knex.fn.now()
          });

        // 2. 停用用户当前的会员状态
        await trx('user_memberships')
          .where('user_id', userId)
          .where('status', 'active')
          .update({
            status: 'expired',
            updated_at: knex.fn.now()
          });

        // 3. 计算会员时间
        const startDate = new Date();
        let endDate = null;
        let quotaResetDate = null;

        if (order.duration_days > 0) {
          endDate = new Date();
          endDate.setDate(endDate.getDate() + order.duration_days);
          
          // 设置下个月的配额重置时间
          quotaResetDate = new Date();
          quotaResetDate.setMonth(quotaResetDate.getMonth() + 1);
          quotaResetDate.setDate(1); // 每月1号重置
          quotaResetDate.setHours(0, 0, 0, 0);
        }

        // 4. 创建新的会员记录
        await trx('user_memberships').insert({
          user_id: userId,
          membership_tier_id: order.membership_tier_id,
          status: 'active',
          start_date: startDate,
          end_date: endDate,
          remaining_ai_quota: order.ai_resume_quota || 0,
          quota_reset_date: quotaResetDate,
          payment_status: 'paid',
          paid_amount: order.final_amount,
          payment_method: order.payment_method,
          admin_notes: `订单激活: ${order.order_number}`,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
      });

      res.json({
        success: true,
        data: {
          orderNumber: order.order_number,
          tierName: order.tier_name,
          activatedAt: new Date().toISOString()
        },
        message: '会员激活成功'
      });

    } catch (error) {
      console.error('❌ [ACTIVATE_ORDER] 激活失败:', error.message);
      res.status(500).json({
        success: false,
        message: '会员激活失败'
      });
    }
  }

  /**
   * 获取用户订单历史
   * GET /api/memberships/orders
   */
  static async getUserOrders(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // 获取订单列表
      const orders = await knex('membership_orders')
        .leftJoin('membership_tiers', 'membership_orders.membership_tier_id', 'membership_tiers.id')
        .select(
          'membership_orders.*',
          'membership_tiers.name as tier_name'
        )
        .where('membership_orders.user_id', userId)
        .orderBy('membership_orders.created_at', 'desc')
        .limit(parseInt(limit))
        .offset(offset);

      // 获取总数
      const [{ count }] = await knex('membership_orders')
        .where('user_id', userId)
        .count('* as count');

      const total = parseInt(count);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        message: '获取订单历史成功'
      });

    } catch (error) {
      console.error('❌ [GET_USER_ORDERS] 获取失败:', error.message);
      res.status(500).json({
        success: false,
        message: '获取订单历史失败'
      });
    }
  }

  /**
   * 校验用户AI配额
   * POST /api/memberships/check-quota
   */
  static async checkAIQuota(req, res) {
    try {
      const userId = req.user.userId;
      const { usageType = 'resume_generation' } = req.body;

      const quotaResult = await MembershipController.validateAIQuota(userId);

      if (!quotaResult.hasQuota) {
        return res.status(403).json({
          success: false,
          message: quotaResult.message,
          data: {
            remainingQuota: quotaResult.remainingQuota,
            membershipRequired: !quotaResult.hasMembership
          }
        });
      }

      res.json({
        success: true,
        data: {
          hasQuota: true,
          remainingQuota: quotaResult.remainingQuota,
          membership: quotaResult.membership
        },
        message: '配额校验通过'
      });

    } catch (error) {
      console.error('❌ [CHECK_QUOTA] 校验失败:', error.message);
      res.status(500).json({
        success: false,
        message: '配额校验失败'
      });
    }
  }

  /**
   * 校验用户AI配额（内部方法）
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 配额校验结果
   */
  static async validateAIQuota(userId) {
    try {
      // 获取用户当前会员信息
      const membership = await UserMembership.getCurrentMembership(userId);

      if (!membership) {
        return {
          hasQuota: false,
          hasMembership: false,
          remainingQuota: 0,
          message: '您还不是会员，请先购买会员套餐'
        };
      }

      if (membership.status !== 'active') {
        return {
          hasQuota: false,
          hasMembership: true,
          remainingQuota: 0,
          message: '您的会员已过期，请续费'
        };
      }

      // 检查配额重置时间
      const now = new Date();
      if (membership.quota_reset_date && new Date(membership.quota_reset_date) <= now) {
        // 需要重置配额
        await knex('user_memberships')
          .where('id', membership.id)
          .update({
            remaining_ai_quota: membership.ai_resume_quota,
            quota_reset_date: this.getNextResetDate(),
            updated_at: knex.fn.now()
          });
        
        membership.remaining_ai_quota = membership.ai_resume_quota;
      }

      if (membership.remaining_ai_quota <= 0) {
        return {
          hasQuota: false,
          hasMembership: true,
          remainingQuota: 0,
          message: '本月AI使用次数已用完，请等待下月重置或升级套餐'
        };
      }

      return {
        hasQuota: true,
        hasMembership: true,
        remainingQuota: membership.remaining_ai_quota,
        membership
      };

    } catch (error) {
      console.error('❌ [VALIDATE_QUOTA] 校验出错:', error.message);
      throw error;
    }
  }

  /**
   * 消耗AI配额
   * @param {number} userId - 用户ID
   * @param {string} usageType - 使用类型
   * @param {number} resumeId - 简历ID（可选）
   * @param {number} jobId - 岗位ID（可选）
   * @returns {Promise<boolean>} 是否成功消耗配额
   */
  static async consumeAIQuota(userId, usageType = 'resume_generation', resumeId = null, jobId = null) {
    try {
      // 先校验配额
      const quotaResult = await this.validateAIQuota(userId);
      if (!quotaResult.hasQuota) {
        throw new Error(quotaResult.message);
      }

      // 开始事务
      await knex.transaction(async (trx) => {
        // 1. 减少配额
        await trx('user_memberships')
          .where('id', quotaResult.membership.id)
          .decrement('remaining_ai_quota', 1)
          .update('updated_at', knex.fn.now());

        // 2. 记录使用日志
        await trx('user_ai_usage_logs').insert({
          user_id: userId,
          usage_type: usageType,
          resume_id: resumeId,
          job_id: jobId,
          is_success: true,
          used_at: knex.fn.now(),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
      });

      return true;

    } catch (error) {
      console.error('❌ [CONSUME_QUOTA] 消耗配额失败:', error.message);
      
      // 记录失败日志
      try {
        await knex('user_ai_usage_logs').insert({
          user_id: userId,
          usage_type: usageType,
          resume_id: resumeId,
          job_id: jobId,
          is_success: false,
          error_message: error.message,
          used_at: knex.fn.now(),
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
      } catch (logError) {
        console.error('❌ [LOG_ERROR] 记录失败日志出错:', logError.message);
      }

      throw error;
    }
  }

  /**
   * 获取下次配额重置时间
   * @returns {Date} 下次重置时间
   */
  static getNextResetDate() {
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);
    nextReset.setHours(0, 0, 0, 0);
    return nextReset;
  }
}

module.exports = MembershipController; 