#!/usr/bin/env node
/**
 * GitHub Secrets 验证检查脚本
 * 帮助验证部署前所有密钥配置是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 GitHub Secrets 验证检查工具\n');

// 定义必需的Secrets及其验证规则
const REQUIRED_SECRETS = [
  {
    name: 'AGICTO_API_KEY',
    description: 'AGICTO AI API密钥',
    validation: (value) => {
      if (!value) return '❌ 密钥为空';
      if (!value.startsWith('sk-')) return '❌ 格式错误，应以sk-开头';
      if (value.length < 30) return '❌ 密钥太短，应至少30字符';
      return '✅ 格式正确';
    }
  },
  {
    name: 'TENCENT_SECRET_ID',
    description: '腾讯云Secret ID',
    validation: (value) => {
      if (!value) return '❌ 密钥为空';
      if (!value.startsWith('AKID')) return '❌ 格式错误，应以AKID开头';
      if (value.length < 20) return '❌ 密钥太短';
      return '✅ 格式正确';
    }
  },
  {
    name: 'TENCENT_SECRET_KEY',
    description: '腾讯云Secret Key',
    validation: (value) => {
      if (!value) return '❌ 密钥为空';
      if (value.length < 20) return '❌ 密钥太短，应至少20字符';
      return '✅ 格式正确';
    }
  },
  {
    name: 'DB_PASSWORD',
    description: '数据库密码',
    validation: (value) => {
      if (!value) return '❌ 密码为空';
      if (value.length < 12) return '❌ 密码太短，建议至少12字符';
      if (!/[A-Z]/.test(value)) return '⚠️ 建议包含大写字母';
      if (!/[a-z]/.test(value)) return '⚠️ 建议包含小写字母';
      if (!/[0-9]/.test(value)) return '⚠️ 建议包含数字';
      if (!/[^A-Za-z0-9]/.test(value)) return '⚠️ 建议包含特殊字符';
      return '✅ 强度良好';
    }
  },
  {
    name: 'JWT_SECRET',
    description: 'JWT密钥',
    validation: (value) => {
      if (!value) return '❌ 密钥为空';
      if (value.length < 20) return '❌ 密钥太短，建议至少20字符';
      return '✅ 格式正确';
    }
  },
  {
    name: 'HOST',
    description: '服务器IP地址',
    validation: (value) => {
      if (!value) return '❌ IP地址为空';
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(value)) return '❌ IP地址格式错误';
      const parts = value.split('.');
      for (let part of parts) {
        if (parseInt(part) > 255) return '❌ IP地址无效';
      }
      return '✅ 格式正确';
    }
  },
  {
    name: 'USERNAME',
    description: '服务器用户名',
    validation: (value) => {
      if (!value) return '❌ 用户名为空';
      if (value.length < 2) return '❌ 用户名太短';
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) return '❌ 用户名格式错误';
      return '✅ 格式正确';
    }
  },
  {
    name: 'PRIVATE_KEY',
    description: 'SSH私钥',
    validation: (value) => {
      if (!value) return '❌ 私钥为空';
      if (!value.includes('-----BEGIN')) return '❌ 缺少BEGIN标识';
      if (!value.includes('-----END')) return '❌ 缺少END标识';
      if (!value.includes('PRIVATE KEY')) return '❌ 不是私钥格式';
      const lines = value.split('\n').filter(line => line.trim());
      if (lines.length < 5) return '❌ 私钥内容太短';
      return '✅ 格式正确';
    }
  },
  {
    name: 'SSH_PORT',
    description: 'SSH端口（可选，默认22）',
    validation: (value) => {
      if (!value) return '✅ 可选参数，将使用默认值22';
      const port = parseInt(value);
      if (isNaN(port)) return '❌ 端口必须是数字';
      if (port < 1 || port > 65535) return '❌ 端口范围1-65535';
      if (port === 22) return '✅ 标准SSH端口';
      return `✅ 自定义SSH端口: ${port}`;
    }
  }
];

console.log('📋 请提供以下Secrets的值进行验证：\n');
console.log('⚠️  注意：本脚本仅进行格式验证，不会保存或传输您的密钥\n');

// 模拟检查（由于无法获取实际的GitHub Secrets，这里提供格式指导）
REQUIRED_SECRETS.forEach((secret, index) => {
  console.log(`${index + 1}. ${secret.name}`);
  console.log(`   描述: ${secret.description}`);
  console.log(`   状态: ⏳ 需要在GitHub仓库中手动配置`);
  console.log('');
});

console.log('🔍 验证方法：');
console.log('1. 打开GitHub仓库页面');
console.log('2. 进入 Settings → Secrets and variables → Actions');
console.log('3. 检查是否配置了上述8个Secrets');
console.log('4. 确保每个Secret的值符合格式要求\n');

console.log('🚨 常见问题排查：');
console.log('');
console.log('❌ 问题1: 缺少Secrets');
console.log('   解决: 在GitHub仓库的Settings中添加所有必需的Secrets');
console.log('');
console.log('❌ 问题2: SSH私钥格式错误');
console.log('   解决: 确保私钥包含完整的BEGIN和END标识');
console.log('');
console.log('❌ 问题3: 服务器连接失败');
console.log('   解决: 检查服务器IP、用户名、防火墙设置');
console.log('');
console.log('❌ 问题4: API密钥无效');
console.log('   解决: 验证AGICTO_API_KEY和腾讯云密钥是否正确');
console.log('');

console.log('💡 调试建议：');
console.log('1. 查看GitHub Actions运行日志中的具体错误信息');
console.log('2. 逐一验证每个Secret的配置');
console.log('3. 在本地测试SSH连接和API调用');
console.log('4. 检查服务器资源和权限设置'); 