/**
 * 部署前密钥检查脚本
 * 验证GitHub Secrets和环境变量是否正确配置
 */

// 定义必需的GitHub Secrets
const REQUIRED_SECRETS = [
  {
    name: 'AGICTO_API_KEY',
    description: 'AGICTO AI API密钥',
    example: 'sk-NKLLp5aHrdNddfM5...',
    minLength: 30,
    prefix: 'sk-'
  },
  {
    name: 'TENCENT_SECRET_ID',
    description: '腾讯云Secret ID',
    example: 'AKIDdCcsbFkBTYP5b7...',
    minLength: 20,
    prefix: 'AKID'
  },
  {
    name: 'TENCENT_SECRET_KEY',
    description: '腾讯云Secret Key',
    example: 'cK8pLfv1ub7TccbS8f...',
    minLength: 20
  },
  {
    name: 'DB_PASSWORD',
    description: '数据库密码',
    example: 'MyStr0ng_DB_P@ssw0rd_2024',
    minLength: 12
  },
  {
    name: 'JWT_SECRET',
    description: 'JWT密钥',
    example: 'MySuper_Secret_JWT_Key_2024_Very_Secure',
    minLength: 20
  },
  {
    name: 'HOST',
    description: '服务器IP地址',
    example: '123.45.67.89',
    pattern: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
  },
  {
    name: 'USERNAME',
    description: '服务器用户名',
    example: 'ubuntu',
    minLength: 3
  },
  {
    name: 'PRIVATE_KEY',
    description: 'SSH私钥',
    example: '-----BEGIN OPENSSH PRIVATE KEY-----...',
    minLength: 100,
    prefix: '-----BEGIN'
  }
];

/**
 * 检查单个密钥的有效性
 * @param {string} name - 密钥名称
 * @param {string} value - 密钥值
 * @param {Object} config - 配置对象
 * @returns {Object} 检查结果
 */
function validateSecret(name, value, config) {
  const result = {
    name,
    valid: true,
    errors: []
  };

  // 检查是否存在
  if (!value) {
    result.valid = false;
    result.errors.push('密钥不能为空');
    return result;
  }

  // 检查最小长度
  if (config.minLength && value.length < config.minLength) {
    result.valid = false;
    result.errors.push(`长度至少需要${config.minLength}个字符，当前${value.length}个字符`);
  }

  // 检查前缀
  if (config.prefix && !value.startsWith(config.prefix)) {
    result.valid = false;
    result.errors.push(`必须以"${config.prefix}"开头`);
  }

  // 检查模式匹配
  if (config.pattern && !config.pattern.test(value)) {
    result.valid = false;
    result.errors.push(`格式不正确，示例：${config.example}`);
  }

  return result;
}

/**
 * 生成配置清单
 */
function generateConfigChecklist() {
  console.log('\n🔐 AI俊才社部署密钥配置清单\n');
  console.log('请在GitHub仓库的 Settings → Secrets and variables → Actions 中配置以下密钥：\n');

  REQUIRED_SECRETS.forEach((secret, index) => {
    console.log(`${index + 1}. ${secret.name}`);
    console.log(`   描述：${secret.description}`);
    console.log(`   示例：${secret.example}`);
    if (secret.minLength) {
      console.log(`   最小长度：${secret.minLength}个字符`);
    }
    if (secret.prefix) {
      console.log(`   必须前缀：${secret.prefix}`);
    }
    console.log('');
  });

  console.log('⚠️  重要提醒：');
  console.log('1. 所有密钥都必须完整配置，缺少任何一个都会导致部署失败');
  console.log('2. AGICTO_API_KEY 是必需的，系统优先使用此密钥调用AI服务');
  console.log('3. SSH私钥必须是完整的，包含 -----BEGIN 和 -----END 标记');
  console.log('4. 数据库密码和JWT密钥必须足够复杂，包含大小写字母、数字和特殊字符');
  console.log('5. 配置完成后，推送代码到main分支即可触发自动部署\n');
}

