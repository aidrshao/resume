/**
 * @file profileRoutes.js
 * @description Routes for user profile management.
 * @author [Your Name]
 * @date 2024-07-15
 */
const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/avatars/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.mimetype.split('/')[1];
        cb(null, `avatar-${req.user.id}-${uniqueSuffix}.${extension}`);
    }
});

const upload = multer({ storage: storage });


// @route   GET api/profile
// @desc    Get user profile
// @access  Private
router.get('/', authenticateToken, userProfileController.getProfile);

// @route   GET api/profile/plan
// @desc    Get user's current plan and quotas
// @access  Private
router.get('/plan', authenticateToken, userProfileController.getCurrentPlan);

// @route   POST api/profile/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, userProfileController.changePassword);

// @route   POST api/profile/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), userProfileController.uploadAvatar);

// 添加新的账户删除路由
router.post('/delete-account', authenticateToken, userProfileController.scheduleAccountDeletion);

module.exports = router; 