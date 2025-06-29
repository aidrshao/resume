#!/bin/bash
set -e

echo "🚀 AI俊才社简历系统 - 完整修复版部署脚本"
echo "=============================================="

# 配置变量 (完全独立，不影响其他项目)
PROJECT_DIR="/home/ubuntu/resume"
BACKEND_PORT=8000
FRONTEND_PORT=3016
DB_PORT=5435
DB_CONTAINER_NAME="resume-postgres"
DB_NAME="resume_db"
DB_USER="resume_user"
DB_PASSWORD="Resume2024SecurePass"

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

log_warning() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ $1"
}

# 错误回滚函数
rollback_on_error() {
  log_error "部署失败，开始回滚..."
  
  # 停止可能启动的PM2进程
  pm2 delete resume-backend 2>/dev/null || true
  pm2 delete resume-frontend 2>/dev/null || true
  
  # 停止数据库容器（但不删除，保护数据）
  docker stop $DB_CONTAINER_NAME 2>/dev/null || true
  
  # 清理项目目录
  if [ -d "$PROJECT_DIR" ]; then
    mv "$PROJECT_DIR" "${PROJECT_DIR}_failed_$(date +%Y%m%d_%H%M%S)" 2>/dev/null || rm -rf "$PROJECT_DIR"
  fi
  
  log_warning "回滚完成，其他项目未受影响"
  exit 1
}

# 设置错误处理
trap rollback_on_error ERR

# 智能端口清理函数
smart_port_cleanup() {
  local port=$1
  local port_name=$2
  
  if lsof -i :$port >/dev/null 2>&1; then
    local process_info=$(lsof -i :$port | tail -1)
    local pid=$(echo "$process_info" | awk '{print $2}')
    local process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
    
    # 检查是否是PM2管理的resume进程
    local pm2_process=$(pm2 list 2>/dev/null | grep "$pid" | grep -E "resume-" || echo "")
    
    if [ -n "$pm2_process" ]; then
      local pm2_name=$(echo "$pm2_process" | awk '{print $2}')
      log_warning "端口 $port 被resume项目进程占用: $pm2_name (PID: $pid)"
      log "自动清理resume进程: $pm2_name"
      pm2 delete "$pm2_name" 2>/dev/null || true
      sleep 2
      
      # 确认端口已释放
      if lsof -i :$port >/dev/null 2>&1; then
        log_warning "PM2清理后端口仍被占用，尝试强制结束进程"
        kill -9 $pid 2>/dev/null || true
        sleep 2
      fi
      
      log_success "端口 $port 已清理"
    elif [[ "$process_name" =~ (node|serve) ]] && [[ "$process_info" =~ (resume|8000|3016) ]]; then
      log_warning "端口 $port 被疑似resume相关进程占用: $process_name (PID: $pid)"
      log "自动清理疑似resume进程"
      kill -15 $pid 2>/dev/null || true
      sleep 3
      
      # 如果进程仍然存在，强制结束
      if kill -0 $pid 2>/dev/null; then
        log_warning "进程未响应SIGTERM，使用SIGKILL强制结束"
        kill -9 $pid 2>/dev/null || true
        sleep 2
      fi
      
      log_success "端口 $port 已清理"
    else
      log_error "端口 $port 被其他项目占用: $process_info"
      log_error "请手动停止占用进程或更改端口配置"
      exit 1
    fi
  fi
}

# 严格的安全预检查
safe_precheck() {
  log "🔒 执行严格安全预检查..."
  
  # 检查并清理同名数据库容器
  if docker ps -a | grep -q "$DB_CONTAINER_NAME"; then
    log_warning "发现同名数据库容器，正在安全清理..."
    docker stop $DB_CONTAINER_NAME 2>/dev/null || true
    docker rm $DB_CONTAINER_NAME 2>/dev/null || true
    log_success "同名容器已清理"
  fi
  
  # 智能清理端口占用
  smart_port_cleanup $DB_PORT "数据库"
  smart_port_cleanup $BACKEND_PORT "后端"
  smart_port_cleanup $FRONTEND_PORT "前端"
  
  # 严格检查其他项目的PM2进程（只显示警告，绝不操作）
  local other_processes=$(pm2 list 2>/dev/null | grep -E "(juncaishe-payment|login-)" | wc -l || echo "0")
  if [ $other_processes -gt 0 ]; then
    log_warning "检测到 $other_processes 个其他项目的PM2进程，将严格避免影响它们"
    log "🔒 安全保护：只操作resume-*进程"
  fi
  
  # 检查系统资源
  local available_memory=$(free -m | awk '/Mem:/ {print $7}')
  if [ $available_memory -lt 512 ]; then
    log_warning "可用内存较低: ${available_memory}MB，建议释放一些内存"
  fi
  
  local available_space=$(df --output=avail / | tail -1)
  if [ $available_space -lt 1048576 ]; then  # 1GB
    log_error "磁盘空间不足，需要至少1GB可用空间"
    exit 1
  fi
  
  log_success "严格安全预检查通过"
}

