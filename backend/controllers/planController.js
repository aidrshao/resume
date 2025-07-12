/**
 * PlanController
 * --------------
 * 管理员套餐管理接口 (/api/admin/plans)
 */

const PlanService = require('../services/planService');
const { AVAILABLE_FEATURES } = require('../config/features');

class PlanController {
  /**
   * GET /api/admin/features
   * 获取权益字典
   */
  static async getFeatures(req, res) {
    try {
      res.json({ 
        success: true, 
        data: AVAILABLE_FEATURES, 
        message: '获取权益字典成功' 
      });
    } catch (err) {
      console.error('❌ [GET_FEATURES] 失败:', err.message);
      res.status(500).json({ success: false, message: '获取权益字典失败' });
    }
  }

  /**
   * GET /api/admin/plans
   * 查询套餐列表
   */
  static async listPlans(req, res) {
    try {
      let plans = await PlanService.getAllPlans(req.query);
      // 将features字段从JSON字符串转换为对象，便于前端直接使用
      plans = plans.map(p => ({
        ...p,
        features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
      }));
      res.json({ success: true, data: plans, message: '获取套餐成功' });
    } catch (err) {
      console.error('❌ [LIST_PLANS] 失败:', err.message);
      res.status(500).json({ success: false, message: '获取套餐失败' });
    }
  }

  /**
   * POST /api/admin/plans
   */
  static async createPlan(req, res) {
    try {
      let plan = await PlanService.createPlan(req.body);
      if (plan && typeof plan.features === 'string') {
        plan.features = JSON.parse(plan.features);
      }
      res.json({ success: true, data: plan, message: '创建套餐成功' });
    } catch (err) {
      console.error('❌ [CREATE_PLAN] 失败:', err.message);
      res.status(500).json({ success: false, message: err.message || '创建套餐失败' });
    }
  }

  /**
   * GET /api/admin/plans/:id
   */
  static async getPlan(req, res) {
    try {
      const { id } = req.params;
      let plan = await PlanService.getPlanById(id);
      if (plan && typeof plan.features === 'string') {
        plan.features = JSON.parse(plan.features);
      }
      if (!plan) return res.status(404).json({ success: false, message: '套餐不存在' });
      res.json({ success: true, data: plan, message: '获取套餐成功' });
    } catch (err) {
      console.error('❌ [GET_PLAN] 失败:', err.message);
      res.status(500).json({ success: false, message: '获取套餐失败' });
    }
  }

  /**
   * PUT /api/admin/plans/:id
   */
  static async updatePlan(req, res) {
    try {
      const { id } = req.params;
      let plan = await PlanService.updatePlan(id, req.body);
      if (plan && typeof plan.features === 'string') {
        plan.features = JSON.parse(plan.features);
      }
      res.json({ success: true, data: plan, message: '更新套餐成功' });
    } catch (err) {
      console.error('❌ [UPDATE_PLAN] 失败:', err.message);
      res.status(500).json({ success: false, message: err.message || '更新套餐失败' });
    }
  }

  /**
   * DELETE /api/admin/plans/:id
   */
  static async deletePlan(req, res) {
    try {
      const { id } = req.params;
      await PlanService.deletePlan(id);
      res.json({ success: true, message: '删除套餐成功' });
    } catch (err) {
      console.error('❌ [DELETE_PLAN] 失败:', err.message);
      res.status(500).json({ success: false, message: '删除套餐失败' });
    }
  }
}

module.exports = PlanController; 