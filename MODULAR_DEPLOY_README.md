# AI俊才社简历系统 - 模块化部署系统

## 🎯 系统概述

全新的模块化部署系统，将原本的单一脚本拆分为多个功能模块，提高可维护性和调试效率。

## 📁 项目结构

```
├── deploy-complete.sh          # 主控制脚本
├── modules/                    # 功能模块目录
│   ├── config.sh              # 配置管理模块
│   ├── log.sh                 # 日志管理模块
│   ├── pm2-manager.sh         # PM2进程管理模块
│   ├── database.sh            # 数据库管理模块
│   ├── backend.sh             # 后端部署模块
│   ├── frontend.sh            # 前端部署模块
│   ├── nginx.sh               # Nginx配置模块
│   ├── ssl.sh                 # SSL证书管理模块
│   └── health-check.sh        # 健康检查模块
└── MODULAR_DEPLOY_README.md   # 本文档
```

## 🚀 快速开始

### 基本使用

```bash
# 赋予执行权限
chmod +x deploy-complete.sh

# 完整部署（推荐）
sudo ./deploy-complete.sh

# 或指定模式
sudo ./deploy-complete.sh --mode=full
```

### 可用模式

1. **完整部署模式** (推荐)
   ```bash
   sudo ./deploy-complete.sh --mode=full
   ```
   - 完整的部署流程
   - 包含所有组件的安装和配置
   - 适用于首次部署或完全重新部署

2. **快速部署模式**
   ```bash
   sudo ./deploy-complete.sh --mode=quick
   ```
   - 检查现有服务状态
   - 如果正常运行，只更新代码和重启服务
   - 如果异常，自动切换到完整部署

3. **修复模式**
   ```bash
   sudo ./deploy-complete.sh --mode=fix
   ```
   - 专门用于修复系统问题
   - 清理PM2进程重复问题
   - 修复数据库认证问题
   - 重启所有服务

4. **健康检查模式**
   ```bash
   sudo ./deploy-complete.sh --mode=check
   ```
   - 只执行系统健康检查
   - 不做任何修改
   - 生成详细的系统状态报告

### 调试模式

```bash
sudo ./deploy-complete.sh --debug --mode=full
```

启用详细的调试日志，用于故障排除。

## 🔧 模块化设计

### 核心优势

1. **模块化设计**: 每个功能独立模块，易于维护
2. **易于调试**: 问题定位更精确，单独测试模块功能
3. **可重用性**: 模块可以独立调用和测试
4. **可扩展性**: 新功能可以作为新模块添加

### 模块功能说明

#### 1. 配置管理模块 (`config.sh`)
- 统一管理所有配置变量
- 端口、路径、数据库等配置
- 配置验证和初始化

#### 2. 日志管理模块 (`log.sh`)
- 标准化日志输出
- 多级别日志（DEBUG, INFO, WARN, ERROR）
- 日志文件轮转和管理

#### 3. PM2管理模块 (`pm2-manager.sh`)
- **解决重复进程问题**（核心修复）
- 智能进程清理策略
- 保护其他项目进程
- 进程状态监控

#### 4. 数据库管理模块 (`database.sh`)
- **解决密码认证失败问题**（核心修复）
- 容器生命周期管理
- 迁移和备份功能
- 连接状态监控

#### 5. 后端部署模块 (`backend.sh`)
- 代码克隆和更新
- 依赖安装
- 环境配置生成
- 后端服务配置

#### 6. 前端部署模块 (`frontend.sh`)
- 前端构建流程
- 静态文件优化
- 生产环境配置

#### 7. Nginx配置模块 (`nginx.sh`)
- Nginx配置生成
- 反向代理设置
- 静态文件服务
- 安全头配置

#### 8. SSL证书管理模块 (`ssl.sh`)
- 智能证书申请和续期
- 证书状态监控
- 自动续期设置

