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
   * 检查专属简历是否存在
   * GET /api/resumes/customize/check
   * 
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async checkCustomizedResumeExists(req, res) {
    try {
      console.log('🔍 [CHECK_CUSTOMIZED_RESUME] 检查专属简历是否存在...');
      
      const { baseResumeId, targetJobId } = req.query;
      const userId = req.user.userId;
      
      // 参数验证
      if (!baseResumeId || !targetJobId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：baseResumeId 和 targetJobId'
        });
      }
      
      console.log('📊 [CHECK_CUSTOMIZED_RESUME] 检查参数:', {
        userId,
        baseResumeId: parseInt(baseResumeId),
        targetJobId: parseInt(targetJobId)
      });
      
      // 检查是否已存在相同的定制简历
      const existingResume = await CustomizedResume.findByUserJobCombination(
        userId, 
        parseInt(baseResumeId), 
        parseInt(targetJobId)
      );
      
      if (existingResume) {
        console.log('✅ [CHECK_CUSTOMIZED_RESUME] 找到已存在的定制简历:', existingResume.id);
        
        res.json({
          success: true,
          data: {
            exists: true,
            customizedResumeId: existingResume.id,
            baseResumeTitle: existingResume.base_resume_title,
            jobTitle: existingResume.job_title,
            jobCompany: existingResume.job_company,
            createdAt: existingResume.created_at
          },
          message: '已存在该组合的定制简历'
        });
      } else {
        console.log('✅ [CHECK_CUSTOMIZED_RESUME] 未找到已存在的定制简历');
        
        res.json({
          success: true,
          data: {
            exists: false
          },
          message: '未找到现有的定制简历'
        });
      }
      
    } catch (error) {
      console.error('❌ [CHECK_CUSTOMIZED_RESUME] 检查失败:', error.message);
      
      res.status(500).json({
        success: false,
        message: '检查专属简历失败: ' + error.message
      });
    }
  }
  
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
    const startTime = Date.now();
    
    console.log('🚀 [CUSTOMIZE_RESUME] ==========================================');
    console.log('🚀 [CUSTOMIZE_RESUME] 开始生成专属简历...');
    console.log('🚀 [CUSTOMIZE_RESUME] 请求ID:', requestId);
    console.log('🚀 [CUSTOMIZE_RESUME] 开始时间:', new Date().toISOString());
    console.log('🚀 [CUSTOMIZE_RESUME] 请求参数:', req.body);
    
    try {
      const { baseResumeId, targetJobId, forceOverwrite = false } = req.body;
      const userId = req.user.userId;
      
      // 参数验证
      if (!baseResumeId || !targetJobId) {
        console.error('❌ [CUSTOMIZE_RESUME] 参数验证失败');
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：baseResumeId 和 targetJobId'
        });
      }
      
      console.log('📊 [CUSTOMIZE_RESUME] 生成参数:', {
        userId,
        baseResumeId,
        targetJobId,
        forceOverwrite,
        requestId
      });
      
      // === 阶段0：数据准备 ===
      const dataStartTime = Date.now();
      console.log('📋 [CUSTOMIZE_RESUME] 阶段0：数据准备...');
      
      // 获取基础简历
      console.log('📋 [CUSTOMIZE_RESUME] 获取基础简历...');
      const baseResume = await Resume.findByIdAndUser(baseResumeId, userId);
      if (!baseResume) {
        console.error('❌ [CUSTOMIZE_RESUME] 基础简历不存在');
        return res.status(404).json({
          success: false,
          message: '基础简历不存在或无权限访问'
        });
      }
      
      console.log('✅ [CUSTOMIZE_RESUME] 基础简历获取成功:', {
        id: baseResume.id,
        title: baseResume.title,
        dataSize: JSON.stringify(baseResume.unified_data || {}).length
      });
      
      // 获取目标岗位
      console.log('📋 [CUSTOMIZE_RESUME] 获取目标岗位...');
      const targetJobResult = await JobPosition.getJobById(targetJobId, userId);
      if (!targetJobResult.success) {
        console.error('❌ [CUSTOMIZE_RESUME] 目标岗位不存在');
        return res.status(404).json({
          success: false,
          message: targetJobResult.message || '目标岗位不存在或无权限访问'
        });
      }
      const targetJob = targetJobResult.data;
      
      console.log('✅ [CUSTOMIZE_RESUME] 目标岗位获取成功:', {
        id: targetJob.id,
        title: targetJob.title,
        company: targetJob.company,
        descriptionLength: targetJob.description?.length || 0,
        requirementsLength: targetJob.requirements?.length || 0
      });
      
      const dataDuration = Date.now() - dataStartTime;
      console.log(`✅ [CUSTOMIZE_RESUME] 数据准备完成，耗时: ${dataDuration}ms`);
      
      // === 阶段1：AI优化简历内容 ===
      const aiStartTime = Date.now();
      console.log('🧠 [CUSTOMIZE_RESUME] 阶段1：AI优化简历内容...');
      
      // 获取优化提示词
      console.log('🧠 [CUSTOMIZE_RESUME] 获取AI提示词配置...');
      const promptConfig = await AIPrompt.findByKey('resume_optimization_content');
      if (!promptConfig) {
        console.error('❌ [CUSTOMIZE_RESUME] AI提示词配置不存在');
        return res.status(500).json({
          success: false,
          message: '系统配置错误：未找到简历优化提示词配置'
        });
      }
      
      console.log('✅ [CUSTOMIZE_RESUME] AI提示词配置获取成功:', {
        promptId: promptConfig.id,
        model: promptConfig.model_type,
        templateLength: promptConfig.prompt_template?.length || 0,
        active: promptConfig.active
      });
      
      // 确保有unified_data（兼容旧格式简历）
      let resumeData = baseResume.unified_data;
      if (!resumeData) {
        console.log('⚠️ [CUSTOMIZE_RESUME] 简历缺少unified_data，尝试从其他字段获取...');
        // 尝试从其他字段获取数据
        resumeData = baseResume.content || baseResume.resume_data;
        if (!resumeData) {
          console.error('❌ [CUSTOMIZE_RESUME] 简历数据不完整');
          return res.status(400).json({
            success: false,
            message: '基础简历数据不完整，无法进行优化'
          });
        }
        console.log('✅ [CUSTOMIZE_RESUME] 使用备用数据字段，类型:', typeof resumeData);
      }
      
      // 准备AI调用参数
      const aiParams = {
        targetCompany: targetJob.company || '',
        targetPosition: targetJob.title || '',
        jobDescription: targetJob.description || '',
        resumeData: JSON.stringify(resumeData, null, 2),
        userRequirements: ''
      };
      
      console.log('📊 [CUSTOMIZE_RESUME] AI参数准备完成:', {
        targetCompany: aiParams.targetCompany,
        targetPosition: aiParams.targetPosition,
        jobDescriptionLength: aiParams.jobDescription.length,
        resumeDataLength: aiParams.resumeData.length,
        resumeDataType: typeof resumeData,
        parametersReady: true
      });
      
      // 渲染提示词模板
      console.log('📝 [CUSTOMIZE_RESUME] 渲染提示词模板...');
      let renderedPrompt = promptConfig.prompt_template;
      Object.keys(aiParams).forEach(key => {
        const placeholder = `\${${key}}`;
        renderedPrompt = renderedPrompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), aiParams[key]);
      });
      
      console.log('✅ [CUSTOMIZE_RESUME] 提示词渲染完成:', {
        originalLength: promptConfig.prompt_template.length,
        renderedLength: renderedPrompt.length,
        parametersReplaced: Object.keys(aiParams).length
      });
      
      // 调用AI进行优化
      console.log('🤖 [CUSTOMIZE_RESUME] 开始AI优化调用...');
      console.log('🤖 [CUSTOMIZE_RESUME] AI配置:', {
        model: promptConfig.model_type || 'gpt',
        temperature: 0.3,
        max_tokens: 6000,
        timeout: 240000, // 4分钟超时
        requestId: requestId
      });
      
      const aiCallStartTime = Date.now();
      const aiResponse = await aiService.generateText(
        renderedPrompt,
        promptConfig.model_type || 'gpt',  // 默认使用GPT-4o
        {
          temperature: 0.3,
          max_tokens: 6000,
          timeout: 240000,  // 4分钟超时
          requestId: requestId
        }
      );
      
      const aiCallDuration = Date.now() - aiCallStartTime;
      console.log('✅ [CUSTOMIZE_RESUME] AI优化调用完成:', {
        aiCallDuration: aiCallDuration + 'ms',
        aiCallSeconds: (aiCallDuration / 1000).toFixed(1) + 's',
        responseLength: aiResponse.length,
        responsePreview: aiResponse.substring(0, 100) + '...'
      });
      
      // 解析AI响应
      console.log('🔍 [CUSTOMIZE_RESUME] 开始解析AI响应...');
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
          
          console.log('📏 [CUSTOMIZE_RESUME] 清理后JSON:', {
            originalLength: aiResponse.length,
            cleanedLength: cleanedResponse.length,
            cleanedPreview: cleanedResponse.substring(0, 100) + '...',
            cleanedSuffix: cleanedResponse.substring(cleanedResponse.length - 100)
          });
          
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
      
      const aiDuration = Date.now() - aiStartTime;
      console.log(`✅ [CUSTOMIZE_RESUME] AI优化阶段完成，总耗时: ${aiDuration}ms (${(aiDuration/1000).toFixed(1)}s)`);
      
      // === 阶段2：存储优化结果 ===
      const storageStartTime = Date.now();
      console.log('💾 [CUSTOMIZE_RESUME] 阶段2：存储优化结果...');
      
      // 检查是否已存在相同的定制简历
      const existingResume = await CustomizedResume.findByUserJobCombination(userId, baseResumeId, targetJobId);
      
      if (existingResume && !forceOverwrite) {
        console.log('⚠️ [CUSTOMIZE_RESUME] 发现已存在的定制简历:', {
          existingId: existingResume.id,
          createdAt: existingResume.created_at,
          forceOverwrite: forceOverwrite
        });
        
        return res.status(409).json({
          success: false,
          message: '该基础简历和目标岗位的定制简历已存在',
          data: {
            existingResumeId: existingResume.id,
            createdAt: existingResume.created_at
          }
        });
      }
      
      let customizedResume;
      
      if (existingResume && forceOverwrite) {
        // 强制覆盖模式：更新现有记录
        console.log('🔄 [CUSTOMIZE_RESUME] 强制覆盖模式，更新现有记录 ID:', existingResume.id);
        
        customizedResume = await CustomizedResume.update(existingResume.id, {
          optimizedData: optimizedData,
          updatedAt: new Date()
        });
        
        console.log('✅ [CUSTOMIZE_RESUME] 专属简历更新完成，ID:', customizedResume.id);
      } else {
        // 正常创建模式
        console.log('➕ [CUSTOMIZE_RESUME] 正常创建模式，创建新记录');
        
        customizedResume = await CustomizedResume.create({
          userId: userId,
          baseResumeId: baseResumeId,
          targetJobId: targetJobId,
          optimizedData: optimizedData
        });
        
        console.log('✅ [CUSTOMIZE_RESUME] 专属简历创建完成，ID:', customizedResume.id);
      }
      
      const storageDuration = Date.now() - storageStartTime;
      const totalDuration = Date.now() - startTime;
      
      console.log('✅ [CUSTOMIZE_RESUME] 专属简历生成完成!');
      console.log('📊 [CUSTOMIZE_RESUME] 性能统计:', {
        requestId: requestId,
        totalDuration: totalDuration + 'ms',
        totalSeconds: (totalDuration / 1000).toFixed(1) + 's',
        dataDuration: dataDuration + 'ms',
        aiDuration: aiDuration + 'ms',
        aiCallDuration: aiCallDuration + 'ms',
        storageDuration: storageDuration + 'ms',
        customizedResumeId: customizedResume.id,
        stages: {
          dataPreparation: Math.round((dataDuration / totalDuration) * 100) + '%',
          aiOptimization: Math.round((aiDuration / totalDuration) * 100) + '%',
          storage: Math.round((storageDuration / totalDuration) * 100) + '%'
        }
      });
      
      // 返回结果
      res.json({
        success: true,
        data: {
          customizedResumeId: customizedResume.id,
          baseResumeTitle: baseResume.title,
          jobTitle: targetJob.title,
          jobCompany: targetJob.company,
          profileName: optimizedData.profile?.name || '未知',
          createdAt: customizedResume.createdAt,
          processingTime: {
            total: totalDuration,
            dataPreparation: dataDuration,
            aiOptimization: aiDuration,
            storage: storageDuration
          }
        },
        message: '专属简历生成成功'
      });
      
    } catch (error) {
      const errorDuration = Date.now() - startTime;
      console.error('❌ [CUSTOMIZE_RESUME] 生成失败:', {
        requestId: requestId,
        error: error.message,
        duration: errorDuration + 'ms',
        stack: error.stack
      });
      
      // 根据错误类型返回不同的错误信息
      let errorMessage = '专属简历生成失败: ' + error.message;
      let statusCode = 500;
      
      if (error.message.includes('timeout') || error.message.includes('超时')) {
        statusCode = 408;
        errorMessage = 'AI优化服务响应超时，请稍后重试。通常AI优化需要2-5分钟时间。';
      } else if (error.message.includes('API限制') || error.message.includes('rate limit')) {
        statusCode = 429;
        errorMessage = 'AI服务请求过于频繁，请稍后重试。';
      }
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          requestId: requestId,
          duration: errorDuration,
          originalError: error.message
        } : undefined
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
      
      console.log('📊 [GET_CUSTOMIZED_RESUME] 请求参数:', {
        resumeId: id,
        userId: userId,
        userEmail: req.user.email || 'N/A'
      });
      
      if (!id) {
        console.error('❌ [GET_CUSTOMIZED_RESUME] 缺少简历ID参数');
        return res.status(400).json({
          success: false,
          message: '缺少简历ID参数'
        });
      }
      
      console.log('📡 [GET_CUSTOMIZED_RESUME] 查询数据库中的专属简历...');
      const customizedResume = await CustomizedResume.findById(parseInt(id), userId);
      
      if (!customizedResume) {
        console.error('❌ [GET_CUSTOMIZED_RESUME] 专属简历不存在', {
          resumeId: id,
          userId: userId
        });
        return res.status(404).json({
          success: false,
          message: '专属简历不存在或无权限访问'
        });
      }
      
      console.log('✅ [GET_CUSTOMIZED_RESUME] 专属简历查询成功:', {
        id: customizedResume.id,
        userId: customizedResume.user_id,
        baseResumeId: customizedResume.base_resume_id,
        targetJobId: customizedResume.target_job_id,
        hasOptimizedData: !!customizedResume.optimized_data,
        optimizedDataType: typeof customizedResume.optimized_data,
        optimizedDataKeys: customizedResume.optimized_data ? Object.keys(customizedResume.optimized_data) : 'N/A',
        createdAt: customizedResume.created_at
      });
      
      // 检查optimized_data的结构
      if (customizedResume.optimized_data) {
        console.log('📊 [GET_CUSTOMIZED_RESUME] optimized_data详情:', {
          profile: customizedResume.optimized_data.profile ? {
            name: customizedResume.optimized_data.profile.name,
            keys: Object.keys(customizedResume.optimized_data.profile)
          } : 'N/A',
          workExperience: customizedResume.optimized_data.workExperience?.length || 0,
          education: customizedResume.optimized_data.education?.length || 0,
          skills: customizedResume.optimized_data.skills?.length || 0,
          projectExperience: customizedResume.optimized_data.projectExperience?.length || 0,
          customSections: customizedResume.optimized_data.customSections?.length || 0
        });
      } else {
        console.warn('⚠️ [GET_CUSTOMIZED_RESUME] optimized_data为空或不存在');
      }
      
      // 准备响应数据
      const responseData = {
        id: customizedResume.id,
        user_id: customizedResume.user_id,
        base_resume_id: customizedResume.base_resume_id,
        target_job_id: customizedResume.target_job_id,
        optimized_data: customizedResume.optimized_data,
        optimizedData: customizedResume.optimized_data, // 兼容前端可能使用的不同字段名
        jobTitle: customizedResume.job_title,
        companyName: customizedResume.job_company,
        baseResumeTitle: customizedResume.base_resume_title,
        created_at: customizedResume.created_at,
        updated_at: customizedResume.updated_at
      };
      
      console.log('📦 [GET_CUSTOMIZED_RESUME] 准备响应数据:', {
        responseDataKeys: Object.keys(responseData),
        hasOptimizedData: !!responseData.optimized_data,
        hasOptimizedDataAlt: !!responseData.optimizedData
      });
      
      console.log('✅ [GET_CUSTOMIZED_RESUME] 获取成功，返回数据');
      
      res.json({
        success: true,
        data: responseData,
        message: '获取专属简历成功'
      });
      
    } catch (error) {
      console.error('❌ [GET_CUSTOMIZED_RESUME] 获取失败:', error.message);
      console.error('❌ [GET_CUSTOMIZED_RESUME] 错误堆栈:', error.stack);
      console.error('❌ [GET_CUSTOMIZED_RESUME] 错误详情:', {
        name: error.name,
        code: error.code,
        sql: error.sql
      });
      
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
