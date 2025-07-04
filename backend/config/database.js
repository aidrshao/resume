/**
 * 数据库配置
 * 使用knex连接PostgreSQL数据库
 */

const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

module.exports = { db }; 