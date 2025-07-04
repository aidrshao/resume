/**
 * 管理员认证中间件
 * 验证管理员身份和权限
 */

const jwt = require('jsonwebtoken');
const { db: knex } = require('../config/database');

/**
 * 管理员身份验证中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const adminAuth = async (req, res, next) => {
  try {
    // 获取Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🚫 [ADMIN_AUTH] 缺少Authorization头');
      return res.status(401).json({
        success: false,
        message: '缺少认证信息'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    if (!token) {
      console.log('🚫 [ADMIN_AUTH] Token为空');
      return res.status(401).json({
        success: false,
        message: '认证信息无效'
      });
    }

    // 验证Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ [ADMIN_AUTH] Token验证成功，用户ID:', decoded.userId);
    } catch (error) {
      console.log('🚫 [ADMIN_AUTH] Token验证失败:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token无效或已过期'
      });
    }

    // 查询用户信息 - 只选择存在的字段
    const user = await knex('users')
      .where('id', decoded.userId)
      .select('id', 'email', 'created_at')
      .first();

    if (!user) {
      console.log('🚫 [ADMIN_AUTH] 用户不存在，ID:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证管理员权限 - 使用邮箱判断
    const isAdmin = user.email === 'admin@example.com';
    if (!isAdmin) {
      console.log('🚫 [ADMIN_AUTH] 用户不是管理员，用户ID:', user.id, '邮箱:', user.email);
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限'
      });
    }

    // 将用户信息添加到请求对象
    req.admin = {
      id: user.id,
      email: user.email,
      name: user.email.split('@')[0], // 从邮箱提取用户名作为name
      role: 'admin'
    };

    console.log('✅ [ADMIN_AUTH] 管理员权限验证通过:', req.admin.email);
    next();

  } catch (error) {
    console.error('❌ [ADMIN_AUTH] 认证过程出错:', error);
    return res.status(500).json({
      success: false,
      message: '认证服务异常'
    });
  }
};

/**
 * 超级管理员权限检查中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const superAdminAuth = async (req, res, next) => {
  // 先通过基础管理员认证
  await adminAuth(req, res, (err) => {
    if (err) return next(err);
    
    // 目前所有管理员都有超级管理员权限
    console.log('✅ [SUPER_ADMIN_AUTH] 超级管理员权限验证通过');
    next();
  });
};

/**
 * 管理员登录验证
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise<Object>} 管理员信息和Token
 */
const adminLogin = async (email, password) => {
  const bcrypt = require('bcrypt');
  
  // 查询用户
  const user = await knex('users')
    .where('email', email)
    .first();

  if (!user) {
    throw new Error('管理员账号不存在');
  }

  // 验证管理员权限 - 使用邮箱判断
  const isAdmin = user.email === 'admin@example.com';
  if (!isAdmin) {
    throw new Error('该账号不是管理员');
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('密码错误');
  }

  // 生成Token
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      isAdmin: true,
      role: 'admin'
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('✅ [ADMIN_LOGIN] 管理员登录成功:', user.email);

  return {
    token,
    admin: {
      id: user.id,
      email: user.email,
      name: user.email.split('@')[0], // 从邮箱提取用户名
      role: 'admin',
      lastLoginAt: new Date()
    }
  };
};

/**
 * 创建管理员账号
 * @param {Object} adminData - 管理员数据
 * @returns {Promise<Object>} 创建的管理员信息
 */
const createAdmin = async (adminData) => {
  const bcrypt = require('bcrypt');
  const { email, password } = adminData;

  // 检查邮箱是否已存在
  const existingUser = await knex('users')
    .where('email', email)
    .first();

  if (existingUser) {
    throw new Error('该邮箱已被注册');
  }

  // 密码加密
  const passwordHash = await bcrypt.hash(password, 12);

  // 创建用户
  const [userId] = await knex('users')
    .insert({
      email,
      password_hash: passwordHash,
      email_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    })
    .returning('id');

  return {
    id: userId,
    email,
    name: email.split('@')[0],
    role: 'admin',
    created_at: new Date()
  };
};

/**
 * 获取管理员列表
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 管理员列表和分页信息
 */
const getAdminList = async (options = {}) => {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  // 目前只有admin@example.com是管理员
  const query = knex('users')
    .where('email', 'admin@example.com')
    .select('id', 'email', 'created_at');

  const total = await query.clone().count('* as count').first();
  const data = await query
    .offset(offset)
    .limit(limit)
    .orderBy('created_at', 'desc');

  // 格式化数据
  const admins = data.map(admin => ({
    id: admin.id,
    email: admin.email,
    name: admin.email.split('@')[0],
    role: 'admin',
    created_at: admin.created_at
  }));

  return {
    data: admins,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total.count),
      pages: Math.ceil(total.count / limit)
    }
  };
};

module.exports = {
  adminAuth,
  superAdminAuth,
  adminLogin,
  createAdmin,
  getAdminList
}; 