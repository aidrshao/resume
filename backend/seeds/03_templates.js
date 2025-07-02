/**
 * 模板种子数据
 * 用于插入初始的简历模板数据
 * 创建时间：2025-07-02
 */

exports.seed = function(knex) {
  // 清空现有数据
  return knex('templates').del()
    .then(function () {
      // 插入种子数据
      return knex('templates').insert([
        {
          id: 1,
          name: '经典商务模板',
          html_content: `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{personalInfo.name}} - 简历</title>
</head>
<body>
    <div class="resume-container">
        <!-- 个人信息 -->
        <header class="header">
            <h1 class="name">{{personalInfo.name}}</h1>
            <div class="contact-info">
                <span class="phone">{{personalInfo.phone}}</span>
                <span class="email">{{personalInfo.email}}</span>
                <span class="location">{{personalInfo.location}}</span>
            </div>
        </header>

        <!-- 个人简介 -->
        {{#if personalInfo.summary}}
        <section class="summary">
            <h2>个人简介</h2>
            <p>{{personalInfo.summary}}</p>
        </section>
        {{/if}}

        <!-- 工作经历 -->
        {{#if workExperiences}}
        <section class="work-experience">
            <h2>工作经历</h2>
            {{#each workExperiences}}
            <div class="experience-item">
                <div class="experience-header">
                    <h3>{{position}}</h3>
                    <span class="company">{{company}}</span>
                    <span class="duration">{{startDate}} - {{endDate}}</span>
                </div>
                <p class="description">{{description}}</p>
            </div>
            {{/each}}
        </section>
        {{/if}}

        <!-- 教育经历 -->
        {{#if educations}}
        <section class="education">
            <h2>教育经历</h2>
            {{#each educations}}
            <div class="education-item">
                <div class="education-header">
                    <h3>{{school}}</h3>
                    <span class="degree">{{degree}} - {{major}}</span>
                    <span class="duration">{{startDate}} - {{endDate}}</span>
                </div>
                {{#if gpa}}<p class="gpa">GPA: {{gpa}}</p>{{/if}}
            </div>
            {{/each}}
        </section>
        {{/if}}

        <!-- 技能 -->
        {{#if skills}}
        <section class="skills">
            <h2>专业技能</h2>
            <div class="skills-list">
                {{#each skills}}
                <span class="skill-tag">{{this}}</span>
                {{/each}}
            </div>
        </section>
        {{/if}}

        <!-- 项目经历 -->
        {{#if projects}}
        <section class="projects">
            <h2>项目经历</h2>
            {{#each projects}}
            <div class="project-item">
                <div class="project-header">
                    <h3>{{name}}</h3>
                    <span class="duration">{{startDate}} - {{endDate}}</span>
                </div>
                <p class="description">{{description}}</p>
                {{#if technologies}}
                <div class="technologies">
                    <strong>技术栈：</strong>
                    {{#each technologies}}
                    <span class="tech-tag">{{this}}</span>
                    {{/each}}
                </div>
                {{/if}}
            </div>
            {{/each}}
        </section>
        {{/if}}
    </div>
</body>
</html>`,
          css_content: `
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    color: #333;
    background-color: #f5f5f5;
}

.resume-container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 40px;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
    border-radius: 8px;
}

.header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 3px solid #2563eb;
}

.name {
    font-size: 2.5em;
    margin: 0 0 10px 0;
    color: #2563eb;
    font-weight: 700;
}

.contact-info {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
}

.contact-info span {
    color: #666;
    font-size: 1.1em;
}

section {
    margin-bottom: 30px;
}

h2 {
    color: #2563eb;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 5px;
    margin-bottom: 20px;
    font-size: 1.4em;
}

.experience-item, .education-item, .project-item {
    margin-bottom: 20px;
    padding: 15px 0;
}

.experience-header, .education-header, .project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.experience-header h3, .education-header h3, .project-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.2em;
}

.company, .degree, .duration {
    color: #666;
    font-weight: 500;
}

.description {
    color: #4b5563;
    margin: 10px 0;
}

.skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.skill-tag {
    background: #e5e7eb;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.9em;
    color: #374151;
}

.technologies {
    margin-top: 10px;
}

.tech-tag {
    background: #dbeafe;
    color: #2563eb;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.8em;
    margin-right: 8px;
}

@media (max-width: 768px) {
    .resume-container {
        padding: 20px;
    }
    
    .experience-header, .education-header, .project-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .contact-info {
        flex-direction: column;
        gap: 10px;
    }
}

@media print {
    body {
        background: white;
        padding: 0;
    }
    
    .resume-container {
        box-shadow: none;
        border-radius: 0;
        padding: 20px;
    }
}`,
          thumbnail_url: '/images/templates/classic-business-thumbnail.jpg',
          is_premium: false,
          status: 'published',
          category: 'business',
          description: '经典商务风格简历模板，适合商务、管理等职位',
          sort_order: 1,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: '现代简约模板',
          html_content: `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{personalInfo.name}} - 简历</title>
</head>
<body>
    <div class="resume-container">
        <div class="sidebar">
            <!-- 个人信息 -->
            <div class="personal-info">
                <h1 class="name">{{personalInfo.name}}</h1>
                <div class="contact">
                    <div class="contact-item">
                        <span class="icon">📱</span>
                        <span>{{personalInfo.phone}}</span>
                    </div>
                    <div class="contact-item">
                        <span class="icon">✉️</span>
                        <span>{{personalInfo.email}}</span>
                    </div>
                    <div class="contact-item">
                        <span class="icon">📍</span>
                        <span>{{personalInfo.location}}</span>
                    </div>
                </div>
            </div>

            <!-- 技能 -->
            {{#if skills}}
            <div class="skills-section">
                <h2>技能</h2>
                <div class="skills-list">
                    {{#each skills}}
                    <div class="skill-item">{{this}}</div>
                    {{/each}}
                </div>
            </div>
            {{/if}}

            <!-- 语言 -->
            {{#if languages}}
            <div class="languages-section">
                <h2>语言</h2>
                <div class="languages-list">
                    {{#each languages}}
                    <div class="language-item">{{this}}</div>
                    {{/each}}
                </div>
            </div>
            {{/if}}
        </div>

        <div class="main-content">
            <!-- 个人简介 -->
            {{#if personalInfo.summary}}
            <section class="summary">
                <h2>个人简介</h2>
                <p>{{personalInfo.summary}}</p>
            </section>
            {{/if}}

            <!-- 工作经历 -->
            {{#if workExperiences}}
            <section class="work-experience">
                <h2>工作经历</h2>
                {{#each workExperiences}}
                <div class="experience-item">
                    <div class="timeline-dot"></div>
                    <div class="experience-content">
                        <h3>{{position}}</h3>
                        <div class="company-info">
                            <span class="company">{{company}}</span>
                            <span class="duration">{{startDate}} - {{endDate}}</span>
                        </div>
                        <p class="description">{{description}}</p>
                    </div>
                </div>
                {{/each}}
            </section>
            {{/if}}

            <!-- 教育经历 -->
            {{#if educations}}
            <section class="education">
                <h2>教育经历</h2>
                {{#each educations}}
                <div class="education-item">
                    <div class="timeline-dot"></div>
                    <div class="education-content">
                        <h3>{{school}}</h3>
                        <div class="degree-info">
                            <span class="degree">{{degree}} - {{major}}</span>
                            <span class="duration">{{startDate}} - {{endDate}}</span>
                        </div>
                        {{#if gpa}}<p class="gpa">GPA: {{gpa}}</p>{{/if}}
                    </div>
                </div>
                {{/each}}
            </section>
            {{/if}}

            <!-- 项目经历 -->
            {{#if projects}}
            <section class="projects">
                <h2>项目经历</h2>
                {{#each projects}}
                <div class="project-item">
                    <h3>{{name}}</h3>
                    <span class="project-duration">{{startDate}} - {{endDate}}</span>
                    <p class="description">{{description}}</p>
                    {{#if technologies}}
                    <div class="technologies">
                        {{#each technologies}}
                        <span class="tech-tag">{{this}}</span>
                        {{/each}}
                    </div>
                    {{/if}}
                </div>
                {{/each}}
            </section>
            {{/if}}
        </div>
    </div>
</body>
</html>`,
          css_content: `
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 0;
    padding: 20px;
    background: #f8fafc;
    color: #334155;
}

.resume-container {
    max-width: 1000px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    display: grid;
    grid-template-columns: 300px 1fr;
    min-height: 800px;
}

.sidebar {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    padding: 30px 25px;
}

.personal-info {
    margin-bottom: 40px;
}

.name {
    font-size: 1.8em;
    margin: 0 0 20px 0;
    font-weight: 700;
    letter-spacing: -0.5px;
}

.contact {
    space-y: 12px;
}

.contact-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-size: 0.9em;
}

.contact-item .icon {
    margin-right: 10px;
    width: 20px;
}

.skills-section, .languages-section {
    margin-bottom: 30px;
}

.skills-section h2, .languages-section h2 {
    font-size: 1.1em;
    margin-bottom: 15px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.9;
}

.skill-item, .language-item {
    background: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 6px;
    margin-bottom: 8px;
    font-size: 0.85em;
    font-weight: 500;
}

.main-content {
    padding: 40px 35px;
}

section {
    margin-bottom: 35px;
}

.main-content h2 {
    color: #059669;
    font-size: 1.3em;
    margin-bottom: 20px;
    font-weight: 700;
    position: relative;
    padding-bottom: 8px;
}

.main-content h2::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50px;
    height: 3px;
    background: #059669;
    border-radius: 2px;
}

.experience-item, .education-item {
    position: relative;
    margin-bottom: 25px;
    padding-left: 25px;
}

.timeline-dot {
    position: absolute;
    left: 0;
    top: 5px;
    width: 12px;
    height: 12px;
    background: #059669;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 2px #059669;
}

.experience-content h3, .education-content h3 {
    margin: 0 0 5px 0;
    color: #1e293b;
    font-size: 1.1em;
    font-weight: 600;
}

.company-info, .degree-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 0.9em;
}

.company, .degree {
    color: #059669;
    font-weight: 500;
}

.duration, .project-duration {
    color: #64748b;
    font-size: 0.85em;
}

.description {
    color: #64748b;
    line-height: 1.6;
    margin: 10px 0;
}

.project-item {
    background: #f8fafc;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    border-left: 4px solid #059669;
}

.project-item h3 {
    margin: 0 0 5px 0;
    color: #1e293b;
    font-size: 1.1em;
    font-weight: 600;
}

.technologies {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}

.tech-tag {
    background: #dcfce7;
    color: #15803d;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75em;
    font-weight: 500;
}

@media (max-width: 768px) {
    .resume-container {
        grid-template-columns: 1fr;
        margin: 10px;
    }
    
    .sidebar {
        padding: 25px 20px;
    }
    
    .main-content {
        padding: 25px 20px;
    }
}

@media print {
    body {
        background: white;
        padding: 0;
    }
    
    .resume-container {
        box-shadow: none;
        border-radius: 0;
    }
}`,
          thumbnail_url: '/images/templates/modern-minimal-thumbnail.jpg',
          is_premium: true,
          status: 'published',
          category: 'modern',
          description: '现代简约风格简历模板，双栏布局，适合设计、技术等职位',
          sort_order: 2,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: '创意设计模板',
          html_content: `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{personalInfo.name}} - 简历</title>
</head>
<body>
    <div class="resume-container">
        <div class="header-section">
            <div class="name-title">
                <h1 class="name">{{personalInfo.name}}</h1>
                <div class="title-line"></div>
            </div>
            <div class="contact-grid">
                <div class="contact-item">
                    <span class="label">电话</span>
                    <span class="value">{{personalInfo.phone}}</span>
                </div>
                <div class="contact-item">
                    <span class="label">邮箱</span>
                    <span class="value">{{personalInfo.email}}</span>
                </div>
                <div class="contact-item">
                    <span class="label">地址</span>
                    <span class="value">{{personalInfo.location}}</span>
                </div>
            </div>
        </div>

        <div class="content-grid">
            <div class="left-column">
                <!-- 个人简介 -->
                {{#if personalInfo.summary}}
                <section class="summary-section">
                    <div class="section-header">
                        <h2>关于我</h2>
                        <div class="section-line"></div>
                    </div>
                    <p class="summary-text">{{personalInfo.summary}}</p>
                </section>
                {{/if}}

                <!-- 技能 -->
                {{#if skills}}
                <section class="skills-section">
                    <div class="section-header">
                        <h2>专业技能</h2>
                        <div class="section-line"></div>
                    </div>
                    <div class="skills-cloud">
                        {{#each skills}}
                        <span class="skill-bubble">{{this}}</span>
                        {{/each}}
                    </div>
                </section>
                {{/if}}
            </div>

            <div class="right-column">
                <!-- 工作经历 -->
                {{#if workExperiences}}
                <section class="experience-section">
                    <div class="section-header">
                        <h2>工作经历</h2>
                        <div class="section-line"></div>
                    </div>
                    <div class="timeline">
                        {{#each workExperiences}}
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <div class="job-header">
                                    <h3>{{position}}</h3>
                                    <span class="company">{{company}}</span>
                                </div>
                                <div class="duration">{{startDate}} - {{endDate}}</div>
                                <p class="description">{{description}}</p>
                            </div>
                        </div>
                        {{/each}}
                    </div>
                </section>
                {{/if}}

                <!-- 教育经历 -->
                {{#if educations}}
                <section class="education-section">
                    <div class="section-header">
                        <h2>教育经历</h2>
                        <div class="section-line"></div>
                    </div>
                    {{#each educations}}
                    <div class="education-item">
                        <div class="education-header">
                            <h3>{{school}}</h3>
                            <span class="duration">{{startDate}} - {{endDate}}</span>
                        </div>
                        <div class="degree">{{degree}} - {{major}}</div>
                        {{#if gpa}}<div class="gpa">GPA: {{gpa}}</div>{{/if}}
                    </div>
                    {{/each}}
                </section>
                {{/if}}

                <!-- 项目经历 -->
                {{#if projects}}
                <section class="projects-section">
                    <div class="section-header">
                        <h2>项目经历</h2>
                        <div class="section-line"></div>
                    </div>
                    {{#each projects}}
                    <div class="project-card">
                        <div class="project-header">
                            <h3>{{name}}</h3>
                            <span class="duration">{{startDate}} - {{endDate}}</span>
                        </div>
                        <p class="description">{{description}}</p>
                        {{#if technologies}}
                        <div class="tech-stack">
                            {{#each technologies}}
                            <span class="tech-item">{{this}}</span>
                            {{/each}}
                        </div>
                        {{/if}}
                    </div>
                    {{/each}}
                </section>
                {{/if}}
            </div>
        </div>
    </div>
</body>
</html>`,
          css_content: `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

body {
    font-family: 'Poppins', sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.resume-container {
    max-width: 900px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.header-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
}

.name-title {
    margin-bottom: 30px;
}

.name {
    font-size: 3em;
    margin: 0;
    font-weight: 700;
    letter-spacing: -1px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.title-line {
    width: 100px;
    height: 4px;
    background: rgba(255, 255, 255, 0.8);
    margin: 15px auto;
    border-radius: 2px;
}

.contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    max-width: 600px;
    margin: 0 auto;
}

.contact-item {
    text-align: center;
}

.contact-item .label {
    display: block;
    font-size: 0.8em;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5px;
}

.contact-item .value {
    display: block;
    font-weight: 500;
    font-size: 1.1em;
}

.content-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 40px;
    padding: 40px 30px;
}

.section-header {
    margin-bottom: 25px;
}

.section-header h2 {
    color: #667eea;
    font-size: 1.4em;
    margin: 0 0 10px 0;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.section-line {
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 2px;
}

.summary-text {
    color: #555;
    line-height: 1.7;
    margin: 0;
    font-size: 0.95em;
}

.skills-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.skill-bubble {
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    padding: 8px 16px;
    border-radius: 25px;
    font-size: 0.8em;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.timeline {
    position: relative;
    padding-left: 30px;
}

.timeline::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, #667eea, #764ba2);
}

.timeline-item {
    position: relative;
    margin-bottom: 30px;
}

.timeline-marker {
    position: absolute;
    left: -23px;
    top: 5px;
    width: 16px;
    height: 16px;
    background: #667eea;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 3px #667eea;
}

.timeline-content {
    background: #f8f9ff;
    padding: 20px;
    border-radius: 12px;
    border-left: 4px solid #667eea;
}

.job-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 5px;
    flex-wrap: wrap;
}

.job-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.1em;
    font-weight: 600;
}

.company {
    color: #667eea;
    font-weight: 500;
    font-size: 0.9em;
}

.duration {
    color: #888;
    font-size: 0.85em;
    font-weight: 500;
    margin-bottom: 10px;
    display: block;
}

.description {
    color: #666;
    line-height: 1.6;
    margin: 0;
    font-size: 0.9em;
}

.education-item {
    background: #f8f9ff;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    border-left: 4px solid #764ba2;
}

.education-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

.education-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.1em;
    font-weight: 600;
}

.degree {
    color: #764ba2;
    font-weight: 500;
    margin-bottom: 5px;
}

.gpa {
    color: #888;
    font-size: 0.9em;
}

.project-card {
    background: linear-gradient(135deg, #f8f9ff 0%, #e8ebff 100%);
    padding: 25px;
    border-radius: 16px;
    margin-bottom: 25px;
    border: 1px solid #e0e4ff;
    position: relative;
    overflow: hidden;
}

.project-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
}

.project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.project-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.1em;
    font-weight: 600;
}

.tech-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 15px;
}

.tech-item {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 0.75em;
    font-weight: 500;
    border: 1px solid rgba(102, 126, 234, 0.2);
}

@media (max-width: 768px) {
    .content-grid {
        grid-template-columns: 1fr;
        gap: 30px;
        padding: 30px 20px;
    }
    
    .header-section {
        padding: 30px 20px;
    }
    
    .contact-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    
    .name {
        font-size: 2.2em;
    }
    
    .timeline {
        padding-left: 20px;
    }
    
    .timeline-marker {
        left: -18px;
    }
}

@media print {
    body {
        background: white;
        padding: 0;
    }
    
    .resume-container {
        box-shadow: none;
        border-radius: 0;
    }
}`,
          thumbnail_url: '/images/templates/creative-design-thumbnail.jpg',
          is_premium: true,
          status: 'published',
          category: 'creative',
          description: '创意设计风格简历模板，渐变色彩，适合设计师、创意等职位',
          sort_order: 3,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    })
    .then(() => {
      // 重置自增ID序列
      return knex.raw('ALTER SEQUENCE templates_id_seq RESTART WITH 4');
    });
}; 