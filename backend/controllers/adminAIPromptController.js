/**
 * 管理员AI提示词控制器
 * 管理系统的AI提示词模板和配置
 */

const AIPrompt = require('../models/AIPrompt');

class AdminAIPromptController {
  /**
   * 获取所有提示词
   * GET /api/admin/ai-prompts
   */
  static async getAllPrompts(req, res) {
    try {
      const { category, isActive, page = 1, limit = 50 } = req.query;
      
      console.log('🔍 [GET_AI_PROMPTS] 获取提示词列表');
      console.log('📝 [GET_AI_PROMPTS] 查询参数:', { category, isActive, page, limit });

      const options = {
        category: category || undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const prompts = await AIPrompt.findAll(options);
      const stats = await AIPrompt.getStats();

      console.log('✅ [GET_AI_PROMPTS] 获取成功，数量:', prompts.length);

      res.json({
        success: true,
        data: {
          prompts,
          stats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: stats.total
          }
        },
        message: '获取提示词列表成功'
      });

    } catch (error) {
      console.error('❌ [GET_AI_PROMPTS] 获取失败:', error);
      res.status(500).json({
        success: false,
        message: '获取提示词列表失败',
        error: error.message
      });
    }
  }

  /**
   * 根据ID获取提示词详情
   * GET /api/admin/ai-prompts/:id
   */
  static async getPromptById(req, res) {
    try {
      const { id } = req.params;
      
      console.log('🔍 [GET_AI_PROMPT] 获取提示词详情, ID:', id);

      const prompt = await AIPrompt.findById(id);
      
      if (!prompt) {
        return res.status(404).json({
          success: false,
          message: '提示词不存在'
        });
      }

      console.log('✅ [GET_AI_PROMPT] 获取成功:', prompt.name);

      res.json({
        success: true,
        data: prompt,
        message: '获取提示词详情成功'
      });

    } catch (error) {
      console.error('❌ [GET_AI_PROMPT] 获取失败:', error);
      res.status(500).json({
        success: false,
        message: '获取提示词详情失败',
        error: error.message
      });
    }
  }

