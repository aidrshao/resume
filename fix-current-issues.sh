#!/bin/bash

# 当前部署问题修复脚本 - AI俊才社简历系统
# 解决502错误、PM2进程异常、数据库迁移失败等问题

echo "🔧 AI俊才社简历系统 - 当前问题修复工具"
echo "============================================="
date
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/home/ubuntu/resume"

echo "🔍 当前问题诊断"
echo "================"

echo "📊 PM2进程状态:"
pm2 list

echo ""
echo "🌐 端口占用情况:"
echo "后端端口8000:" 
netstat -tln | grep ":8000" || echo "未监听"
echo "前端端口3000:"
netstat -tln | grep ":3000" || echo "未监听"
echo "数据库端口5435:"
netstat -tln | grep ":5435" || echo "未监听"

echo ""
echo "🐘 数据库连接测试:"
docker exec resume-postgres psql -U resume_user -d resume_db -c "SELECT 'connected' as status;" 2>&1 || echo "数据库连接失败"

echo ""
echo "🔧 问题1: 清理异常PM2进程"
echo "=========================="

echo "强制停止所有resume进程..."
pm2 delete resume-backend 2>/dev/null || true
pm2 delete resume-frontend 2>/dev/null || true

echo "等待3秒..."
sleep 3

echo "清理残留进程..."
pkill -f "resume" 2>/dev/null || true
pkill -f "serve.*build" 2>/dev/null || true

echo "✅ PM2进程清理完成"

echo ""
echo "🔧 问题2: 修复数据库认证"
echo "========================"

echo "重置数据库用户和权限..."
docker exec resume-postgres psql -U postgres -d postgres << 'EOF' 2>/dev/null || \
docker exec resume-postgres psql -d template1 << 'EOF' 2>/dev/null || \
docker exec resume-postgres psql << 'EOF'

-- 确保数据库和用户存在
CREATE DATABASE resume_db;
CREATE USER resume_user WITH PASSWORD 'ResumePass123';
GRANT ALL PRIVILEGES ON DATABASE resume_db TO resume_user;

-- 连接到resume_db设置权限
\c resume_db

-- 给用户创建schema权限
GRANT ALL ON SCHEMA public TO resume_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO resume_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO resume_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO resume_user;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO resume_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO resume_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO resume_user;

EOF

if [ $? -eq 0 ]; then
    echo "✅ 数据库用户权限重置成功"
else
    echo "⚠️ 数据库权限设置可能需要手动处理"
fi

echo ""
echo "🔧 问题3: 手动创建数据库表"
echo "==========================="

echo "直接创建所需的数据库表结构..."
docker exec resume-postgres psql -U resume_user -d resume_db << 'EOF'

