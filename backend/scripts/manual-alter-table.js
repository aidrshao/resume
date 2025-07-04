/**
 * 手动执行ALTER TABLE操作来添加新字段
 */

const knex = require('../config/database');

async function manualAlterTable() {
  try {
    console.log('🔧 开始手动添加字段...');
    
    // 检查字段是否已存在
    const hasUnifiedData = await knex.schema.hasColumn('resumes', 'unified_data');
    const hasSchemaVersion = await knex.schema.hasColumn('resumes', 'schema_version');
    
    console.log('📊 当前状态:');
    console.log('  - unified_data存在:', hasUnifiedData);
    console.log('  - schema_version存在:', hasSchemaVersion);
    
    if (!hasUnifiedData) {
      console.log('➕ 添加unified_data字段...');
      try {
        await knex.raw('ALTER TABLE resumes ADD COLUMN unified_data JSONB NULL');
        console.log('✅ unified_data字段添加成功');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('✅ unified_data字段已存在');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ unified_data字段已存在');
    }
    
    if (!hasSchemaVersion) {
      console.log('➕ 添加schema_version字段...');
      try {
        await knex.raw("ALTER TABLE resumes ADD COLUMN schema_version VARCHAR(10) DEFAULT '2.1'");
        console.log('✅ schema_version字段添加成功');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('✅ schema_version字段已存在');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ schema_version字段已存在');
    }
    
    // 再次验证
    const finalHasUnifiedData = await knex.schema.hasColumn('resumes', 'unified_data');
    const finalHasSchemaVersion = await knex.schema.hasColumn('resumes', 'schema_version');
    
    console.log('\n📊 最终状态:');
    console.log('  - unified_data存在:', finalHasUnifiedData);
    console.log('  - schema_version存在:', finalHasSchemaVersion);
    
    if (finalHasUnifiedData && finalHasSchemaVersion) {
      console.log('\n🎉 数据库结构迁移成功！');
    } else {
      console.log('\n❌ 数据库结构迁移失败');
    }
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    
    // 尝试其他解决方案
    if (error.message.includes('must be owner')) {
      console.log('\n💡 建议解决方案:');
      console.log('1. 以postgres用户身份运行迁移');
      console.log('2. 或者授予resume_user表所有者权限');
      console.log('3. 或者请数据库管理员手动添加字段');
      console.log('\n执行的SQL命令:');
      console.log('ALTER TABLE resumes ADD COLUMN unified_data JSONB NULL;');
      console.log("ALTER TABLE resumes ADD COLUMN schema_version VARCHAR(10) DEFAULT '2.1';");
    }
  } finally {
    await knex.destroy();
  }
}

manualAlterTable(); 