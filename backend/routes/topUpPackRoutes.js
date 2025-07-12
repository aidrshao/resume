const express = require('express');
const router = express.Router();
const TopUpPackController = require('../controllers/topUpPackController');
const { adminAuth } = require('../middleware/adminAuth');

// 所有路由需要管理员认证
router.use(adminAuth);

router.get('/', TopUpPackController.listPacks);
router.post('/', TopUpPackController.createPack);
router.get('/:id', TopUpPackController.getPack);
router.put('/:id', TopUpPackController.updatePack);
router.delete('/:id', TopUpPackController.deletePack);

module.exports = router; 