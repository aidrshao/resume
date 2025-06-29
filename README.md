# AI俊才社简历系统

> 智能简历生成与管理平台，基于React + Node.js + PostgreSQL构建

## 🚀 快速部署

### 生产环境一键部署
```bash
# 在服务器上运行（需要sudo权限）
sudo bash deploy-standalone.sh
```

### 本地开发环境
```bash
# 启动后端（端口：8000）
cd backend && npm start

# 启动前端（端口：3016）  
cd frontend && npm start
```

## 📁 项目结构

```
├── backend/          # Node.js后端
├── frontend/         # React前端
├── deploy-standalone.sh  # 一键部署脚本
├── docker-compose.prod.yml  # 生产环境Docker配置
├── nginx.conf        # Nginx配置
└── README.md         # 项目说明
```

## 🛠️ 技术栈

- **前端**: React + TailwindCSS
- **后端**: Node.js + Express + Knex.js
- **数据库**: PostgreSQL
- **AI服务**: OpenAI GPT-4 + DeepSeek
- **邮件服务**: 腾讯云SES
- **部署**: Docker + Nginx + PM2

## 📧 联系方式

- 项目维护：AI俊才社技术团队
- 域名：cv.juncaishe.com
