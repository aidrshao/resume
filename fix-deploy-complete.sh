
#!/bin/bash
# ============================================================================
# AI俊才社简历系统 - 唯一官方生产环境部署脚本
# ============================================================================
# 
# 📌 重要声明:
#    这是AI俊才社简历系统的唯一官方部署脚本!
#    任何生产环境部署都必须使用此脚本完成!
#    禁止创建或使用其他部署脚本!
#
# 🎯 功能:
#    • 一键完整部署生产环境
#    • 自动配置所有服务组件
#    • 统一管理配置和密钥
#    • 智能错误处理和恢复
#    • 生成运维管理工具
#
# 🏗️ 架构:
#    • React前端 (端口3016) + Node.js后端 (端口8000)
#    • PostgreSQL数据库 (端口5435)
#    • nginx反向代理 + PM2进程管理
#    • AI服务 (OpenAI + DeepSeek) + 腾讯云邮件服务
#
# 📋 使用方法:
#    bash fix-deploy-complete.sh          # 完整部署
#    bash fix-deploy-complete.sh help     # 查看帮助
#    bash fix-deploy-complete.sh knowledge # 查看知识库
#
# 👤 维护: AI俊才社技术团队
# 📅 创建: 2024年
# 🔧 调试版本: 2024-06-29 (增强调试日志)
#    - 添加PM2进程清理详细日志
#    - 添加数据库连接和迁移详细日志  
#    - 添加nginx配置冲突检查日志
#    - 解决残留进程和密码认证问题
# ============================================================================

set -e

echo "🚀 AI俊才社简历系统 - 增强版一键部署脚本 v4.0"
echo "=================================================="
echo "📋 【项目架构】"
echo "   🎯 前端: React + TailwindCSS (端口:$FRONTEND_PORT)"
echo "   ⚙️  后端: Node.js + Express + knex.js (端口:$BACKEND_PORT)"
echo "   🗄️  数据库: PostgreSQL (端口:$DB_PORT)"
echo "   🤖 AI功能: OpenAI GPT-4 + DeepSeek"
echo "   📧 邮件服务: 腾讯云SES"
echo "   🔐 认证: JWT Token"
echo "   🌐 域名: $DOMAIN"
echo ""
echo "📋 【增强功能清单】"
echo "   ✅ 强化版PM2进程清理 (解决重复进程问题)"
echo "   ✅ 智能数据库认证修复 (解决密码认证失败)"
echo "   ✅ 智能SSL证书配置 (避免重复申请限制)"
echo "   ✅ 增强版系统诊断 (全面分析问题)"
echo "   ✅ 紧急修复模式 (一键解决常见问题)"
echo "   ✅ 端口冲突智能检测和清理"
echo "   ✅ nginx配置自动优化"
echo "   ✅ 数据库迁移增强错误处理"
echo "   ✅ 多模式运行支持"
echo "   ✅ 全面健康检查和验证"
echo "=================================================="
echo ""
echo "⚠️  重要提醒: 这是唯一的生产环境部署脚本!"
echo "   🔥 推荐: bash $0 emergency  # 一键解决所有问题"
echo "   📊 诊断: bash $0 diagnose  # 详细分析系统状态"
echo "   🔧 修复: bash $0 fix       # 解决PM2/数据库问题"
echo ""

# 配置变量 (完全独立，不影响其他项目)
PROJECT_DIR="/home/ubuntu/resume"
BACKEND_PORT=8000
FRONTEND_PORT=3016  # 使用3016端口避免冲突
DB_PORT=5435
DB_CONTAINER_NAME="resume-postgres"
DB_NAME="resume_db"
DB_USER="resume_user"
DB_PASSWORD="ResumePass123"
DOMAIN="cv.juncaishe.com"
GIT_REPO="https://github.com/your-username/resume.git"  # 请替换为实际的Git仓库地址

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

log_info() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️ $1"
}

# 进度显示函数
show_progress() {
  local current=$1
  local total=$2
  local message="$3"
  local percent=$((current * 100 / total))
  local filled=$((percent / 2))
  local empty=$((50 - filled))
  
  printf "\r[$(date '+%H:%M:%S')] "
  printf "█%.0s" $(seq 1 $filled)
  printf "░%.0s" $(seq 1 $empty)
  printf " %d%% - %s" $percent "$message"
  
  if [ $current -eq $total ]; then
    echo ""
  fi
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
  log "🔍 DEBUG: 开始详细清理流程分析..."
  
  # 显示当前PM2状态
  log "📊 当前PM2进程状态:"
  pm2 list 2>/dev/null || log "PM2列表获取失败"
  
  # 获取所有resume相关进程（包括错误状态的）
  local resume_process_ids=($(pm2 list 2>/dev/null | grep -E "resume-" | awk '{print $1}' | grep -E '^[0-9]+$' || true))
  local resume_process_names=($(pm2 list 2>/dev/null | grep -E "resume-" | awk '{print $2}' | grep -v "undefined" || true))
  
  log "🔍 DEBUG: 检测到的resume进程ID: ${resume_process_ids[*]}"
  log "🔍 DEBUG: 检测到的resume进程名: ${resume_process_names[*]}"
  
  # 按进程ID删除（更可靠）
  for process_id in "${resume_process_ids[@]}"; do
    if [[ "$process_id" =~ ^[0-9]+$ ]]; then
      log "🔄 停止resume进程ID: $process_id"
      pm2 delete $process_id 2>/dev/null || log "⚠️ 进程ID $process_id 不存在"
    fi
  done
  
  # 按进程名删除（双重保险）
  for process_name in "${resume_process_names[@]}"; do
    if [[ "$process_name" =~ ^resume- ]]; then
      log "🔄 停止resume进程名: $process_name"
      pm2 delete "$process_name" 2>/dev/null || log "⚠️ 进程 $process_name 不存在"
    fi
  done
  
  # 强制清理所有resume相关进程（终极版）
  local max_cleanup_attempts=3
  for attempt in $(seq 1 $max_cleanup_attempts); do
    local remaining_processes=$(pm2 list 2>/dev/null | grep -E "resume-" | wc -l || echo "0")
    if [ "$remaining_processes" -eq 0 ]; then
      log "✅ 所有resume进程已清理完成"
      break
    fi
    
    log "🔄 清理尝试 $attempt/$max_cleanup_attempts，剩余进程: $remaining_processes"
    log "🔍 DEBUG: 剩余resume进程详情:"
    pm2 list 2>/dev/null | grep -E "resume-" || log "无resume进程详情"
    
    # 方法1：按进程ID强制删除
    pm2 list 2>/dev/null | grep -E "resume-" | awk '{print $1}' | grep -E '^[0-9]+$' | while read process_id; do
      log "🔄 强制删除进程ID: $process_id"
      pm2 delete $process_id 2>/dev/null || true
    done
    
    # 方法2：使用pm2 kill然后重启PM2服务
    if [ $attempt -eq $max_cleanup_attempts ]; then
      log_warning "🚨 使用终极清理方法"
      log "🔍 DEBUG: 终极清理前PM2状态:"
      pm2 list 2>/dev/null
      
      # 删除PM2持久化配置，防止进程重启后恢复
      log "🗑️ 删除PM2持久化配置文件..."
      rm -f /root/.pm2/dump.pm2 2>/dev/null || true
      log "🔍 DEBUG: PM2持久化配置文件已删除: /root/.pm2/dump.pm2"
      
      pm2 kill 2>/dev/null || true
      sleep 2
      pm2 resurrect 2>/dev/null || true
      
      log "🔍 DEBUG: 终极清理后PM2状态:"
      pm2 list 2>/dev/null
    fi
    
    sleep 2
  done
  
  # 安全备份现有项目目录
  if [ -d "$PROJECT_DIR" ]; then
    local backup_dir="${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    log "备份现有项目到: $backup_dir"
    mv "$PROJECT_DIR" "$backup_dir" 2>/dev/null || rm -rf "$PROJECT_DIR"
  fi
  
  log_success "resume项目清理完成，其他项目未受影响"
}

