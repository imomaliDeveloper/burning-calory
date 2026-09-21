import { Markup } from 'telegraf';

export const inlineKeyboards = {
  /**
   * Jinsni tanlash
   */
  getGenderKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('Erkak 👨', 'gender_male'),
        Markup.button.callback('Ayol 👩', 'gender_female'),
      ],
    ]);
  },

  /**
   * Faollik darajasini tanlash
   */
  getActivityKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🛋 Sedentary (Kamharakat)', 'act_sedentary')],
      [Markup.button.callback('🚶 Light (Yengil: haftada 1-3 kun)', 'act_light')],
      [Markup.button.callback('🏃 Moderate (O\'rtacha: haftada 3-5 kun)', 'act_moderate')],
      [Markup.button.callback('⚡ Active (Yuqori: haftada 6-7 kun)', 'act_active')],
      [Markup.button.callback('🔥 Very Active (Juda faol / 2 mahal)', 'act_very_active')],
    ]);
  },

  /**
   * Mashg'ulot kunlari soni
   */
  getWorkoutDaysKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('2 kun', 'days_2'),
        Markup.button.callback('3 kun', 'days_3'),
        Markup.button.callback('4 kun', 'days_4'),
      ],
      [
        Markup.button.callback('5 kun', 'days_5'),
        Markup.button.callback('6 kun', 'days_6'),
      ],
    ]);
  },

  /**
   * Mashg'ulot joyi (Uy yoki Zal)
   */
  getLocationKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🏠 Uy sharoitida', 'loc_home'),
        Markup.button.callback('🏋️ Fitnes zalida', 'loc_gym'),
      ],
    ]);
  },

  /**
   * Fitness maqsadi
   */
  getGoalKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔥 Vazn tashlash', 'goal_weight_loss')],
      [Markup.button.callback('💪 Mushak qurish', 'goal_build_muscle')],
      [Markup.button.callback('⚡ Recomposition', 'goal_recomposition')],
      [Markup.button.callback('🏆 Kuch va fitness', 'goal_strength')],
    ]);
  },

  /**
   * Profilni tahrirlash / boshqarish menyusi
   */
  getProfileSettingsKeyboard(notificationsEnabled = 1) {
    const notifText = notificationsEnabled === 1 ? '🔔 Eslatmalar: Yoqilgan (O\'chirish)' : '🔕 Eslatmalar: O\'chirilgan (Yoqish)';
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✏️ Vaznni yangilash', 'edit_weight'),
        Markup.button.callback('🎯 Maqsadni o\'zgartirish', 'edit_goal'),
      ],
      [
        Markup.button.callback(notifText, 'toggle_notifications'),
      ],
      [
        Markup.button.callback('📄 Shaxsiy dasturni PDF yuklab olish', 'download_plan_pdf'),
      ],
      [
        Markup.button.callback('🔄 Butun profilni qayta to\'ldirish', 'edit_all'),
      ],
      [
        Markup.button.callback('🗑 Profilni o\'chirish', 'prompt_delete_profile'),
      ],
    ]);
  },

  /**
   * Profilni o'chirishni tasdiqlash
   */
  getDeleteConfirmKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('❌ Ha, butunlay o\'chirilsin', 'confirm_delete_profile'),
        Markup.button.callback('🔙 Bekor qilish', 'cancel_delete_profile'),
      ],
    ]);
  },

  /**
   * Haftalik check-in baholash tugmalari (1-10)
   */
  getRatingKeyboard(prefix) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('1-2 😞', `${prefix}_2`),
        Markup.button.callback('3-4 😐', `${prefix}_4`),
        Markup.button.callback('5-6 🙂', `${prefix}_6`),
        Markup.button.callback('7-8 😃', `${prefix}_8`),
        Markup.button.callback('9-10 🚀', `${prefix}_10`),
      ],
    ]);
  },
};
