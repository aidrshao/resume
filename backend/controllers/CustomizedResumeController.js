/**
 * CustomizedResumeController - 专属简历控制器
 * 处理专属简历生成和管理的业务逻辑
 * 
 * 功能：
 * - 生成专属简历（MVP两阶段流程）
 * - 获取专属简历详情
 * - 获取用户专属简历列表
 */

const CustomizedResume = require('../models/CustomizedResume');
const { Resume } = require('../models/Resume');
const JobPosition = require('../models/JobPosition');
const AIPrompt = require('../models/AIPrompt');
const { aiService } = require('../services/aiService');

class CustomizedResumeController {
  
  /**
   * 生成专属简历 - MVP核心接口
   * POST /api/resumes/customize
   * 
   * 流程：
   * 1. 数据准备：获取基础简历和岗位信息
   * 2. 阶段一：AI优化简历内容
   * 3. 阶段二：存储优化结果
   * 
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async generateCustomizedResume(req, res) {
    const requestId = req.requestId || 'unknown';
    
    try {
      console.log('🚀 [CUSTOMIZE_RESUME] 开始生成专属简历...');
      console.log('📊 [CUSTOMIZE_RESUME] 请求参数:', req.body);
      
      const { baseResumeId, targetJobId } = req.body;
      const userId = req.user.userId;
      
      // 参数验证
      if (!baseResumeId || !targetJobId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：baseResumeId 和 targetJobId'
        });
      }
      
      // === 阶段0：数据准备 ===
      console.log('📋 [CUSTOMIZE_RESUME] 阶段0：数据准备...');
      
      // 获取基础简历
      const baseResume = await Resume.findByIdAndUser(baseResumeId, userId);
      if (!baseResume) {
        return res.status(404).json({
          success: false,
          message: '基础简历不存在或无权限访问'
        });
      }
      
      // 获取目标岗位
      const targetJobResult = await JobPosition.getJobById(targetJobId, userId);
      if (!targetJobResult.success) {
        return res.status(404).json({
          success: false,
          message: targetJobResult.message || '目标岗位不存在或无权限访问'
        });
      }
      const targetJob = targetJobResult.data;
      
      console.log('✅ [CUSTOMIZE_RESUME] 数据准备完成:', {
        baseResumeTitle: baseResume.title,
        jobTitle: targetJob.title,
        jobCompany: targetJob.company
      });
      
      // === 阶段1：AI优化简历内容 ===
      console.log('🧠 [CUSTOMIZE_RESUME] 阶段1：AI优化简历内容...');
      
      // 获取优化提示词
      const promptConfig = await AIPrompt.findByKey('resume_optimization_content');
      if (!promptConfig) {
        return res.status(500).json({
          success: false,
          message: '系统配置错误：未找到简历优化提示词配置'
        });
      }
      
      console.log('✅ [CUSTOMIZE_RESUME] 获取提示词配置成功:', {
        promptId: promptConfig.id,
        model: promptConfig.model_type,
        templateLength: promptConfig.prompt_template?.length || 0
      });
      
      // 确保有unified_data（兼容旧格式简历）
      let resumeData = baseResume.unified_data;
      if (!resumeData) {
        console.log('⚠️ [CUSTOMIZE_RESUME] 简历缺少unified_data，尝试从其他字段获取...');
        // 尝试从其他字段获取数据
        resumeData = baseResume.content || baseResume.resume_data;
        if (!resumeData) {
          return res.status(400).json({
            success: false,
            message: '基础简历数据不完整，无法进行优化'
          });
        }
        console.log('✅ [CUSTOMIZE_RESUME] 使用备用数据字段，类型:', typeof resumeData);
      }
      
      // 准备AI调用参数
      const aiParams = {
        jobDescription: targetJob.description || '',
        preAnalyzedInfo: targetJob.requirements || '',
        baseResumeData: JSON.stringify(resumeData, null, 2)
      };
      
      console.log('📊 [CUSTOMIZE_RESUME] AI参数准备完成:', {
        jobDescriptionLength: aiParams.jobDescription.length,
        preAnalyzedInfoLength: aiParams.preAnalyzedInfo.length,
        baseResumeDataLength: aiParams.baseResumeData.length,
        baseResumeDataType: typeof resumeData,
        baseResumeDataPreview: aiParams.baseResumeData.substring(0, 200) + '...'
      });
      
      // 渲染提示词模板
      let renderedPrompt = promptConfig.prompt_template;
      Object.keys(aiParams).forEach(key => {
        const placeholder = `\${${key}}`;
        renderedPrompt = renderedPrompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), aiParams[key]);
      });
      
      console.log('📝 [CUSTOMIZE_RESUME] 提示词渲染完成，长度:', renderedPrompt.length);
      
      // 调用AI进行优化
      console.log('🤖 [CUSTOMIZE_RESUME] 开始AI优化...');
      const aiResponse = await aiService.generateText(
        renderedPrompt,
        promptConfig.model_type || 'gpt',  // 默认使用GPT-4o
        {
          temperature: 0.3,
          max_tokens: 6000,
          timeout: 180000  // 3分钟超时
        }
      );
      
      console.log('✅ [CUSTOMIZE_RESUME] AI优化完成，响应长度:', aiResponse.length);
      
      // 解析AI响应
      let optimizedData;
      try {
        // 🔧 增强版JSON解析（多重容错处理）
        let rawContent = aiResponse;
        
        try {
          // 步骤1：基础清理
          console.log('🧹 [CUSTOMIZE_RESUME] 开始JSON清理和解析...');
          let cleanedResponse = aiResponse
            .replace(/```json\n?|\n?```/g, '') // 移除代码块标记
            .replace(/^[^{]*/, '') // 移除开头的非JSON内容
            .replace(/[^}]*$/, '') // 移除结尾的非JSON内容
            .trim();
          
          console.log('📏 [CUSTOMIZE_RESUME] 清理后JSON长度:', cleanedResponse.length);
          console.log('🔍 [CUSTOMIZE_RESUME] JSON开头100字符:', cleanedResponse.substring(0, 100));
          console.log('🔍 [CUSTOMIZE_RESUME] JSON结尾100字符:', cleanedResponse.substring(cleanedResponse.length - 100));
          
          optimizedData = JSON.parse(cleanedResponse);
          console.log('✅ [CUSTOMIZE_RESUME] 基础JSON解析成功');
          
        } catch (parseError) {
          console.error('❌ [CUSTOMIZE_RESUME] 基础JSON解析失败:', parseError.message);
          console.error('❌ [CUSTOMIZE_RESUME] 错误位置:', parseError.message.match(/position (\d+)/)?.[1] || '未知');
          
          try {
            // 步骤2：智能JSON修复
            console.log('🔧 [CUSTOMIZE_RESUME] 开始智能JSON修复...');
            let fixedJson = this.smartFixJSON(rawContent);
            
            optimizedData = JSON.parse(fixedJson);
            console.log('✅ [CUSTOMIZE_RESUME] 智能修复解析成功');
            
          } catch (fixError) {
            console.error('❌ [CUSTOMIZE_RESUME] 智能修复失败:', fixError.message);
            
            try {
              // 步骤3：提取JSON片段
              console.log('🔧 [CUSTOMIZE_RESUME] 尝试提取JSON片段...');
              const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                let extractedJson = jsonMatch[0];
                // 尝试修复常见的JSON错误
                extractedJson = this.repairCommonJSONErrors(extractedJson);
                
                optimizedData = JSON.parse(extractedJson);
                console.log('✅ [CUSTOMIZE_RESUME] JSON片段解析成功');
              } else {
                throw new Error('无法提取有效的JSON结构');
              }
              
            } catch (extractError) {
              console.error('❌ [CUSTOMIZE_RESUME] JSON片段解析失败:', extractError.message);
              console.error('📝 [CUSTOMIZE_RESUME] AI原始响应:', rawContent.substring(0, 1000) + '...');
              
              return res.status(500).json({
                success: false,
                message: 'AI响应格式错误，无法解析为有效的JSON格式。原始响应: ' + rawContent.substring(0, 200) + '...'
              });
            }
          }
        }
        
      } catch (error) {
        console.error('❌ [CUSTOMIZE_RESUME] JSON解析完全失败:', error.message);
        console.error('🔍 [CUSTOMIZE_RESUME] 原始响应:', aiResponse.substring(0, 500) + '...');
        
        return res.status(500).json({
          success: false,
          message: 'AI响应格式错误，无法解析为有效的JSON格式'
        });
      }
      
      // === 阶段2：存储优化结果 ===
      console.log('💾 [CUSTOMIZE_RESUME] 阶段2：存储优化结果...');
      
      // 检查是否已存在相同的定制简历
      const existingResume = await CustomizedResume.findByUserJobCombination(userId, baseResumeId, targetJobId);
      
      if (existingResume) {
        console.log('⚠️ [CUSTOMIZE_RESUME] 发现已存在的定制简历，ID:', existingResume.id);
        
        return res.status(409).json({
          success: false,
          message: '该基础简历和目标岗位的定制简历已存在',
          data: {
            existingResumeId: existingResume.id,
            createdAt: existingResume.created_at
          }
        });
      }
      
      const customizedResume = await CustomizedResume.create({
        userId: userId,
        baseResumeId: baseResumeId,
        targetJobId: targetJobId,
        optimizedData: optimizedData
      });
      
      console.log('✅ [CUSTOMIZE_RESUME] 专属简历生成完成，ID:', customizedResume.id);
      
      // 返回结果
      res.json({
        success: true,
        data: {
          customizedResumeId: customizedResume.id,
          baseResumeTitle: baseResume.title,
          jobTitle: targetJob.title,
          jobCompany: targetJob.company,
          profileName: optimizedData.profile?.name || '未知',
          createdAt: customizedResume.createdAt
        },
        message: '专属简历生成成功'
      });
      
    } catch (error) {
      console.error('❌ [CUSTOMIZE_RESUME] 生成失败:', error.message);
      console.error('🔍 [CUSTOMIZE_RESUME] 错误堆栈:', error.stack);
      
      res.status(500).json({
        success: false,
        message: '专属简历生成失败: ' + error.message
      });
    }
  }
  
  /**
   * 获取专属简历详情
   * GET /api/customized-resumes/:id
   * 
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async getCustomizedResume(req, res) {
    try {
      console.log('🔍 [GET_CUSTOMIZED_RESUME] 获取专属简历详情...');
      
      const { id } = req.params;
      const userId = req.user.userId;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '缺少简历ID参数'
        });
      }
      
      const customizedResume = await CustomizedResume.findById(parseInt(id), userId);
      
      if (!customizedResume) {
        return res.status(404).json({
          success: false,
          message: '专属简历不存在或无权限访问'
        });
      }
      
      console.log('✅ [GET_CUSTOMIZED_RESUME] 获取成功:', {
        id: customizedResume.id,
        profileName: customizedResume.optimizedData?.profile?.name || '未知'
      });
      
      res.json({
        success: true,
        data: customizedResume,
        message: '获取专属简历成功'
      });
      
    } catch (error) {
      console.error('❌ [GET_CUSTOMIZED_RESUME] 获取失败:', error.message);
      
      res.status(500).json({
        success: false,
        message: '获取专属简历失败: ' + error.message
      });
    }
  }
  
  /**
   * 获取用户专属简历列表
   * GET /api/customized-resumes
   * 
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async getCustomizedResumeList(req, res) {
    try {
      console.log('📋 [GET_CUSTOMIZED_RESUME_LIST] 获取专属简历列表...');
      
      const userId = req.user.userId;
      const { page = 1, limit = 20, baseResumeId, targetJobId } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      if (baseResumeId) {
        options.baseResumeId = parseInt(baseResumeId);
      }
      
      if (targetJobId) {
        options.targetJobId = parseInt(targetJobId);
      }
      
      const result = await CustomizedResume.findByUserId(userId, options);
      
      console.log('✅ [GET_CUSTOMIZED_RESUME_LIST] 获取成功，数量:', result.data.length);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: '获取专属简历列表成功'
      });
      
    } catch (error) {
      console.error('❌ [GET_CUSTOMIZED_RESUME_LIST] 获取失败:', error.message);
      
      res.status(500).json({
        success: false,
        message: '获取专属简历列表失败: ' + error.message
      });
    }
  }
  
  /**
   * 删除专属简历
   * DELETE /api/customized-resumes/:id
   * 
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async deleteCustomizedResume(req, res) {
    try {
      console.log('🗑️ [DELETE_CUSTOMIZED_RESUME] 删除专属简历...');
      
      const { id } = req.params;
      const userId = req.user.userId;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '缺少简历ID参数'
        });
      }
      
      const success = await CustomizedResume.delete(parseInt(id), userId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '专属简历不存在或无权限删除'
        });
      }
      
      console.log('✅ [DELETE_CUSTOMIZED_RESUME] 删除成功');
      
      res.json({
        success: true,
        message: '专属简历删除成功'
      });
      
    } catch (error) {
      console.error('❌ [DELETE_CUSTOMIZED_RESUME] 删除失败:', error.message);
      
      res.status(500).json({
        success: false,
        message: '删除专属简历失败: ' + error.message
      });
    }
  }
  
  /**
   * 🔧 智能JSON修复（从AI服务的成功经验中学习）
   * @param {string} rawContent - 原始内容
   * @returns {string} 修复后的JSON字符串
   */
  static smartFixJSON(rawContent) {
    console.log('🔧 [JSON修复] 开始智能修复...');
    
    // 提取最可能的JSON部分
    let jsonContent = rawContent;
    
    // 查找最外层的大括号
    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
    }
    
    // 修复常见的AI生成JSON问题
    jsonContent = jsonContent
      // 修复多余的逗号
      .replace(/,(\s*[}\]])/g, '$1')
      // 修复缺失的逗号（在对象或数组元素之间）
      .replace(/("\w+":\s*"[^"]*")\s*\n\s*(")/g, '$1,\n    $2')
      .replace(/(\]|\})(\s*\n\s*)(")/g, '$1,\n    $2')
      // 修复引号问题
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
      // 修复数组末尾的逗号
      .replace(/,(\s*\])/g, '$1')
      // 修复对象末尾的逗号
      .replace(/,(\s*\})/g, '$1');
    
    console.log('🔧 [JSON修复] 基础修复完成');
    return jsonContent;
  }

  /**
   * 🔧 修复常见JSON错误（从AI服务的成功经验中学习）
   * @param {string} jsonStr - JSON字符串
   * @returns {string} 修复后的JSON字符串
   */
  static repairCommonJSONErrors(jsonStr) {
    console.log('🔧 [JSON修复] 修复常见错误...');
    
    let repaired = jsonStr;
    
    // 修复1：删除多余的逗号
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    // 修复2：在缺少逗号的地方添加逗号
    repaired = repaired.replace(/("|\]|\})(\s*\n\s*)("|\{|\[)/g, '$1,$2$3');
    
    // 修复3：修复未闭合的字符串
    const stringMatches = repaired.match(/"[^"]*$/gm);
    if (stringMatches) {
      repaired = repaired.replace(/"([^"]*?)$/gm, '"$1"');
    }
    
    // 修复4：修复未闭合的数组或对象
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    
    // 补充缺失的闭合括号
    if (openBraces > closeBraces) {
      repaired += '}'.repeat(openBraces - closeBraces);
    }
    if (openBrackets > closeBrackets) {
      repaired += ']'.repeat(openBrackets - closeBrackets);
    }
    
    console.log('🔧 [JSON修复] 常见错误修复完成');
    return repaired;
  }
}

module.exports = CustomizedResumeController;
