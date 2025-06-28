# AI俊才社简历管理系统 - 后端服务Dockerfile
# 基于Node.js 20 Alpine版本
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# 复制package文件
COPY package*.json ./

# 安装Node.js依赖
RUN npm ci --only=production && npm cache clean --force

# 复制后端源码
COPY . .

# 创建必要的目录
RUN mkdir -p uploads/resumes uploads/temp logs

# 复制前端构建文件（如果存在）
COPY public ./public 2>/dev/null || echo "前端静态文件不存在，跳过复制"

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8000

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/status || exit 1

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 修改文件权限
RUN chown -R nextjs:nodejs /app
USER nextjs

# 启动命令
CMD ["node", "server.js"] 