/**
 * @file profileRoutes.js
 * @description Routes for user profile management.
 * @author [Your Name]
 * @date 2024-07-15
 */
const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const auth = require('../middleware/auth');
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
router.get('/', auth.authenticateToken, userProfileController.getProfile);

// @route   POST api/profile/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth.authenticateToken, userProfileController.changePassword);

// @route   POST api/profile/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', auth.authenticateToken, upload.single('avatar'), userProfileController.uploadAvatar);


module.exports = router; 