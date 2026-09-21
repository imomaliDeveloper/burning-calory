import { query, queryOne, execute } from '../index.js';

export const nutritionRepository = {
  /**
   * Kunlik ovqatlanishni saqlash yoki yangilash
   */
  async log(userId, calories, protein, carbs, fat, date = null) {
    const logDate = date || new Date().toISOString().split('T')[0];

    // Ushbu kunda yozuv bor-yo'qligini tekshirish
    const existing = await queryOne('SELECT id FROM nutrition WHERE user_id = ? AND date = ?', [userId, logDate]);

    if (existing) {
      await execute(
        'UPDATE nutrition SET calories = ?, protein = ?, carbs = ?, fat = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
        [calories, protein, carbs, fat, existing.id]
      );
      return existing.id;
    } else {
      const res = await execute(
        'INSERT INTO nutrition (user_id, date, calories, protein, carbs, fat, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [userId, logDate, calories, protein, carbs, fat]
      );
      return res.lastInsertRowid;
    }
  },

  /**
   * Muayyan kundagi ovqatlanish yozuvini olish
   */
  async getByDate(userId, date = null) {
    const logDate = date || new Date().toISOString().split('T')[0];
    return await queryOne('SELECT * FROM nutrition WHERE user_id = ? AND date = ?', [userId, logDate]);
  },

  /**
   * So'nggi N kundagi ovqatlanish tarixi
   */
  async getHistory(userId, days = 7) {
    return await query(
      'SELECT * FROM nutrition WHERE user_id = ? ORDER BY date DESC LIMIT ?',
      [userId, days]
    );
  },
};
