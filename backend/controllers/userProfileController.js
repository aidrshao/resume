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
const { validationResult } = require('express-validator');
const UserQuota = require('../models/UserQuota');
const { db: knex } = require('../config/database');

const PROFILE_CACHE_TTL = 3600; // 1 hour cache

class UserProfileController {
    /**
     * Get current user's profile, with Redis caching
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    static async getProfile(req, res) {
        const userId = req.user.userId;
        const cacheKey = `user_profile:${userId}`;

        try {
            // Try to get from cache first
            try {
                const cachedProfile = await redis.get(cacheKey);
                if (cachedProfile) {
                    console.log(`[CACHE] HIT for user profile ${userId}`);
                    return res.json({ success: true, data: JSON.parse(cachedProfile) });
                }
            } catch (redisError) {
                console.warn(`[CACHE] Redis error, falling back to database:`, redisError.message);
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

            // Try to cache the result
            try {
                await redis.setex(cacheKey, PROFILE_CACHE_TTL, JSON.stringify(userProfile));
            } catch (redisError) {
                console.warn(`[CACHE] Failed to cache user profile:`, redisError.message);
            }

            res.json({ success: true, data: userProfile });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    /**
     * Upload user avatar
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    static async uploadAvatar(req, res) {
        const userId = req.user.userId;
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

            res.json({ 
                success: true, 
                message: 'Avatar uploaded successfully', 
                avatarUrl: avatarUrl 
            });

        } catch (error) {
            console.error(`[AVATAR_UPLOAD] Error uploading avatar for user ${userId}:`, error);
            res.status(500).json({ success: false, message: 'Server error during avatar upload.' });
        }
    }

    /**
     * Change user's password
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    static async changePassword(req, res) {
        const userId = req.user.userId;
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
    }

    /**
     * @description Schedule account deletion (soft delete)
     * @route POST /api/profile/delete-account
     * @access Private
     */
    static async scheduleAccountDeletion(req, res) {
        try {
            const { password } = req.body;
            const userId = req.user.userId;

            if (!password) {
                return res.status(400).json({ success: false, message: '请输入您的密码以确认操作' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: '密码不正确' });
            }

            await User.update(userId, {
                status: 'to_be_deleted',
                deletion_scheduled_at: new Date(),
            });
            
            // 注意：JWT令牌的失效通常在客户端通过删除令牌来实现。
            // 后端能做的是确保此令牌在下一次使用时（如果被盗用）无法通过需要 'active' 状态的检查。
            // 任何需要用户登录状态的接口都应增加对 user.status === 'active' 的检查。

            res.json({ success: true, message: '您的账户删除请求已提交。您将自动登出。' });
        } catch (error) {
            console.error('Error scheduling account deletion:', error);
            res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
        }
    }

    static async getCurrentPlan(req, res) {
        const userId = req.user.userId;
        console.log(`[API_DEBUG] Received request for GET /api/profile/plan for user ${userId}.`);

        try {
            // 获取用户的配额信息
            const userQuotas = await knex('user_quotas')
                .where({ user_id: userId })
                .select('quota_type', 'quota_limit', 'quota_used', 'reset_date');

            // 获取默认套餐信息
            const defaultPlan = await knex('plans')
                .where({ is_default: true })
                .first();

            const planData = {
                planName: defaultPlan ? defaultPlan.name : '免费版',
                planId: defaultPlan ? defaultPlan.id : null,
                quotas: {
                    subscription: {},
                    permanent: {}
                },
                subscriptionExpiresAt: null
            };

            // 处理配额数据
            if (userQuotas && userQuotas.length > 0) {
                userQuotas.forEach(quota => {
                    const remaining = Math.max(0, quota.quota_limit - quota.quota_used);
                    planData.quotas.subscription[quota.quota_type] = remaining;
                });
            } else {
                // 如果没有配额记录，返回默认配额
                planData.quotas.subscription.resume_optimizations = 5;
            }
            
            console.log('[API_DEBUG] Sending plan data to frontend:', JSON.stringify(planData, null, 2));

            res.json({ success: true, data: planData });
        } catch (error) {
            console.error(`[API_ERROR] Error fetching plan for user ${userId}:`, error);
            res.status(500).json({ success: false, message: '获取用户套餐信息失败' });
        }
    }
}

module.exports = UserProfileController;