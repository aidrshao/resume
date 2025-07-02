#!/bin/bash
# =============================================================================
# AI服务优化脚本 - 解决生产环境AI超时问题
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# 项目配置
PROJECT_DIR="/home/ubuntu/resume"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "============================================"
echo "AI服务生产环境优化脚本"
echo "============================================"
echo ""

# 1. 优化后端环境变量
log_info "1. 优化AI服务环境变量配置..."

cat >> "$BACKEND_DIR/.env" << 'ENVEOF'

# ===== AI服务生产环境优化配置 =====
# 基础AI超时配置（更保守的设置）
AI_TIMEOUT=90000
AI_MAX_RETRIES=1
AI_REQUEST_TIMEOUT=60000
AI_CONNECTION_TIMEOUT=15000

# 简历解析专用配置（更短的超时）
RESUME_AI_TIMEOUT=120000
RESUME_MAX_RETRIES=2
RESUME_PARSE_TIMEOUT=180000

# 生产环境性能优化
NODE_ENV=production
MAX_OLD_SPACE_SIZE=1024
UV_THREADPOOL_SIZE=16
ENVEOF

log_success "AI环境变量配置完成"

echo ""
echo "============================================"
echo "AI服务优化完成！"
echo "============================================"
echo ""
log_success "🎉 主要优化内容："
log_info "  ✅ AI超时时间缩短至90秒"
log_info "  ✅ 简历AI超时设置为120秒"
log_info "  ✅ 重试次数减少至1-2次"
echo ""
log_warning "🔄 请重启后端服务应用新配置"
