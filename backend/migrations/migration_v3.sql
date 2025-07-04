-- 数据库迁移脚本 - 版本 3.2
-- 统一简历数据存储结构重构
-- 执行日期：2025-07-04
-- 作者：AI Assistant

-- 开始事务
BEGIN;

-- 统一简历数据存储字段，并重命名以明确其用途
-- 1. 删除旧的content字段（如果存在）
ALTER TABLE resumes DROP COLUMN IF EXISTS content;

-- 2. 重命名resume_data为unified_data
-- 首先检查字段是否存在，避免重复执行时出错
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'resumes' AND column_name = 'resume_data') THEN
        ALTER TABLE resumes RENAME COLUMN resume_data TO unified_data;
    END IF;
END $$;

-- 3. 确保unified_data字段为JSONB类型
ALTER TABLE resumes ALTER COLUMN unified_data TYPE JSONB USING unified_data::jsonb;

-- 4. 为未来的数据结构迭代添加版本控制
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS schema_version VARCHAR(10) DEFAULT '3.2';

-- 5. 更新现有数据的schema_version（如果字段已存在但值为空）
UPDATE resumes SET schema_version = '3.2' WHERE schema_version IS NULL OR schema_version = '';

-- 6. 为unified_data字段添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_resumes_unified_data ON resumes USING GIN (unified_data);

-- 7. 为schema_version字段添加索引
CREATE INDEX IF NOT EXISTS idx_resumes_schema_version ON resumes (schema_version);

-- 8. 添加约束确保unified_data不为空
ALTER TABLE resumes ADD CONSTRAINT chk_unified_data_not_null CHECK (unified_data IS NOT NULL);

-- 提交事务
COMMIT;

-- 验证迁移结果
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'resumes' 
    AND column_name IN ('unified_data', 'schema_version')
ORDER BY column_name;

-- 显示迁移完成信息
SELECT 
    'Migration v3.2 completed successfully' as status,
    COUNT(*) as total_resumes,
    COUNT(CASE WHEN schema_version = '3.2' THEN 1 END) as v3_2_resumes
FROM resumes; 