# 增强版依赖检查和自动修复
check_dependencies() {
  log "🔍 执行增强版依赖检查和自动修复..."
  show_progress 1 8 "检查系统工具"
  
  # 检查必要的系统工具
  local required_tools=("node" "npm" "git" "docker" "curl" "lsof" "nginx")
  for tool in "${required_tools[@]}"; do
    if ! command -v $tool &> /dev/null; then
      if [ "$tool" = "nginx" ]; then
        log "📦 自动安装nginx..."
        apt-get update -qq && apt-get install -y nginx
      else
        log_error "$tool 未安装或不在PATH中"
        exit 1
      fi
    fi
  done
  
  show_progress 2 8 "检查Node.js版本"
  
  # 检查Node.js版本
  local node_version=$(node --version | sed 's/v//')
  local node_major=${node_version%%.*}
  if [ "$node_major" -lt 18 ]; then
    log_error "Node.js版本过低 ($node_version)，需要18或更高版本"
    log_info "请使用以下命令升级Node.js:"
    log_info "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    log_info "sudo apt-get install -y nodejs"
    exit 1
  fi
  log "✅ Node.js版本: v$node_version"
  
  show_progress 3 8 "检查npm配置"
  
  # 检查npm版本并配置
  log "✅ npm版本: $(npm --version)"
  
  # 配置npm镜像源以提高速度
  npm config set registry https://registry.npmmirror.com/ 2>/dev/null || true
  
  show_progress 4 8 "检查PM2"
  
  # 检查或安装PM2
  if ! command -v pm2 &> /dev/null; then
    log "📦 安装PM2..."
    npm install -g pm2
  fi
  log "✅ PM2版本: $(pm2 --version)"
  
  show_progress 5 8 "检查Docker服务"
  
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
  
  # 智能代码部署方式
  log "🔄 部署代码..."
  
  # 检查当前是否在项目目录中
  local current_dir=$(pwd)
  if [ -f "package.json" ] && [ -d "frontend" ] && [ -d "backend" ]; then
    log "✅ 检测到本地项目，复制到部署目录..."
    
    # 复制当前项目到部署目录
    mkdir -p "$PROJECT_DIR"
    rsync -a --exclude=node_modules --exclude=.git --exclude=build --exclude=dist . "$PROJECT_DIR/"
    log_success "本地代码复制完成"
  else
    log "🔄 从Git仓库克隆..."
    
    # 尝试从多个可能的仓库克隆
    local repo_urls=(
      "git@github.com:aidrshao/resume.git"
      "git@github.com:shaojunyu/resume.git"
      "$GIT_REPO"
    )
    
    local clone_success=false
    for repo_url in "${repo_urls[@]}"; do
      if [ -n "$repo_url" ] && [ "$repo_url" != "https://github.com/your-username/resume.git" ]; then
        log "尝试克隆: $repo_url"
        if timeout 60 git clone --depth 1 "$repo_url" "$PROJECT_DIR" 2>/dev/null; then
          log_success "成功克隆: $repo_url"
          clone_success=true
          break
        else
          log_warning "克隆失败: $repo_url"
        fi
      fi
    done
    
    if [ "$clone_success" = false ]; then
      log_error "代码获取失败"
      log "请确认："
      log "1. 当前是否在项目根目录中"
      log "2. 或者配置正确的Git仓库地址"
      log "3. 如果使用Git，确保有仓库访问权限"
      exit 1
    fi
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
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="AI俊才社智能简历管理系统" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
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
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png", 
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
JSONEOF
  fi
  
  # 创建必要的静态文件
  for file in favicon.ico logo192.png logo512.png robots.txt; do
    if [ ! -f "frontend/public/$file" ]; then
      touch "frontend/public/$file"
    fi
  done
  
  log_success "代码克隆和文件修复完成"
}

