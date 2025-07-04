#!/usr/bin/env node

/**
 * 数据库问题修复脚本
 * 用于解决迁移冲突、字段重复、用户ID问题等
 */

require('dotenv').config();
const { db: knex } = require('../config/database');

/**
 * 修复数据库表结构问题
 */
async function fixDatabaseSchema() {
    console.log('🔧 [FIX] 开始修复数据库表结构...');
    
    try {
        // 检查并修复resumes表
        await fixResumesTable();
        
        // 检查并修复用户表序列
        await fixUsersSequence();
        
        // 检查并修复会员表
        await fixMembershipTables();
        
        console.log('✅ [FIX] 数据库表结构修复完成');
        
    } catch (error) {
        console.error('❌ [FIX] 数据库表结构修复失败:', error);
        throw error;
    }
}

/**
 * 修复resumes表结构
 */
async function fixResumesTable() {
    console.log('🔧 [FIX] 修复resumes表结构...');
    
    try {
        // 检查表是否存在
        const tableExists = await knex.schema.hasTable('resumes');
        if (!tableExists) {
            console.log('ℹ️ [FIX] resumes表不存在，跳过修复');
            return;
        }
        
        // 检查字段是否存在
        const hasUnifiedData = await knex.schema.hasColumn('resumes', 'unified_data');
        const hasSchemaVersion = await knex.schema.hasColumn('resumes', 'schema_version');
        const hasResumeData = await knex.schema.hasColumn('resumes', 'resume_data');
        const hasContent = await knex.schema.hasColumn('resumes', 'content');
        
        console.log(`📊 [FIX] 字段检查: unified_data=${hasUnifiedData}, schema_version=${hasSchemaVersion}, resume_data=${hasResumeData}, content=${hasContent}`);
        
        // 如果没有unified_data字段，添加它
        if (!hasUnifiedData) {
            await knex.schema.alterTable('resumes', function(table) {
                table.jsonb('unified_data').nullable().comment('统一格式的简历数据');
            });
            console.log('✅ [FIX] 添加了unified_data字段');
        }
        
        // 如果没有schema_version字段，添加它
        if (!hasSchemaVersion) {
            await knex.schema.alterTable('resumes', function(table) {
                table.string('schema_version', 10).defaultTo('2.1').comment('数据结构版本');
            });
            console.log('✅ [FIX] 添加了schema_version字段');
        }
        
        // 迁移数据
        if (hasResumeData && hasUnifiedData) {
            console.log('🔄 [FIX] 从resume_data迁移数据到unified_data...');
            await knex.raw(`
                UPDATE resumes 
                SET unified_data = 
                    CASE 
                        WHEN resume_data IS NOT NULL AND resume_data != '' THEN 
                            CASE 
                                WHEN resume_data::text LIKE '{%' THEN resume_data::jsonb
                                ELSE json_build_object('content', resume_data)::jsonb
                            END
                        ELSE NULL
                    END
                WHERE unified_data IS NULL AND resume_data IS NOT NULL
            `);
            
            // 删除旧字段
            await knex.schema.alterTable('resumes', function(table) {
                table.dropColumn('resume_data');
            });
            console.log('✅ [FIX] 删除了resume_data字段');
        }
        
        if (hasContent && hasUnifiedData) {
            console.log('🔄 [FIX] 从content迁移数据到unified_data...');
            await knex.raw(`
                UPDATE resumes 
                SET unified_data = 
                    CASE 
                        WHEN content IS NOT NULL AND content != '' THEN 
                            CASE 
                                WHEN content::text LIKE '{%' THEN content::jsonb
                                ELSE json_build_object('content', content)::jsonb
                            END
                        ELSE NULL
                    END
                WHERE unified_data IS NULL AND content IS NOT NULL
            `);
            
            // 删除旧字段
            await knex.schema.alterTable('resumes', function(table) {
                table.dropColumn('content');
            });
            console.log('✅ [FIX] 删除了content字段');
        }
        
        console.log('✅ [FIX] resumes表结构修复完成');
        
    } catch (error) {
        console.error('❌ [FIX] resumes表结构修复失败:', error);
        throw error;
    }
}

/**
 * 修复用户表序列
 */
async function fixUsersSequence() {
    console.log('🔧 [FIX] 修复用户表序列...');
    
    try {
        // 检查表是否存在
        const tableExists = await knex.schema.hasTable('users');
        if (!tableExists) {
            console.log('ℹ️ [FIX] users表不存在，跳过修复');
            return;
        }
        
        // 获取当前最大ID
        const result = await knex('users').max('id as max_id').first();
        const maxId = result.max_id || 0;
        
        // 重置序列
        await knex.raw(`SELECT setval('users_id_seq', ${maxId}, true)`);
        
        console.log(`✅ [FIX] 用户表序列重置为: ${maxId}`);
        
    } catch (error) {
        console.error('❌ [FIX] 用户表序列修复失败:', error);
        throw error;
    }
}

