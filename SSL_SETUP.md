# SSL证书配置指南

## 🔒 自动SSL证书配置

### 1. 部署后配置SSL

部署完成后，如果您有域名，可以自动配置SSL证书：

```bash
# 登录服务器
ssh ubuntu@122.51.234.153

# 进入部署脚本目录
cd /home/ubuntu/resume-app

# 下载SSL配置脚本（如果不存在）
wget -O ssl-setup.sh https://raw.githubusercontent.com/your-repo/main/ssl-setup.sh

# 运行SSL配置脚本
./ssl-setup.sh yourdomain.com
```

### 2. 手动SSL证书配置

如果需要手动配置SSL证书：

#### 安装Certbot
```bash
sudo apt update
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
```

#### 申请SSL证书
```bash
# 停止nginx以释放80端口
sudo systemctl stop nginx

# 申请证书
sudo certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@yourdomain.com \
  -d yourdomain.com

# 重启nginx
sudo systemctl start nginx
```

#### 配置Nginx使用SSL
```bash
# 备份现有配置
sudo cp /etc/nginx/sites-available/resume.conf /etc/nginx/sites-available/resume.conf.backup

# 编辑配置文件
sudo nano /etc/nginx/sites-available/resume.conf
```

添加SSL配置：
```nginx
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 前端静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 后端API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 测试和重启Nginx
```bash
# 测试配置
sudo nginx -t

# 重启nginx
sudo systemctl restart nginx
```

### 3. 设置自动续期

```bash
# 添加自动续期任务
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -

# 验证自动续期
sudo certbot renew --dry-run
```

### 4. 检查SSL证书状态

```bash
# 检查证书信息
sudo certbot certificates

# 检查证书有效期
openssl x509 -enddate -noout -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem

# 测试SSL配置
curl -I https://yourdomain.com
```

## 🔧 常见问题

### 域名解析问题
确保域名正确解析到服务器IP：
```bash
# 检查域名解析
dig +short yourdomain.com

# 检查服务器IP
curl -s ifconfig.me
```

### 端口80被占用
如果端口80被其他服务占用，使用webroot方式申请证书：
```bash
sudo certbot certonly --webroot \
  -w /var/www/html \
  --non-interactive \
  --agree-tos \
  --email admin@yourdomain.com \
  -d yourdomain.com
```

### 证书续期失败
```bash
# 手动续期
sudo certbot renew --force-renewal

# 检查续期日志
sudo journalctl -u snap.certbot.renew.timer
```

## 📋 SSL最佳实践

1. **定期检查证书有效期**
2. **使用强加密算法**
3. **启用HTTP/2**
4. **配置安全头部**
5. **定期测试SSL配置**

## 🚨 安全注意事项

- 确保私钥文件权限正确（600）
- 定期备份SSL证书
- 监控证书过期时间
- 使用安全的SSL配置 