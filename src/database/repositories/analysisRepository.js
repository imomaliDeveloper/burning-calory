import { query, queryOne, execute } from '../index.js';

export const analysisRepository = {
  /**
   * Yangi tana tahlilini saqlash
   */
  async create(userId, imageReference, analysis) {
    const analysisStr = typeof analysis === 'object' ? JSON.stringify(analysis) : String(analysis);
    const res = await execute(
      'INSERT INTO body_analyses (user_id, image_reference, analysis, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [userId, imageReference || null, analysisStr]
    );
    return res.lastInsertRowid;
  },

  /**
   * Foydalanuvchining eng oxirgi tahlilini olish
   */
  async getLatestByUserId(userId) {
    const row = await queryOne(
      'SELECT * FROM body_analyses WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId]
    );
    if (!row) return null;
    try {
      return {
        ...row,
        analysis: JSON.parse(row.analysis),
      };
    } catch {
      return row;
    }
  },

  /**
   * Foydalanuvchining barcha tahlillarini olish
   */
  async getAllByUserId(userId, limit = 10) {
    const rows = await query(
      'SELECT * FROM body_analyses WHERE user_id = ? ORDER BY id DESC LIMIT ?',
      [userId, limit]
    );
    return rows.map((row) => {
      try {
        return { ...row, analysis: JSON.parse(row.analysis) };
      } catch {
        return row;
      }
    });
  },
};