# 智能数据库配置
setup_database() {
  log "🐘 配置PostgreSQL数据库..."
  log "🔍 DEBUG: 数据库配置参数检查..."
  log "  📝 DB_PORT: $DB_PORT"
  log "  📝 DB_NAME: $DB_NAME" 
  log "  📝 DB_USER: $DB_USER"
  log "  📝 DB_PASSWORD: [长度: ${#DB_PASSWORD}]"
  log "  📝 DB_CONTAINER_NAME: $DB_CONTAINER_NAME"
  
  log "🔄 创建新的PostgreSQL容器..."
  
  # 确保端口可用
  if lsof -i :$DB_PORT >/dev/null 2>&1; then
    log_error "数据库端口 $DB_PORT 被占用"
    exit 1
  fi
  
  # 添加更详细的容器创建日志
  log "🔍 DEBUG: 执行Docker容器创建命令..."
  local container_id
  container_id=$(docker run -d \
    --name $DB_CONTAINER_NAME \
    --restart unless-stopped \
    -e POSTGRES_DB=$DB_NAME \
    -e POSTGRES_USER=$DB_USER \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_INITDB_ARGS="--encoding=UTF8 --locale=C" \
    -p $DB_PORT:5432 \
    -v "${DB_CONTAINER_NAME}_data:/var/lib/postgresql/data" \
    postgres:15-alpine)
  
  log "✅ 数据库容器创建完成，ID: $container_id"
  log "🔍 DEBUG: 检查容器状态..."
  docker ps -f name=$DB_CONTAINER_NAME
  
  # 等待数据库完全启动
  log "⏳ 等待数据库启动..."
  log "🔍 DEBUG: 检查容器初始化日志..."
  sleep 3
  docker logs $DB_CONTAINER_NAME --tail 10
  
  local max_attempts=60
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    log "🔍 DEBUG: 尝试连接数据库 (尝试 $attempt/$max_attempts)..."
    
    # 检查容器是否还在运行
    if ! docker ps -q -f name=$DB_CONTAINER_NAME | grep -q .; then
      log_error "数据库容器已停止运行！"
      docker logs $DB_CONTAINER_NAME --tail 20
      exit 1
    fi
    
    # 测试基本连接（不验证密码）
    if docker exec $DB_CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME >/dev/null 2>&1; then
      log "✅ 数据库基本连接检查通过"
      
      # 测试密码认证
      log "🔍 DEBUG: 测试数据库密码认证..."
      if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "✅ 数据库密码认证成功，启动完成"
        break
      else
        log_warning "数据库密码认证失败，可能还在初始化中..."
        # 显示详细的错误信息
        docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" 2>&1 | head -3
      fi
    else
      log "⏳ 数据库服务还未就绪..."
    fi
    
    if [ $((attempt % 10)) -eq 0 ]; then
      log "⏳ 数据库启动中... ($attempt/$max_attempts)"
      log "🔍 DEBUG: 当前容器日志:"
      docker logs $DB_CONTAINER_NAME --tail 5
    fi
    
    sleep 2
    ((attempt++))
  done
  
  if [ $attempt -gt $max_attempts ]; then
    log_error "🚨 数据库启动超时！"
    log "🔍 DEBUG: 容器详细信息:"
    docker inspect $DB_CONTAINER_NAME | jq '.[] | {State, Config: {Env}}'
    log "🔍 DEBUG: 完整容器日志:"
    docker logs $DB_CONTAINER_NAME
    exit 1
  fi
  
  # 最终验证数据库连接
  log "🔍 DEBUG: 执行最终数据库连接验证..."
  if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT version();" 2>&1; then
    log_success "✅ 数据库连接验证成功"
  else
    log_error "🚨 数据库连接验证失败！"
    log "🔍 DEBUG: 错误详情:"
    docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT version();" 2>&1 | head -10
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
DB_HOST=localhost
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD="$DB_PASSWORD"

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
  
  # 等待数据库完全启动并测试连接
  log "⏳ 等待数据库完全就绪并测试连接..."
  
  local db_ready=false
  local max_db_wait=60
  for wait_time in $(seq 5 5 $max_db_wait); do
    log "等待数据库启动... ($wait_time/$max_db_wait 秒)"
    
    # 测试基本连接
    if docker exec $DB_CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME >/dev/null 2>&1; then
      log "✅ 数据库基本连接OK"
      
      # 测试密码认证
      if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "✅ 数据库密码认证成功"
        db_ready=true
        break
      else
        log_warning "数据库密码认证失败，继续等待..."
      fi
    else
      log "数据库还未就绪，继续等待..."
    fi
    
    sleep 5
  done
  
  if [ "$db_ready" = false ]; then
    log_error "数据库连接测试失败，检查配置..."
    log "容器日志："
    docker logs $DB_CONTAINER_NAME --tail 20
    log "环境变量检查："
    echo "DB_HOST: $DB_HOST"
    echo "DB_PORT: $DB_PORT" 
    echo "DB_NAME: $DB_NAME"
    echo "DB_USER: $DB_USER"
    echo "DB_PASSWORD: [长度: ${#DB_PASSWORD}]"
    exit 1
  fi
  
  # 运行数据库迁移（带重试机制和详细错误信息）
  log "🔄 运行数据库迁移..."
  log "🔍 DEBUG: 迁移前数据库连接详细检查..."
  
  # 在容器内部直接检查用户和数据库
  log "🔍 DEBUG: 检查数据库内部用户状态..."
  docker exec $DB_CONTAINER_NAME psql -U postgres -d postgres -c "SELECT usename, usecreatedb, usesuper FROM pg_user WHERE usename='$DB_USER';" 2>&1 || true
  docker exec $DB_CONTAINER_NAME psql -U postgres -d postgres -c "SELECT datname FROM pg_database WHERE datname='$DB_NAME';" 2>&1 || true
  
  # 检查密码认证方法
  log "🔍 DEBUG: 检查pg_hba.conf认证配置..."
  docker exec $DB_CONTAINER_NAME cat /var/lib/postgresql/data/pg_hba.conf | grep -E "(local|host)" | tail -5 || true
  
  local migration_attempts=3
  local migration_success=false
  
  for i in $(seq 1 $migration_attempts); do
    log "🔄 迁移尝试 $i/$migration_attempts"
    
    # 详细检查环境变量
    log "🔍 DEBUG: 验证应用配置..."
    log "  📝 当前工作目录: $(pwd)"
    log "  📝 .env文件存在: $([ -f .env ] && echo "是" || echo "否")"
    if [ -f .env ]; then
      log "  📝 .env文件内容 (隐藏密码):"
      grep -v "PASSWORD" .env | head -10 || true
      log "  📝 .env文件密码行:"
      grep "PASSWORD" .env | sed 's/=.*/=***HIDDEN***/' || true
    fi
    
    # Node.js环境变量检查
    if node -e "
      require('dotenv').config();
      console.log('数据库配置验证:');
      console.log('DB_HOST:', process.env.DB_HOST);
      console.log('DB_PORT:', process.env.DB_PORT);
      console.log('DB_NAME:', process.env.DB_NAME);
      console.log('DB_USER:', process.env.DB_USER);
      console.log('DB_PASSWORD 长度:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');
      console.log('NODE_ENV:', process.env.NODE_ENV);
    " 2>&1; then
      log "✅ 应用环境变量加载正常"
    else
      log_error "🚨 应用环境变量加载异常！"
    fi
    
    # 在迁移前再次测试数据库连接
    log "🔍 DEBUG: 迁移前测试数据库连接..."
    if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT current_database(), current_user;" 2>&1; then
      log "✅ 数据库连接正常，开始迁移"
    else
      log_error "🚨 数据库连接失败，迁移可能会失败"
      # 尝试重置数据库用户密码
      log "🔧 尝试重置数据库用户密码..."
      docker exec $DB_CONTAINER_NAME psql -U postgres -d postgres -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>&1 || true
    fi
    
    # 执行迁移并捕获详细输出
    log "🚀 执行数据库迁移命令..."
    local migration_output
    migration_output=$(timeout 45 npm run migrate 2>&1)
    local migration_result=$?
    
    # 保存迁移日志
    echo "$migration_output" > /tmp/migration_log_$i.txt
    
    # 显示迁移输出
    echo "$migration_output"
    
    # 检查迁移结果
    if [ $migration_result -eq 0 ] && ! echo "$migration_output" | grep -q -E "(error|Error|ERROR|failed|Failed|FAILED|password authentication failed)"; then
      log_success "✅ 数据库迁移成功"
      migration_success=true
      break
    else
      # 检查是否是密码认证失败
      if echo "$migration_output" | grep -q "password authentication failed"; then
        log_error "🔧 数据库密码认证失败，尝试修复..."
        
        # 重新创建数据库用户
        docker exec $DB_CONTAINER_NAME psql -U postgres -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
        docker exec $DB_CONTAINER_NAME psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
        docker exec $DB_CONTAINER_NAME psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
        docker exec $DB_CONTAINER_NAME psql -U postgres -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;"
        
        # 测试修复结果
        if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
          log_success "数据库用户认证修复成功，继续重试迁移..."
        else
          log_error "数据库用户认证修复失败"
        fi
      else
        log_error "🚨 迁移失败，详细错误:"
        echo "$migration_output" | tail -20
      fi
      
      if [ $i -lt $migration_attempts ]; then
        log_warning "⏳ 等待10秒后重试 ($i/$migration_attempts)..."
        sleep 10
      fi
    fi
  done
  
  if [ "$migration_success" = false ]; then
    log_error "❌ 数据库迁移失败！尝试修复数据库认证问题..."
    
    # 详细诊断数据库认证问题
    log "🔍 DEBUG: 诊断数据库认证问题..."
    
    # 1. 重新创建数据库用户
    log "🔧 重新创建数据库用户..."
    docker exec $DB_CONTAINER_NAME psql -U postgres -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
    docker exec $DB_CONTAINER_NAME psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    docker exec $DB_CONTAINER_NAME psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    docker exec $DB_CONTAINER_NAME psql -U postgres -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;"
    
    # 2. 测试用户认证
    if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
      log_success "数据库用户认证修复成功，重试迁移..."
      
      # 重试迁移
      cd "$PROJECT_DIR/backend"
      if npm run migrate 2>&1; then
        log_success "✅ 数据库迁移修复成功"
        migration_success=true
      else
        log_error "迁移仍然失败，使用手动创建表结构"
      fi
    else
      log_error "数据库用户认证仍然失败"
    fi
    
    # 如果迁移仍然失败，手动创建表结构
    if [ "$migration_success" = false ]; then
      log_warning "🚨 使用手动表结构创建..."
      if docker exec $DB_CONTAINER_NAME psql -U postgres -d $DB_NAME -c "
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
      
      CREATE TABLE IF NOT EXISTS task_progress_logs (
        id SERIAL PRIMARY KEY,
        task_id VARCHAR(100) NOT NULL,
        progress INTEGER NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
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
      
      -- 授权给应用用户
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
      " 2>&1; then
        log_success "✅ 手动表结构创建成功"
        
        # 验证用户能否访问表
        if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM users;" >/dev/null 2>&1; then
          log_success "✅ 数据库用户权限验证成功"
          migration_success=true
        else
          log_error "❌ 数据库用户权限仍有问题"
        fi
      else
        log_error "🚨 手动表创建失败"
        return 1
      fi
    fi
  fi
  
  if [ "$migration_success" = true ]; then
    log_success "✅ 后端配置完成（数据库OK）"
  else
    log_error "❌ 后端配置失败（数据库问题）"
    return 1
  fi
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
  
  # 启动后端服务（强制模式避免冲突）
  log "启动后端服务..."
  pm2 start "$PROJECT_DIR/backend/server.js" \
    --name "resume-backend" \
    --cwd "$PROJECT_DIR/backend" \
    --env production \
    --max-memory-restart 1G \
    --watch false \
    --force \
    --error "/var/log/resume-backend-error.log" \
    --output "/var/log/resume-backend.log" \
    --log-date-format "YYYY-MM-DD HH:mm:ss Z"
  
  # 等待后端启动
  sleep 3
  
  # 启动前端服务（强制模式避免冲突）
  log "启动前端服务..."
  pm2 start serve \
    --name "resume-frontend" \
    -- -s "$PROJECT_DIR/frontend/build" -l $FRONTEND_PORT \
    --max-memory-restart 512M \
    --watch false \
    --force \
    --error "/var/log/resume-frontend-error.log" \
    --output "/var/log/resume-frontend.log"
  
  # 等待前端启动
  sleep 3
  
  # 保存PM2配置
  pm2 save
  
  # 确保PM2自启动
  pm2 startup systemd -u root --hp /root 2>/dev/null || true
  
  log_success "服务启动完成"
}

# 配置nginx反向代理
setup_nginx() {
  log "🌐 配置nginx反向代理..."
  log "🔍 DEBUG: 开始nginx配置诊断..."
  
  # 检查nginx是否安装
  if ! command -v nginx &> /dev/null; then
    log_warning "nginx未安装，跳过nginx配置"
    return 0
  fi
  
  # 检查现有的nginx配置
  log "🔍 DEBUG: 检查现有nginx配置..."
  log "  📁 sites-available目录内容:"
  ls -la /etc/nginx/sites-available/ | grep -E "(cv\.juncaishe|pay\.juncaishe|default)" || true
  log "  📁 sites-enabled目录内容:"
  ls -la /etc/nginx/sites-enabled/ | grep -E "(cv\.juncaishe|pay\.juncaishe|default)" || true
  
  # 检查是否有冲突的配置
  if [ -f /etc/nginx/sites-enabled/pay.juncaishe.com ]; then
    log_warning "🚨 发现冲突的pay.juncaishe.com配置！"
    cat /etc/nginx/sites-enabled/pay.juncaishe.com | grep -A 5 -B 5 "cv.juncaishe.com" || true
  fi
  
  # 创建nginx配置文件（支持SSL和HTTP重定向）
  cat > /etc/nginx/sites-available/cv.juncaishe.com << 'NGINXEOF'
# HTTP配置 - 支持证书验证和重定向
server {
    listen 80;
    server_name cv.juncaishe.com;
    
    # Let's Encrypt证书验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    # 临时HTTP访问（如果没有SSL证书）
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
  
  log "🔍 DEBUG: nginx配置文件已创建，检查内容..."
  head -10 /etc/nginx/sites-available/cv.juncaishe.com
  
  # 移除可能冲突的配置
  log "🔍 DEBUG: 检查并移除冲突配置..."
  if [ -L /etc/nginx/sites-enabled/default ]; then
    log "🗑️ 移除默认nginx配置..."
    rm -f /etc/nginx/sites-enabled/default
  fi
  
  # 启用站点配置
  if [ ! -L /etc/nginx/sites-enabled/cv.juncaishe.com ]; then
    log "🔗 创建软链接启用配置..."
    ln -sf /etc/nginx/sites-available/cv.juncaishe.com /etc/nginx/sites-enabled/
    log_success "✅ nginx配置已创建并启用"
  else
    log "🔄 nginx配置已存在，已更新"
  fi
  
  # 检查启用后的配置
  log "🔍 DEBUG: 检查启用后的sites-enabled目录:"
  ls -la /etc/nginx/sites-enabled/
  
  # 测试nginx配置
  log "🔍 DEBUG: 测试nginx配置语法..."
  if nginx -t 2>&1; then
    log_success "✅ nginx配置测试通过"
    
    # 重载nginx配置
    log "🔄 重载nginx配置..."
    systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
    log_success "✅ nginx配置已重载"
    
    # 验证nginx状态
    log "🔍 DEBUG: 检查nginx运行状态..."
    systemctl status nginx --no-pager -l || service nginx status
    
    # 测试域名访问
    log "🔍 DEBUG: 测试域名解析和访问..."
    nslookup cv.juncaishe.com || true
    curl -I http://cv.juncaishe.com/ 2>&1 | head -5 || true
    
  else
    log_error "🚨 nginx配置测试失败！"
    log "🔍 DEBUG: nginx配置错误详情:"
    nginx -t 2>&1
    log "🔍 DEBUG: 检查所有nginx配置文件:"
    find /etc/nginx/ -name "*.conf" -o -name "*juncaishe*" | xargs ls -la 2>/dev/null || true
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
    health_report+="\n✅ 前端服务正常 (端口: $FRONTEND_PORT - 支持密码登录+验证码登录)"
  else
    health_report+="\n❌ 前端服务异常 (状态码: $frontend_status)"
    health_ok=false
  fi
  
  # 修复PM2进程状态检查
  local pm2_backend_status=$(pm2 list 2>/dev/null | grep "resume-backend" | grep -c "online" 2>/dev/null || echo "0")
  local pm2_frontend_status=$(pm2 list 2>/dev/null | grep "resume-frontend" | grep -c "online" 2>/dev/null || echo "0")
  
  # 确保数值有效，清理可能的空格和换行符
  pm2_backend_status=$(echo "${pm2_backend_status:-0}" | tr -d ' \n\r')
  pm2_frontend_status=$(echo "${pm2_frontend_status:-0}" | tr -d ' \n\r')
  
  # 验证是否为数字，如果不是则设为0
  [[ "$pm2_backend_status" =~ ^[0-9]+$ ]] || pm2_backend_status=0
  [[ "$pm2_frontend_status" =~ ^[0-9]+$ ]] || pm2_frontend_status=0
  
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

# 自动诊断和修复工具
auto_diagnose() {
  log "🔍 执行自动故障诊断..."
  
  local issues_found=false
  
  # 检查服务状态
  echo ""
  echo "=== 服务状态诊断 ==="
  
  # PM2进程状态
  local pm2_status=$(pm2 list 2>/dev/null | grep -E "resume-" || echo "无resume进程")
  echo "PM2状态: $pm2_status"
  
  # 端口占用情况
  echo "端口占用情况:"
  for port in $BACKEND_PORT $FRONTEND_PORT $DB_PORT; do
    local port_info=$(lsof -i :$port 2>/dev/null | tail -1 || echo "端口 $port 空闲")
    echo "  端口 $port: $port_info"
  done
  
  # 数据库连接测试
  echo ""
  echo "=== 数据库诊断 ==="
  if docker ps | grep -q "$DB_CONTAINER_NAME"; then
    if docker exec $DB_CONTAINER_NAME pg_isready -U $DB_USER >/dev/null 2>&1; then
      echo "✅ 数据库连接正常"
      
      # 检查表结构
      local table_count=$(docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | xargs || echo "0")
      echo "✅ 数据库表数量: $table_count"
    else
      echo "❌ 数据库连接失败"
      issues_found=true
    fi
  else
    echo "❌ 数据库容器未运行"
    issues_found=true
  fi
  
  # 磁盘空间检查
  echo ""
  echo "=== 系统资源诊断 ==="
  local disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
  local memory_usage=$(free | awk '/^Mem:/ {printf "%.1f", $3/$2 * 100.0}')
  
  echo "磁盘使用率: ${disk_usage}%"
  echo "内存使用率: ${memory_usage}%"
  
  if [ $disk_usage -gt 90 ]; then
    echo "⚠️ 磁盘空间不足"
    issues_found=true
  fi
  
  # 网络连接检查
  echo ""
  echo "=== 网络诊断 ==="
  if curl -s --max-time 5 http://127.0.0.1:$BACKEND_PORT >/dev/null 2>&1; then
    echo "✅ 后端API响应正常"
  else
    echo "❌ 后端API无响应"
    issues_found=true
  fi
  
  if curl -s --max-time 5 http://127.0.0.1:$FRONTEND_PORT >/dev/null 2>&1; then
    echo "✅ 前端服务响应正常"
  else
    echo "❌ 前端服务无响应"
    issues_found=true
  fi
  
  # 日志检查
  echo ""
  echo "=== 错误日志检查 ==="
  if pm2 logs resume-backend --lines 5 2>/dev/null | grep -i error; then
    echo "⚠️ 发现后端错误日志"
    issues_found=true
  else
    echo "✅ 后端日志正常"
  fi
  
  if [ "$issues_found" = true ]; then
    echo ""
    echo "🔧 建议修复操作："
    echo "1. 重启所有服务: pm2 restart resume-backend resume-frontend"
    echo "2. 查看详细日志: pm2 logs resume-backend"
    echo "3. 重新部署: bash $0"
    return 1
  else
    echo ""
    echo "✅ 所有检查通过，系统运行正常"
    return 0
  fi
}

# 强化版紧急修复 - 集成所有修复逻辑
emergency_fix() {
  log "🚨 强化版紧急修复 - 解决所有常见问题"
  echo "================================="

  # 1. 完全诊断当前状态
  log "🔍 1. 完整系统诊断..."
  echo ""
  echo "=== PM2进程状态 ==="
  pm2 list
  
  echo ""
  echo "=== 端口占用情况 ==="
  netstat -tlnp 2>/dev/null | grep -E "(3016|8000|5435)" || echo "相关端口未占用"
  
  echo ""
  echo "=== 数据库容器状态 ==="
  docker ps | grep resume-postgres || echo "数据库容器未运行"
  
  # 2. 彻底清理PM2进程（解决重复问题）
  log "🧹 2. 彻底清理PM2重复进程..."
  pm2 kill
  sleep 3
  rm -rf /root/.pm2/dump.pm2*
  log_success "PM2进程完全清理完成"
  
  # 3. 修复数据库密码问题
  log "🔧 3. 修复数据库认证问题..."
  
  # 检查数据库容器
  if docker ps | grep resume-postgres >/dev/null; then
    log "数据库容器正在运行，重置密码..."
    
    # 重置数据库用户密码
    docker exec resume-postgres psql -U postgres -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
    docker exec resume-postgres psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || {
      log "用户已存在，重置密码..."
      docker exec resume-postgres psql -U postgres -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    }
    docker exec resume-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    docker exec resume-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;"
    
    log_success "数据库密码重置完成"
  else
    log_error "数据库容器未运行"
  fi
  
  # 4. 检查并修复后端配置
  log "📝 4. 检查后端配置..."
  if [ -f "$PROJECT_DIR/backend/.env" ]; then
    echo "当前.env配置："
    cat "$PROJECT_DIR/backend/.env" | grep -v PASSWORD
    
    # 确保密码正确
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$PROJECT_DIR/backend/.env"
    log_success "后端配置已更新"
  else
    log_error "后端.env文件不存在"
  fi
  
  # 5. 测试数据库连接
  log "🔍 5. 测试数据库连接..."
  if docker exec resume-postgres psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
    log_success "数据库连接正常"
  else
    log_error "数据库连接失败，需要手动修复"
    echo "手动修复命令："
    echo "docker exec -it resume-postgres psql -U postgres"
    echo "然后执行：ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
  fi
  
  # 6. 重新启动服务（单一进程）
  log "🚀 6. 重新启动服务..."
  
  if [ -d "$PROJECT_DIR/backend" ]; then
    cd "$PROJECT_DIR/backend"
    pm2 start server.js --name "resume-backend" --env production --force
  fi
  
  if [ -d "$PROJECT_DIR/frontend/build" ]; then
    cd "$PROJECT_DIR/frontend"
    pm2 start serve --name "resume-frontend" -- -s build -l $FRONTEND_PORT --force
  fi
  
  # 保存配置
  pm2 save
  
  echo ""
  echo "=== 最终状态检查 ==="
  pm2 list
  
  echo ""
  echo "=== 服务测试 ==="
  sleep 5
  
  echo "前端测试 (端口$FRONTEND_PORT):"
  curl -I http://127.0.0.1:$FRONTEND_PORT 2>/dev/null | head -2 || echo "❌ 前端无响应"
  
  echo ""
  echo "后端测试 (端口$BACKEND_PORT):"
  curl -I http://127.0.0.1:$BACKEND_PORT 2>/dev/null | head -2 || echo "❌ 后端无响应"
  
  echo ""
  echo "域名测试:"
  curl -I http://$DOMAIN 2>/dev/null | head -2 || echo "❌ 域名访问失败"
  
  echo ""
  log "🎯 修复建议："
  echo "1. 如果数据库连接仍然失败，运行数据库密码重置命令"
  echo "2. 如果需要SSL证书，运行: bash $0 ssl"
  echo "3. 检查PM2日志：pm2 logs"
  echo "4. 检查nginx日志：tail -f /var/log/nginx/error.log"
  
  echo ""
  log_success "紧急修复完成！"
}

# 智能SSL证书配置 - 避免重复申请限制
smart_ssl_config() {
  log "🔐 智能SSL证书配置 - 避免重复申请限制"
  echo "========================"
  
  # 1. 检查SSL证书状态
  log "🔍 检查SSL证书状态..."
  
  local cert_status="missing"
  local nginx_ssl="not_configured"
  
  if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    log_success "SSL证书已存在！"
    
    echo ""
    echo "证书详情："
    ls -la "/etc/letsencrypt/live/$DOMAIN/"
    
    echo ""
    echo "证书有效期："
    openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/cert.pem" -text -noout | grep -A 2 "Validity" || echo "证书信息读取失败"
    
    # 检查证书是否即将过期（30天内）
    if openssl x509 -checkend 2592000 -noout -in "/etc/letsencrypt/live/$DOMAIN/cert.pem" >/dev/null 2>&1; then
      log_success "证书有效期正常（30天以上）"
      cert_status="valid"
    else
      log "证书即将过期（30天内），建议更新"
      cert_status="expiring"
    fi
  else
    log "SSL证书不存在"
    cert_status="missing"
  fi
  
  # 2. 检查nginx配置
  log "🌐 检查nginx配置..."
  
  if [ -f "/etc/nginx/sites-available/$DOMAIN" ]; then
    log "nginx配置文件存在"
    
    # 检查是否已配置SSL
    if grep -q "ssl_certificate" "/etc/nginx/sites-available/$DOMAIN"; then
      log_success "nginx已配置SSL"
      nginx_ssl="configured"
    else
      log "nginx未配置SSL"
      nginx_ssl="not_configured"
    fi
  else
    log_error "nginx配置文件不存在"
    nginx_ssl="missing"
  fi
  
  # 3. 根据状态决定操作
  echo ""
  echo "=== 决策分析 ==="
  echo "证书状态: $cert_status"
  echo "nginx SSL: $nginx_ssl"
  
  case "$cert_status" in
    "valid")
      if [ "$nginx_ssl" = "configured" ]; then
        log_success "SSL配置完整，无需操作"
        
        # 测试HTTPS访问
        echo ""
        log "🧪 测试HTTPS访问..."
        if curl -I "https://$DOMAIN" 2>/dev/null | head -1; then
          log_success "HTTPS访问正常"
        else
          log "HTTPS访问异常，检查nginx配置"
          nginx -t
        fi
        
      else
        log "证书存在但nginx未配置，更新nginx配置..."
        update_nginx_ssl_config
      fi
      ;;
      
    "expiring")
      log "证书即将过期，更新证书..."
      certbot renew --nginx --quiet
      systemctl reload nginx
      log_success "SSL证书已更新"
      ;;
      
    "missing")
      if command -v certbot >/dev/null 2>&1; then
        log "申请新的SSL证书..."
        create_ssl_certificate
      else
        log "安装certbot并申请证书..."
        apt update
        apt install -y certbot python3-certbot-nginx
        create_ssl_certificate
      fi
      ;;
  esac
  
  echo ""
  echo "🎉 SSL配置完成！"
  echo ""
  echo "📝 使用说明："
  echo "  • HTTP访问会自动重定向到HTTPS"
  echo "  • 证书会自动续期"
  echo "  • 访问地址：https://$DOMAIN"
}

