# AI俊才社简历系统 - 生产环境部署规范

## 🚨 重要规范

### 唯一部署脚本原则

**所有生产环境部署操作必须且只能使用 `fix-deploy-complete.sh` 脚本完成！**

#### 📋 核心要求

1. **唯一性**: `fix-deploy-complete.sh` 是唯一的官方部署脚本
2. **禁止性**: 严禁创建、使用其他部署脚本或方式
3. **统一性**: 所有配置、密钥、环境变量统一在此脚本管理
4. **权威性**: 任何部署相关的修改都必须在此脚本中进行

#### 🎯 脚本功能

- ✅ 一键完整部署生产环境
- ✅ 自动配置 React 前端 + Node.js 后端
- ✅ 自动设置 PostgreSQL 数据库
- ✅ 自动配置 nginx 反向代理
- ✅ 自动管理 PM2 进程
- ✅ 自动配置 AI 服务 (OpenAI + DeepSeek)
- ✅ 自动配置腾讯云邮件服务
- ✅ 智能错误处理和自动回滚
- ✅ 生成运维管理工具

#### 🔧 使用方法

```bash
# 完整部署 (推荐)
bash fix-deploy-complete.sh

# 查看帮助
bash fix-deploy-complete.sh help

# 查看知识库
bash fix-deploy-complete.sh knowledge

# 系统诊断
bash fix-deploy-complete.sh diagnose

# 快速修复
bash fix-deploy-complete.sh fix
```

#### 🛠️ 部署后管理

部署完成后，使用生成的管理工具：

```bash
# 查看服务状态
/root/manage-resume.sh status

# 查看实时日志
/root/manage-resume.sh logs

# 重启服务
/root/manage-resume.sh restart

# 备份数据
/root/manage-resume.sh backup
```

#### 🏗️ 技术架构

- **前端**: React + TailwindCSS (端口 3016)
- **后端**: Node.js + Express + knex.js (端口 8000)  
- **数据库**: PostgreSQL (端口 5435)
- **进程管理**: PM2
- **反向代理**: nginx
- **AI服务**: OpenAI GPT-4o + DeepSeek V3
- **邮件服务**: 腾讯云 SES

#### ⚠️ 重要约定

1. **绝对禁止** 创建其他部署脚本
2. **绝对禁止** 修改其他配置文件进行部署
3. **绝对禁止** 手动配置生产环境
4. 任何配置更改都必须在 `fix-deploy-complete.sh` 中进行
5. 保持脚本的唯一性、权威性、完整性

#### 📞 技术支持

如有问题，请联系 AI俊才社技术团队

---

**请严格遵守此部署规范，确保生产环境的稳定性和一致性！** 