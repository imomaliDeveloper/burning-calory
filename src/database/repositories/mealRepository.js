import { query, queryOne, execute } from '../index.js';
import { nutritionRepository } from './nutritionRepository.js';

export const mealRepository = {
  /**
   * Yangi iste'mol qilingan taomni saqlash
   */
  async logMeal({ userId, date, photoReference, dishName, portionGrams, calories, protein, carbs, fat }) {
    const logDate = date || new Date().toISOString().split('T')[0];

    const res = await execute(
      `INSERT INTO meals (
        user_id, date, photo_reference, dish_name, portion_grams, 
        calories, protein, carbs, fat, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        logDate,
        photoReference || null,
        dishName,
        portionGrams || null,
        calories,
        protein,
        carbs,
        fat,
      ]
    );

    // Bugungi jami ko'rsatkichlarni hisoblab, nutrition jadvaliga ham sinxronizatsiya qilamiz
    const totals = await this.getTodayTotals(userId, logDate);
    await nutritionRepository.log(
      userId,
      totals.totalCalories,
      totals.totalProtein,
      totals.totalCarbs,
      totals.totalFat,
      logDate
    );

    return res.lastInsertRowid;
  },

  /**
   * Foydalanuvchining bugungi barcha taomlarini olish
   */
  async getTodayMeals(userId, date = null) {
    const logDate = date || new Date().toISOString().split('T')[0];
    return await query(
      'SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY created_at ASC',
      [userId, logDate]
    );
  },

  /**
   * Bugungi jami iste'mol qilingan kaloriya va makrolar yig'indisi
   */
  async getTodayTotals(userId, date = null) {
    const logDate = date || new Date().toISOString().split('T')[0];
    const row = await queryOne(
      `SELECT 
        COALESCE(SUM(calories), 0) as totalCalories,
        COALESCE(SUM(protein), 0) as totalProtein,
        COALESCE(SUM(carbs), 0) as totalCarbs,
        COALESCE(SUM(fat), 0) as totalFat,
        COUNT(*) as mealCount
      FROM meals 
      WHERE user_id = ? AND date = ?`,
      [userId, logDate]
    );

    return {
      totalCalories: Math.round(Number(row?.totalCalories || 0)),
      totalProtein: Math.round(Number(row?.totalProtein || 0)),
      totalCarbs: Math.round(Number(row?.totalCarbs || 0)),
      totalFat: Math.round(Number(row?.totalFat || 0)),
      mealCount: Number(row?.mealCount || 0),
    };
  },
};
