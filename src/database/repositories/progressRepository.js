import { query, queryOne, execute } from '../index.js';

export const progressRepository = {
  /**
   * Yangi o'lchov yozuvini qo'shish (vazn, bel, rasm)
   */
  async create(userId, weight, waist = null, photoReference = null) {
    const res = await execute(
      'INSERT INTO progress (user_id, weight, waist, photo_reference, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [userId, weight, waist, photoReference]
    );

    // Shuningdek, users jadvalidagi hozirgi vaznni ham yangilab qo'yamiz
    await execute('UPDATE users SET weight = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [weight, userId]);

    return res.lastInsertRowid;
  },

  /**
   * Foydalanuvchining barcha progress yozuvlarini sanasi bo'yicha olish (o'sish tartibida)
   */
  async getHistoryByUserId(userId) {
    return await query(
      'SELECT * FROM progress WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
  },

  /**
   * Boshlang'ich va eng oxirgi ko'rsatkichlarni olish
   */
  async getInitialAndLatest(userId) {
    const history = await this.getHistoryByUserId(userId);
    if (!history || history.length === 0) return null;

    const initial = history[0];
    const latest = history[history.length - 1];
    const diffWeight = +(latest.weight - initial.weight).toFixed(2);
    const diffWaist = (latest.waist && initial.waist) ? +(latest.waist - initial.waist).toFixed(2) : null;

    return {
      initial,
      latest,
      diffWeight,
      diffWaist,
      totalEntries: history.length,
      history,
    };
  },
};