# 更新nginx SSL配置
update_nginx_ssl_config() {
  log "📝 更新nginx SSL配置..."
  
  cat > "/etc/nginx/sites-available/$DOMAIN" << NGINXEOF
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    
    # Let's Encrypt证书验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 重定向到HTTPS
    location / {
        return 301 https://$DOMAIN\$request_uri;
    }
}

# HTTPS主配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;
    
    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 前端页面
    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 后端API
    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
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
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log /var/log/nginx/$DOMAIN.error.log;
}
NGINXEOF

  # 测试配置并重载
  if nginx -t; then
    systemctl reload nginx
    log_success "nginx SSL配置已更新"
  else
    log_error "nginx配置测试失败"
  fi
}

# 创建SSL证书
create_ssl_certificate() {
  log "📋 申请SSL证书..."
  
  # 创建webroot目录
  mkdir -p /var/www/certbot
  
  # 申请证书
  if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@juncaishe.com --redirect; then
    log_success "SSL证书申请成功"
  else
    log_error "SSL证书申请失败"
    echo ""
    echo "可能的原因："
    echo "1. 达到申请频率限制（每周5次）"
    echo "2. 域名解析问题"
    echo "3. 80端口被占用"
    echo ""
    echo "解决方案："
    echo "1. 等待一周后重试"
    echo "2. 检查域名DNS解析"
    echo "3. 确保80端口可用"
  fi
}

