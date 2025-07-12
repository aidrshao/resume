/**
 * TopUpPackController
 * -------------------
 * 管理员加油包管理接口 (/api/admin/top-up-packs)
 */

const TopUpPackService = require('../services/topUpPackService');

class TopUpPackController {
  static async listPacks(req, res) {
    try {
      const packs = await TopUpPackService.getAll(req.query);
      res.json({ success: true, data: packs, message: '获取加油包成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '获取加油包失败' });
    }
  }

  static async createPack(req, res) {
    try {
      const pack = await TopUpPackService.create(req.body);
      res.json({ success: true, data: pack, message: '创建加油包成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '创建加油包失败' });
    }
  }

  static async getPack(req, res) {
    try {
      const { id } = req.params;
      const pack = await TopUpPackService.getById(id);
      if (!pack) return res.status(404).json({ success: false, message: '加油包不存在' });
      res.json({ success: true, data: pack, message: '获取加油包成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '获取加油包失败' });
    }
  }

  static async updatePack(req, res) {
    try {
      const { id } = req.params;
      const pack = await TopUpPackService.update(id, req.body);
      res.json({ success: true, data: pack, message: '更新加油包成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '更新加油包失败' });
    }
  }

  static async deletePack(req, res) {
    try {
      const { id } = req.params;
      await TopUpPackService.delete(id);
      res.json({ success: true, message: '删除加油包成功' });
    } catch (err) {
      res.status(500).json({ success: false, message: '删除加油包失败' });
    }
  }
}

module.exports = TopUpPackController; 