#### 9. 健康检查模块 (`health-check.sh`)
- 全面的系统健康检查
- 端口、服务、资源监控
- 问题诊断和报告

## 🛠️ 解决的关键问题

### 1. PM2进程重复问题
**问题**: 原脚本中PM2清理后又通过`pm2 resurrect`恢复了旧进程
**解决**: 
- 智能识别resume项目进程
- 备份其他项目配置
- 清理PM2持久化配置中的resume条目
- 避免错误恢复

### 2. 数据库认证失败
**问题**: 迁移时出现密码认证失败
**解决**:
- 实时检测认证失败
- 自动重置用户权限
- 迁移过程中实时修复

### 3. 脚本维护困难
**问题**: 单文件2136行，难以调试
**解决**:
- 模块化设计，每个模块独立功能
- 清晰的依赖关系
- 独立测试和调试

## 📊 使用效果对比

| 特性 | 原脚本 | 模块化系统 |
|------|--------|------------|
| 文件数量 | 1个文件 | 10个模块 |
| 代码行数 | 2136行 | 分散到各模块 |
| 可维护性 | ❌ 难维护 | ✅ 易维护 |
| 可调试性 | ❌ 难调试 | ✅ 易调试 |
| 可扩展性 | ❌ 难扩展 | ✅ 易扩展 |
| 问题定位 | ❌ 困难 | ✅ 精确 |

## 🔍 故障排除

### 日志查看

```bash
# 查看部署日志
tail -f /var/log/resume-deploy.log

# 查看PM2日志
pm2 logs

# 查看nginx日志
tail -f /var/log/nginx/error.log
```

### 常见问题

1. **权限问题**
   ```bash
   # 确保使用root权限
   sudo ./deploy-complete.sh
   ```

2. **模块加载失败**
   ```bash
   # 检查modules目录是否存在
   ls -la modules/
   
   # 确保模块文件有执行权限
   chmod +x modules/*.sh
   ```

3. **服务启动失败**
   ```bash
   # 使用修复模式
   sudo ./deploy-complete.sh --mode=fix
   
   # 查看详细错误
   sudo ./deploy-complete.sh --debug --mode=check
   ```

## 📈 性能优化

### 并行处理
- 模块间合理的并行执行
- 减少等待时间

### 智能检测
- 只在必要时执行操作
- 跳过已正确配置的组件

### 缓存机制
- 依赖安装缓存
- 构建结果缓存

## 🔄 迁移指南

### 从旧脚本迁移

1. **备份现有部署**
   ```bash
   cp fix-deploy-complete.sh fix-deploy-complete.sh.backup
   ```

2. **使用新系统**
   ```bash
   # 首次使用建议用修复模式
   sudo ./deploy-complete.sh --mode=fix
   ```

3. **验证部署结果**
   ```bash
   sudo ./deploy-complete.sh --mode=check
   ```

## 🎯 推荐使用流程

### 首次部署
```bash
sudo ./deploy-complete.sh --mode=full
```

### 日常更新
```bash
sudo ./deploy-complete.sh --mode=quick
```

### 问题修复
```bash
sudo ./deploy-complete.sh --mode=fix
```

### 状态检查
```bash
sudo ./deploy-complete.sh --mode=check
```

## 💡 最佳实践

1. **定期健康检查**: 建议每日运行一次健康检查
2. **日志监控**: 定期查看部署日志
3. **备份策略**: 重要操作前先备份
4. **测试环境**: 新功能先在测试环境验证
5. **模块更新**: 保持模块的独立性和可重用性

## 🔮 未来规划

1. **监控模块**: 添加系统监控和告警
2. **自动化模块**: CI/CD集成
3. **备份模块**: 自动备份和恢复
4. **性能模块**: 性能监控和优化
5. **安全模块**: 安全扫描和加固

---

**维护团队**: AI俊才社技术团队  
**创建日期**: 2024-06-29  
**版本**: v5.0 Modular 