import { query, queryOne, execute } from '../index.js';

export const userRepository = {
  /**
   * Telegram ID bo'yicha foydalanuvchini topish
   */
  async findByTelegramId(telegramId) {
    return await queryOne('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
  },

  /**
   * Ichki ID bo'yicha foydalanuvchini topish
   */
  async findById(id) {
    return await queryOne('SELECT * FROM users WHERE id = ?', [id]);
  },

  /**
   * Yangi foydalanuvchi yaratish
   */
  async create({ telegramId, name, age, gender, height, weight, activityLevel, goal, workoutLocation, workoutDays }) {
    const res = await execute(
      `INSERT INTO users (
        telegram_id, name, age, gender, height, weight, 
        activity_level, goal, workout_location, workout_days, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        telegramId,
        name || null,
        age || null,
        gender || null,
        height || null,
        weight || null,
        activityLevel || null,
        goal || null,
        workoutLocation || null,
        workoutDays || 3,
      ]
    );

    return await this.findByTelegramId(telegramId);
  },

  /**
   * Profilni yangilash
   */
  async update(telegramId, updates) {
    const fields = [];
    const values = [];

    const allowed = {
      name: 'name',
      age: 'age',
      gender: 'gender',
      height: 'height',
      weight: 'weight',
      activityLevel: 'activity_level',
      goal: 'goal',
      workoutLocation: 'workout_location',
      workoutDays: 'workout_days',
      notificationsEnabled: 'notifications_enabled',
      fastingMode: 'fasting_mode',
    };

    for (const [key, col] of Object.entries(allowed)) {
      if (updates[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(updates[key]);
      }
    }

    if (fields.length === 0) return await this.findByTelegramId(telegramId);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(telegramId);

    await execute(
      `UPDATE users SET ${fields.join(', ')} WHERE telegram_id = ?`,
      values
    );

    return await this.findByTelegramId(telegramId);
  },

  /**
   * Profilni va unga tegishli barcha ma'lumotlarni o'chirish (Privacy talabi)
   */
  async deleteByTelegramId(telegramId) {
    const user = await this.findByTelegramId(telegramId);
    if (!user) return false;

    // Foreign key CASCADE orqali bog'langan jadvallardagi ma'lumotlar ham tozalanadi
    await execute('DELETE FROM users WHERE telegram_id = ?', [telegramId]);
    return true;
  },

  /**
   * Eslatmalar yoqilgan barcha faol foydalanuvchilarni olish
   */
  async findSubscribersForReminders() {
    return await query('SELECT * FROM users WHERE notifications_enabled = 1 AND height IS NOT NULL AND weight IS NOT NULL');
  },

  /**
   * Barcha ro'yxatdan o'tgan foydalanuvchilar Telegram ID larini olish (Broadcast uchun)
   */
  async getAllTelegramIds() {
    const rows = await query('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL');
    return rows.map((r) => r.telegram_id);
  },

  /**
   * Admin statistikasi
   */
  async getAdminStats() {
    const totalUsersRow = await queryOne('SELECT COUNT(*) as count FROM users');
    const goalsRows = await query('SELECT goal, COUNT(*) as count FROM users WHERE goal IS NOT NULL GROUP BY goal');
    const mealsCountRow = await queryOne('SELECT COUNT(*) as count FROM meals');
    const workoutsCountRow = await queryOne('SELECT COUNT(*) as count FROM workouts');

    return {
      totalUsers: Number(totalUsersRow?.count || 0),
      goals: goalsRows,
      totalMeals: Number(mealsCountRow?.count || 0),
      totalWorkouts: Number(workoutsCountRow?.count || 0),
    };
  },
};
