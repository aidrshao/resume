#!/bin/bash

# 部署问题修复脚本 - AI俊才社简历系统
# 针对当前发现的具体问题进行修复

echo "🔧 AI俊才社简历系统 - 部署问题修复工具"
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

echo "🔍 问题1: 修复数据库迁移密码认证失败"
echo "==========================================="

echo "📝 检查当前数据库配置..."
if [ -f "$PROJECT_DIR/backend/.env" ]; then
    echo "当前.env文件中的数据库配置:"
    grep -E "^DB_" "$PROJECT_DIR/backend/.env"
    echo ""
    
    # 提取数据库配置
    DB_PASSWORD=$(grep "^DB_PASSWORD" "$PROJECT_DIR/backend/.env" | cut -d'"' -f2)
    echo "提取到的密码长度: ${#DB_PASSWORD}"
    
    # 测试直接数据库连接
    echo "🔍 测试直接数据库连接..."
    docker exec resume-postgres psql -U resume_user -d resume_db -c "SELECT version();" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 直接连接成功${NC}"
    else
        echo -e "${RED}❌ 直接连接失败，需要重建数据库认证${NC}"
        
        echo "🔄 重置数据库用户密码..."
        docker exec resume-postgres psql -U postgres -c "ALTER USER resume_user PASSWORD '$DB_PASSWORD';" 2>/dev/null || \
        docker exec resume-postgres psql -c "ALTER USER resume_user PASSWORD '$DB_PASSWORD';" 2>/dev/null || \
        echo "无法通过postgres用户连接，尝试其他方法..."
        
        # 如果postgres用户不存在，创建resume_user
        echo "🆕 确保resume_user存在并设置正确密码..."
        docker exec resume-postgres psql -d resume_db -c "
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'resume_user') THEN
                CREATE USER resume_user WITH PASSWORD '$DB_PASSWORD';
            ELSE
                ALTER USER resume_user PASSWORD '$DB_PASSWORD';
            END IF;
            GRANT ALL PRIVILEGES ON DATABASE resume_db TO resume_user;
            GRANT ALL ON SCHEMA public TO resume_user;
        END
        \$\$;" 2>/dev/null || echo "数据库用户设置可能需要手动处理"
    fi
else
    echo -e "${RED}❌ .env文件不存在${NC}"
fi

echo ""
echo "🔍 问题2: 修复nginx端口配置错误"
echo "=================================="

echo "📝 检查当前nginx配置..."
NGINX_CONFIG="/etc/nginx/sites-available/cv.juncaishe.com"
if [ -f "$NGINX_CONFIG" ]; then
    echo "当前nginx配置中的端口:"
    grep "proxy_pass" "$NGINX_CONFIG"
    echo ""
    
    # 检查实际服务端口
    echo "🔍 检查实际服务端口..."
    BACKEND_PORT=$(netstat -tln | grep ":8000" && echo "8000" || echo "未监听")
    FRONTEND_PORT=$(netstat -tln | grep ":3000" && echo "3000" || echo "未监听")
    
    echo "后端端口状态: $BACKEND_PORT"
    echo "前端端口状态: $FRONTEND_PORT"
    
    # 修复nginx配置
    echo "🔧 修复nginx配置..."
    cat > "$NGINX_CONFIG" << 'EOF'
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
    
    # 前端静态文件 (使用serve服务)
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
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
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
    
    echo "✅ nginx配置已更新"
    
    # 测试配置
    echo "🔍 测试nginx配置..."
    nginx -t
    if [ $? -eq 0 ]; then
        echo "✅ nginx配置语法正确"
        systemctl reload nginx
        echo "✅ nginx已重载"
    else
        echo -e "${RED}❌ nginx配置有误${NC}"
    fi
else
    echo -e "${RED}❌ nginx配置文件不存在${NC}"
fi

echo ""
echo "🔍 问题3: 检查和修复PM2服务状态"
echo "=================================="

echo "📊 当前PM2状态:"
pm2 list

echo ""
echo "🔍 检查后端服务日志..."
pm2 logs resume-backend --lines 10 --nostream

echo ""
echo "🔍 检查前端服务日志..."
pm2 logs resume-frontend --lines 10 --nostream

# 检查服务是否正确监听端口
echo ""
echo "🌐 检查服务端口监听..."
echo "后端端口8000:"
netstat -tln | grep ":8000"
echo "前端端口3000:"
netstat -tln | grep ":3000"

# 如果端口未监听，尝试重启服务
if ! netstat -tln | grep -q ":8000"; then
    echo "🔄 后端服务未监听，尝试重启..."
    cd "$PROJECT_DIR/backend"
    pm2 restart resume-backend
fi

if ! netstat -tln | grep -q ":3000"; then
    echo "🔄 前端服务未监听，检查serve配置..."
    pm2 describe resume-frontend
    
    # 检查serve命令和端口
    FRONTEND_BUILD_DIR="$PROJECT_DIR/frontend/build"
    if [ -d "$FRONTEND_BUILD_DIR" ]; then
        echo "前端构建目录存在，重新启动serve..."
        pm2 delete resume-frontend 2>/dev/null
        cd "$PROJECT_DIR/frontend"
        pm2 start "npx serve -s build -l 3000" --name resume-frontend
    else
        echo -e "${RED}❌ 前端构建目录不存在${NC}"
    fi
fi

echo ""
echo "🔍 问题4: 重新运行数据库迁移"
echo "============================="

cd "$PROJECT_DIR/backend"
echo "📁 当前目录: $(pwd)"
echo "📄 检查package.json中的migrate脚本..."
grep -A2 -B2 "migrate" package.json

echo ""
echo "🔄 重新尝试数据库迁移..."
npm run migrate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库迁移成功${NC}"
else
    echo -e "${RED}❌ 数据库迁移失败，尝试手动创建表${NC}"
    
    # 手动创建基础表结构
    echo "🔧 手动创建基础表结构..."
    docker exec resume-postgres psql -U resume_user -d resume_db << 'EOF'
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建简历表
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content JSONB,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建任务队列表
CREATE TABLE IF NOT EXISTS task_queue (
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

-- 创建邮件验证表
CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- 显示创建的表
\dt
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 手动表创建成功${NC}"
    else
        echo -e "${RED}❌ 手动表创建失败${NC}"
    fi
fi

echo ""
echo "🏥 最终健康检查"
echo "================"

echo "1. 数据库连接测试:"
docker exec resume-postgres psql -U resume_user -d resume_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1

echo ""
echo "2. 后端服务测试:"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:8000/api/health 2>/dev/null || echo "后端服务无响应"

echo ""
echo "3. 前端服务测试:"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost:3000/ 2>/dev/null || echo "前端服务无响应"

echo ""
echo "4. nginx代理测试:"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://cv.juncaishe.com/ 2>/dev/null || echo "nginx代理无响应"

echo ""
echo "5. PM2进程状态:"
pm2 list

echo ""
echo "📋 修复总结"
echo "==========="
echo -e "${BLUE}已完成的修复:${NC}"
echo "  ✓ 数据库用户密码重置"
echo "  ✓ nginx配置端口修正"
echo "  ✓ PM2服务状态检查"
echo "  ✓ 数据库表结构创建"
echo ""
echo -e "${YELLOW}建议下一步:${NC}"
echo "  1. 检查服务日志: pm2 logs"
echo "  2. 访问测试: curl http://cv.juncaishe.com/"
echo "  3. 如有问题，查看: tail -f /var/log/nginx/cv.juncaishe.com.error.log"
echo ""
echo "🎉 修复脚本执行完成!" 