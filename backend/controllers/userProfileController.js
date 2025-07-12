/**
 * @file userProfileController.js
 * @description Controller for handling user profile related requests.
 * @author [Your Name]
 * @date 2024-07-15
 */
const User = require('../models/User');
const Resume = require('../models/Resume');
const bcrypt = require('bcryptjs');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const PROFILE_CACHE_TTL = 3600; // 1 hour cache

/**
 * Get current user's profile, with Redis caching
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
exports.getProfile = async (req, res) => {
    const userId = req.user.id;
    const cacheKey = `user_profile:${userId}`;

    try {
        const cachedProfile = await redis.get(cacheKey);
        if (cachedProfile) {
            console.log(`[CACHE] HIT for user profile ${userId}`);
            return res.json({ success: true, data: JSON.parse(cachedProfile) });
        }

        console.log(`[CACHE] MISS for user profile ${userId}`);
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        delete user.password_hash;

        const userProfile = {
            ...user,
            name: user.nickname || null
        };

        await redis.setex(cacheKey, PROFILE_CACHE_TTL, JSON.stringify(userProfile));

        res.json({ success: true, data: userProfile });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Upload user avatar
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
exports.uploadAvatar = async (req, res) => {
    const userId = req.user.id;
    const cacheKey = `user_profile:${userId}`;
    console.log(`[AVATAR_UPLOAD] User ${userId} is uploading a new avatar.`);
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        
        await User.updateById(userId, { avatar_url: avatarUrl, updated_at: new Date() });
        console.log(`[AVATAR_UPLOAD] User ${userId} avatar_url updated in database.`);

        // Invalidate cache after update
        await redis.del(cacheKey);
        console.log(`[CACHE] INVALIDATED for user profile ${userId}`);

        const updatedUser = await User.findById(userId);
        delete updatedUser.password_hash;
        
        const userProfile = {
            ...updatedUser,
            name: updatedUser.nickname || null
        };

        res.json({ success: true, message: 'Avatar uploaded successfully', data: userProfile });

    } catch (error) {
        console.error(`[AVATAR_UPLOAD] Error uploading avatar for user ${userId}:`, error);
        res.status(500).json({ success: false, message: 'Server error during avatar upload.' });
    }
};


/**
 * Change user's password
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const cacheKey = `user_profile:${userId}`;
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide both current and new passwords' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await User.updateById(userId, { password_hash: passwordHash, updated_at: new Date() });

        // Invalidate cache after update
        await redis.del(cacheKey);
        console.log(`[CACHE] INVALIDATED for user profile ${userId}`);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}; 