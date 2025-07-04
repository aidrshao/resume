/**
 * 简历渲染记录数据模型
 * 用于管理用户简历渲染的历史记录
 */

const { db } = require('../config/database');

class ResumeRender {
  
  /**
   * 创建渲染记录
   * @param {Object} renderData 渲染数据
   * @returns {Promise<Object>} 创建的渲染记录
   */
  static async create(renderData) {
    try {
      const [result] = await db('resume_renders')
        .insert({
          user_id: renderData.user_id,
          resume_id: renderData.resume_id,
          template_id: renderData.template_id,
          rendered_data: typeof renderData.rendered_data === 'string' 
            ? renderData.rendered_data 
            : JSON.stringify(renderData.rendered_data),
          status: renderData.status || 'pending'
        })
        .returning('id');

      return await this.findById(result.id);
    } catch (error) {
      console.error('创建渲染记录失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取渲染记录
   * @param {number} id 记录ID
   * @returns {Promise<Object>} 渲染记录
   */
  static async findById(id) {
    try {
      const render = await db('resume_renders')
        .leftJoin('resume_templates', 'resume_renders.template_id', 'resume_templates.id')
        .leftJoin('resumes', 'resume_renders.resume_id', 'resumes.id')
        .where('resume_renders.id', id)
        .select(
          'resume_renders.*',
          'resume_templates.name as template_name',
          'resume_templates.description as template_description',
          'resumes.title as resume_title'
        )
        .first();

      if (render && render.rendered_data) {
        try {
          render.rendered_data = JSON.parse(render.rendered_data);
        } catch (e) {
          console.warn('渲染数据解析失败:', e.message);
        }
      }

      return render;
    } catch (error) {
      console.error('获取渲染记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的渲染历史
   * @param {number} userId 用户ID
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 渲染记录列表
   */
  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const offset = (page - 1) * limit;

      let query = db('resume_renders')
        .leftJoin('resume_templates', 'resume_renders.template_id', 'resume_templates.id')
        .leftJoin('resumes', 'resume_renders.resume_id', 'resumes.id')
        .where('resume_renders.user_id', userId)
        .select(
          'resume_renders.id',
          'resume_renders.status',
          'resume_renders.file_path',
          'resume_renders.created_at',
          'resume_templates.name as template_name',
          'resume_templates.description as template_description',
          'resumes.title as resume_title'
        )
        .orderBy('resume_renders.created_at', 'desc');

      if (status) {
        query = query.where('resume_renders.status', status);
      }

      const renders = await query.limit(limit).offset(offset);
      
      return renders;
    } catch (error) {
      console.error('获取用户渲染历史失败:', error);
      throw error;
    }
  }

  /**
   * 更新渲染记录
   * @param {number} id 记录ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Object>} 更新后的记录
   */
  static async update(id, updateData) {
    try {
      // 准备更新数据，过滤掉undefined值
      const filteredData = {};
      if (updateData.status !== undefined) filteredData.status = updateData.status;
      if (updateData.pdf_url !== undefined) filteredData.pdf_url = updateData.pdf_url;
      if (updateData.file_path !== undefined) filteredData.file_path = updateData.file_path;
      if (updateData.file_size !== undefined) filteredData.file_size = updateData.file_size;
      if (updateData.error_message !== undefined) filteredData.error_message = updateData.error_message;
      if (updateData.metadata !== undefined) {
        filteredData.metadata = typeof updateData.metadata === 'string' 
          ? updateData.metadata 
          : JSON.stringify(updateData.metadata);
      }
      
      // 总是更新updated_at
      filteredData.updated_at = db.fn.now();

      await db('resume_renders')
        .where('id', id)
        .update(filteredData);

      return await this.findById(id);
    } catch (error) {
      console.error('更新渲染记录失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否已存在相同的渲染记录
   * @param {number} userId 用户ID
   * @param {number} resumeId 简历ID
   * @param {number} templateId 模板ID
   * @returns {Promise<Object|null>} 已存在的记录或null
   */
  static async findExisting(userId, resumeId, templateId) {
    try {
      const existing = await db('resume_renders')
        .where({
          user_id: userId,
          resume_id: resumeId,
          template_id: templateId,
          status: 'completed'
        })
        .orderBy('created_at', 'desc')
        .first();

      return existing;
    } catch (error) {
      console.error('检查已存在渲染记录失败:', error);
      throw error;
    }
  }

  /**
   * 删除渲染记录
   * @param {number} id 记录ID
   * @param {number} userId 用户ID（用于权限验证）
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id, userId) {
    try {
      const affected = await db('resume_renders')
        .where({ id, user_id: userId })
        .del();

      return affected > 0;
    } catch (error) {
      console.error('删除渲染记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户渲染统计
   * @param {number} userId 用户ID
   * @returns {Promise<Object>} 渲染统计
   */
  static async getUserStats(userId) {
    try {
      const stats = await db('resume_renders')
        .where('user_id', userId)
        .count('id as total_renders')
        .count(db.raw('CASE WHEN status = ? THEN 1 END as successful_renders', ['completed']))
        .count(db.raw('CASE WHEN status = ? THEN 1 END as failed_renders', ['failed']))
        .first();

      return {
        total_renders: parseInt(stats.total_renders),
        successful_renders: parseInt(stats.successful_renders || 0),
        failed_renders: parseInt(stats.failed_renders || 0)
      };
    } catch (error) {
      console.error('获取用户渲染统计失败:', error);
      throw error;
    }
  }
}

module.exports = ResumeRender; 