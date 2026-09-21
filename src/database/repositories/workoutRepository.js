import { query, execute } from '../index.js';

export const workoutRepository = {
  /**
   * Bajarilgan mashqni yozib qo'yish
   */
  async logExercise(userId, exercise, sets, reps, weight = 0, date = null) {
    const logDate = date || new Date().toISOString().split('T')[0];
    const res = await execute(
      'INSERT INTO workouts (user_id, date, exercise, sets, reps, weight, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [userId, logDate, exercise, sets, reps, weight]
    );
    return res.lastInsertRowid;
  },

  /**
   * Foydalanuvchining yaqinda qilgan mashqlarini olish
   */
  async getHistoryByUserId(userId, limit = 20) {
    return await query(
      'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT ?',
      [userId, limit]
    );
  },

  /**
   * Ma'lum bir kundagi mashqlarni olish
   */
  async getByDate(userId, date) {
    return await query(
      'SELECT * FROM workouts WHERE user_id = ? AND date = ? ORDER BY id ASC',
      [userId, date]
    );
  },

  /**
   * Umumiy statistika (mashg'ulotlar soni)
   */
  async getStatsByUserId(userId) {
    const countRow = await query(
      'SELECT COUNT(DISTINCT date) as workout_days_count, COUNT(*) as total_sets FROM workouts WHERE user_id = ?',
      [userId]
    );
    return countRow[0] || { workout_days_count: 0, total_sets: 0 };
  },
};
