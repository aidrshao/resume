#!/usr/bin/env node
/**
 * GitHub Actions 部署失败诊断脚本
 * 帮助快速定位和解决部署问题
 */

console.log('🔍 GitHub Actions 部署失败诊断工具\n');

// 根据运行时间判断失败阶段
const analyzeFailureByTime = (duration) => {
  console.log(`⏱️ 运行时间分析: ${duration}\n`);
  
  if (duration <= 30) {
    return {
      stage: '语法验证阶段',
      likelyReasons: [
        'workflow文件语法错误',
        'GitHub Actions配置问题',
        'repository权限问题'
      ],
      solutions: [
        '检查.github/workflows/deploy.yml文件语法',
        '确保repository有Actions权限',
        '检查分支保护规则'
      ]
    };
  } else if (duration <= 90) {
    return {
      stage: 'Secrets验证阶段',
      likelyReasons: [
        '缺少必要的GitHub Secrets',
        'Secret格式错误或为空',
        'SSH连接失败',
        '服务器IP无法访问'
      ],
      solutions: [
        '检查所有9个必需Secrets是否配置',
        '验证SSH私钥格式（包含BEGIN/END）',
        '确认服务器IP地址正确',
        '测试SSH连接：ssh -i your_key user@host'
      ]
    };
  } else if (duration <= 300) {
    return {
      stage: '依赖安装阶段',
      likelyReasons: [
        'npm安装失败',
        '网络连接问题',
        'Node.js版本不兼容',
        '服务器磁盘空间不足'
      ],
      solutions: [
        '检查package.json依赖',
        '确认服务器网络正常',
        '检查服务器磁盘空间',
        '查看npm安装日志'
      ]
    };
  } else {
    return {
      stage: '应用部署阶段',
      likelyReasons: [
        '数据库连接失败',
        '端口被占用',
        '服务启动失败',
        '健康检查失败'
      ],
      solutions: [
        '检查数据库配置',
        '确认端口可用性',
        '查看应用日志',
        '检查服务器资源'
      ]
    };
  }
};

// 常见错误模式和解决方案
const commonErrors = {
  'secrets': {
    pattern: /缺少必要Secret|Secret.*空|invalid.*secret/i,
    solution: `
📋 GitHub Secrets检查清单：
1. 进入GitHub仓库 → Settings → Secrets and variables → Actions
2. 确认配置了这9个Secrets：
   ✅ AGICTO_API_KEY
   ✅ TENCENT_SECRET_ID  
   ✅ TENCENT_SECRET_KEY
   ✅ DB_PASSWORD
   ✅ JWT_SECRET
   ✅ HOST
   ✅ USERNAME
   ✅ PRIVATE_KEY
   ✅ SSH_PORT (可选)

🔧 修复步骤：
- 删除OPENAI_API_KEY（不需要）
- 确保每个Secret值不为空
- SSH私钥需包含完整的BEGIN/END标识
    `
  },
  
  'ssh': {
    pattern: /SSH.*失败|连接.*超时|Host.*unreachable/i,
    solution: `
🔑 SSH连接问题解决：
1. 检查服务器IP地址是否正确
2. 确认SSH端口（默认22）
3. 验证SSH私钥格式：
   -----BEGIN OPENSSH PRIVATE KEY-----
   (私钥内容)
   -----END OPENSSH PRIVATE KEY-----
4. 测试本地SSH连接：
   ssh -i ~/.ssh/your_key user@your_server_ip

🛠️ 常见问题：
- 服务器防火墙阻止SSH（开放22端口）
- 用户名不存在或无权限
- 私钥权限设置：chmod 600 ~/.ssh/your_key
    `
  },
  
  'docker': {
    pattern: /docker.*not.*found|Cannot.*connect.*Docker/i,
    solution: `
🐳 Docker问题解决：
1. 确认服务器已安装Docker：
   sudo apt update
   sudo apt install docker.io
   sudo systemctl start docker
   sudo systemctl enable docker

2. 添加用户到docker组：
   sudo usermod -aG docker $USER
   newgrp docker

3. 测试Docker运行：
   docker run hello-world
    `
  },
  
  'permissions': {
    pattern: /Permission.*denied|sudo.*password|access.*denied/i,
    solution: `
👤 权限问题解决：
1. 确认用户有sudo权限：
   sudo -l

2. 配置无密码sudo（可选）：
   sudo visudo
   添加：your_user ALL=(ALL) NOPASSWD:ALL

3. 检查文件权限：
   ls -la /path/to/deployment/directory
    `
  }
};

// 主诊断函数
const diagnose = () => {
  console.log('📊 基于您的情况分析：\n');
  
  // 分析1分20秒失败的情况
  const analysis = analyzeFailureByTime('1分20秒');
  
  console.log(`🎯 失败阶段: ${analysis.stage}`);
  console.log('\n🚨 可能原因：');
  analysis.likelyReasons.forEach((reason, index) => {
    console.log(`   ${index + 1}. ${reason}`);
  });
  
  console.log('\n💡 解决方案：');
  analysis.solutions.forEach((solution, index) => {
    console.log(`   ${index + 1}. ${solution}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 详细错误检查指南：\n');
  
  Object.entries(commonErrors).forEach(([type, error]) => {
    console.log(`📋 ${type.toUpperCase()}问题:${error.solution}\n`);
  });
  
  console.log('🚀 下一步行动：');
  console.log('1. 点击GitHub Actions中最新失败的运行');
  console.log('2. 点击红色的"deploy"任务');
  console.log('3. 找到具体的错误信息');
  console.log('4. 根据错误信息对照上述解决方案');
  console.log('5. 修复问题后重新触发部署\n');
  
  console.log('💬 如需详细帮助，请提供：');
  console.log('- GitHub Actions日志中的具体错误信息');
  console.log('- 失败的具体步骤名称');
  console.log('- 您的服务器配置情况');
};

// 执行诊断
diagnose(); 