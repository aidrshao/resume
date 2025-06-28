/**
 * AI对话控制器
 * 处理AI问答收集用户信息的功能
 */

const { aiService } = require('../services/aiService');
const { UserProfile } = require('../models/Resume');
const knex = require('../config/database');

class AIChatController {
  /**
   * 开始AI对话收集信息
   * POST /api/ai-chat/start
   */
  static async startInfoCollection(req, res) {
    try {
      const userId = req.user.id;
      const sessionId = `session_${userId}_${Date.now()}`;
      
      // 获取用户已有信息
      const existingInfo = await UserProfile.getCompleteProfile(userId);
      
      // 创建对话记录
      const [conversation] = await knex('ai_conversations')
        .insert({
          user_id: userId,
          session_id: sessionId,
          conversation_type: 'info_collection',
          conversation_data: {
            messages: [],
            currentStep: 'greeting'
          },
          collected_info: existingInfo,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      
      // 生成欢迎消息
      const welcomeMessage = `您好！我是您的AI简历助手。我将通过几个简单的问题来了解您的背景，帮助您创建一份出色的简历。

让我们开始吧！首先，请告诉我您的姓名是什么？`;
      
      // 更新对话记录
      await knex('ai_conversations')
        .where('id', conversation.id)
        .update({
          conversation_data: {
            messages: [
              {
                role: 'assistant',
                content: welcomeMessage,
                timestamp: new Date().toISOString()
              }
            ],
            currentStep: 'personal_info'
          },
          updated_at: new Date()
        });
      
      res.json({
        success: true,
        data: {
          sessionId,
          message: welcomeMessage,
          collectedInfo: existingInfo,
          completionPercentage: 0
        },
        message: '对话开始成功'
      });
    } catch (error) {
      console.error('开始AI对话失败:', error);
      res.status(500).json({
        success: false,
        message: '开始AI对话失败'
      });
    }
  }

  /**
   * 发送消息到AI对话
   * POST /api/ai-chat/message
   */
  static async sendMessage(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId, message } = req.body;
      
      if (!sessionId || !message) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }
      
      // 获取对话记录
      const conversation = await knex('ai_conversations')
        .where('session_id', sessionId)
        .where('user_id', userId)
        .where('status', 'active')
        .first();
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: '对话不存在或已结束'
        });
      }
      
      // 构建对话历史
      const conversationHistory = conversation.conversation_data.messages || [];
      
      // 添加用户消息
      conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });
      
      console.log('🤖 处理AI对话:', { sessionId, message });
      
      // 调用AI服务处理对话
      const aiResponse = await aiService.collectUserInfoByChat(
        conversationHistory,
        message,
        conversation.collected_info
      );
      
      console.log('✅ AI对话处理完成');
      
      // 添加AI回复
      conversationHistory.push({
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date().toISOString()
      });
      
      // 更新对话记录
      const updateData = {
        conversation_data: {
          messages: conversationHistory,
          currentStep: aiResponse.isComplete ? 'completed' : 'collecting'
        },
        collected_info: aiResponse.updatedInfo,
        status: aiResponse.isComplete ? 'completed' : 'active',
        updated_at: new Date()
      };
      
      await knex('ai_conversations')
        .where('id', conversation.id)
        .update(updateData);
      
      // 如果信息收集完成，保存到用户资料
      if (aiResponse.isComplete) {
        await this.saveCollectedInfo(userId, aiResponse.updatedInfo);
      }
      
      res.json({
        success: true,
        data: {
          response: aiResponse.response,
          nextQuestion: aiResponse.nextQuestion,
          isComplete: aiResponse.isComplete,
          completionPercentage: aiResponse.completionPercentage || 0,
          collectedInfo: aiResponse.updatedInfo
        },
        message: '消息发送成功'
      });
    } catch (error) {
      console.error('发送AI对话消息失败:', error);
      res.status(500).json({
        success: false,
        message: 'AI对话处理失败'
      });
    }
  }

  /**
   * 获取对话历史
   * GET /api/ai-chat/history/:sessionId
   */
  static async getChatHistory(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      
      const conversation = await knex('ai_conversations')
        .where('session_id', sessionId)
        .where('user_id', userId)
        .first();
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: '对话不存在'
        });
      }
      
      res.json({
        success: true,
        data: {
          sessionId: conversation.session_id,
          messages: conversation.conversation_data.messages || [],
          collectedInfo: conversation.collected_info,
          status: conversation.status,
          createdAt: conversation.created_at
        },
        message: '获取对话历史成功'
      });
    } catch (error) {
      console.error('获取对话历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取对话历史失败'
      });
    }
  }

  /**
   * 获取用户的所有对话会话
   * GET /api/ai-chat/sessions
   */
  static async getChatSessions(req, res) {
    try {
      const userId = req.user.id;
      
      const sessions = await knex('ai_conversations')
        .where('user_id', userId)
        .select('id', 'session_id', 'conversation_type', 'status', 'created_at', 'updated_at')
        .orderBy('updated_at', 'desc');
      
      res.json({
        success: true,
        data: sessions,
        message: '获取对话会话列表成功'
      });
    } catch (error) {
      console.error('获取对话会话列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取对话会话列表失败'
      });
    }
  }

  /**
   * 结束对话
   * POST /api/ai-chat/end
   */
  static async endConversation(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.body;
      
      const conversation = await knex('ai_conversations')
        .where('session_id', sessionId)
        .where('user_id', userId)
        .first();
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: '对话不存在'
        });
      }
      
      // 保存收集到的信息
      await this.saveCollectedInfo(userId, conversation.collected_info);
      
      // 更新对话状态
      await knex('ai_conversations')
        .where('id', conversation.id)
        .update({
          status: 'completed',
          updated_at: new Date()
        });
      
      res.json({
        success: true,
        message: '对话结束，信息已保存'
      });
    } catch (error) {
      console.error('结束对话失败:', error);
      res.status(500).json({
        success: false,
        message: '结束对话失败'
      });
    }
  }

  /**
   * 保存收集到的信息到用户资料
   * @param {number} userId - 用户ID
   * @param {Object} collectedInfo - 收集到的信息
   */
  static async saveCollectedInfo(userId, collectedInfo) {
    try {
      console.log('💾 保存收集到的用户信息');
      
      // 保存个人信息
      if (collectedInfo.personalInfo) {
        await UserProfile.upsert(userId, {
          full_name: collectedInfo.personalInfo.name,
          phone: collectedInfo.personalInfo.phone,
          location: collectedInfo.personalInfo.location,
          summary: collectedInfo.personalInfo.summary,
          skills: collectedInfo.skills || [],
          languages: collectedInfo.languages || []
        });
      }
      
      // 保存教育经历
      if (collectedInfo.educations && collectedInfo.educations.length > 0) {
        // 先删除现有的教育经历
        await knex('educations').where('user_id', userId).del();
        
        // 插入新的教育经历
        const educations = collectedInfo.educations.map((edu, index) => ({
          user_id: userId,
          school: edu.school,
          degree: edu.degree,
          major: edu.major,
          start_date: edu.startDate,
          end_date: edu.endDate,
          gpa: edu.gpa,
          description: edu.description,
          sort_order: index,
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        await knex('educations').insert(educations);
      }
      
      // 保存工作经历
      if (collectedInfo.workExperiences && collectedInfo.workExperiences.length > 0) {
        // 先删除现有的工作经历
        await knex('work_experiences').where('user_id', userId).del();
        
        // 插入新的工作经历
        const workExperiences = collectedInfo.workExperiences.map((work, index) => ({
          user_id: userId,
          company: work.company,
          position: work.position,
          location: work.location,
          start_date: work.startDate,
          end_date: work.endDate,
          is_current: work.endDate === null || work.endDate === 'present',
          description: work.description,
          achievements: work.achievements || [],
          technologies: work.technologies || [],
          sort_order: index,
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        await knex('work_experiences').insert(workExperiences);
      }
      
      // 保存项目经历
      if (collectedInfo.projects && collectedInfo.projects.length > 0) {
        // 先删除现有的项目经历
        await knex('projects').where('user_id', userId).del();
        
        // 插入新的项目经历
        const projects = collectedInfo.projects.map((project, index) => ({
          user_id: userId,
          name: project.name,
          role: project.role,
          start_date: project.startDate,
          end_date: project.endDate,
          is_current: project.endDate === null || project.endDate === 'present',
          description: project.description,
          technologies: project.technologies || [],
          demo_url: project.demo_url,
          github_url: project.github_url,
          sort_order: index,
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        await knex('projects').insert(projects);
      }
      
      console.log('✅ 用户信息保存完成');
    } catch (error) {
      console.error('保存用户信息失败:', error);
      throw error;
    }
  }

  /**
   * AI对话演示 - 不需要认证
   * POST /api/ai/chat
   */
  static async chatDemo(req, res) {
    try {
      const { message, conversationId } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          message: '缺少消息内容'
        });
      }
      
      console.log('🤖 处理AI对话演示:', { conversationId, message });
      
      // 构建简单的对话历史（演示模式）
      const conversationHistory = [
        {
          role: 'system',
          content: '你是一个专业的简历助手，正在帮助用户收集简历信息。请保持友好、专业的语调，每次只问1-2个相关问题。'
        },
        {
          role: 'user',
          content: message
        }
      ];
      
      // 调用AI服务处理对话
      const aiResponse = await aiService.collectUserInfoByChat(
        conversationHistory,
        message,
        {} // 演示模式，不保存已收集信息
      );
      
      console.log('✅ AI对话演示处理完成');
      
      res.json({
        success: true,
        data: {
          reply: aiResponse.response || '感谢您的信息！请继续告诉我更多关于您的工作经历。',
          nextQuestion: aiResponse.nextQuestion,
          isComplete: aiResponse.isComplete || false,
          completionPercentage: aiResponse.completionPercentage || 0
        },
        message: '对话成功'
      });
      
    } catch (error) {
      console.error('AI对话演示失败:', error);
      res.status(500).json({
        success: false,
        message: 'AI对话服务暂时不可用，请稍后重试'
      });
    }
  }
}

module.exports = AIChatController; 