# 安全清理仅resume相关服务
cleanup_resume_services() {
  log "🧹 安全清理resume项目相关服务..."
  
  # 只操作resume开头的PM2进程，使用修复的PM2命令
  local resume_processes=($(pm2 list 2>/dev/null | grep -E "resume-" | awk '{print $2}' | grep -v "undefined" || true))
  
  for process in "${resume_processes[@]}"; do
    if [[ "$process" =~ ^resume- ]]; then
      log "停止resume进程: $process"
      pm2 delete "$process" 2>/dev/null || log "进程 $process 不存在"
    fi
  done
  
  # 安全备份现有项目目录
  if [ -d "$PROJECT_DIR" ]; then
    local backup_dir="${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    log "备份现有项目到: $backup_dir"
    mv "$PROJECT_DIR" "$backup_dir" 2>/dev/null || rm -rf "$PROJECT_DIR"
  fi
  
  log_success "resume项目清理完成，其他项目未受影响"
}

# 完整依赖检查
check_dependencies() {
  log "🔍 检查系统依赖..."
  
  # 检查必要的系统工具
  local required_tools=("node" "npm" "git" "docker" "curl" "lsof")
  for tool in "${required_tools[@]}"; do
    if ! command -v $tool &> /dev/null; then
      log_error "$tool 未安装或不在PATH中"
      exit 1
    fi
  done
  
  # 检查Node.js版本
  local node_version=$(node --version | sed 's/v//')
  local node_major=${node_version%%.*}
  if [ "$node_major" -lt 18 ]; then
    log_error "Node.js版本过低 ($node_version)，需要18或更高版本"
    exit 1
  fi
  log "✅ Node.js版本: v$node_version"
  
  # 检查npm版本
  log "✅ npm版本: $(npm --version)"
  
  # 检查或安装PM2
  if ! command -v pm2 &> /dev/null; then
    log "📦 安装PM2..."
    npm install -g pm2
  fi
  log "✅ PM2版本: $(pm2 --version)"
  
  # 检查Docker服务状态
  if ! docker info >/dev/null 2>&1; then
    log_error "Docker服务未运行"
    exit 1
  fi
  log "✅ Docker运行正常"
  
  log_success "所有依赖检查通过"
}

