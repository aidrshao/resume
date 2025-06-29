#!/bin/bash
set -e

echo "🚀 AI俊才社简历系统 - 修正版部署脚本"
echo "========================================="

# 配置变量 (避免与现有项目冲突)
PROJECT_DIR="/home/ubuntu/resume"
BACKEND_PORT=8000
FRONTEND_PORT=3016  # 修正：使用3016端口，避免与现有项目冲突
DB_PORT=5435  # 修正：使用5435端口，避免与现有项目冲突
DB_CONTAINER_NAME="resume-postgres"
DB_NAME="resume_db"
DB_USER="resume_user"
DB_PASSWORD="resume123456"

# 日志函数
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1"
}

log_success() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1"
}

# 安全检查：确保不碰触其他项目
safe_precheck() {
  log "🔍 安全预检查..."
  
  # 检查端口占用
  if lsof -i :$DB_PORT >/dev/null 2>&1; then
    log_error "端口 $DB_PORT 已被占用，请选择其他端口"
    exit 1
  fi
  
  if lsof -i :$BACKEND_PORT >/dev/null 2>&1; then
    log_error "端口 $BACKEND_PORT 已被占用，请选择其他端口"
    exit 1
  fi
  
  if lsof -i :$FRONTEND_PORT >/dev/null 2>&1; then
    log_error "端口 $FRONTEND_PORT 已被占用，请选择其他端口"
    exit 1
  fi
  
  # 检查Docker容器名冲突
  if docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER_NAME}$"; then
    log "发现同名数据库容器，将重用现有容器"
    USE_EXISTING_DB=true
  else
    USE_EXISTING_DB=false
  fi
  
  # 确保不会影响其他项目的PM2进程
  local conflicting_processes=$(pm2 list | grep -E "(juncaishe-payment|login-)" | wc -l)
  if [ $conflicting_processes -gt 0 ]; then
    log "🔒 检测到其他项目的PM2进程，将确保不影响它们"
  fi
  
  log_success "安全预检查通过"
}

# 清理仅resume项目相关的服务
cleanup_resume_services() {
  log "🧹 清理resume项目相关服务..."
  
  # 只停止resume相关的PM2进程
  pm2 delete resume-backend 2>/dev/null || log "resume-backend进程不存在"
  pm2 delete resume-frontend 2>/dev/null || log "resume-frontend进程不存在"
  
  # 备份resume项目目录
  if [ -d "$PROJECT_DIR" ]; then
    log "备份现有resume项目目录..."
    mv "$PROJECT_DIR" "${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)" 2>/dev/null || rm -rf "$PROJECT_DIR"
  fi
  
  log_success "resume项目清理完成"
}

# 检查依赖
check_dependencies() {
  log "🔍 检查系统依赖..."
  
  # 检查Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js未安装"
    exit 1
  fi
  log "✅ Node.js版本: $(node --version)"
  
  # 检查npm
  if ! command -v npm &> /dev/null; then
    log_error "npm未安装"
    exit 1
  fi
  log "✅ npm版本: $(npm --version)"
  
  # 检查PM2
  if ! command -v pm2 &> /dev/null; then
    log "📦 安装PM2..."
    npm install -g pm2
  fi
  log "✅ PM2版本: $(pm2 --version)"
  
  # 检查Docker
  if ! command -v docker &> /dev/null; then
    log_error "Docker未安装"
    exit 1
  fi
  log "✅ Docker已安装"
  
  # 检查Git
  if ! command -v git &> /dev/null; then
    log_error "Git未安装"
    exit 1
  fi
  log "✅ Git已安装"
}

