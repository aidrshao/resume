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
const fs = require('fs');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/avatars/');
        // 确保目录存在
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.mimetype.split('/')[1];
        // 安全的文件名生成，避免依赖req.user
        cb(null, `avatar-${uniqueSuffix}.${extension}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB 限制 (从10MB增加)
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('只支持 JPEG, PNG, GIF 格式的图片文件'));
        }
    }
});

// 头像上传错误处理中间件
const handleAvatarUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '文件过大，请上传小于20MB的图片文件',
                error_code: 'FILE_TOO_LARGE'
            });
        }
        return res.status(400).json({
            success: false,
            message: '文件上传失败: ' + err.message,
            error_code: 'UPLOAD_ERROR'
        });
    }
    
    if (err.message.includes('只支持')) {
        return res.status(400).json({
            success: false,
            message: err.message,
            error_code: 'INVALID_FILE_TYPE'
        });
    }
    
    next(err);
};


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
router.post('/upload-avatar', authenticateToken, (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            return handleAvatarUploadError(err, req, res, next);
        }
        next();
    });
}, userProfileController.uploadAvatar);

// 添加新的账户删除路由
router.post('/delete-account', authenticateToken, userProfileController.scheduleAccountDeletion);

module.exports = router; 