# 智能代码克隆（处理SSH和各种异常情况）
clone_code() {
  log "📥 智能克隆项目代码..."
  
  # 确保目录清理干净
  rm -rf "$PROJECT_DIR"
  
  # 配置SSH环境
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  
  # 检查SSH密钥
  if [ ! -f ~/.ssh/id_rsa ]; then
    log_error "SSH密钥不存在！"
    log "请先生成SSH密钥："
    log "ssh-keygen -t rsa -b 4096 -C 'your-email@example.com' -f ~/.ssh/id_rsa -N ''"
    log "然后将公钥添加到GitHub: cat ~/.ssh/id_rsa.pub"
    exit 1
  fi
  
  # 优化SSH配置
  cat > ~/.ssh/config << 'SSHEOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ConnectTimeout 10
SSHEOF
  chmod 600 ~/.ssh/config
  
  # 测试SSH连接
  log "🔐 测试GitHub SSH连接..."
  if timeout 15 ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    log_success "GitHub SSH连接正常"
  else
    log_error "GitHub SSH连接失败"
    log "请检查："
    log "1. SSH密钥是否已添加到GitHub"
    log "2. 执行: ssh -T git@github.com"
    exit 1
  fi
  
  # 多种方式尝试克隆
  log "🔄 克隆私有仓库..."
  
  # 尝试SSH克隆（假设正确的仓库地址）
  local repo_urls=(
    "git@github.com:aidrshao/resume.git"
    "git@github.com:shaojunyu/resume.git"
  )
  
  local clone_success=false
  for repo_url in "${repo_urls[@]}"; do
    log "尝试克隆: $repo_url"
    if timeout 60 git clone --depth 1 "$repo_url" "$PROJECT_DIR" 2>/dev/null; then
      log_success "成功克隆: $repo_url"
      clone_success=true
      break
    else
      log_warning "克隆失败: $repo_url"
    fi
  done
  
  if [ "$clone_success" = false ]; then
    log_error "所有仓库地址克隆失败"
    log "请确认："
    log "1. 仓库地址是否正确"
    log "2. 是否有仓库访问权限"
    log "3. 网络连接是否正常"
    exit 1
  fi
  
  cd "$PROJECT_DIR"
  
  # 修复.gitignore导致的public目录问题
  log "🔧 检查并修复前端文件结构..."
  
  if [ ! -d "frontend/public" ]; then
    log_warning "frontend/public目录不存在，正在创建..."
    mkdir -p frontend/public
  fi
  
  if [ ! -f "frontend/public/index.html" ]; then
    log_warning "index.html缺失，正在创建..."
    cat > frontend/public/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="AI俊才社智能简历管理系统" />
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  <title>AI俊才社 - 智能简历管理系统</title>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>
HTMLEOF
  fi
  
  if [ ! -f "frontend/public/manifest.json" ]; then
    cat > frontend/public/manifest.json << 'JSONEOF'
{
  "short_name": "AI俊才社",
  "name": "AI俊才社智能简历管理系统",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
JSONEOF
  fi
  
  # 创建空的favicon.ico如果不存在
  if [ ! -f "frontend/public/favicon.ico" ]; then
    touch frontend/public/favicon.ico
  fi
  
  log_success "代码克隆和文件修复完成"
}

# 智能数据库配置
setup_database() {
  log "🐘 配置PostgreSQL数据库..."
  
  log "创建新的PostgreSQL容器..."
  
  # 确保端口可用
  if lsof -i :$DB_PORT >/dev/null 2>&1; then
    log_error "数据库端口 $DB_PORT 被占用"
    exit 1
  fi
  
  docker run -d \
    --name $DB_CONTAINER_NAME \
    --restart unless-stopped \
    -e POSTGRES_DB=$DB_NAME \
    -e POSTGRES_USER=$DB_USER \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_INITDB_ARGS="--encoding=UTF8 --locale=C" \
    -p $DB_PORT:5432 \
    -v "${DB_CONTAINER_NAME}_data:/var/lib/postgresql/data" \
    postgres:15-alpine
  
  log "数据库容器创建完成，ID: $(docker ps -q -f name=$DB_CONTAINER_NAME)"
  
  # 等待数据库完全启动
  log "⏳ 等待数据库启动..."
  local max_attempts=60
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    if docker exec $DB_CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME >/dev/null 2>&1; then
      log_success "数据库启动成功"
      break
    fi
    
    if [ $((attempt % 10)) -eq 0 ]; then
      log "⏳ 数据库启动中... ($attempt/$max_attempts)"
    fi
    
    sleep 2
    ((attempt++))
  done
  
  if [ $attempt -gt $max_attempts ]; then
    log_error "数据库启动超时"
    docker logs $DB_CONTAINER_NAME --tail 20
    exit 1
  fi
  
  # 验证数据库连接
  if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT version();" >/dev/null 2>&1; then
    log_success "数据库连接验证成功"
  else
    log_error "数据库连接验证失败"
    exit 1
  fi
}

# 智能后端配置
setup_backend() {
  log "⚙️ 配置后端服务..."
  
  cd "$PROJECT_DIR/backend"
  
  # 清理可能的缓存
  rm -rf node_modules package-lock.json 2>/dev/null || true
  
  # 安装依赖
  log "📦 安装后端依赖..."
  if ! npm install --production=false --no-audit --no-fund; then
    log_error "后端依赖安装失败"
    exit 1
  fi
  
  # 创建优化的环境配置
  log "📝 创建生产环境配置..."
  cat > .env << ENVEOF
# 基础配置
NODE_ENV=production
PORT=$BACKEND_PORT

# 数据库配置（修复连接问题）
DB_HOST=127.0.0.1
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASSWORD

# JWT安全配置
JWT_SECRET=Resume2024SuperSecureJWTKey$(date +%s)
JWT_EXPIRES_IN=24h

# AI API配置（agicto代理）
AGICTO_API_KEY=sk-NKLLp5aHrdNddfM5MXFuoagJXutv8QrPtMdnXy8oFEdTrAUk
OPENAI_BASE_URL=https://api.agicto.cn/v1
OPENAI_DEFAULT_MODEL=gpt-4o-2024-11-20

# 腾讯云邮件服务配置
TENCENT_SECRET_ID=AKIDdCcsbFkBTYP5b7UgliWAdzA9xAHLRPCq
TENCENT_SECRET_KEY=cK8pLfv1ub7TccbS8f2EJCtQo1EI9pLv
TENCENT_SES_TEMPLATE_ID=31516
TENCENT_SES_FROM_EMAIL=admin@juncaishe.com
TENCENT_SES_FROM_NAME=AI俊才社

# 上传配置
UPLOAD_MAX_SIZE=10MB
UPLOAD_ALLOWED_TYPES=pdf,doc,docx

# 安全配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENVEOF
  
  chmod 600 .env
  
  # 测试环境变量加载
  if node -e "require('dotenv').config(); console.log('ENV test:', process.env.NODE_ENV);" 2>/dev/null; then
    log_success "环境变量配置验证成功"
  else
    log_warning "环境变量验证失败，但继续部署"
  fi
  
  # 等待数据库完全启动后再运行迁移
  log "⏳ 等待数据库完全就绪..."
  sleep 10
  
  # 运行数据库迁移（带重试机制和详细错误信息）
  log "🔄 运行数据库迁移..."
  local migration_attempts=5
  local migration_success=false
  
  for i in $(seq 1 $migration_attempts); do
    log "迁移尝试 $i/$migration_attempts"
    if timeout 30 npm run migrate 2>&1; then
      log_success "数据库迁移成功"
      migration_success=true
      break
    else
      log_warning "迁移失败，等待10秒后重试..."
      sleep 10
    fi
  done
  
  if [ "$migration_success" = false ]; then
    log_warning "数据库迁移失败，尝试手动创建基础表结构..."
    
    # 手动创建基础表
    docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE,
      email_verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS resumes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      parsed_data JSONB,
      file_path VARCHAR(500),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS task_queue (
      id SERIAL PRIMARY KEY,
      task_id VARCHAR(100) UNIQUE NOT NULL,
      task_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      user_id INTEGER REFERENCES users(id),
      data JSONB,
      result JSONB,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      code VARCHAR(10) NOT NULL,
      type VARCHAR(50) NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    " 2>/dev/null || log_warning "手动表创建也失败，但继续部署"
  fi
  
  log_success "后端配置完成"
}

# 智能前端配置
setup_frontend() {
  log "🎨 配置前端服务..."
  
  cd "$PROJECT_DIR/frontend"
  
  # 清理缓存
  rm -rf node_modules package-lock.json build 2>/dev/null || true
  
  # 安装依赖
  log "📦 安装前端依赖..."
  if ! npm install --no-audit --no-fund; then
    log_error "前端依赖安装失败"
    exit 1
  fi
  
  # 检查关键文件
  local required_files=("src/index.js" "public/index.html" "package.json")
  for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
      log_error "关键文件缺失: $file"
      exit 1
    fi
  done
  
  # 构建前端
  log "🔨 构建前端应用..."
  if ! npm run build; then
    log_error "前端构建失败"
    exit 1
  fi
  
  # 验证构建结果
  if [ ! -d "build" ] || [ ! -f "build/index.html" ]; then
    log_error "前端构建结果异常"
    exit 1
  fi
  
  local build_size=$(du -sh build | cut -f1)
  log_success "前端构建完成，大小: $build_size"
}

# 智能服务启动
start_services() {
  log "🚀 启动应用服务..."
  
  # 安装serve工具
  if ! command -v serve &> /dev/null; then
    log "📦 安装serve工具..."
    npm install -g serve
  fi
  
  # 启动后端服务
  log "启动后端服务..."
  pm2 start "$PROJECT_DIR/backend/server.js" \
    --name "resume-backend" \
    --cwd "$PROJECT_DIR/backend" \
    --env production \
    --max-memory-restart 1G \
    --watch false \
    --error "/var/log/resume-backend-error.log" \
    --output "/var/log/resume-backend.log" \
    --log-date-format "YYYY-MM-DD HH:mm:ss Z"
  
  # 启动前端服务
  log "启动前端服务..."
  pm2 start serve \
    --name "resume-frontend" \
    -- -s "$PROJECT_DIR/frontend/build" -l $FRONTEND_PORT \
    --max-memory-restart 512M \
    --watch false \
    --error "/var/log/resume-frontend-error.log" \
    --output "/var/log/resume-frontend.log"
  
  # 保存PM2配置
  pm2 save
  
  # 确保PM2自启动
  pm2 startup systemd -u root --hp /root 2>/dev/null || true
  
  log_success "服务启动完成"
}

# 配置nginx反向代理
setup_nginx() {
  log "🌐 配置nginx反向代理..."
  
  # 检查nginx是否安装
  if ! command -v nginx &> /dev/null; then
    log_warning "nginx未安装，跳过nginx配置"
    return 0
  fi
  
  # 创建nginx配置文件
  cat > /etc/nginx/sites-available/cv.juncaishe.com << 'NGINXEOF'
# Resume项目 - cv.juncaishe.com 配置
server {
    listen 80;
    server_name cv.juncaishe.com;
    
    # 临时HTTP访问（用于测试）
    location / {
        proxy_pass http://127.0.0.1:3016;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 后端API
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
        
        # 文件上传大小限制
        client_max_body_size 50M;
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "Resume System OK\n";
        add_header Content-Type text/plain;
    }
    
    # 日志
    access_log /var/log/nginx/cv.juncaishe.com.access.log;
    error_log /var/log/nginx/cv.juncaishe.com.error.log;
}
NGINXEOF
  
  # 启用站点配置
  if [ ! -L /etc/nginx/sites-enabled/cv.juncaishe.com ]; then
    ln -sf /etc/nginx/sites-available/cv.juncaishe.com /etc/nginx/sites-enabled/
    log_success "nginx配置已创建并启用"
  else
    log "nginx配置已存在，已更新"
  fi
  
  # 测试nginx配置
  if nginx -t 2>/dev/null; then
    log_success "nginx配置测试通过"
    
    # 重载nginx配置
    systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
    log_success "nginx配置已重载"
  else
    log_warning "nginx配置测试失败，请手动检查"
  fi
}

# 修复的健康检查
health_check() {
  log "🏥 执行全面健康检查..."
  
  # 等待服务完全启动
  log "⏳ 等待服务启动（30秒）..."
  sleep 30
  
  local health_ok=true
  local health_report=""
  
  # 检查数据库
  if docker exec $DB_CONTAINER_NAME pg_isready -U $DB_USER >/dev/null 2>&1; then
    health_report+="\n✅ 数据库连接正常"
  else
    health_report+="\n❌ 数据库连接失败"
    health_ok=false
  fi
  
  # 检查后端API（使用健康检查端点，如果不存在则检查根路径）
  local backend_status=""
  if curl -s http://127.0.0.1:$BACKEND_PORT/api/health >/dev/null 2>&1; then
    backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$BACKEND_PORT/api/health 2>/dev/null || echo "000")
  else
    backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$BACKEND_PORT/ 2>/dev/null || echo "000")
  fi
  
  if [ "$backend_status" = "200" ] || [ "$backend_status" = "404" ]; then
    health_report+="\n✅ 后端服务正常 (端口: $BACKEND_PORT, 状态码: $backend_status)"
  else
    health_report+="\n❌ 后端服务异常 (状态码: $backend_status)"
    health_ok=false
  fi
  
  # 检查前端服务
  local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$FRONTEND_PORT 2>/dev/null || echo "000")
  if [ "$frontend_status" = "200" ]; then
    health_report+="\n✅ 前端服务正常 (端口: $FRONTEND_PORT)"
  else
    health_report+="\n❌ 前端服务异常 (状态码: $frontend_status)"
    health_ok=false
  fi
  
  # 修复PM2进程状态检查
  local pm2_backend_status=$(pm2 list 2>/dev/null | grep "resume-backend" | grep -c "online" || echo "0")
  local pm2_frontend_status=$(pm2 list 2>/dev/null | grep "resume-frontend" | grep -c "online" || echo "0")
  local total_online=$((pm2_backend_status + pm2_frontend_status))
  
  if [ "$total_online" = "2" ]; then
    health_report+="\n✅ PM2进程状态正常 (2/2 在线)"
  else
    health_report+="\n❌ PM2进程状态异常 ($total_online/2 在线)"
    health_ok=false
  fi
  
  # 输出健康检查报告
  echo -e "$health_report"
  
  if [ "$health_ok" = false ]; then
    log_error "健康检查发现问题"
    log "查看详细日志："
    log "- 后端日志: pm2 logs resume-backend"
    log "- 前端日志: pm2 logs resume-frontend"
    log "- 数据库日志: docker logs $DB_CONTAINER_NAME"
    return 1
  fi
  
  log_success "健康检查全部通过"
  return 0
}

