/**
 * 管理员全局配额配置控制器
 * 管理系统级别的配额配置
 */

const GlobalQuotaConfig = require('../models/GlobalQuotaConfig');
const knex = require('../config/database');

class AdminGlobalQuotaController {

  /**
   * 获取全局配额配置列表
   * GET /api/admin/global-quota-configs
   */
  static async getGlobalQuotaConfigs(req, res) {
    try {
      const { category, isActive, page = 1, limit = 20 } = req.query;
      
      console.log('🚀 [GET_GLOBAL_QUOTA_CONFIGS] 获取全局配额配置列表:', { category, isActive });

      const configs = await GlobalQuotaConfig.getAllConfigs({
        category,
        isActive: isActive !== undefined ? JSON.parse(isActive) : null
      });

      // 分页处理
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedConfigs = configs.slice(startIndex, endIndex);

      const result = {
        data: paginatedConfigs.map(config => GlobalQuotaConfig.formatForDisplay(config)),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: configs.length,
          totalPages: Math.ceil(configs.length / parseInt(limit))
        }
      };

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: '获取全局配额配置成功'
      });

    } catch (error) {
      console.error('❌ [GET_GLOBAL_QUOTA_CONFIGS] 获取失败:', error.message);
      res.status(500).json({
        success: false,
        message: '获取全局配额配置失败'
      });
    }
  }

  /**
   * 更新全局配额配置
   * PUT /api/admin/global-quota-configs/:id
   */
  static async updateGlobalQuotaConfig(req, res) {
    try {
      const { id } = req.params;
      const adminUserId = req.admin.id;
      const updateData = req.body;

      // 验证配置是否存在
      const existingConfig = await GlobalQuotaConfig.findById(parseInt(id));
      if (!existingConfig) {
        return res.status(404).json({
          success: false,
          message: '配额配置不存在'
        });
      }

      // 如果更新了default_quota，确保它是数字
      if (updateData.default_quota !== undefined) {
        updateData.default_quota = parseInt(updateData.default_quota);
      }

      // 如果更新了sort_order，确保它是数字
      if (updateData.sort_order !== undefined) {
        updateData.sort_order = parseInt(updateData.sort_order);
      }

      const updatedConfig = await GlobalQuotaConfig.update(parseInt(id), updateData);

      res.json({
        success: true,
        data: GlobalQuotaConfig.formatForDisplay(updatedConfig),
        message: '更新配额配置成功'
      });

    } catch (error) {
      console.error('❌ [UPDATE_GLOBAL_QUOTA_CONFIG] 更新失败:', error.message);
      res.status(500).json({
        success: false,
        message: '更新配额配置失败'
      });
    }
  }

  /**
   * 批量更新全局配额配置
   * POST /api/admin/global-quota-configs/batch-update
   */
  static async batchUpdateGlobalQuotaConfigs(req, res) {
    try {
      const { configUpdates } = req.body;
      const adminUserId = req.admin.id;

      if (!Array.isArray(configUpdates) || configUpdates.length === 0) {
        return res.status(400).json({
          success: false,
          message: '配置更新数据不能为空'
        });
      }

      const results = await GlobalQuotaConfig.batchUpdate(configUpdates);

      res.json({
        success: true,
        data: results,
        message: `批量更新了${results.length}个配额配置`
      });

    } catch (error) {
      console.error('❌ [BATCH_UPDATE_GLOBAL_QUOTA_CONFIGS] 批量更新失败:', error.message);
      res.status(500).json({
        success: false,
        message: '批量更新配额配置失败'
      });
    }
  }

  /**
   * 获取全局配额配置统计信息
   * GET /api/admin/global-quota-configs/statistics
   */
  static async getGlobalQuotaConfigStatistics(req, res) {
    try {
      const statistics = await GlobalQuotaConfig.getStatistics();

      res.json({
        success: true,
        data: statistics,
        message: '获取配额配置统计成功'
      });

    } catch (error) {
      console.error('❌ [GET_GLOBAL_QUOTA_CONFIG_STATISTICS] 获取统计失败:', error.message);
      res.status(500).json({
        success: false,
        message: '获取配额配置统计失败'
      });
    }
  }

}

module.exports = AdminGlobalQuotaController; 