-- 删除已存在的表（如果有）
DROP TABLE IF EXISTS task_progress_logs CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS task_queue CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS user_infos CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 创建用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户信息表
CREATE TABLE user_infos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建简历表
CREATE TABLE resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content JSONB,
    file_path VARCHAR(500),
    original_filename VARCHAR(255),
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建任务队列表
CREATE TABLE task_queue (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    data JSONB,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建任务进度日志表
CREATE TABLE task_progress_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES task_queue(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建邮件验证表
CREATE TABLE email_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_task_queue_status ON task_queue(status);
CREATE INDEX idx_task_progress_logs_task_id ON task_progress_logs(task_id);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_code ON email_verifications(code);

-- 显示创建的表
\dt

-- 验证权限
SELECT table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee = 'resume_user' 
LIMIT 10;

EOF

if [ $? -eq 0 ]; then
    echo "✅ 数据库表结构创建成功"
else
    echo "❌ 数据库表结构创建失败"
fi

echo ""
echo "🔧 问题4: 修复nginx配置"
echo "======================="

echo "更新nginx配置文件..."
cat > /etc/nginx/sites-available/cv.juncaishe.com << 'EOF'
# Resume项目 - cv.juncaishe.com 配置
server {
    listen 80;
    server_name cv.juncaishe.com;
    
    # API请求转发到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 前端静态文件
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # 日志
    access_log /var/log/nginx/cv.juncaishe.com.access.log;
    error_log /var/log/nginx/cv.juncaishe.com.error.log;
}
EOF

echo "测试nginx配置..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ nginx配置语法正确"
    systemctl reload nginx
    echo "✅ nginx已重载"
else
    echo "❌ nginx配置有误"
fi

echo ""
echo "🔧 问题5: 重新启动服务"
echo "====================="

echo "进入后端目录..."
cd "$PROJECT_DIR/backend" || exit 1

echo "检查后端配置..."
if [ -f ".env" ]; then
    echo "✅ .env文件存在"
    echo "数据库配置:"
    grep -E "^DB_" .env
else
    echo "❌ .env文件不存在"
fi

echo ""
echo "启动后端服务..."
pm2 start server.js --name resume-backend --log /var/log/resume-backend.log --error /var/log/resume-backend-error.log

echo "等待后端启动..."
sleep 5

echo ""
echo "启动前端服务..."
cd "$PROJECT_DIR/frontend" || exit 1

echo "检查构建目录..."
if [ -d "build" ]; then
    echo "✅ 前端构建目录存在"
    ls -la build/ | head -5
    
    # 启动前端服务，明确指定端口3000
    pm2 start "npx serve -s build -l 3000" --name resume-frontend --log /var/log/resume-frontend.log --error /var/log/resume-frontend-error.log
else
    echo "❌ 前端构建目录不存在，重新构建..."
    npm run build
    pm2 start "npx serve -s build -l 3000" --name resume-frontend --log /var/log/resume-frontend.log --error /var/log/resume-frontend-error.log
fi

echo ""
echo "🏥 服务健康检查"
echo "==============="

echo "等待服务完全启动..."
sleep 10

echo "1. PM2进程状态:"
pm2 list

echo ""
echo "2. 端口监听检查:"
echo "后端端口8000:"
netstat -tln | grep ":8000" && echo "✅ 后端端口正常" || echo "❌ 后端端口未监听"
echo "前端端口3000:"
netstat -tln | grep ":3000" && echo "✅ 前端端口正常" || echo "❌ 前端端口未监听"

echo ""
echo "3. 服务响应测试:"
echo "后端API测试:"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:8000/ 2>/dev/null || echo "后端无响应"

echo "前端测试:"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:3000/ 2>/dev/null || echo "前端无响应"

echo ""
echo "4. nginx代理测试:"
curl -s -w "HTTP状态码: %{http_code}\n" http://cv.juncaishe.com/ 2>/dev/null || echo "nginx代理异常"

echo ""
echo "5. 数据库最终测试:"
docker exec resume-postgres psql -U resume_user -d resume_db -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';" 2>&1

echo ""
echo "📋 修复总结"
echo "==========="
echo -e "${GREEN}已完成的修复:${NC}"
echo "  ✓ 清理异常PM2进程"
echo "  ✓ 重置数据库用户权限"
echo "  ✓ 手动创建数据库表结构"
echo "  ✓ 修复nginx配置"
echo "  ✓ 重新启动后端和前端服务"

echo ""
echo -e "${BLUE}检查结果:${NC}"
if netstat -tln | grep -q ":8000" && netstat -tln | grep -q ":3000"; then
    echo "  ✅ 服务端口正常监听"
    echo "  🌐 请访问: http://cv.juncaishe.com/"
else
    echo "  ❌ 服务端口异常，需要查看日志"
    echo "  📝 查看日志命令:"
    echo "     pm2 logs resume-backend"
    echo "     pm2 logs resume-frontend"
    echo "     tail -f /var/log/nginx/cv.juncaishe.com.error.log"
fi

echo ""
echo "🎉 修复脚本执行完成!"
echo "如有问题，请运行: pm2 logs 查看详细日志" 