/**
 * 修复会员表
 */
async function fixMembershipTables() {
    console.log('🔧 [FIX] 修复会员表...');
    
    try {
        // 检查表是否存在
        const membershipTiersExists = await knex.schema.hasTable('membership_tiers');
        const userMembershipsExists = await knex.schema.hasTable('user_memberships');
        
        if (!membershipTiersExists || !userMembershipsExists) {
            console.log('ℹ️ [FIX] 会员表不存在，跳过修复');
            return;
        }
        
        // 检查是否有会员套餐数据
        const tierCount = await knex('membership_tiers').count('id as count').first();
        
        if (tierCount.count == 0) {
            console.log('ℹ️ [FIX] 没有会员套餐数据，跳过修复');
            return;
        }
        
        // 修复用户会员关系中的数据类型问题
        await knex.raw(`
            UPDATE user_memberships 
            SET user_id = CAST(user_id AS INTEGER) 
            WHERE user_id IS NOT NULL AND user_id != ''
        `);
        
        console.log('✅ [FIX] 会员表修复完成');
        
    } catch (error) {
        console.error('❌ [FIX] 会员表修复失败:', error);
        // 不抛出错误，因为这不是致命问题
    }
}

/**
 * 清理重复的迁移记录
 */
async function cleanupMigrations() {
    console.log('🔧 [FIX] 清理迁移记录...');
    
    try {
        // 检查knex_migrations表是否存在
        const migrationsExists = await knex.schema.hasTable('knex_migrations');
        if (!migrationsExists) {
            console.log('ℹ️ [FIX] 迁移表不存在，跳过清理');
            return;
        }
        
        // 获取重复的迁移记录
        const duplicates = await knex('knex_migrations')
            .select('name')
            .count('name as count')
            .groupBy('name')
            .having('count', '>', 1);
        
        if (duplicates.length > 0) {
            console.log(`🔄 [FIX] 发现${duplicates.length}个重复的迁移记录`);
            
            for (const duplicate of duplicates) {
                // 保留最新的记录，删除其他的
                const records = await knex('knex_migrations')
                    .where('name', duplicate.name)
                    .orderBy('id', 'desc');
                
                if (records.length > 1) {
                    const toDelete = records.slice(1).map(r => r.id);
                    await knex('knex_migrations').whereIn('id', toDelete).del();
                    console.log(`✅ [FIX] 清理了迁移记录: ${duplicate.name}`);
                }
            }
        }
        
        console.log('✅ [FIX] 迁移记录清理完成');
        
    } catch (error) {
        console.error('❌ [FIX] 迁移记录清理失败:', error);
        // 不抛出错误，因为这不是致命问题
    }
}

/**
 * 验证数据库状态
 */
async function verifyDatabaseState() {
    console.log('🔧 [FIX] 验证数据库状态...');
    
    try {
        // 检查核心表
        const coreTablens = ['users', 'resumes', 'membership_tiers', 'user_memberships'];
        
        for (const tableName of coreTablens) {
            const exists = await knex.schema.hasTable(tableName);
            if (exists) {
                const count = await knex(tableName).count('* as count').first();
                console.log(`✅ [FIX] 表 ${tableName}: 存在, 记录数: ${count.count}`);
            } else {
                console.log(`⚠️ [FIX] 表 ${tableName}: 不存在`);
            }
        }
        
        // 检查resumes表结构
        const resumesExists = await knex.schema.hasTable('resumes');
        if (resumesExists) {
            const hasUnifiedData = await knex.schema.hasColumn('resumes', 'unified_data');
            const hasSchemaVersion = await knex.schema.hasColumn('resumes', 'schema_version');
            console.log(`✅ [FIX] resumes表字段: unified_data=${hasUnifiedData}, schema_version=${hasSchemaVersion}`);
        }
        
        console.log('✅ [FIX] 数据库状态验证完成');
        
    } catch (error) {
        console.error('❌ [FIX] 数据库状态验证失败:', error);
        throw error;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('🎯 [MAIN] 开始数据库修复流程...');
    
    try {
        // 修复数据库表结构
        await fixDatabaseSchema();
        
        // 清理重复的迁移记录
        await cleanupMigrations();
        
        // 验证数据库状态
        await verifyDatabaseState();
        
        console.log('🎉 [MAIN] 数据库修复流程完成！');
        
    } catch (error) {
        console.error('❌ [MAIN] 数据库修复流程失败:', error);
        process.exit(1);
    } finally {
        // 关闭数据库连接
        await knex.destroy();
        console.log('🔌 [MAIN] 数据库连接已关闭');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    fixDatabaseSchema,
    cleanupMigrations,
    verifyDatabaseState
}; 