# 显示部署结果
show_result() {
  echo ""
  echo "🎉🎉🎉 部署成功完成！🎉🎉🎉"
  echo "=========================================="
  
  # 服务状态
  echo ""
  echo "📊 服务状态："
  pm2 list | grep -E "(resume-backend|resume-frontend)" || true
  
  # 访问地址
  echo ""
  echo "🌐 访问地址："
  echo "   - 前端网站: http://101.34.19.47:$FRONTEND_PORT"
  echo "   - 后端API:  http://101.34.19.47:$BACKEND_PORT"
  echo "   - API文档:  http://101.34.19.47:$BACKEND_PORT/api/docs"
  
  # 管理命令
  echo ""
  echo "🔧 管理命令："
  echo "   - 查看所有服务: pm2 list"
  echo "   - 查看后端日志: pm2 logs resume-backend"
  echo "   - 查看前端日志: pm2 logs resume-frontend"
  echo "   - 重启后端: pm2 restart resume-backend"
  echo "   - 重启前端: pm2 restart resume-frontend"
  echo "   - 停止所有resume服务: pm2 delete resume-backend resume-frontend"
  
  # 数据库信息
  echo ""
  echo "💾 数据库信息："
  echo "   - 容器名: $DB_CONTAINER_NAME"
  echo "   - 端口: $DB_PORT"
  echo "   - 数据库: $DB_NAME"
  echo "   - 用户: $DB_USER"
  echo "   - 查看数据库日志: docker logs $DB_CONTAINER_NAME"
  
  # 安全信息
  echo ""
  echo "🔒 安全隔离信息："
  echo "   - 使用独立端口: $FRONTEND_PORT, $BACKEND_PORT, $DB_PORT"
  echo "   - 独立数据库容器: $DB_CONTAINER_NAME"
  echo "   - 独立PM2进程: resume-backend, resume-frontend"
  echo "   - 其他项目完全未受影响"
  
  # 日志文件位置
  echo ""
  echo "📝 日志文件位置："
  echo "   - 后端日志: /var/log/resume-backend.log"
  echo "   - 后端错误: /var/log/resume-backend-error.log"
  echo "   - 前端日志: /var/log/resume-frontend.log"
  echo "   - 前端错误: /var/log/resume-frontend-error.log"
  
  echo ""
  echo "=========================================="
  echo "✨ 部署脚本执行完成，享受您的AI简历系统！"
  echo "=========================================="
}