# 克隆代码
clone_code() {
  log "📥 克隆项目代码..."
  
  # 确保目录不存在
  rm -rf "$PROJECT_DIR"
  
  # 配置SSH
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  
  # 检查SSH密钥是否存在
  if [ ! -f ~/.ssh/id_rsa ]; then
    log_error "SSH密钥不存在，请先生成SSH密钥并添加到GitHub"
    log "执行以下命令生成SSH密钥："
    log "ssh-keygen -t rsa -b 4096 -C 'your-email@example.com' -f ~/.ssh/id_rsa -N ''"
    log "然后将公钥内容添加到GitHub: cat ~/.ssh/id_rsa.pub"
    exit 1
  fi
  
  # 创建SSH配置
  cat > ~/.ssh/config << SSHEOF
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
SSHEOF
  chmod 600 ~/.ssh/config
  
  # 测试SSH连接
  log "🔐 测试GitHub SSH连接..."
  if ssh -T git@github.com -o ConnectTimeout=10 2>&1 | grep -q "successfully authenticated"; then
    log_success "GitHub SSH连接正常"
  else
    log_error "GitHub SSH连接失败，请检查："
    log "1. SSH密钥是否已添加到GitHub Settings > SSH and GPG keys"
    log "2. 网络是否能访问GitHub"
    log "3. 执行：ssh -T git@github.com 进行手动测试"
    exit 1
  fi
  
  # 使用SSH方式克隆私有仓库
  log "🔄 使用SSH克隆私有仓库..."
  if git clone --depth 1 git@github.com:aidrshao/resume.git "$PROJECT_DIR"; then
    log_success "私有仓库克隆成功"
  else
    log_error "SSH克隆失败，请确认："
    log "1. SSH密钥已正确添加到GitHub"
    log "2. 仓库地址正确：git@github.com:aidrshao/resume.git"
    log "3. 有仓库访问权限"
    exit 1
  fi
  
  cd "$PROJECT_DIR"
  log_success "代码克隆完成"
}

# 配置数据库
setup_database() {
  log "🐘 配置PostgreSQL数据库..."
  
  if [ "$USE_EXISTING_DB" = "true" ]; then
    log "重用现有数据库容器: $DB_CONTAINER_NAME"
    docker start $DB_CONTAINER_NAME || docker restart $DB_CONTAINER_NAME
  else
    log "创建新的数据库容器..."
    docker run -d \
      --name $DB_CONTAINER_NAME \
      --restart unless-stopped \
      -e POSTGRES_DB=$DB_NAME \
      -e POSTGRES_USER=$DB_USER \
      -e POSTGRES_PASSWORD=$DB_PASSWORD \
      -p $DB_PORT:5432 \
      postgres:15-alpine
  fi
  
  # 等待数据库启动
  log "⏳ 等待数据库启动..."
  sleep 10
  
  # 验证数据库连接
  local max_attempts=30
  local attempt=1
  while [ $attempt -le $max_attempts ]; do
    if docker exec $DB_CONTAINER_NAME pg_isready -U $DB_USER; then
      log_success "数据库启动成功"
      break
    fi
    log "⏳ 数据库启动中... ($attempt/$max_attempts)"
    sleep 2
    ((attempt++))
  done
  
  if [ $attempt -gt $max_attempts ]; then
    log_error "数据库启动失败"
    exit 1
  fi
}

# 配置后端
setup_backend() {
  log "⚙️ 配置后端服务..."
  
  cd "$PROJECT_DIR/backend"
  
  # 安装依赖
  log "📦 安装后端依赖..."
  npm install
  
  # 创建环境配置
  log "📝 创建环境配置..."
  cat > .env << EOF
NODE_ENV=production
PORT=$BACKEND_PORT

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASSWORD

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key-here-12345

# AI API配置（使用agicto代理）
AGICTO_API_KEY=sk-NKLLp5aHrdNddfM5MXFuoagJXutv8QrPtMdnXy8oFEdTrAUk
OPENAI_BASE_URL=https://api.agicto.cn/v1

# 腾讯云邮件服务配置
TENCENT_SECRET_ID=AKIDdCcsbFkBTYP5b7UgliWAdzA9xAHLRPCq
TENCENT_SECRET_KEY=cK8pLfv1ub7TccbS8f2EJCtQo1EI9pLv
TENCENT_SES_TEMPLATE_ID=31516
TENCENT_SES_FROM_EMAIL=admin@juncaishe.com
TENCENT_SES_FROM_NAME=AI俊才社
EOF
  
  # 运行数据库迁移
  log "🔄 运行数据库迁移..."
  npm run migrate || log "⚠️ 迁移可能已存在，继续..."
  
  log_success "后端配置完成"
}

