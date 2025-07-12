/**
 * 数据填充脚本 (幂等)
 * --------------------------------------------------
 * 1. 检查 plans 表中是否已存在 is_default = true 的套餐
 * 2. 若不存在，则插入一个 "新用户免费套餐" 的默认记录
 * 3. 若已存在，则跳过并输出提示
 *
 * 使用方法：
 *   npm run seed   (在 backend 目录下执行)
 */

/* eslint-disable no-console */

const path = require('path');
const dotenv = require('dotenv');
const { db: knex } = require(path.join(__dirname, '..', 'config', 'database'));

// 加载环境变量（若 .env 存在）
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

(async () => {
  try {
    console.log('🔍 正在检查默认套餐是否已存在...');

    const existingDefault = await knex('plans').where({ is_default: true }).first();

    if (existingDefault) {
      console.log(`ℹ️ 已检测到默认套餐 (ID: ${existingDefault.id}, 名称: ${existingDefault.name})，跳过插入。`);
    } else {
      const defaultPlan = {
        name: '新用户免费套餐',
        price: 0,
        duration_days: 30, // 免费体验 30 天
        features: { resume_optimizations: 5 }, // 可根据业务调节
        status: 'active',
        is_default: true,
        sort_order: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [inserted] = await knex('plans').insert(defaultPlan).returning('*');
      console.log(`✅ 默认套餐已创建，ID: ${inserted.id}`);
    }

    console.log('🔍 正在检查AI提示词是否已存在...');
    const existingPrompts = await knex('ai_prompts').count('* as count').first();
    const promptCount = parseInt(existingPrompts.count);
    
    if (promptCount === 0) {
      console.log('📝 AI提示词不存在，正在导入...');
      const aiPromptSeed = require('../seeds/02_ai_prompts.js');
      await aiPromptSeed.seed(knex);
      console.log('✅ AI提示词已导入');
    } else {
      console.log(`ℹ️ 已检测到${promptCount}个AI提示词，跳过导入。`);
    }

    console.log('🏁 数据填充脚本执行完毕 (幂等)。');
    process.exit(0);
  } catch (err) {
    console.error('❌ 数据填充脚本执行失败:', err);
    process.exit(1);
  } finally {
    // 释放数据库连接
    await knex.destroy();
  }
})(); 