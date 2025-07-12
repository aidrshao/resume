const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.get('/profile', auth, AuthController.getProfile);
router.get('/me/plan', auth, AuthController.getMyPlan);

module.exports = router; 