/**
 * 模拟验证密钥（用于演示）
 */
function simulateValidation() {
  console.log('🔍 配置验证示例：\n');

  // 模拟一些测试数据
  const testSecrets = {
    'AGICTO_API_KEY': 'sk-NKLLp5aHrdNddfM5MXFuoagJXutv8QrPtMdnXy8oFEdTrAUk',
    'TENCENT_SECRET_ID': 'AKIDdCcsbFkBTYP5b7UgliWAdzA9xAHLRPCq',
    'TENCENT_SECRET_KEY': 'cK8pLfv1ub7TccbS8f2EJCtQo1EI9pLv',
    'DB_PASSWORD': 'MyStr0ng_DB_P@ssw0rd_2024',
    'JWT_SECRET': 'MySuper_Secret_JWT_Key_2024_Very_Secure',
    'HOST': '123.45.67.89',
    'USERNAME': 'ubuntu',
    'PRIVATE_KEY': '-----BEGIN OPENSSH PRIVATE KEY-----\nMIIEogIBAAKCAQEA...(省略)...==\n-----END OPENSSH PRIVATE KEY-----'
  };

  let allValid = true;

  REQUIRED_SECRETS.forEach(secret => {
    const value = testSecrets[secret.name];
    const result = validateSecret(secret.name, value, secret);
    
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.valid ? '配置正确' : '配置错误'}`);
    
    if (!result.valid) {
      result.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      allValid = false;
    }
  });

  console.log(`\n📊 验证结果：${allValid ? '✅ 所有配置正确' : '❌ 存在配置错误'}\n`);
  
  if (allValid) {
    console.log('🎉 配置验证通过！现在可以推送代码触发部署了！');
  } else {
    console.log('⚠️  请修复上述配置错误后再进行部署。');
  }
}

/**
 * 生成环境变量模板
 */
function generateEnvTemplate() {
  console.log('\n📄 .env 文件模板：\n');
  console.log('# AI俊才社简历管理系统 - 环境变量配置');
  console.log('# 请复制此模板并填入您的真实配置\n');
  
  console.log('# 生产环境标识');
  console.log('NODE_ENV=production\n');
  
  console.log('# 数据库配置');
  console.log('DB_HOST=127.0.0.1');
  console.log('DB_PORT=5432');
  console.log('DB_NAME=resume_db');
  console.log('DB_USER=resume_user');
  console.log('DB_PASSWORD=您的数据库密码\n');
  
  console.log('# JWT配置');
  console.log('JWT_SECRET=您的JWT密钥\n');
  
  console.log('# AI API配置（agicto代理，更稳定）');
  console.log('AGICTO_API_KEY=您的AGICTO_API密钥');
  console.log('OPENAI_BASE_URL=https://api.agicto.cn/v1\n');
  
  console.log('# 腾讯云邮件服务配置');
  console.log('TENCENT_SECRET_ID=您的腾讯云Secret_ID');
  console.log('TENCENT_SECRET_KEY=您的腾讯云Secret_Key');
  console.log('TENCENT_SES_TEMPLATE_ID=31516');
  console.log('TENCENT_SES_FROM_EMAIL=admin@juncaishe.com');
  console.log('TENCENT_SES_FROM_NAME=AI俊才社\n');
}

// 主函数
function main() {
  console.log('🚀 AI俊才社简历管理系统 - 部署配置检查工具\n');
  console.log('====================================================');
  
  generateConfigChecklist();
  simulateValidation();
  generateEnvTemplate();
  
  console.log('====================================================');
  console.log('💡 使用提示：');
  console.log('1. 配置完所有GitHub Secrets后');
  console.log('2. 推送代码：git push origin main');
  console.log('3. 观察GitHub Actions部署状态');
  console.log('4. 部署完成后访问您的域名测试功能\n');
}

// 如果是直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  validateSecret,
  REQUIRED_SECRETS,
  generateConfigChecklist
}; 