/**
 * 认证控制器
 * 处理用户注册、登录、邮箱验证相关业务逻辑
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const emailService = require('../services/emailService');
const { generateToken } = require('../utils/auth');
const { registerSchema, loginSchema } = require('../utils/validation');

/**
 * 发送验证码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const sendVerificationCode = async (req, res) => {
  try {
    const { email, type } = req.body;

    console.log(`📧 [SEND_CODE] 开始发送验证码: ${email}, 类型: ${type}`);

    // 验证邮箱格式
    if (!emailService.constructor.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }

    // 验证类型
    const validTypes = ['register', 'login', 'reset_password'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: '验证码类型不正确'
      });
    }

    // 检查是否频繁发送验证码（1分钟内不能重复发送）
    const recentCode = await EmailVerification.getRecentCode(email, type, 1);
    if (recentCode) {
      return res.status(429).json({
        success: false,
        message: '验证码发送过于频繁，请1分钟后再试'
      });
    }

    // 根据类型进行特殊检查
    if (type === 'register') {
      // 注册时检查邮箱是否已存在
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被注册'
        });
      }
    } else if (type === 'login' || type === 'reset_password') {
      // 登录或重置密码时检查邮箱是否存在
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: '该邮箱未注册'
        });
      }
    }

    // 删除该邮箱之前未使用的验证码
    await EmailVerification.deleteOldCodes(email, type);

    // 生成验证码
    const code = emailService.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 存储验证码到数据库
    await EmailVerification.create({
      email,
      code,
      type,
      expires_at: expiresAt
    });

    console.log(`💾 [SEND_CODE] 验证码已存储到数据库: ${code}, 过期时间: ${expiresAt}`);

    // 发送验证码邮件
    const emailResult = await emailService.sendVerificationCode(email, code, type);

    if (emailResult.success) {
      console.log(`✅ [SEND_CODE] 验证码发送成功: ${email}`);
      res.json({
        success: true,
        message: '验证码已发送到您的邮箱，请注意查收（有效期10分钟）',
        data: {
          email,
          type,
          expires_in: 600 // 秒
        }
      });
    } else {
      console.error(`❌ [SEND_CODE] 邮件发送失败: ${emailResult.error}`);
      res.status(500).json({
        success: false,
        message: emailResult.error || '验证码发送失败，请稍后重试'
      });
    }

  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 验证邮箱验证码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const verifyEmailCode = async (req, res) => {
  try {
    const { email, code, type } = req.body;

    console.log(`🔍 [VERIFY_CODE] 开始验证: ${email}, 代码: ${code}, 类型: ${type}`);

    // 验证邮箱格式
    if (!emailService.constructor.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }

    // 验证验证码
    const verification = await EmailVerification.verify(email, code, type);
    if (!verification) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
    }

    // 标记验证码为已使用
    await EmailVerification.markAsUsed(verification.id);

    console.log(`✅ [VERIFY_CODE] 验证成功: ${email}`);

    res.json({
      success: true,
      message: '验证码验证成功',
      data: {
        email,
        type,
        verified_at: new Date()
      }
    });

  } catch (error) {
    console.error('验证验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 用户注册（需要邮箱验证）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const register = async (req, res) => {
  try {
    // 数据验证
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password, code } = req.body;

    console.log(`📝 [REGISTER] 开始注册: ${email}`);

    // 验证邮箱验证码
    const verification = await EmailVerification.verify(email, code, 'register');
    if (!verification) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 密码加密
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户（邮箱已验证）
    const newUser = await User.create({
      email,
      password_hash: passwordHash,
      email_verified: true
    });

    // 标记验证码为已使用
    await EmailVerification.markAsUsed(verification.id);

    console.log(`✅ [REGISTER] 注册成功: ${email}, 用户ID: ${newUser.id}`);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        id: newUser.id,
        email: newUser.email,
        email_verified: newUser.email_verified,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 用户登录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const login = async (req, res) => {
  try {
    // 数据验证
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = req.body;

    console.log(`🔐 [LOGIN] 开始登录: ${email}`);

    // 查找用户
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 生成JWT token
    const token = generateToken({ userId: user.id });

    console.log(`✅ [LOGIN] 登录成功: ${email}, 用户ID: ${user.id}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 邮箱验证码登录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const loginWithCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    console.log(`📧 [LOGIN_CODE] 开始验证码登录: ${email}`);

    // 验证邮箱格式
    if (!emailService.constructor.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }

    // 查找用户
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '该邮箱未注册'
      });
    }

    // 验证验证码
    const verification = await EmailVerification.verify(email, code, 'login');
    if (!verification) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
    }

    // 标记验证码为已使用
    await EmailVerification.markAsUsed(verification.id);

    // 生成JWT token
    const token = generateToken({ userId: user.id });

    console.log(`✅ [LOGIN_CODE] 验证码登录成功: ${email}, 用户ID: ${user.id}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified
        }
      }
    });

  } catch (error) {
    console.error('验证码登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 重置密码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    console.log(`🔑 [RESET_PASSWORD] 开始重置密码: ${email}`);

    // 基本验证
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '邮箱、验证码和新密码都不能为空'
      });
    }

    // 验证密码强度
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      });
    }

    // 查找用户
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '该邮箱未注册'
      });
    }

    // 验证验证码
    const verification = await EmailVerification.verify(email, code, 'reset_password');
    if (!verification) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
    }

    // 加密新密码
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await User.updatePassword(email, newPasswordHash);

    // 标记验证码为已使用
    await EmailVerification.markAsUsed(verification.id);

    console.log(`✅ [RESET_PASSWORD] 密码重置成功: ${email}`);

    res.json({
      success: true,
      message: '密码重置成功，请使用新密码登录',
      data: {
        email,
        reset_at: new Date()
      }
    });

  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取用户信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      message: '获取用户信息成功',
      data: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        email_verified_at: user.email_verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 测试邮件服务
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const testEmailService = async (req, res) => {
  try {
    console.log(`🧪 [TEST_EMAIL] 开始测试邮件服务`);

    const result = await emailService.testConnection();

    res.json({
      success: result.success,
      message: result.success ? '邮件服务测试成功' : '邮件服务测试失败',
      data: result
    });

  } catch (error) {
    console.error('测试邮件服务错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  register,
  login,
  loginWithCode,
  resetPassword,
  sendVerificationCode,
  verifyEmailCode,
  getProfile,
  testEmailService
}; 