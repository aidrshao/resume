/**
 * 认证控制器
 * 处理用户注册、登录相关业务逻辑
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/auth');
const { registerSchema, loginSchema } = require('../utils/validation');

/**
 * 用户注册
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

    const { email, password } = req.body;

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

    // 创建用户
    const newUser = await User.create({
      email,
      password_hash: passwordHash
    });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        id: newUser.id,
        email: newUser.email,
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

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email
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

module.exports = {
  register,
  login,
  getProfile
}; 