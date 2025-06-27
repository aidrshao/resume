/**
 * 数据库连接工具
 * 初始化knex数据库连接
 */

const knex = require('knex');
const config = require('../knexfile.js');

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

module.exports = db; 