# 配置前端
setup_frontend() {
  log "🎨 配置前端服务..."
  
  cd "$PROJECT_DIR/frontend"
  
  # 安装依赖
  log "📦 安装前端依赖..."
  npm install
  
  # 构建前端
  log "🔨 构建前端..."
  npm run build
  
  log_success "前端配置完成"
}

# 启动服务
start_services() {
  log "🚀 启动应用服务..."
  
  # 启动后端服务
  log "启动后端服务..."
  pm2 start "$PROJECT_DIR/backend/server.js" \
    --name "resume-backend" \
    --cwd "$PROJECT_DIR/backend" \
    --env production
  
  # 启动前端服务（使用serve）
  log "启动前端服务..."
  if ! command -v serve &> /dev/null; then
    npm install -g serve
  fi
  
  pm2 start serve \
    --name "resume-frontend" \
    -- -s "$PROJECT_DIR/frontend/build" -l $FRONTEND_PORT
  
  # 保存PM2配置
  pm2 save
  
  log_success "服务启动完成"
}

# 健康检查
health_check() {
  log "🏥 执行健康检查..."
  
  sleep 15  # 等待服务启动
  
  # 检查后端API
  if curl -f -m 10 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null; then
    log_success "后端API健康检查通过"
  else
    log_error "后端API健康检查失败"
    return 1
  fi
  
  # 检查前端
  if curl -f -m 10 "http://127.0.0.1:$FRONTEND_PORT" 2>/dev/null; then
    log_success "前端服务健康检查通过"
  else
    log_error "前端服务健康检查失败"
    return 1
  fi
  
  # 检查数据库
  if docker exec $DB_CONTAINER_NAME pg_isready -U $DB_USER 2>/dev/null; then
    log_success "数据库连接正常"
  else
    log_error "数据库连接失败"
    return 1
  fi
  
  return 0
}

# 显示结果
show_result() {
  log_success "🎉 部署完成！"
  echo ""
  echo "📊 服务状态："
  pm2 list | grep -E "(resume-backend|resume-frontend)"
  echo ""
  echo "🌐 访问地址："
  echo "   - 前端: http://101.34.19.47:$FRONTEND_PORT"
  echo "   - 后端API: http://101.34.19.47:$BACKEND_PORT"
  echo ""
  echo "🔧 管理命令："
  echo "   - 查看后端日志: pm2 logs resume-backend"
  echo "   - 查看前端日志: pm2 logs resume-frontend"
  echo "   - 重启后端: pm2 restart resume-backend"
  echo "   - 重启前端: pm2 restart resume-frontend"
  echo "   - 查看数据库: docker logs $DB_CONTAINER_NAME"
  echo ""
  echo "💾 数据库信息："
  echo "   - 容器名: $DB_CONTAINER_NAME"
  echo "   - 端口: $DB_PORT"
  echo "   - 数据库: $DB_NAME"
  echo "   - 用户: $DB_USER"
  echo ""
  echo "🔒 安全隔离："
  echo "   - 使用独立端口，不影响其他项目"
  echo "   - 独立数据库容器"
  echo "   - 独立PM2进程名"
}

# 主函数
main() {
  log "🚀 开始安全隔离的resume项目部署..."
  
  safe_precheck
  cleanup_resume_services
  check_dependencies
  clone_code
  setup_database
  setup_backend
  setup_frontend
  start_services
  
  if health_check; then
    show_result
    log_success "✅ 部署成功完成！"
  else
    log_error "❌ 健康检查失败"
    exit 1
  fi
}

# 执行主函数
main 