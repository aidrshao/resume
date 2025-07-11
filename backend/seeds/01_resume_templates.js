/**
 * 简历模板种子数据
 * 插入一些基础的简历模板
 */

exports.seed = async function(knex) {
  // 幂等处理：不再删除全部数据，改为按需插入
  
  // 定义模板数据列表
  const templates = [
    {
      id: 1,
      name: '经典商务',
      description: '简洁专业的商务风格模板，适合大多数行业',

      template_config: {
        layout: 'single-column',
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          text: '#1e293b'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter'
        },
        sections: ['header', 'summary', 'experience', 'education', 'skills']
      },
      is_premium: false,
      is_active: true,
      sort_order: 1,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      name: '现代创意',
      description: '现代设计风格，适合创意和设计行业',

      template_config: {
        layout: 'two-column',
        colors: {
          primary: '#7c3aed',
          secondary: '#a78bfa',
          text: '#374151'
        },
        fonts: {
          heading: 'Poppins',
          body: 'Inter'
        },
        sections: ['header', 'summary', 'skills', 'experience', 'education', 'projects']
      },
      is_premium: true,
      is_active: true,
      sort_order: 2,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 3,
      name: '技术极简',
      description: '极简风格，专为技术岗位设计',

      template_config: {
        layout: 'single-column',
        colors: {
          primary: '#059669',
          secondary: '#6b7280',
          text: '#111827'
        },
        fonts: {
          heading: 'JetBrains Mono',
          body: 'Inter'
        },
        sections: ['header', 'summary', 'skills', 'experience', 'projects', 'education']
      },
      is_premium: false,
      is_active: true,
      sort_order: 3,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 4,
      name: '学术研究',
      description: '适合学术界和研究岗位的正式模板',

      template_config: {
        layout: 'single-column',
        colors: {
          primary: '#1f2937',
          secondary: '#4b5563',
          text: '#374151'
        },
        fonts: {
          heading: 'Georgia',
          body: 'Georgia'
        },
        sections: ['header', 'summary', 'education', 'experience', 'publications', 'skills']
      },
      is_premium: true,
      is_active: true,
      sort_order: 4,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 5,
      name: '销售营销',
      description: '动感活力的设计，适合销售和营销岗位',

      template_config: {
        layout: 'two-column',
        colors: {
          primary: '#dc2626',
          secondary: '#f87171',
          text: '#1f2937'
        },
        fonts: {
          heading: 'Montserrat',
          body: 'Inter'
        },
        sections: ['header', 'summary', 'experience', 'achievements', 'skills', 'education']
      },
      is_premium: true,
      is_active: true,
      sort_order: 5,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 6,
      name: '专业侧边栏',
      description: '专业的侧边栏布局，左侧展示个人信息，右侧展示核心内容',
      template_config: {
        layout: 'sidebar',
        colors: {
          primary: '#2c3e50',
          secondary: '#f9c922',
          text: '#333333',
          sidebar: '#2c3e50',
          accent: '#f9c922'
        },
        fonts: {
          heading: 'PingFang SC',
          body: 'PingFang SC'
        },
        sections: ['header', 'summary', 'experience', 'education', 'skills', 'projects', 'languages', 'references']
      },
      is_premium: false,
      is_active: true,
      sort_order: 6,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // 幂等插入：如已存在相同 name 的模板则跳过
  for (const tpl of templates) {
    const exists = await knex('resume_templates').where({ name: tpl.name }).first();
    if (!exists) {
      await knex('resume_templates').insert(tpl);
    }
  }

  console.log('✅ [SEED] resume_templates 已同步 (幂等)');
}; 