  /**
   * 创建新提示词
   * POST /api/admin/ai-prompts
   */
  static async createPrompt(req, res) {
    try {
      const {
        name,
        key,
        prompt_template,
        description,
        category,
        model_type,
        model_config,
        variables,
        is_active
      } = req.body;

      console.log('🆕 [CREATE_AI_PROMPT] 创建提示词');
      console.log('📝 [CREATE_AI_PROMPT] 数据:', { name, key, category, model_type });

      // 验证必填字段
      if (!name || !key || !prompt_template) {
        return res.status(400).json({
          success: false,
          message: '名称、标识和模板内容为必填项'
        });
      }

      // 验证key格式
      if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
        return res.status(400).json({
          success: false,
          message: '提示词标识只能包含字母、数字、下划线和横线'
        });
      }

      // 验证模型类型
      if (model_type && !['gpt', 'deepseek'].includes(model_type)) {
        return res.status(400).json({
          success: false,
          message: '模型类型只能是 gpt 或 deepseek'
        });
      }

      const promptData = {
        name: name.trim(),
        key: key.trim(),
        prompt_template: prompt_template.trim(),
        description: description?.trim(),
        category: category?.trim() || 'general',
        model_type: model_type || 'gpt',
        model_config: model_config || {},
        variables: variables || {},
        is_active: is_active !== undefined ? is_active : true
      };

      const newPrompt = await AIPrompt.create(promptData);

      console.log('✅ [CREATE_AI_PROMPT] 创建成功, ID:', newPrompt.id);

      res.status(201).json({
        success: true,
        data: newPrompt,
        message: '创建提示词成功'
      });

    } catch (error) {
      console.error('❌ [CREATE_AI_PROMPT] 创建失败:', error);
      
      if (error.message.includes('已存在')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: '创建提示词失败',
        error: error.message
      });
    }
  }

  /**
   * 更新提示词
   * PUT /api/admin/ai-prompts/:id
   */
  static async updatePrompt(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        key,
        prompt_template,
        description,
        category,
        model_type,
        model_config,
        variables,
        is_active
      } = req.body;

      console.log('📝 [UPDATE_AI_PROMPT] 更新提示词, ID:', id);
      console.log('📝 [UPDATE_AI_PROMPT] 数据:', { name, key, category, model_type });

      // 检查提示词是否存在
      const existingPrompt = await AIPrompt.findById(id);
      if (!existingPrompt) {
        return res.status(404).json({
          success: false,
          message: '提示词不存在'
        });
      }

      // 验证key格式
      if (key && !/^[a-zA-Z0-9_-]+$/.test(key)) {
        return res.status(400).json({
          success: false,
          message: '提示词标识只能包含字母、数字、下划线和横线'
        });
      }

      // 验证模型类型
      if (model_type && !['gpt', 'deepseek'].includes(model_type)) {
        return res.status(400).json({
          success: false,
          message: '模型类型只能是 gpt 或 deepseek'
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (key !== undefined) updateData.key = key.trim();
      if (prompt_template !== undefined) updateData.prompt_template = prompt_template.trim();
      if (description !== undefined) updateData.description = description?.trim();
      if (category !== undefined) updateData.category = category?.trim() || 'general';
      if (model_type !== undefined) updateData.model_type = model_type;
      if (model_config !== undefined) updateData.model_config = model_config;
      if (variables !== undefined) updateData.variables = variables;
      if (is_active !== undefined) updateData.is_active = is_active;

      const updatedPrompt = await AIPrompt.update(id, updateData);

      console.log('✅ [UPDATE_AI_PROMPT] 更新成功:', updatedPrompt.name);

      res.json({
        success: true,
        data: updatedPrompt,
        message: '更新提示词成功'
      });

    } catch (error) {
      console.error('❌ [UPDATE_AI_PROMPT] 更新失败:', error);
      
      if (error.message.includes('已被其他记录使用')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: '更新提示词失败',
        error: error.message
      });
    }
  }

  /**
   * 删除提示词
   * DELETE /api/admin/ai-prompts/:id
   */
  static async deletePrompt(req, res) {
    try {
      const { id } = req.params;
      
      console.log('🗑️ [DELETE_AI_PROMPT] 删除提示词, ID:', id);

      // 检查提示词是否存在
      const existingPrompt = await AIPrompt.findById(id);
      if (!existingPrompt) {
        return res.status(404).json({
          success: false,
          message: '提示词不存在'
        });
      }

      const deleted = await AIPrompt.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: '删除提示词失败'
        });
      }

      console.log('✅ [DELETE_AI_PROMPT] 删除成功:', existingPrompt.name);

      res.json({
        success: true,
        message: '删除提示词成功'
      });

    } catch (error) {
      console.error('❌ [DELETE_AI_PROMPT] 删除失败:', error);
      res.status(500).json({
        success: false,
        message: '删除提示词失败',
        error: error.message
      });
    }
  }

  /**
   * 获取所有分类
   * GET /api/admin/ai-prompts/categories
   */
  static async getCategories(req, res) {
    try {
      console.log('🔍 [GET_AI_PROMPT_CATEGORIES] 获取分类列表');

      const categories = await AIPrompt.getCategories();

      console.log('✅ [GET_AI_PROMPT_CATEGORIES] 获取成功，数量:', categories.length);

      res.json({
        success: true,
        data: categories,
        message: '获取分类列表成功'
      });

    } catch (error) {
      console.error('❌ [GET_AI_PROMPT_CATEGORIES] 获取失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类列表失败',
        error: error.message
      });
    }
  }

  /**
   * 测试提示词渲染
   * POST /api/admin/ai-prompts/test-render
   */
  static async testRender(req, res) {
    try {
      const { prompt_template, variables } = req.body;
      
      console.log('🧪 [TEST_AI_PROMPT_RENDER] 测试提示词渲染');
      console.log('🧪 [TEST_AI_PROMPT_RENDER] 模板:', prompt_template);
      console.log('🧪 [TEST_AI_PROMPT_RENDER] 变量:', variables);

      if (!prompt_template) {
        return res.status(400).json({
          success: false,
          message: '模板内容不能为空'
        });
      }

      const rendered = AIPrompt.renderTemplate(prompt_template, variables || {});

      console.log('✅ [TEST_AI_PROMPT_RENDER] 渲染成功:', rendered);

      res.json({
        success: true,
        data: {
          prompt_template,
          variables: variables || {},
          rendered_prompt: rendered
        },
        message: '提示词渲染测试成功'
      });

    } catch (error) {
      console.error('❌ [TEST_AI_PROMPT_RENDER] 渲染失败:', error);
      res.status(500).json({
        success: false,
        message: '提示词渲染测试失败',
        error: error.message
      });
    }
  }

  /**
   * 批量操作提示词
   * POST /api/admin/ai-prompts/batch
   */
  static async batchOperation(req, res) {
    try {
      const { operation, ids } = req.body;
      
      console.log('🔄 [BATCH_AI_PROMPT] 批量操作:', operation, '数量:', ids?.length);

      if (!operation || !ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '操作类型和ID列表不能为空'
        });
      }

      let results = [];

      switch (operation) {
        case 'activate':
          for (const id of ids) {
            try {
              await AIPrompt.update(id, { is_active: true });
              results.push({ id, success: true });
            } catch (error) {
              results.push({ id, success: false, error: error.message });
            }
          }
          break;

        case 'deactivate':
          for (const id of ids) {
            try {
              await AIPrompt.update(id, { is_active: false });
              results.push({ id, success: true });
            } catch (error) {
              results.push({ id, success: false, error: error.message });
            }
          }
          break;

        case 'delete':
          for (const id of ids) {
            try {
              await AIPrompt.delete(id);
              results.push({ id, success: true });
            } catch (error) {
              results.push({ id, success: false, error: error.message });
            }
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            message: '不支持的操作类型'
          });
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log('✅ [BATCH_AI_PROMPT] 批量操作完成, 成功:', successCount, '失败:', failureCount);

      res.json({
        success: true,
        data: {
          operation,
          total: ids.length,
          success: successCount,
          failure: failureCount,
          results
        },
        message: `批量${operation}操作完成`
      });

    } catch (error) {
      console.error('❌ [BATCH_AI_PROMPT] 批量操作失败:', error);
      res.status(500).json({
        success: false,
        message: '批量操作失败',
        error: error.message
      });
    }
  }
}

module.exports = AdminAIPromptController; 