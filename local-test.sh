#!/bin/bash

# AI俊才社简历系统 - 本地测试脚本
# 用于在部署前验证所有服务是否正常运行

set -e

echo "🧪 AI俊才社简历系统 - 本地测试"
echo "================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查必要工具
check_tools() {
    echo "🔍 检查必要工具..."
    
    local tools=("node" "npm" "docker" "curl")
    for tool in "${tools[@]}"; do
        if command -v $tool &> /dev/null; then
            log_info "$tool 已安装: $(which $tool)"
        else
            log_error "$tool 未安装，请先安装"
            exit 1
        fi
    done
}

# 检查端口占用
check_ports() {
    echo "🔌 检查端口占用..."
    
    local ports=(3000 8000 5432)
    for port in "${ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1; then
            local process=$(lsof -i :$port | grep LISTEN | head -1)
            log_warn "端口 $port 被占用: $process"
            read -p "是否要停止占用端口 $port 的进程? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                local pid=$(lsof -t -i :$port)
                kill -9 $pid 2>/dev/null || true
                log_info "已停止端口 $port 的进程"
            else
                log_error "端口 $port 被占用，测试可能失败"
            fi
        else
            log_info "端口 $port 可用"
        fi
    done
}

# 启动数据库
start_database() {
    echo "🐘 启动PostgreSQL数据库..."
    
    # 检查是否已有数据库容器运行
    if docker ps | grep -q "resume-postgres-test"; then
        log_warn "测试数据库容器已运行，将重启"
        docker stop resume-postgres-test
        docker rm resume-postgres-test
    fi
    
    # 启动测试数据库
    docker run -d \
        --name resume-postgres-test \
        -e POSTGRES_DB=resume_db \
        -e POSTGRES_USER=resume_user \
        -e POSTGRES_PASSWORD=test123 \
        -p 5432:5432 \
        postgres:15-alpine
    
    # 等待数据库启动
    echo "⏳ 等待数据库启动..."
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if docker exec resume-postgres-test pg_isready -U resume_user >/dev/null 2>&1; then
            log_info "数据库启动成功"
            break
        fi
        sleep 2
        ((attempts++))
    done
    
    if [ $attempts -ge 30 ]; then
        log_error "数据库启动失败"
        exit 1
    fi
}

# 准备后端环境
setup_backend() {
    echo "⚙️  准备后端环境..."
    
    cd backend
    
    # 创建测试环境配置
    cat > .env << EOF
NODE_ENV=development
PORT=8000

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resume_db
DB_USER=resume_user
DB_PASS=test123

# JWT密钥
JWT_SECRET=test-jwt-secret-key-for-local-testing

# OpenAI API配置
OPENAI_API_KEY=sk-NKLLp5aHrdNddfM5MXFuoagJXutv8QrPtMdnXy8oFEdTrAUk
OPENAI_BASE_URL=https://api.agicto.cn/v1

# 腾讯云邮件服务配置
TENCENT_SECRET_ID=AKIDdCcsbFkBTYP5b7UgliWAdzA9xAHLRPCq
TENCENT_SECRET_KEY=cK8pLfv1ub7TccbS8f2EJCtQo1EI9pLv
TENCENT_SES_TEMPLATE_ID=31516
TENCENT_SES_FROM_EMAIL=admin@juncaishe.com
TENCENT_SES_FROM_NAME=AI俊才社
EOF
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo "📦 安装后端依赖..."
        npm install
    fi
    
    # 运行数据库迁移
    echo "🔄 运行数据库迁移..."
    npm run migrate || log_warn "迁移可能已存在"
    
    cd ..
    log_info "后端环境准备完成"
}

# 构建前端
build_frontend() {
    echo "🏗️  构建前端..."
    
    cd frontend
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo "📦 安装前端依赖..."
        npm install
    fi
    
    # 构建生产版本
    echo "📦 构建前端项目..."
    npm run build
    
    cd ..
    log_info "前端构建完成"
}

# 启动服务
start_services() {
    echo "🚀 启动服务..."
    
    # 启动后端服务（后台运行）
    echo "🔧 启动后端服务..."
    cd backend
    node server.js &
    BACKEND_PID=$!
    cd ..
    
    # 等待后端启动
    sleep 5
    
    # 启动前端服务（后台运行）
    echo "🌐 启动前端服务..."
    cd frontend
    npx serve -s build -l 3000 &
    FRONTEND_PID=$!
    cd ..
    
    # 等待前端启动
    sleep 5
    
    log_info "服务启动完成"
    echo "后端PID: $BACKEND_PID"
    echo "前端PID: $FRONTEND_PID"
}

# 运行健康检查
health_check() {
    echo "🏥 运行健康检查..."
    
    local all_ok=true
    
    # 检查后端API
    echo "🔍 检查后端API..."
    if curl -f -s http://localhost:8000/api/health >/dev/null; then
        log_info "后端API健康检查通过"
    else
        log_error "后端API健康检查失败"
        all_ok=false
    fi
    
    # 检查前端
    echo "🔍 检查前端服务..."
    if curl -f -s http://localhost:3000 >/dev/null; then
        log_info "前端服务健康检查通过"
    else
        log_error "前端服务健康检查失败"
        all_ok=false
    fi
    
    # 检查数据库连接
    echo "🔍 检查数据库连接..."
    if docker exec resume-postgres-test pg_isready -U resume_user >/dev/null 2>&1; then
        log_info "数据库连接正常"
    else
        log_error "数据库连接失败"
        all_ok=false
    fi
    
    if [ "$all_ok" = true ]; then
        echo ""
        echo "🎉 所有服务运行正常！"
        echo ""
        echo "📍 访问地址："
        echo "   - 前端：http://localhost:3000"
        echo "   - 后端API：http://localhost:8000"
        echo "   - API健康检查：http://localhost:8000/api/health"
        echo ""
        echo "🔧 测试命令："
        echo "   - 注册用户：curl -X POST http://localhost:8000/api/auth/register -H \"Content-Type: application/json\" -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'"
        echo "   - 用户登录：curl -X POST http://localhost:8000/api/auth/login -H \"Content-Type: application/json\" -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'"
        echo ""
        log_info "可以开始测试您的应用了！"
    else
        log_error "部分服务存在问题，请检查日志"
        return 1
    fi
}

# 清理函数
cleanup() {
    echo ""
    echo "🧹 清理测试环境..."
    
    # 停止服务进程
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        log_info "后端服务已停止"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        log_info "前端服务已停止"
    fi
    
    # 停止并删除数据库容器
    docker stop resume-postgres-test 2>/dev/null || true
    docker rm resume-postgres-test 2>/dev/null || true
    log_info "测试数据库已清理"
    
    # 清理环境文件
    rm -f backend/.env
    log_info "测试环境文件已清理"
    
    echo "✅ 清理完成"
}

# 设置清理陷阱
trap cleanup EXIT INT TERM

# 主测试流程
main() {
    echo "开始本地测试流程..."
    
    check_tools
    check_ports
    start_database
    setup_backend
    build_frontend
    start_services
    health_check
    
    echo ""
    echo "🎯 测试完成！按 Ctrl+C 停止服务并清理环境"
    
    # 保持服务运行，等待用户手动停止
    while true; do
        sleep 60
        echo "$(date): 服务运行中... (按 Ctrl+C 停止)"
    done
}

# 检查脚本参数
if [ "$1" = "--cleanup-only" ]; then
    cleanup
    exit 0
fi

# 执行主函数
main 