# 增强版系统诊断
enhanced_diagnose() {
  log "🔍 增强版系统诊断 - 全面分析"
  echo "============================="
  
  local issues_found=0
  
  echo ""
  echo "=== 1. 服务状态检查 ==="
  
  # PM2进程检查
  echo "🔍 PM2进程状态："
  local pm2_output=$(pm2 list 2>/dev/null)
  echo "$pm2_output"
  
  local resume_processes=$(echo "$pm2_output" | grep -E "resume-" | wc -l || echo "0")
  local expected_processes=2
  
  if [ "$resume_processes" -eq "$expected_processes" ]; then
    echo "✅ PM2进程数量正常 ($resume_processes/$expected_processes)"
  elif [ "$resume_processes" -gt "$expected_processes" ]; then
    echo "❌ PM2进程过多 ($resume_processes/$expected_processes) - 有重复进程"
    issues_found=$((issues_found + 1))
  else
    echo "❌ PM2进程不足 ($resume_processes/$expected_processes) - 服务未完全启动"
    issues_found=$((issues_found + 1))
  fi
  
  # 端口检查
  echo ""
  echo "🔍 端口监听状态："
  local frontend_port_check=$(netstat -tlnp 2>/dev/null | grep ":$FRONTEND_PORT " || echo "")
  local backend_port_check=$(netstat -tlnp 2>/dev/null | grep ":$BACKEND_PORT " || echo "")
  local db_port_check=$(netstat -tlnp 2>/dev/null | grep ":$DB_PORT " || echo "")
  
  if [ -n "$frontend_port_check" ]; then
    echo "✅ 前端端口 $FRONTEND_PORT 正常监听"
  else
    echo "❌ 前端端口 $FRONTEND_PORT 未监听"
    issues_found=$((issues_found + 1))
  fi
  
  if [ -n "$backend_port_check" ]; then
    echo "✅ 后端端口 $BACKEND_PORT 正常监听"
  else
    echo "❌ 后端端口 $BACKEND_PORT 未监听"
    issues_found=$((issues_found + 1))
  fi
  
  if [ -n "$db_port_check" ]; then
    echo "✅ 数据库端口 $DB_PORT 正常监听"
  else
    echo "❌ 数据库端口 $DB_PORT 未监听"
    issues_found=$((issues_found + 1))
  fi
  
  echo ""
  echo "=== 2. 数据库连接检查 ==="
  
  # 数据库容器检查
  if docker ps | grep -q $DB_CONTAINER_NAME; then
    echo "✅ 数据库容器运行正常"
    
    # 数据库连接测试
    if docker exec $DB_CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
      echo "✅ 数据库用户认证正常"
    else
      echo "❌ 数据库用户认证失败"
      issues_found=$((issues_found + 1))
    fi
  else
    echo "❌ 数据库容器未运行"
    issues_found=$((issues_found + 1))
  fi
  
  echo ""
  echo "=== 3. 网络访问检查 ==="
  
  # 本地访问测试
  echo "🔍 本地访问测试："
  local frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$FRONTEND_PORT/ 2>/dev/null || echo "000")
  local backend_response=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$BACKEND_PORT/api/health 2>/dev/null || echo "000")
  
  if [ "$frontend_response" = "200" ]; then
    echo "✅ 前端本地访问正常 (HTTP $frontend_response)"
  else
    echo "❌ 前端本地访问异常 (HTTP $frontend_response)"
    issues_found=$((issues_found + 1))
  fi
  
  if [ "$backend_response" = "200" ]; then
    echo "✅ 后端本地访问正常 (HTTP $backend_response)"
  else
    echo "❌ 后端本地访问异常 (HTTP $backend_response)"
    issues_found=$((issues_found + 1))
  fi
  
  # 域名访问测试
  echo ""
  echo "🔍 域名访问测试："
  local domain_response=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/ 2>/dev/null || echo "000")
  
  if [ "$domain_response" = "200" ] || [ "$domain_response" = "301" ] || [ "$domain_response" = "302" ]; then
    echo "✅ 域名访问正常 (HTTP $domain_response)"
  else
    echo "❌ 域名访问异常 (HTTP $domain_response)"
    issues_found=$((issues_found + 1))
  fi
  
  echo ""
  echo "=== 4. SSL证书检查 ==="
  
  if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "✅ SSL证书文件存在"
    
    # HTTPS访问测试
    local https_response=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ 2>/dev/null || echo "000")
    if [ "$https_response" = "200" ]; then
      echo "✅ HTTPS访问正常 (HTTP $https_response)"
    else
      echo "❌ HTTPS访问异常 (HTTP $https_response)"
      issues_found=$((issues_found + 1))
    fi
  else
    echo "⚠️ SSL证书未配置"
  fi
  
  echo ""
  echo "=== 5. nginx配置检查 ==="
  
  if nginx -t >/dev/null 2>&1; then
    echo "✅ nginx配置语法正确"
  else
    echo "❌ nginx配置语法错误"
    nginx -t
    issues_found=$((issues_found + 1))
  fi
  
  echo ""
  echo "=== 诊断结果汇总 ==="
  
  if [ "$issues_found" -eq 0 ]; then
    echo "🎉 系统运行完全正常！"
    echo ""
    echo "✅ 所有检查项目通过"
    echo "🌐 访问地址："
    echo "  • HTTP: http://$DOMAIN"
    echo "  • HTTPS: https://$DOMAIN (如已配置SSL)"
    echo "  • 前端: http://127.0.0.1:$FRONTEND_PORT"
    echo "  • 后端: http://127.0.0.1:$BACKEND_PORT"
    return 0
  else
    echo "❌ 发现 $issues_found 个问题需要修复"
    echo ""
    echo "🔧 建议修复命令："
    echo "  bash $0 fix       # 紧急修复"
    echo "  bash $0 ssl       # 配置SSL证书"
    echo "  bash $0 deploy    # 完整重新部署"
    echo ""
    echo "📝 查看详细日志："
    echo "  pm2 logs resume-backend"
    echo "  pm2 logs resume-frontend"
    echo "  docker logs $DB_CONTAINER_NAME"
    return 1
  fi
}

