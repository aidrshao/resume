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
    console.log('🔥 [DEBUG] sendVerificationCode函数被调用');
    console.log('🔥 [DEBUG] req.body:', JSON.stringify(req.body, null, 2));
    console.log('🔥 [DEBUG] emailService 对象:', typeof emailService);
    console.log('🔥 [DEBUG] emailService.constructor:', typeof emailService.constructor);
    
    const { email, type } = req.body;

    console.log(`📧 [SEND_CODE] 开始发送验证码: ${email}, 类型: ${type}`);
    
    // 验证基本参数
    if (!email || !type) {
      console.error('❌ [SEND_CODE] 缺少必需参数:', { email: !!email, type: !!type });
      return res.status(400).json({
        success: false,
        message: '邮箱和类型都不能为空'
      });
    }

    // 验证邮箱格式
    console.log('🔍 [SEND_CODE] 开始验证邮箱格式...');
    try {
      if (!emailService.constructor.isValidEmail(email)) {
        console.error('❌ [SEND_CODE] 邮箱格式不正确:', email);
        return res.status(400).json({
          success: false,
          message: '邮箱格式不正确'
        });
      }
      console.log('✅ [SEND_CODE] 邮箱格式验证通过');
    } catch (emailValidationError) {
      console.error('❌ [SEND_CODE] 邮箱格式验证异常:', emailValidationError);
      throw emailValidationError;
    }

    // 验证类型
    const validTypes = ['register', 'login', 'reset_password'];
    if (!validTypes.includes(type)) {
      console.error('❌ [SEND_CODE] 验证码类型不正确:', type);
      return res.status(400).json({
        success: false,
        message: '验证码类型不正确'
      });
    }
    console.log('✅ [SEND_CODE] 验证码类型验证通过');

    // 检查是否频繁发送验证码（1分钟内不能重复发送）
    console.log('🔍 [SEND_CODE] 检查频率限制...');
    try {
      const recentCode = await EmailVerification.getRecentCode(email, type, 1);
      if (recentCode) {
        console.warn('⚠️ [SEND_CODE] 验证码发送过于频繁:', { email, type });
        return res.status(429).json({
          success: false,
          message: '验证码发送过于频繁，请1分钟后再试'
        });
      }
      console.log('✅ [SEND_CODE] 频率限制检查通过');
    } catch (frequencyCheckError) {
      console.error('❌ [SEND_CODE] 频率限制检查异常:', frequencyCheckError);
      throw frequencyCheckError;
    }

    // 根据类型进行特殊检查
    console.log('🔍 [SEND_CODE] 开始类型特殊检查...');
    try {
      if (type === 'register') {
        console.log('🔍 [SEND_CODE] 注册类型：检查邮箱是否已存在...');
        // 注册时检查邮箱是否已存在
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          console.warn('⚠️ [SEND_CODE] 邮箱已被注册:', email);
          return res.status(400).json({
            success: false,
            message: '该邮箱已被注册'
          });
        }
        console.log('✅ [SEND_CODE] 邮箱可用于注册');
      } else if (type === 'login' || type === 'reset_password') {
        console.log('🔍 [SEND_CODE] 登录/重置类型：检查邮箱是否存在...');
        // 登录或重置密码时检查邮箱是否存在
        const user = await User.findByEmail(email);
        if (!user) {
          console.warn('⚠️ [SEND_CODE] 邮箱未注册:', email);
          return res.status(400).json({
            success: false,
            message: '该邮箱未注册'
          });
        }
        console.log('✅ [SEND_CODE] 邮箱存在，可以发送验证码');
      }
    } catch (userCheckError) {
      console.error('❌ [SEND_CODE] 用户检查异常:', userCheckError);
      throw userCheckError;
    }

    // 删除该邮箱之前未使用的验证码
    console.log('🔍 [SEND_CODE] 清理旧验证码...');
    try {
      await EmailVerification.deleteOldCodes(email, type);
      console.log('✅ [SEND_CODE] 旧验证码清理完成');
    } catch (deleteOldCodesError) {
      console.error('❌ [SEND_CODE] 清理旧验证码异常:', deleteOldCodesError);
      throw deleteOldCodesError;
    }

    // 生成验证码
    console.log('🔍 [SEND_CODE] 生成验证码...');
    let code;
    try {
      code = emailService.generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期
      console.log(`✅ [SEND_CODE] 验证码生成成功: ${code}, 过期时间: ${expiresAt}`);

      // 存储验证码到数据库
      console.log('🔍 [SEND_CODE] 存储验证码到数据库...');
      await EmailVerification.create({
        email,
        code,
        type,
        expires_at: expiresAt
      });
      console.log(`💾 [SEND_CODE] 验证码已存储到数据库: ${code}, 过期时间: ${expiresAt}`);
    } catch (codeGenerationError) {
      console.error('❌ [SEND_CODE] 验证码生成或存储异常:', codeGenerationError);
      throw codeGenerationError;
    }

    // 发送验证码邮件
    console.log('🔍 [SEND_CODE] 发送验证码邮件...');
    try {
      const emailResult = await emailService.sendVerificationCode(email, code, type);
      console.log('📧 [SEND_CODE] 邮件发送结果:', emailResult);

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
    } catch (emailSendError) {
      console.error('❌ [SEND_CODE] 邮件发送异常:', emailSendError);
      throw emailSendError;
    }

  } catch (error) {
    console.error('💥 [SEND_CODE] ==> 发送验证码严重错误');
    console.error('💥 [SEND_CODE] 错误名称:', error.name);
    console.error('💥 [SEND_CODE] 错误消息:', error.message);
    console.error('💥 [SEND_CODE] 错误堆栈:', error.stack);
    console.error('💥 [SEND_CODE] 请求参数:', req.body);
    console.error('💥 [SEND_CODE] 请求ID:', req.requestId);
    
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error_code: 'SEND_CODE_ERROR',
      request_id: req.requestId,
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // 密码加密（优化性能：从12降到10，登录速度提升5倍）
    const saltRounds = 10;
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

    // 🚀 密码hash迁移：检查是否使用旧的saltRounds=12
    console.log(`🔍 [LOGIN] 检查密码hash格式: ${user.password_hash.substring(0, 7)}`);
    
    if (user.password_hash.startsWith('$2a$12$') || user.password_hash.startsWith('$2b$12$')) {
      console.log(`🔄 [LOGIN] 检测到旧密码hash (saltRounds=12)，开始迁移到saltRounds=10...`);
      console.log(`🔄 [LOGIN] 原始hash: ${user.password_hash}`);
      
      try {
        // 生成新的hash (saltRounds=10)
        const newPasswordHash = await bcrypt.hash(password, 10);
        console.log(`🔄 [LOGIN] 新hash生成: ${newPasswordHash}`);
        
        // 更新数据库中的密码hash
        const updatedUser = await User.updatePassword(email, newPasswordHash);
        console.log(`🔄 [LOGIN] 数据库更新结果:`, updatedUser);
        
        console.log(`✅ [LOGIN] 密码hash迁移成功: ${email} (saltRounds=12 → saltRounds=10)`);
      } catch (migrationError) {
        console.error(`❌ [LOGIN] 密码hash迁移失败: ${email}`, migrationError);
        console.error(`❌ [LOGIN] 迁移错误详情:`, migrationError.stack);
        // 迁移失败不影响登录流程，继续正常登录
      }
    } else {
      console.log(`✅ [LOGIN] 密码hash已优化 (saltRounds=10)`);
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

    // 加密新密码（优化性能：从12降到10）
    const saltRounds = 10;
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