-- AI俊才社简历管理系统 - 数据库初始化SQL
-- 此文件在PostgreSQL容器启动时自动执行

-- 确保数据库编码正确
ALTER DATABASE resume_db SET timezone TO 'Asia/Shanghai';

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户详细信息表
CREATE TABLE IF NOT EXISTS user_infos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    summary TEXT,
    objective TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建简历表
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    template_id INTEGER DEFAULT 1,
    resume_data JSONB,
    source VARCHAR(50) DEFAULT 'manual',
    is_base BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建任务队列表
CREATE TABLE IF NOT EXISTS task_queue (
    id SERIAL PRIMARY KEY,
    task_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    task_data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    message TEXT,
    result_data JSONB,
    error_message TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 创建任务进度日志表
CREATE TABLE IF NOT EXISTS task_progress_logs (
    id SERIAL PRIMARY KEY,
    task_id UUID REFERENCES task_queue(task_id) ON DELETE CASCADE,
    progress INTEGER NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建邮箱验证表
CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_infos_user_id ON user_infos(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_base ON resumes(is_base);
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_queue_task_id ON task_queue(task_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_user_id ON task_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_logs_task_id ON task_progress_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(code);

-- 创建更新时间自动更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_infos_updated_at 
    BEFORE UPDATE ON user_infos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at 
    BEFORE UPDATE ON resumes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_queue_updated_at 
    BEFORE UPDATE ON task_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认模板数据
INSERT INTO resumes (id, user_id, title, template_id, resume_data, source, is_base, status) 
VALUES (1, NULL, '默认模板', 1, '{}', 'system', FALSE, 'template')
ON CONFLICT DO NOTHING;

-- 清理过期验证码的函数
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM email_verifications 
    WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 创建定时清理任务（需要pg_cron扩展，可选）
-- SELECT cron.schedule('cleanup-verifications', '0 */6 * * *', 'SELECT cleanup_expired_verifications();');

-- 设置数据库连接参数
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- 重新加载配置
SELECT pg_reload_conf(); 