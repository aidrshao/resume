/**
 * BillingController
 * -----------------
 * 处理与计费、商品相关的业务逻辑
 * - 获取所有可售卖的套餐与加油包
 */

const planService = require('../services/planService');
const topUpPackService = require('../services/topUpPackService');

class BillingController {
  /**
   * 获取所有可售卖的商品（套餐和加油包）
   * GET /api/billing/products
   */
  static async getProducts(req, res) {
    try {
      const [plans, topUpPacks] = await Promise.all([
        planService.getAllPlans({ status: 'active' }),
        topUpPackService.getAll({ status: 'active' }),
      ]);

      res.json({
        success: true,
        data: {
          plans,
          topUpPacks,
        },
        message: '获取商品列表成功',
      });
    } catch (error) {
      console.error('❌ [GET_PRODUCTS] 获取商品列表失败:', error);
      res.status(500).json({ success: false, message: '获取商品列表失败' });
    }
  }
}

module.exports = BillingController; 