const express = require('express');
const router = express.Router();

const PlanController = require('../controllers/planController');
const { adminAuth } = require('../middleware/adminAuth');

// 路由前缀： /api/admin/plans
router.use(adminAuth); // 所有路由需管理员认证

router.get('/', PlanController.listPlans);
router.post('/', PlanController.createPlan);
router.get('/:id', PlanController.getPlan);
router.put('/:id', PlanController.updatePlan);
router.delete('/:id', PlanController.deletePlan);

module.exports = router; 