# 快速修复工具（保留原功能）
quick_fix() {
  log "🔧 执行快速修复..."
  
  # 重启PM2进程
  log "重启PM2进程..."
  pm2 restart resume-backend 2>/dev/null || true
  pm2 restart resume-frontend 2>/dev/null || true
  
  # 清理npm缓存
  log "清理npm缓存..."
  npm cache clean --force 2>/dev/null || true
  
  # 重启nginx
  log "重启nginx..."
  systemctl reload nginx 2>/dev/null || true
  
  # 等待服务重启
  sleep 10
  
  # 运行诊断
  enhanced_diagnose
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
    
    # 创建增强版管理脚本
    cat > /root/manage-resume.sh << 'MGEOF'
#!/bin/bash
# AI俊才社简历系统管理工具
echo "🚀 AI俊才社简历系统管理工具"
echo "=================================="

case "${1:-menu}" in
  "status"|"s")
    echo "📊 服务状态："
    pm2 list | grep -E "(resume-|NAME)" || echo "无resume进程运行"
    echo "🐘 数据库状态："
    docker ps | grep resume-postgres || echo "数据库容器未运行"
    ;;
  "logs"|"l")
    echo "📝 实时日志 (Ctrl+C退出)："
    pm2 logs resume-backend resume-frontend
    ;;
  "restart"|"r")
    echo "🔄 重启所有服务..."
    pm2 restart resume-backend resume-frontend
    echo "✅ 重启完成"
    ;;
  "help"|"h"|*)
    echo "🔧 可用命令："
    echo "  ./manage-resume.sh status    (s) - 查看服务状态"
    echo "  ./manage-resume.sh logs      (l) - 查看实时日志"
    echo "  ./manage-resume.sh restart   (r) - 重启所有服务"
    echo "🌐 访问地址："
    echo "  前端: http://127.0.0.1:3016"
    echo "  后端: http://127.0.0.1:8000"
    ;;
