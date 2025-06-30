#!/bin/bash

echo "🚨 修复空的users表问题"
echo "======================"

# 1. 检查PM2日志，找出服务崩溃原因
echo "1️⃣ 检查后端服务日志（最近50行）..."
pm2 logs resume-backend --lines 50 --nostream

echo ""
echo "2️⃣ 检查数据库连接..."
echo "SELECT version();" | docker exec -i resume-postgres psql -U resume_user -d resume_db

echo ""
echo "3️⃣ 检查所有表的数据情况..."
echo "SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'resume_templates', COUNT(*) FROM resume_templates
UNION ALL  
SELECT 'resumes', COUNT(*) FROM resumes;" | docker exec -i resume-postgres psql -U resume_user -d resume_db

echo ""
echo "4️⃣ 重新运行数据库迁移和种子数据..."
cd /home/ubuntu/resume/backend

# 检查knex是否可用
if command -v npx knex >/dev/null 2>&1; then
    echo "运行数据库迁移..."
    npx knex migrate:latest
    
    echo "运行种子数据..."
    npx knex seed:run
else
    echo "⚠️ knex命令不可用，尝试直接运行..."
    npm run migrate 2>/dev/null || echo "migrate命令不存在"
    npm run seed 2>/dev/null || echo "seed命令不存在"
fi

echo ""
echo "5️⃣ 重启服务..."
pm2 restart resume-backend
sleep 3

echo ""
echo "6️⃣ 再次检查数据..."
echo "SELECT 'users' as table_name, COUNT(*) as count FROM users;" | docker exec -i resume-postgres psql -U resume_user -d resume_db

echo ""
echo "7️⃣ 检查服务状态..."
pm2 list | grep resume

echo ""
echo "✅ 修复完成！"
