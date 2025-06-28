/**
 * 简历解析服务
 * 负责解析PDF和Word文档，提取文本并进行结构化识别
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { aiService } = require('./aiService');

class ResumeParseService {
  /**
   * 解析简历文件
   * @param {string} filePath - 文件路径
   * @param {string} fileType - 文件类型 (pdf, docx, doc)
   * @returns {Promise<Object>} 解析结果
   */
  static async parseResumeFile(filePath, fileType) {
    try {
      console.log(`📄 开始解析简历文件: ${filePath}, 类型: ${fileType}`);
      
      // 第一步：提取纯文本
      let extractedText = '';
      
      switch (fileType.toLowerCase()) {
        case 'pdf':
          extractedText = await this.extractTextFromPDF(filePath);
          break;
        case 'docx':
        case 'doc':
          extractedText = await this.extractTextFromWord(filePath);
          break;
        case 'txt':
          extractedText = await this.extractTextFromTXT(filePath);
          break;
        default:
          throw new Error(`不支持的文件类型: ${fileType}`);
      }
      
      console.log(`📝 文本提取完成，长度: ${extractedText.length}`);
      
      // 第二步：使用AI进行结构化识别
      const structuredData = await this.structureResumeText(extractedText);
      
      console.log('🧠 AI结构化识别完成');
      
      return {
        success: true,
        extractedText,
        structuredData
      };
      
    } catch (error) {
      console.error('❌ 简历解析失败:', error);
      return {
        success: false,
        error: error.message,
        extractedText: '',
        structuredData: null
      };
    }
  }

  /**
   * 从PDF文件提取文本
   * @param {string} filePath - PDF文件路径
   * @returns {Promise<string>} 提取的文本
   */
  static async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF文本提取失败:', error);
      throw new Error('PDF文件解析失败');
    }
  }

  /**
   * 从Word文档提取文本
   * @param {string} filePath - Word文档路径
   * @returns {Promise<string>} 提取的文本
   */
  static async extractTextFromWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Word文档文本提取失败:', error);
      throw new Error('Word文档解析失败');
    }
  }

  /**
   * 从TXT文件提取文本
   * @param {string} filePath - TXT文件路径
   * @returns {Promise<string>} 提取的文本
   */
  static async extractTextFromTXT(filePath) {
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      return text;
    } catch (error) {
      console.error('TXT文件读取失败:', error);
      throw new Error('TXT文件读取失败');
    }
  }

  /**
   * 使用AI对简历文本进行结构化识别
   * @param {string} text - 简历文本
   * @returns {Promise<Object>} 结构化数据
   */
  static async structureResumeText(text) {
    const prompt = `
你是一个专业的简历解析专家，请仔细分析以下简历文本，提取所有可能的结构化信息。

简历文本内容：
${text}

请按照以下步骤仔细解析：

第一步：识别个人基本信息
- 姓名：通常在简历开头，可能是最大的文字或单独一行
- 联系方式：手机号码（11位数字，可能有分隔符）
- 邮箱：包含@符号的邮箱地址
- 地址：城市、省份信息
- 个人简介：通常有"个人简介"、"自我评价"、"简介"等标题

第二步：识别教育背景
- 寻找学校名称、专业、学位、时间等信息
- 注意"教育经历"、"教育背景"、"学习经历"等关键词

第三步：识别工作经历
- 寻找公司名称、职位、工作时间、工作描述
- 注意"工作经历"、"工作经验"、"职业经历"等关键词
- 每个工作经历都要单独提取

第四步：识别项目经验
- 寻找项目名称、项目描述、使用技术等
- 注意"项目经验"、"项目经历"、"主要项目"等关键词

第五步：识别技能信息
- 编程语言、技术栈、工具等
- 注意"技能"、"专业技能"、"技术栈"等关键词

请严格按照以下JSON格式返回结果：

{
  "personalInfo": {
    "name": "从简历中提取的完整姓名",
    "phone": "手机号码（保持原格式）",
    "email": "邮箱地址", 
    "location": "居住地址或城市",
    "summary": "个人简介或自我评价的完整内容",
    "objective": "求职意向或职业目标"
  },
  "educations": [
    {
      "school": "学校完整名称",
      "degree": "学位类型（学士/硕士/博士/专科等）",
      "major": "专业名称",
      "startDate": "入学时间（YYYY-MM格式）",
      "endDate": "毕业时间（YYYY-MM格式）",
      "gpa": "GPA成绩（如果有）",
      "honors": ["学术荣誉或奖项"],
      "courses": ["主要课程"],
      "description": "其他教育相关描述"
    }
  ],
  "workExperiences": [
    {
      "company": "公司完整名称",
      "position": "职位名称",
      "department": "部门名称",
      "location": "工作地点",
      "startDate": "入职时间（YYYY-MM格式）",
      "endDate": "离职时间（YYYY-MM格式，在职写'至今'）",
      "description": "工作职责和内容的详细描述",
      "achievements": ["具体工作成就", "量化的工作成果"],
      "technologies": ["使用的技术、工具、软件"],
      "teamSize": "团队规模（如果提到）",
      "reportTo": "汇报对象（如果提到）"
    }
  ],
  "projects": [
    {
      "name": "项目名称",
      "role": "在项目中的角色",
      "company": "项目所属公司",
      "startDate": "项目开始时间", 
      "endDate": "项目结束时间",
      "description": "项目详细描述和背景",
      "responsibilities": ["具体职责"],
      "achievements": ["项目成果和影响"],
      "technologies": ["使用的技术栈"],
      "teamSize": "项目团队规模",
      "budget": "项目预算（如果提到）"
    }
  ],
  "skills": {
    "technical": ["编程语言", "开发框架", "数据库", "开发工具"],
    "professional": ["专业技能", "行业知识"],
    "soft": ["软技能", "沟通能力", "领导力"],
    "certifications": ["获得的证书", "资格认证"]
  },
  "languages": [
    {
      "language": "语言名称（中文/英文/日文等）",
      "level": "熟练程度（母语/精通/熟练/一般）",
      "certification": "语言证书（如CET-6、托福、雅思分数）"
    }
  ],
  "awards": [
    {
      "name": "奖项名称",
      "issuer": "颁发机构",
      "date": "获奖时间",
      "description": "奖项说明"
    }
  ],
  "publications": [
    {
      "title": "论文或著作标题",
      "journal": "发表期刊或出版社",
      "date": "发表时间",
      "authors": ["作者列表"]
    }
  ],
  "interests": ["个人兴趣爱好"]
}

重要提取规则：
1. 个人信息是最重要的，请务必仔细提取姓名、电话、邮箱
2. 每个工作经历、教育经历、项目都要单独成条目
3. 保留所有时间信息，统一格式为YYYY-MM
4. 技能要详细分类，不要遗漏
5. 保留所有量化数据和具体成就
6. 如果某个字段确实没有信息，设为null或空数组
7. 只返回JSON格式，不要包含任何其他文字

现在开始解析：
`;

    try {
      console.log('🧠 开始AI结构化识别，文本长度:', text.length);
      const response = await aiService.generateText(prompt, 'deepseek', {
        temperature: 0.3, // 降低随机性，提高准确性
        max_tokens: 6000
      });
      
      console.log('🤖 AI原始响应:', response.substring(0, 500) + '...');
      
      // 尝试解析JSON
      let structuredData;
      try {
        // 清理可能的markdown代码块标记
        const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        structuredData = JSON.parse(cleanedResponse);
        console.log('✅ JSON解析成功');
      } catch (parseError) {
        console.error('❌ JSON解析失败，尝试修复:', parseError);
        // 如果直接解析失败，尝试提取JSON部分
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredData = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON修复解析成功');
        } else {
          console.error('❌ 无法提取有效JSON');
          throw new Error('AI返回的不是有效的JSON格式');
        }
      }
      
      // 验证关键字段
      if (!structuredData.personalInfo) {
        console.warn('⚠️ 缺少个人信息字段，创建默认结构');
        structuredData.personalInfo = {};
      }
      
      console.log('📊 提取的个人信息:', JSON.stringify(structuredData.personalInfo, null, 2));
      
      return structuredData;
      
    } catch (error) {
      console.error('💥 AI结构化识别失败:', error);
      throw new Error('简历内容结构化识别失败: ' + error.message);
    }
  }

  /**
   * 验证和清理结构化数据
   * @param {Object} data - 原始结构化数据
   * @returns {Object} 清理后的数据
   */
  static validateAndCleanData(data) {
    const cleaned = {
      personalInfo: {
        name: data.personalInfo?.name || null,
        phone: data.personalInfo?.phone || null,
        email: data.personalInfo?.email || null,
        location: data.personalInfo?.location || null,
        summary: data.personalInfo?.summary || null,
        objective: data.personalInfo?.objective || null
      },
      educations: Array.isArray(data.educations) ? data.educations.map(edu => ({
        school: edu.school || null,
        degree: edu.degree || null,
        major: edu.major || null,
        startDate: this.formatDate(edu.startDate),
        endDate: this.formatDate(edu.endDate),
        gpa: edu.gpa || null,
        honors: Array.isArray(edu.honors) ? edu.honors : [],
        courses: Array.isArray(edu.courses) ? edu.courses : [],
        description: edu.description || null
      })) : [],
      workExperiences: Array.isArray(data.workExperiences) ? data.workExperiences.map(work => ({
        company: work.company || null,
        position: work.position || null,
        department: work.department || null,
        location: work.location || null,
        startDate: this.formatDate(work.startDate),
        endDate: this.formatDate(work.endDate),
        description: work.description || null,
        achievements: Array.isArray(work.achievements) ? work.achievements : [],
        technologies: Array.isArray(work.technologies) ? work.technologies : [],
        teamSize: work.teamSize || null,
        reportTo: work.reportTo || null
      })) : [],
      projects: Array.isArray(data.projects) ? data.projects.map(project => ({
        name: project.name || null,
        role: project.role || null,
        company: project.company || null,
        startDate: this.formatDate(project.startDate),
        endDate: this.formatDate(project.endDate),
        description: project.description || null,
        responsibilities: Array.isArray(project.responsibilities) ? project.responsibilities : [],
        achievements: Array.isArray(project.achievements) ? project.achievements : [],
        technologies: Array.isArray(project.technologies) ? project.technologies : [],
        teamSize: project.teamSize || null,
        budget: project.budget || null
      })) : [],
      skills: data.skills && typeof data.skills === 'object' ? {
        technical: Array.isArray(data.skills.technical) ? data.skills.technical : [],
        professional: Array.isArray(data.skills.professional) ? data.skills.professional : [],
        soft: Array.isArray(data.skills.soft) ? data.skills.soft : [],
        certifications: Array.isArray(data.skills.certifications) ? data.skills.certifications : []
      } : {
        technical: [],
        professional: [],
        soft: [],
        certifications: []
      },
      languages: Array.isArray(data.languages) ? data.languages.map(lang => ({
        language: lang.language || null,
        level: lang.level || null,
        certification: lang.certification || null
      })) : [],
      awards: Array.isArray(data.awards) ? data.awards.map(award => ({
        name: award.name || null,
        issuer: award.issuer || null,
        date: this.formatDate(award.date),
        description: award.description || null
      })) : [],
      publications: Array.isArray(data.publications) ? data.publications.map(pub => ({
        title: pub.title || null,
        journal: pub.journal || null,
        date: this.formatDate(pub.date),
        authors: Array.isArray(pub.authors) ? pub.authors : []
      })) : [],
      interests: Array.isArray(data.interests) ? data.interests : []
    };
    
    return cleaned;
  }

  /**
   * 格式化日期
   * @param {string} dateStr - 日期字符串
   * @returns {string|null} 格式化后的日期
   */
  static formatDate(dateStr) {
    if (!dateStr) return null;
    
    // 尝试各种日期格式的匹配和转换
    const datePatterns = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/,  // YYYY-MM-DD
      /(\d{4})-(\d{1,2})/,           // YYYY-MM
      /(\d{4})年(\d{1,2})月/,        // YYYY年MM月
      /(\d{4})\.(\d{1,2})/,          // YYYY.MM
      /(\d{1,2})\/(\d{4})/,          // MM/YYYY
    ];
    
    for (const pattern of datePatterns) {
      const match = dateStr.match(pattern);
      if (match) {
        if (pattern.source.includes('年')) {
          return `${match[1]}-${match[2].padStart(2, '0')}`;
        } else if (pattern.source.includes('/') && match.length === 3) {
          return `${match[2]}-${match[1].padStart(2, '0')}`;
        } else {
          return match[0];
        }
      }
    }
    
    return dateStr; // 如果无法匹配，返回原始字符串
  }
}

module.exports = ResumeParseService; 