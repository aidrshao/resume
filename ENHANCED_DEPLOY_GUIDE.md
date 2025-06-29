# 🚀 AI俊才社简历系统 - 终极一键部署指南

## 📋 升级版特性

### ✅ **v5.3 终极修复版新增功能**

1. **🔧 Nginx配置冲突修复**
   - 自动清理 `multi_domain.conf` 和 `www.zhenshizhiyuan.com.conf` 冲突
   - 创建干净的 `cv.juncaishe.com` 配置
   - 解决域名跳转问题的根本原因

2. **🛠️ 502错误智能修复**
   - 自动检查PM2服务状态
   - 智能启动 `resume-frontend` 和 `resume-backend`
   - 端口监听状态实时检测
   - 自动安装和配置serve服务

3. **🧹 调试脚本自动清理**
   - 自动删除16个调试过程中创建的临时脚本
   - 保持项目目录整洁

4. **💡 浏览器缓存提醒**
   - 提供清理浏览器缓存的具体指导
   - 解决301/302重定向缓存问题

---

## 🎯 一键使用方法

### 🔥 **推荐：修复模式（解决所有已知问题）**

```bash
sudo bash deploy-standalone.sh --mode=fix
```

**这个命令会：**
- ✅ 清理所有临时调试脚本
- ✅ 修复Nginx配置冲突
- ✅ 清理PM2重复进程
- ✅ 修复数据库认证问题
- ✅ 修复502 Bad Gateway错误
- ✅ 启动所有必要服务
- ✅ 配置干净的Nginx代理
- ✅ 最终健康检查

### 📋 **其他模式**

```bash
# 完整部署（全新环境）
sudo bash deploy-standalone.sh --mode=full

# 快速部署（代码更新）
sudo bash deploy-standalone.sh --mode=quick

# 健康检查（不做修改）
sudo bash deploy-standalone.sh --mode=check

# 调试模式
sudo bash deploy-standalone.sh --debug --mode=fix
```

---

## 🎉 部署后访问方式

### ✅ **正常访问**
- **简历系统**: http://cv.juncaishe.com
- **原有系统**: https://www.juncaishe.com
- **健康检查**: http://cv.juncaishe.com/api/health

### 🔄 **备用访问（如遇域名缓存问题）**
- **简历系统**: http://122.51.234.153:8080
- **原有系统**: http://122.51.234.153:8081

---

## 🔧 故障排除

### 🌐 **如果仍有域名跳转问题**
这通常是浏览器缓存301/302重定向造成的：

1. **强制刷新**: `Ctrl + Shift + R` (Windows/Linux) 或 `Cmd + Shift + R` (Mac)
2. **清除缓存**: 在浏览器开发者工具中勾选"禁用缓存"
3. **使用无痕模式**: 打开新的无痕窗口访问
4. **备用访问**: 使用IP地址访问 `http://122.51.234.153:8080`

### 🔍 **如果仍有502错误**
```bash
# 检查PM2状态
pm2 list

# 查看PM2日志
pm2 logs

# 重新运行修复
sudo bash deploy-standalone.sh --mode=fix
```

---

## 📊 修复效果对比

| 问题 | 修复前 | 修复后 |
|------|--------|--------|
| PM2进程数 | 6个重复进程 | 2个正常进程 |
| 域名访问 | 跳转到pay.juncaishe.com | 正常访问cv.juncaishe.com |
| 502错误 | 前端服务未启动 | 自动启动并检查 |
| Nginx配置 | 多文件冲突 | 单一干净配置 |
| 调试脚本 | 16个临时文件 | 自动清理 |

---

## 🎯 **立即开始**

```bash
# 执行一键修复（推荐）
sudo bash deploy-standalone.sh --mode=fix
```

**预期结果：**
- ✅ 所有已知问题自动修复
- ✅ 系统正常运行
- ✅ 项目目录整洁
- ✅ 访问地址正常

---

## 📞 技术支持

如果遇到任何问题，请：
1. 查看日志：`tail -f /var/log/resume-deploy.log`
2. 运行健康检查：`sudo bash deploy-standalone.sh --mode=check`
3. 联系技术团队，并提供完整的错误日志

---

**维护团队**: AI俊才社技术团队  
**版本**: v5.3 终极修复版  
**更新日期**: 2024-06-29 