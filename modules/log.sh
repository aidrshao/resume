#!/bin/bash
# =============================================================================
# 日志管理模块 - AI俊才社简历系统
# =============================================================================

# 日志级别定义
declare -r LOG_LEVEL_DEBUG=0
declare -r LOG_LEVEL_INFO=1
declare -r LOG_LEVEL_WARN=2
declare -r LOG_LEVEL_ERROR=3

# 当前日志级别（默认INFO）
LOG_LEVEL=${LOG_LEVEL:-$LOG_LEVEL_INFO}

# 日志文件
LOG_FILE="${LOG_DIR:-/var/log}/resume-deploy.log"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 初始化日志
init_log() {
    local log_dir=$(dirname "$LOG_FILE")
    mkdir -p "$log_dir"
    touch "$LOG_FILE"
    
    # 日志轮转（保留最近7天）
    if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0) -gt $((10 * 1024 * 1024)) ]; then
        mv "$LOG_FILE" "${LOG_FILE}.$(date +%Y%m%d_%H%M%S)"
        find "$(dirname "$LOG_FILE")" -name "$(basename "$LOG_FILE").*" -mtime +7 -delete 2>/dev/null || true
        touch "$LOG_FILE"
    fi
}

# 设置日志级别
set_log_level() {
    case "$1" in
        "debug") LOG_LEVEL=$LOG_LEVEL_DEBUG ;;
        "info") LOG_LEVEL=$LOG_LEVEL_INFO ;;
        "warn") LOG_LEVEL=$LOG_LEVEL_WARN ;;
        "error") LOG_LEVEL=$LOG_LEVEL_ERROR ;;
        *) LOG_LEVEL=$LOG_LEVEL_INFO ;;
    esac
}

# 格式化时间戳
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# 写入日志文件
write_to_file() {
    local level="$1"
    local message="$2"
    echo "[$(get_timestamp)] [$level] $message" >> "$LOG_FILE"
}

# DEBUG级别日志
log_debug() {
    if [ $LOG_LEVEL -le $LOG_LEVEL_DEBUG ]; then
        local message="$1"
        echo -e "${PURPLE}[DEBUG]${NC} $message"
        write_to_file "DEBUG" "$message"
    fi
}

# INFO级别日志
log_info() {
    if [ $LOG_LEVEL -le $LOG_LEVEL_INFO ]; then
        local message="$1"
        echo -e "${BLUE}[INFO]${NC} $message"
        write_to_file "INFO" "$message"
    fi
}

# 成功日志
log_success() {
    if [ $LOG_LEVEL -le $LOG_LEVEL_INFO ]; then
        local message="$1"
        echo -e "${GREEN}[SUCCESS]${NC} $message"
        write_to_file "SUCCESS" "$message"
    fi
}

# WARNING级别日志
log_warning() {
    if [ $LOG_LEVEL -le $LOG_LEVEL_WARN ]; then
        local message="$1"
        echo -e "${YELLOW}[WARNING]${NC} $message"
        write_to_file "WARNING" "$message"
    fi
}

# ERROR级别日志
log_error() {
    if [ $LOG_LEVEL -le $LOG_LEVEL_ERROR ]; then
        local message="$1"
        echo -e "${RED}[ERROR]${NC} $message" >&2
        write_to_file "ERROR" "$message"
    fi
}

# 标题日志
log_title() {
    local title="$1"
    local separator="="
    local length=${#title}
    local total_length=$((length + 20))
    
    echo ""
    printf "%*s\n" $total_length | tr ' ' "$separator"
    echo -e "${WHITE}$(printf "%*s" $(((total_length - length) / 2)) "")$title${NC}"
    printf "%*s\n" $total_length | tr ' ' "$separator"
    echo ""
    
    write_to_file "TITLE" "$title"
}

# 子标题日志
log_subtitle() {
    local subtitle="$1"
    echo ""
    echo -e "${CYAN}▶ $subtitle${NC}"
    echo ""
    write_to_file "SUBTITLE" "$subtitle"
}

# 步骤日志
log_step() {
    local current="$1"
    local total="$2"
    local description="$3"
    
    echo ""
    echo -e "${WHITE}[$current/$total]${NC} ${CYAN}$description${NC}"
    echo ""
    write_to_file "STEP" "[$current/$total] $description"
}

# 分隔符
log_separator() {
    local char="${1:-=}"
    local length="${2:-50}"
    printf "%*s\n" $length | tr ' ' "$char"
    write_to_file "SEPARATOR" "$(printf "%*s" $length | tr ' ' "$char")"
}

# 进度条（简单版本）
log_progress() {
    local current="$1"
    local total="$2"
    local description="${3:-处理中}"
    
    local percentage=$((current * 100 / total))
    local bar_length=30
    local filled_length=$((current * bar_length / total))
    
    local bar=""
    for ((i=0; i<filled_length; i++)); do
        bar+="█"
    done
    for ((i=filled_length; i<bar_length; i++)); do
        bar+="░"
    done
    
    printf "\r${CYAN}%s${NC} [%s] %d%% (%d/%d)" "$description" "$bar" "$percentage" "$current" "$total"
    
    if [ $current -eq $total ]; then
        echo ""
        write_to_file "PROGRESS" "$description - 完成 (100%)"
    fi
}

# 清除当前行
clear_line() {
    printf "\r\033[K"
}

# 询问用户确认
log_confirm() {
    local question="$1"
    local default="${2:-n}"
    
    while true; do
        if [ "$default" = "y" ]; then
            echo -ne "${YELLOW}$question [Y/n]: ${NC}"
        else
            echo -ne "${YELLOW}$question [y/N]: ${NC}"
        fi
        
        read -r answer
        
        # 如果用户直接回车，使用默认值
        if [ -z "$answer" ]; then
            answer="$default"
        fi
        
        case "$answer" in
            [Yy]* ) 
                write_to_file "CONFIRM" "$question - YES"
                return 0
                ;;
            [Nn]* ) 
                write_to_file "CONFIRM" "$question - NO"
                return 1
                ;;
            * ) 
                echo -e "${RED}请输入 y 或 n${NC}"
                ;;
        esac
    done
}

# 显示当前配置信息
log_config_info() {
    log_info "配置信息:"
    log_info "  日志文件: $LOG_FILE"
    log_info "  日志级别: $LOG_LEVEL"
    log_info "  时间戳: $(get_timestamp)"
}

# 导出函数
export -f init_log set_log_level get_timestamp write_to_file
export -f log_debug log_info log_success log_warning log_error
export -f log_title log_subtitle log_step log_separator log_progress
export -f clear_line log_confirm log_config_info 