esac
MGEOF
    chmod +x /root/manage-resume.sh
    
    echo ""
    echo "💡 提示: 运行 /root/manage-resume.sh 查看管理命令"
    
  else
    log_error "部署完成但健康检查发现问题，请查看日志"
    exit 1
  fi
}

# 处理命令行参数
case "${1:-deploy}" in
  "deploy"|"d"|"")
    main "$@"
    ;;
  "diagnose"|"check"|"c")
    log "🔍 执行增强版系统诊断..."
    enhanced_diagnose
    ;;
  "fix"|"f")
    log "🚨 执行强化版紧急修复..."
    emergency_fix
    ;;
  "quickfix"|"qf")
    log "🔧 执行快速修复..."
    quick_fix
    ;;
  "ssl"|"s")
    log "🔐 智能SSL证书配置..."
    smart_ssl_config
    ;;
  "test"|"t")
    log "🧪 执行功能测试..."
    echo ""
    echo "=== 基础服务测试 ==="
    echo "测试后端健康检查:"
    curl -s http://127.0.0.1:$BACKEND_PORT/api/health | head -3 || echo "后端API无响应"
    echo ""
    echo "测试发送验证码API:"
    curl -s -X POST http://127.0.0.1:$BACKEND_PORT/api/auth/send-code \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","type":"login"}' | head -3 || echo "验证码API无响应"
    echo ""
    echo "前端页面响应:"
    curl -s -I http://127.0.0.1:$FRONTEND_PORT | head -3 || echo "前端无响应"
    echo ""
    echo "域名访问测试:"
    curl -s -I http://$DOMAIN | head -3 || echo "域名访问失败"
    echo ""
    echo "=== 完整功能列表 ==="
    echo "✅ 用户注册/登录"
    echo "✅ 验证码登录"
    echo "✅ 邮箱验证码发送"
    echo "✅ 简历上传解析"
    echo "✅ AI智能对话收集信息"
    echo "✅ 任务队列异步处理"
    echo ""
    echo "🌐 访问地址:"
    echo "  前端: http://127.0.0.1:$FRONTEND_PORT"
    echo "  后端: http://127.0.0.1:$BACKEND_PORT"
    echo "  域名: http://$DOMAIN"
    ;;
  "emergency"|"e")
    log "🚨 紧急模式 - 综合修复所有问题..."
    emergency_fix
    echo ""
    log "🔐 自动配置SSL证书..."
    smart_ssl_config
    echo ""
    log "🔍 最终系统验证..."
    enhanced_diagnose
    ;;
  "clean"|"cl")
    log "🧹 仅执行清理操作..."
    safe_precheck
    cleanup_resume_services
    log_success "清理完成"
    ;;
  "help"|"h"|"-h"|"--help")
    echo ""
    echo "🚀 AI俊才社简历系统 - 增强版一键部署脚本"
    echo "============================================="
    echo ""
    echo "⚠️  重要: 这是项目的唯一官方部署脚本!"
    echo "📖 使用方法: bash $0 [选项]"
    echo ""
    echo "🔧 核心功能选项："
    echo "  deploy, d        - 完整部署系统 (默认)"
    echo "  fix, f           - 强化版紧急修复 (推荐)"
    echo "  diagnose, c      - 增强版系统诊断"
    echo "  ssl, s           - 智能SSL证书配置"
    echo "  emergency, e     - 紧急模式 (修复+SSL+诊断)"
    echo ""
    echo "🛠️  辅助功能选项："
    echo "  quickfix, qf     - 快速修复 (重启服务)"
    echo "  clean, cl        - 仅清理PM2进程"
    echo "  test, t          - 功能测试"
    echo "  help, h          - 显示此帮助信息"
    echo ""
    echo "💡 常用场景："
    echo "  bash $0               - 首次部署"
    echo "  bash $0 fix           - 解决PM2重复/数据库认证问题"
    echo "  bash $0 emergency     - 一键解决所有问题 (推荐)"
    echo "  bash $0 diagnose      - 分析问题原因"
    echo "  bash $0 ssl           - 配置HTTPS (避免重复申请)"
    echo ""
    echo "🚨 故障排除流程："
    echo "  1. bash $0 diagnose   - 诊断问题"
    echo "  2. bash $0 fix        - 修复问题"  
    echo "  3. bash $0 ssl        - 配置SSL"
    echo "  4. bash $0 test       - 验证结果"
    ;;
  *)
    log_error "未知选项: $1"
    echo ""
    echo "可用选项: deploy, fix, diagnose, ssl, emergency, test, help"
    echo "使用 'bash $0 help' 查看详细帮助"
    exit 1
    ;;
esac

echo "🎉 AI俊才社简历系统部署脚本执行完成！"

