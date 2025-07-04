/**
 * 简历渲染控制器
 * 处理简历模板选择、预览和PDF生成
 */

const { Resume } = require('../models/Resume');
const ResumeTemplate = require('../models/ResumeTemplate');
const ResumeRender = require('../models/ResumeRender');
const path = require('path');
const fs = require('fs').promises;
const PDFService = require('../services/pdfService');
const Handlebars = require('handlebars');

class ResumeRenderController {
  /**
   * 获取所有可用的简历模板
   * GET /api/resume-render/templates
   */
  static async getTemplates(req, res) {
    try {
      console.log('📋 [简历模板] 获取模板列表');
      
      const templates = await ResumeTemplate.findAllActive();
      
      console.log(`✅ [简历模板] 获取到 ${templates.length} 个模板`);
      
      res.json({
        success: true,
        data: templates,
        message: '模板列表获取成功'
      });
    } catch (error) {
      console.error('❌ [简历模板] 获取模板列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取模板列表失败',
        error: error.message
      });
    }
  }

  /**
   * 获取单个模板详情
   * GET /api/resume-render/templates/:id
   */
  static async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      console.log(`📋 [简历模板] 获取模板详情 ID: ${id}`);
      
      const template = await ResumeTemplate.findById(parseInt(id));
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: '模板不存在'
        });
      }
      
      console.log(`✅ [简历模板] 获取模板详情成功: ${template.name}`);
      
      res.json({
        success: true,
        data: template,
        message: '模板详情获取成功'
      });
    } catch (error) {
      console.error('❌ [简历模板] 获取模板详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取模板详情失败',
        error: error.message
      });
    }
  }

  /**
   * 预览简历渲染效果
   * POST /api/resume-render/preview
   * Body: { resumeId, templateId }
   */
  static async previewResume(req, res) {
    try {
      const { resumeId, templateId } = req.body;
      const userId = req.user.userId;
      
      console.log(`🔍 [简历预览] 用户ID: ${userId}, 简历ID: ${resumeId}, 模板ID: ${templateId}`);
      
      // 验证参数
      if (!resumeId || !templateId) {
        return res.status(400).json({
          success: false,
          message: '简历ID和模板ID都是必需的'
        });
      }
      
      // 获取简历数据
      const resume = await Resume.findById(resumeId);
      if (!resume || resume.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权访问'
        });
      }
      
      // 获取模板数据
      const template = await ResumeTemplate.findById(templateId);
      if (!template || !template.is_active) {
        return res.status(404).json({
          success: false,
          message: '模板不存在或已禁用'
        });
      }
      
      // 转换简历数据为模板需要的格式
      const formattedData = ResumeRenderController.formatResumeData(resume);
      
      // 生成HTML预览
      const htmlContent = await ResumeRenderController.generateHtmlFromConfig(formattedData, template);
      
      console.log(`✅ [简历预览] 预览生成成功`);
      
      res.json({
        success: true,
        data: {
          html: htmlContent,
          template: {
            id: template.id,
            name: template.name,
            description: template.description
          },
          resume: {
            id: resume.id,
            title: resume.title
          }
        },
        message: '简历预览生成成功'
      });
    } catch (error) {
      console.error('❌ [简历预览] 预览生成失败:', error);
      res.status(500).json({
        success: false,
        message: '简历预览生成失败',
        error: error.message
      });
    }
  }

  /**
   * 渲染并保存简历
   * POST /api/resume-render/render
   * Body: { resumeId, templateId, format? }
   */
  static async renderResume(req, res) {
    try {
      const { resumeId, templateId, format = 'html' } = req.body;
      const userId = req.user.userId;
      
      console.log(`🎨 [简历渲染] 用户ID: ${userId}, 简历ID: ${resumeId}, 模板ID: ${templateId}, 格式: ${format}`);
      
      // 验证参数
      if (!resumeId || !templateId) {
        return res.status(400).json({
          success: false,
          message: '简历ID和模板ID都是必需的'
        });
      }
      
      // 获取简历数据
      const resume = await Resume.findById(resumeId);
      if (!resume || resume.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权访问'
        });
      }
      
      // 获取模板数据
      const template = await ResumeTemplate.findById(templateId);
      if (!template || !template.is_active) {
        return res.status(404).json({
          success: false,
          message: '模板不存在或已禁用'
        });
      }
      
      // 转换简历数据为模板需要的格式
      const formattedData = ResumeRenderController.formatResumeData(resume);
      
      // 创建渲染记录
      const renderRecord = await ResumeRender.create({
        user_id: userId,
        resume_id: resumeId,
        template_id: templateId,
        rendered_data: JSON.stringify(formattedData),
        status: 'pending'
      });
      
      try {
        // 生成HTML内容
        const htmlContent = await ResumeRenderController.generateHtmlFromConfig(formattedData, template);
        
        let result = {
          id: renderRecord.id,
          html: htmlContent,
          format: 'html'
        };
        
        // 如果请求PDF格式，生成PDF
        if (format === 'pdf') {
          // TODO: 集成PDF生成功能
          console.log('📄 [PDF生成] PDF生成功能待实现');
          result.pdf_url = null;
          result.format = 'html'; // 暂时返回HTML
        }
        
        // 更新渲染记录状态
        await ResumeRender.update(renderRecord.id, {
          status: 'completed'
        });
        
        console.log(`✅ [简历渲染] 渲染完成 ID: ${renderRecord.id}`);
        
        res.json({
          success: true,
          data: result,
          message: '简历渲染完成'
        });
        
      } catch (renderError) {
        // 更新渲染记录为失败状态
        await ResumeRender.update(renderRecord.id, {
          status: 'failed',
          error_message: renderError.message
        });
        throw renderError;
      }
      
    } catch (error) {
      console.error('❌ [简历渲染] 渲染失败:', error);
      res.status(500).json({
        success: false,
        message: '简历渲染失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户的渲染历史
   * GET /api/resume-render/history
   */
  static async getRenderHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;
      
      console.log(`📖 [渲染历史] 用户ID: ${userId}, 页码: ${page}, 限制: ${limit}`);
      
      const { renders, total } = await ResumeRender.findByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      console.log(`✅ [渲染历史] 获取到 ${renders.length} 条记录，总计 ${total} 条`);
      
      res.json({
        success: true,
        data: {
          renders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        },
        message: '渲染历史获取成功'
      });
    } catch (error) {
      console.error('❌ [渲染历史] 获取失败:', error);
      res.status(500).json({
        success: false,
        message: '获取渲染历史失败',
        error: error.message
      });
    }
  }

  /**
   * 格式化简历数据为模板渲染需要的格式
   * @param {Object} resume - 原始简历数据
   * @returns {Object} 格式化后的数据
   */
  static formatResumeData(resume) {
    console.log('🔍 [数据格式化] 开始处理简历数据:', {
      resumeId: resume.id,
      hasContent: !!resume.content,
      hasResumeData: !!resume.resume_data,
      contentType: typeof resume.content,
      resumeDataType: typeof resume.resume_data,
      contentLength: resume.content ? resume.content.length : 0
    });

    let content;
    try {
      // 尝试从resume_data或content字段获取简历内容
      const rawContent = resume.resume_data || resume.content || {};
      content = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
      
      console.log('🔍 [数据格式化] 原始内容结构:', {
        keys: Object.keys(content),
        hasWorkExperience: !!content.work_experience,
        hasExperience: !!content.experience,
        hasEducation: !!content.education,
        hasSkills: !!content.skills,
        hasProjects: !!content.projects,
        workExpCount: Array.isArray(content.work_experience) ? content.work_experience.length : 0,
        expCount: Array.isArray(content.experience) ? content.experience.length : 0,
        eduCount: Array.isArray(content.education) ? content.education.length : 0,
        skillsCount: Array.isArray(content.skills) ? content.skills.length : 0,
        projectsCount: Array.isArray(content.projects) ? content.projects.length : 0
      });
      
    } catch (error) {
      console.error('❌ [数据格式化] 简历内容解析失败:', error);
      content = {};
    }

    const profile = content.profile || {};

    // 处理技能数据 - 转换为数组格式
    let skillsArray = [];
    if (content.skills) {
      if (Array.isArray(content.skills)) {
        skillsArray = content.skills;
      } else if (typeof content.skills === 'object') {
        // 从对象结构中提取技能
        const allSkills = [];
        if (Array.isArray(content.skills.technical)) {
          allSkills.push(...content.skills.technical.map(skill => ({
            name: skill,
            category: '技术技能'
          })));
        }
        if (Array.isArray(content.skills.professional)) {
          allSkills.push(...content.skills.professional.map(skill => ({
            name: skill,
            category: '专业技能'
          })));
        }
        if (Array.isArray(content.skills.soft)) {
          allSkills.push(...content.skills.soft.map(skill => ({
            name: skill,
            category: '软技能'
          })));
        }
        if (Array.isArray(content.skills.certifications)) {
          allSkills.push(...content.skills.certifications.map(skill => ({
            name: skill,
            category: '认证证书'
          })));
        }
        skillsArray = allSkills;
      }
    }

    const formattedData = {
      // 个人信息 - 使用新格式
      name: profile.name || content.name || '姓名',
      title: profile.title || content.title || '',
      email: profile.email || content.email || '',
      phone: profile.phone || content.phone || '',
      location: profile.location || content.location || '',
      portfolio: profile.portfolio || content.portfolio || '',
      linkedin: profile.linkedin || content.linkedin || '',
      github: profile.github || content.github || '',
      
      // 简介/目标
      summary: profile.summary || content.summary || '',
      
      // 工作经历 - 使用新格式
      experience: ResumeRenderController.formatWorkExperience(content.workExperience || content.work_experience || content.experience || []),
      
      // 教育背景 - 使用正确的字段名
      education: ResumeRenderController.formatEducation(content.educations || content.education || []),
      
      // 技能 - 使用处理后的技能数组
      skills: ResumeRenderController.formatSkills(skillsArray),
      
      // 项目经验
      projects: ResumeRenderController.formatProjects(content.projects || []),
      
      // 其他信息
      languages: ResumeRenderController.formatLanguages(content.languages || []),
      certifications: ResumeRenderController.formatCertifications(content.certifications || []),
      awards: ResumeRenderController.formatAwards(content.awards || [])
    };

    console.log('✅ [数据格式化] 格式化完成:', {
      name: formattedData.name,
      hasSummary: !!formattedData.summary,
      experienceCount: formattedData.experience.length,
      educationCount: formattedData.education.length,
      skillsCount: formattedData.skills.length,
      projectsCount: formattedData.projects.length,
      languagesCount: formattedData.languages.length,
      certificationsCount: formattedData.certifications.length,
      awardsCount: formattedData.awards.length
    });

    return formattedData;
  }

  /**
   * 格式化工作经历
   */
  static formatWorkExperience(experience) {
    if (!Array.isArray(experience)) return [];
    
    return experience.map(exp => ({
      company: exp.company || '',
      position: exp.position || exp.title || '',
      location: exp.location || '',
      startDate: exp.start_date || exp.startDate || '',
      endDate: exp.end_date || exp.endDate || '至今',
      isCurrent: exp.is_current || exp.isCurrent || false,
      description: exp.description || '',
      achievements: Array.isArray(exp.achievements) ? exp.achievements : []
    }));
  }

  /**
   * 格式化教育背景
   */
  static formatEducation(education) {
    if (!Array.isArray(education)) return [];
    
    return education.map(edu => ({
      school: edu.school || edu.institution || '',
      degree: edu.degree || '',
      major: edu.major || edu.field || '',
      location: edu.location || '',
      startDate: edu.start_date || edu.startDate || '',
      endDate: edu.end_date || edu.endDate || '',
      gpa: edu.gpa || '',
      description: edu.description || ''
    }));
  }

  /**
   * 格式化技能
   */
  static formatSkills(skills) {
    if (!Array.isArray(skills)) return [];
    
    return skills.map(skill => ({
      name: skill.name || skill,
      level: skill.level || '',
      category: skill.category || '技能'
    }));
  }

  /**
   * 格式化项目经验
   */
  static formatProjects(projects) {
    if (!Array.isArray(projects)) return [];
    
    return projects.map(project => ({
      name: project.name || project.title || '',
      description: project.description || '',
      technologies: Array.isArray(project.technologies) ? project.technologies : [],
      url: project.url || project.link || '',
      startDate: project.start_date || project.startDate || '',
      endDate: project.end_date || project.endDate || ''
    }));
  }

  /**
   * 格式化语言能力
   */
  static formatLanguages(languages) {
    if (!Array.isArray(languages)) return [];
    
    return languages.map(lang => ({
      name: lang.name || lang,
      level: lang.level || ''
    }));
  }

  /**
   * 格式化证书
   */
  static formatCertifications(certifications) {
    if (!Array.isArray(certifications)) return [];
    
    return certifications.map(cert => ({
      name: cert.name || cert.title || '',
      issuer: cert.issuer || cert.organization || '',
      date: cert.date || cert.issue_date || '',
      url: cert.url || ''
    }));
  }

  /**
   * 格式化奖项
   */
  static formatAwards(awards) {
    if (!Array.isArray(awards)) return [];
    
    return awards.map(award => ({
      name: award.name || award.title || '',
      issuer: award.issuer || award.organization || '',
      date: award.date || '',
      description: award.description || ''
    }));
  }

  /**
   * 根据模板配置生成HTML内容
   * @param {Object} data - 格式化后的简历数据
   * @param {Object} template - 模板对象
   * @returns {Promise<String>} HTML内容
   */
  static async generateHtmlFromConfig(data, template) {
    const config = template.template_config;
    
    // 检查是否有对应的HTML模板文件
    const templateFileName = ResumeRenderController.getTemplateFileName(template.name);
    const templatePath = path.join(__dirname, '../templates/resume', templateFileName);
    
    try {
      // 尝试读取HTML模板文件
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      console.log(`✅ [模板渲染] 使用HTML模板文件: ${templateFileName}`);
      
      // 使用Handlebars编译模板
      const compiledTemplate = Handlebars.compile(templateContent);
      
      // 渲染模板
      const result = compiledTemplate(data);
      
      return result;
      
    } catch (error) {
      // 如果模板文件不存在，回退到动态生成
      console.log(`📝 [模板渲染] 使用动态生成，模板: ${template.name}`);
      
      // 基础HTML结构
      let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name}的简历</title>
    <style>
        ${ResumeRenderController.generateCSSFromConfig(config)}
    </style>
</head>
<body>
    <div class="resume-container ${config.layout || 'single-column'}">
        ${ResumeRenderController.generateSectionsFromConfig(data, config)}
    </div>
</body>
</html>`;
      
      return html;
    }
  }

  /**
   * 根据模板名称获取对应的HTML文件名
   */
  static getTemplateFileName(templateName) {
    const nameMap = {
      '经典商务': 'simple-blue.html',
      '现代创意': 'creative-green.html',
      '技术极简': 'business-dark.html',
      '学术研究': 'simple-blue.html',
      '销售营销': 'creative-green.html',
      '专业侧边栏': 'professional-sidebar.html'
    };
    
    return nameMap[templateName] || 'simple-blue.html';
  }

  /**
   * 根据配置生成CSS样式
   */
  static generateCSSFromConfig(config) {
    const colors = config.colors || {};
    const fonts = config.fonts || {};
    
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: ${fonts.body || 'Arial, sans-serif'}; 
            line-height: 1.6; 
            color: ${colors.text || '#333'};
            background: #fff;
        }
        .resume-container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            ${config.layout === 'two-column' ? 'display: grid; grid-template-columns: 300px 1fr; gap: 30px; min-height: 100vh;' : ''}
        }
        /* 确保PDF打印时内容不被截断 */
        @media print {
            .resume-container { 
                max-width: none; 
                margin: 0; 
                padding: 10px;
            }
            .section { 
                break-inside: avoid; 
                page-break-inside: avoid;
                margin-bottom: 20px;
            }
            .experience-item, .education-item, .project-item {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }
        .section { margin-bottom: 30px; }
        .section-title { 
            font-family: ${fonts.heading || fonts.body || 'Arial, sans-serif'};
            font-size: 18px; 
            font-weight: bold; 
            color: ${colors.primary || '#2563eb'}; 
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 2px solid ${colors.primary || '#2563eb'};
        }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { 
            font-family: ${fonts.heading || fonts.body || 'Arial, sans-serif'};
            font-size: 28px; 
            color: ${colors.primary || '#2563eb'}; 
            margin-bottom: 5px; 
        }
        .header .title { 
            font-size: 16px; 
            color: ${colors.secondary || '#64748b'}; 
            margin-bottom: 15px; 
        }
        .contact-info { 
            display: flex; 
            justify-content: center; 
            flex-wrap: wrap; 
            gap: 15px; 
            font-size: 14px; 
        }
        .contact-item { color: ${colors.secondary || '#64748b'}; }
        .experience-item, .education-item, .project-item { 
            margin-bottom: 20px; 
        }
        .item-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 5px; 
        }
        .item-title { 
            font-weight: bold; 
            color: ${colors.primary || '#2563eb'}; 
        }
        .item-company, .item-school { 
            font-weight: 500; 
            color: ${colors.text || '#333'}; 
        }
        .item-date { 
            color: ${colors.secondary || '#64748b'}; 
            font-size: 14px; 
        }
        .item-description { 
            margin-top: 8px; 
            color: ${colors.text || '#333'}; 
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .skills-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 10px; 
        }
        .skill-item { 
            padding: 8px 12px; 
            background: ${colors.primary || '#2563eb'}15; 
            border-radius: 5px; 
            color: ${colors.text || '#333'}; 
        }
        ${config.layout === 'two-column' ? `
            .left-column { }
            .right-column { }
        ` : ''}
    `;
  }

  /**
   * 根据配置生成HTML部分
   */
  static generateSectionsFromConfig(data, config) {
    const sections = config.sections || ['header', 'summary', 'experience', 'education', 'skills'];
    let html = '';
    
    // 如果是双栏布局
    if (config.layout === 'two-column') {
      const leftSections = ['header', 'summary', 'skills'];
      const rightSections = ['experience', 'education', 'projects'];
      
      html += '<div class="left-column">';
      leftSections.forEach(section => {
        if (sections.includes(section)) {
          html += ResumeRenderController.generateSectionHTML(section, data);
        }
      });
      html += '</div>';
      
      html += '<div class="right-column">';
      rightSections.forEach(section => {
        if (sections.includes(section)) {
          html += ResumeRenderController.generateSectionHTML(section, data);
        }
      });
      html += '</div>';
    } else {
      sections.forEach(section => {
        html += ResumeRenderController.generateSectionHTML(section, data);
      });
    }
    
    return html;
  }

  /**
   * 生成单个部分的HTML
   */
  static generateSectionHTML(section, data) {
    switch (section) {
      case 'header':
        return `
          <div class="header">
            <h1>${data.name}</h1>
            <div class="title">${data.title}</div>
            <div class="contact-info">
              ${data.email ? `<span class="contact-item">📧 ${data.email}</span>` : ''}
              ${data.phone ? `<span class="contact-item">📱 ${data.phone}</span>` : ''}
              ${data.location ? `<span class="contact-item">📍 ${data.location}</span>` : ''}
              ${data.portfolio ? `<span class="contact-item">🌐 ${data.portfolio}</span>` : ''}
            </div>
          </div>
        `;
      
      case 'summary':
        return data.summary ? `
          <div class="section">
            <h2 class="section-title">个人简介</h2>
            <div class="item-description">${data.summary}</div>
          </div>
        ` : '';
      
      case 'experience':
        return data.experience.length > 0 ? `
          <div class="section">
            <h2 class="section-title">工作经历</h2>
            ${data.experience.map(exp => `
              <div class="experience-item">
                <div class="item-header">
                  <div>
                    <div class="item-title">${exp.position}</div>
                    <div class="item-company">${exp.company}</div>
                  </div>
                  <div class="item-date">${exp.startDate} - ${exp.endDate}</div>
                </div>
                ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : '';
      
      case 'education':
        return data.education.length > 0 ? `
          <div class="section">
            <h2 class="section-title">教育背景</h2>
            ${data.education.map(edu => `
              <div class="education-item">
                <div class="item-header">
                  <div>
                    <div class="item-title">${edu.degree} - ${edu.major}</div>
                    <div class="item-school">${edu.school}</div>
                  </div>
                  <div class="item-date">${edu.startDate} - ${edu.endDate}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '';
      
      case 'skills':
        return data.skills.length > 0 ? `
          <div class="section">
            <h2 class="section-title">专业技能</h2>
            <div class="skills-grid">
              ${data.skills.map(skill => `
                <div class="skill-item">${skill.name}</div>
              `).join('')}
            </div>
          </div>
        ` : '';
      
      case 'projects':
        return data.projects.length > 0 ? `
          <div class="section">
            <h2 class="section-title">项目经验</h2>
            ${data.projects.map(project => `
              <div class="project-item">
                <div class="item-header">
                  <div>
                    <div class="item-title">${project.name}</div>
                  </div>
                  <div class="item-date">${project.startDate} - ${project.endDate}</div>
                </div>
                ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : '';
      
      default:
        return '';
    }
  }

  /**
   * 生成PDF格式简历
   * POST /api/resume-render/pdf
   * Body: { resumeId, templateId, options? }
   */
  static async generatePDF(req, res) {
    const requestId = req.requestId || Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    try {
      const { resumeId, templateId, options = {} } = req.body;
      const userId = req.user.userId;

      console.log('📄 [生成PDF] 开始生成:', { 
        userId, 
        resumeId, 
        templateId, 
        requestId 
      });

      // 参数验证
      if (!resumeId || !templateId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：resumeId 和 templateId',
          request_id: requestId
        });
      }

      // 获取简历数据
      const resume = await Resume.findByIdAndUser(resumeId, userId);
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: '简历不存在或无权访问',
          request_id: requestId
        });
      }

      // 获取模板
      const template = await ResumeTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: '模板不存在',
          request_id: requestId
        });
      }

      // 检查浏览器是否可用
      const browserAvailable = await PDFService.checkBrowserAvailable();
      if (!browserAvailable) {
        return res.status(500).json({
          success: false,
          message: 'PDF生成服务暂时不可用，请稍后再试',
          request_id: requestId
        });
      }

      // 格式化简历数据
      const formattedData = ResumeRenderController.formatResumeData(resume);
      
      // 调试：记录格式化后的数据
      console.log('🔍 [PDF调试] 格式化后的数据:', {
        sections: Object.keys(formattedData),
        experienceCount: formattedData.experience?.length || 0,
        educationCount: formattedData.education?.length || 0,
        skillsCount: formattedData.skills?.length || 0,
        projectsCount: formattedData.projects?.length || 0,
        hasName: !!formattedData.name,
        hasSummary: !!formattedData.summary
      });
      
      // 渲染HTML
      const renderedHTML = await ResumeRenderController.generateHtmlFromConfig(
        formattedData, 
        template
      );

      // 调试：记录HTML长度和关键内容
      console.log('📝 [PDF调试] HTML生成情况:', {
        htmlLength: renderedHTML.length,
        containsExperience: renderedHTML.includes('工作经历'),
        containsEducation: renderedHTML.includes('教育背景'),
        containsSkills: renderedHTML.includes('专业技能'),
        containsProjects: renderedHTML.includes('项目经验'),
        containsSummary: renderedHTML.includes('个人简介')
      });

      // 生成PDF
      const pdfResult = await PDFService.generateResumePDF(
        renderedHTML,
        resume.title || '我的简历',
        userId,
        options
      );

      // 保存渲染记录
      await ResumeRender.create({
        user_id: userId,
        resume_id: resumeId,
        template_id: templateId,
        output_format: 'pdf',
        file_path: pdfResult.filePath,
        file_size: pdfResult.fileSize,
        status: 'completed',
        metadata: {
          original_format: 'html',
          pdf_options: options,
          generation_time: new Date().toISOString()
        }
      });

      console.log('✅ [生成PDF] 成功生成:', pdfResult.filename);

      res.json({
        success: true,
        message: 'PDF生成成功',
        data: {
          filename: pdfResult.filename,
          downloadUrl: pdfResult.downloadUrl,
          fileSize: pdfResult.fileSize,
          resumeTitle: resume.title
        },
        request_id: requestId
      });

    } catch (error) {
      console.error('❌ [生成PDF] 失败:', error);
      res.status(500).json({
        success: false,
        message: 'PDF生成失败',
        error: error.message,
        request_id: requestId
      });
    }
  }

  /**
   * 下载PDF文件
   * GET /api/resume-render/download/:filename
   */
  static async downloadPDF(req, res) {
    try {
      const { filename } = req.params;
      const userId = req.user.userId;

      console.log('⬇️ [下载PDF] 用户请求下载:', { userId, filename });

      // 安全检查：确保文件名包含用户ID
      if (!filename.includes(`resume_${userId}_`)) {
        return res.status(403).json({
          success: false,
          message: '无权访问此文件'
        });
      }

      const filePath = path.join(__dirname, '..', 'uploads', 'pdfs', filename);
      
      // 检查文件是否存在
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }

      // 对文件名进行编码以支持中文
      const encodedFilename = encodeURIComponent(filename);
      
      // 设置响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      
      // 发送文件
      res.sendFile(filePath);

    } catch (error) {
      console.error('❌ [下载PDF] 失败:', error);
      res.status(500).json({
        success: false,
        message: '文件下载失败',
        error: error.message
      });
    }
  }
}

module.exports = ResumeRenderController;