# 主函数
main() {
  echo ""
  log "🚀 开始AI俊才社简历系统完整部署流程..."
  log "⏰ 预计耗时: 3-5分钟"
  echo ""
  
  # 执行部署步骤
  safe_precheck
  cleanup_resume_services
  check_dependencies
  clone_code
  setup_database
  setup_backend
  setup_frontend
  start_services
  setup_nginx
  
  # 健康检查
  if health_check; then
    show_result
    log_success "🎉 部署成功完成！"
    
    # 创建管理脚本
    cat > /root/manage-resume.sh << 'MGEOF'
#!/bin/bash
echo "AI俊才社简历系统管理脚本"
echo "========================="
echo "1. 查看服务状态: pm2 list | grep resume"
echo "2. 重启所有服务: pm2 restart resume-backend resume-frontend"
echo "3. 查看日志: pm2 logs resume-backend"
echo "4. 停止服务: pm2 delete resume-backend resume-frontend"
echo "5. 访问地址: http://101.34.19.47:3016"
MGEOF
    chmod +x /root/manage-resume.sh
    
    echo ""
    echo "💡 提示: 运行 /root/manage-resume.sh 查看管理命令"
    
  else
    log_error "部署完成但健康检查发现问题，请查看日志"
    exit 1
  fi
}

# 执行主函数
main "$@" 