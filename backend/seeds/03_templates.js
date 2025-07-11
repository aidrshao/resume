/**
 * 模板种子数据
 * 用于插入初始的简历模板数据
 * 创建时间：2025-07-02
 */

exports.seed = async function(knex) {
  // 幂等处理：不再删除全部数据，改为按需插入

  // 定义模板数据列表
  const templates = [
    {
      id: 1,
      name: '简洁蓝色',
      description: '简洁专业的蓝色主题简历模板',
      html_content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{profile.name}} - 简历</title>
</head>
<body>
    <div class="resume-container">
        <!-- 个人信息 -->
        <header class="header">
            <h1 class="name">{{profile.name}}</h1>
            <div class="contact-info">
                <span class="phone">{{profile.phone}}</span>
                <span class="email">{{profile.email}}</span>
                <span class="location">{{profile.location}}</span>
            </div>
        </header>

        <!-- 个人简介 -->
        {{#if profile.summary}}
        <section class="summary">
            <h2>个人简介</h2>
            <p>{{profile.summary}}</p>
        </section>
        {{/if}}

        <!-- 工作经历 -->
        {{#if workExperience}}
        <section class="work-experience">
            <h2>工作经历</h2>
            {{#each workExperience}}
            <div class="experience-item">
                <div class="experience-header">
                    <h3>{{position}}</h3>
                    <span class="company">{{company}}</span>
                    <span class="duration">{{duration}}</span>
                </div>
                <p class="description">{{description}}</p>
            </div>
            {{/each}}
        </section>
        {{/if}}

        <!-- 教育经历 -->
        {{#if education}}
        <section class="education">
            <h2>教育经历</h2>
            {{#each education}}
            <div class="education-item">
                <div class="education-header">
                    <h3>{{school}}</h3>
                    <span class="degree">{{degree}} - {{major}}</span>
                    <span class="duration">{{duration}}</span>
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
                <div class="skill-category">
                    <strong>{{category}}:</strong> {{details}}
                </div>
                {{/each}}
            </div>
        </section>
        {{/if}}

        <!-- 项目经历 -->
        {{#if projectExperience}}
        <section class="projects">
            <h2>项目经历</h2>
            {{#each projectExperience}}
            <div class="project-item">
                <div class="project-header">
                    <h3>{{name}}</h3>
                    <span class="duration">{{duration}}</span>
                </div>
                <p class="role">角色：{{role}}</p>
                <p class="description">{{description}}</p>
                {{#if url}}
                <p class="project-url">项目链接：<a href="{{url}}" target="_blank">{{url}}</a></p>
                {{/if}}
            </div>
            {{/each}}
        </section>
        {{/if}}

        <!-- 自定义部分 -->
        {{#if customSections}}
        {{#each customSections}}
        <section class="custom-section">
            <h2>{{title}}</h2>
            <p>{{content}}</p>
        </section>
        {{/each}}
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

.company, .degree, .duration, .role {
    color: #666;
    font-weight: 500;
}

.description {
    color: #4b5563;
    margin: 10px 0;
}

.skills-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.skill-category {
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
}

.skill-category:last-child {
    border-bottom: none;
}

.project-url a {
    color: #2563eb;
    text-decoration: none;
}

.project-url a:hover {
    text-decoration: underline;
}

.custom-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
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
        align-items: center;
        gap: 10px;
    }
}`,
    }
  ];

  // 幂等插入：以 name 唯一检查
  for (const tpl of templates) {
    const exists = await knex('templates').where({ name: tpl.name }).first();
    if (!exists) {
      await knex('templates').insert(tpl);
    }
  }

  console.log('✅ [SEED] templates 已同步 (幂等)');
}; 