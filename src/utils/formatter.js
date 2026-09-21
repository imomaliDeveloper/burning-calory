/**
 * Xabarlarni o'zbek tilida chiroyli va qulay formatlash
 */

export const formatter = {
  /**
   * Maqsad nomini o'zbekcha ifodalash
   */
  getGoalText(goal) {
    const goals = {
      weight_loss: '🔥 Vazn tashlash (Yog\' yo\'qotish)',
      build_muscle: '💪 Mushak qurish (Massa olish)',
      recomposition: '⚡ Recomposition (Tana tarkibini yaxshilash)',
      strength: '🏆 Kuch va umumiy fitness',
    };
    return goals[goal] || goal || 'Belgilanmagan';
  },

  /**
   * Faollik darajasini o'zbekcha ifodalash
   */
  getActivityText(level) {
    const levels = {
      sedentary: '🛋 Kamharakat (Ofis ishi, mashqsiz)',
      light: '🚶 Yengil faol (Haftada 1-3 kun)',
      moderate: '🏃 O\'rtacha faol (Haftada 3-5 kun)',
      active: '⚡ Yuqori faol (Haftada 6-7 kun)',
      very_active: '🔥 Juda faol (Kuniga 2 mahal/og\'ir mehnat)',
    };
    return levels[level] || level || 'Belgilanmagan';
  },

  /**
   * Mashg'ulot joyini o'zbekcha ifodalash
   */
  getLocationText(loc) {
    return loc === 'home' ? '🏠 Uy sharoitida' : '🏋️ Fitnes zalida';
  },

  /**
   * Jinsni o'zbekcha ifodalash
   */
  getGenderText(gender) {
    return gender === 'female' ? 'Ayol' : 'Erkak';
  },

  /**
   * Foydalanuvchi profili kartochkasi
   */
  formatProfile(user, plan = null) {
    let msg = `👤 *SIZNING FITNESS PROFILINGIZ*\n\n`;
    msg += `▫️ *Ism:* ${user.name || '—'}\n`;
    msg += `▫️ *Yosh:* ${user.age || '—'} yosh\n`;
    msg += `▫️ *Jins:* ${this.getGenderText(user.gender)}\n`;
    msg += `▫️ *Bo'y:* ${user.height || '—'} sm\n`;
    msg += `▫️ *Vazn:* ${user.weight || '—'} kg\n`;
    msg += `▫️ *Faollik:* ${this.getActivityText(user.activity_level)}\n`;
    msg += `▫️ *Joylashuv:* ${this.getLocationText(user.workout_location)}\n`;
    msg += `▫️ *Mashq kunlari:* Haftada ${user.workout_days || 3} kun\n`;
    msg += `▫️ *Asosiy maqsad:* ${this.getGoalText(user.goal)}\n\n`;

    if (plan) {
      msg += `🎯 *SHAXSIY HISOB-KITOBLAR:*\n`;
      msg += `▫️ *BMI:* ${plan.bmi} (${plan.bmiCategory})\n`;
      msg += `▫️ *BMR (Bazaviy sarf):* ${plan.bmr} kcal\n`;
      msg += `▫️ *TDEE (Kunlik umumiy sarf):* ${plan.tdee} kcal\n\n`;
      msg += `🔥 *KUNLIK KALORIYA TARGETI:* *${plan.targetCalories} kcal*\n`;
      msg += `🥩 *Protein:* ${plan.macros.protein} g\n`;
      msg += `🥑 *Yog' (Fat):* ${plan.macros.fat} g\n`;
      msg += `🍚 *Uglevod (Carbs):* ${plan.macros.carbs} g\n\n`;

      if (plan.safetyDisclaimer) {
        msg += `${plan.safetyDisclaimer}\n\n`;
      }
    }

    msg += `_Quyidagi tugmalar orqali profilingizni tahrirlashingiz mumkin._`;
    return msg;
  },

  /**
   * Tana rasmi tahlili natijasini formatlash
   */
  formatBodyAnalysis(analysis) {
    if (!analysis.is_valid_body_photo) {
      return (
        `📸 *Tana rasmi tahlili natijasi:*\n\n` +
        `⚠️ ${analysis.summary || 'Rasm sifati yetarli emas yoki unda tana aniq ko\'rinmadi.'}\n\n` +
        `Iltimos, aniqroq tahlil uchun yaxshiroq yorug'likdagi, old va imkon bo'lsa yon tomondan tushirilgan sifatliroq rasm yuboring.`
      );
    }

    let msg = `📊 *TANA TAHLILI*\n\n`;
    msg += `👤 *Umumiy kuzatuv:*\n${analysis.summary || '—'}\n\n`;
    msg += `💪 *Mushaklar rivojlanishi:*\n${analysis.muscle_development || '—'}\n\n`;
    msg += `🔥 *Tana kompozitsiyasi va yog' taqsimoti:*\n${analysis.body_composition || analysis.fat_distribution || '—'}\n\n`;

    if (analysis.posture_observations) {
      msg += `🧍‍♂️ *Qad-qomat (Posture):*\n${analysis.posture_observations}\n\n`;
    }

    if (analysis.focus_areas && Array.isArray(analysis.focus_areas) && analysis.focus_areas.length > 0) {
      msg += `🎯 *Workoutda e'tibor berish tavsiya etiladigan sohalar:*\n`;
      for (const area of analysis.focus_areas) {
        msg += `• ${area}\n`;
      }
      msg += `\n`;
    }

    if (analysis.recommendation) {
      msg += `💡 *Tavsiya:* ${analysis.recommendation}\n\n`;
    }

    msg += `⚠️ *Eslatma:*\n_${analysis.disclaimer || 'Bu AI tomonidan rasm asosida berilgan taxminiy fitness tahlili. Bu tibbiy tashxis emas.'}_`;
    return msg;
  },

  /**
   * Progress xulosasini formatlash
   */
  formatProgressSummary(progressData) {
    if (!progressData || !progressData.initial) {
      return "📊 Hali progress yozuvlari mavjud emas. Birinchi o'lchovlaringizni kiriting!";
    }

    const { initial, latest, diffWeight, diffWaist, totalEntries } = progressData;
    const sign = diffWeight > 0 ? `+${diffWeight}` : `${diffWeight}`;

    let msg = `📊 *SIZNING PROGRESSINGIZ*\n\n`;
    msg += `▫️ *Boshlang'ich vazn:* ${initial.weight} kg\n`;
    msg += `▫️ *Hozirgi vazn:* ${latest.weight} kg\n`;
    msg += `▫️ *Umumiy farq:* *${sign} kg* ${diffWeight < 0 ? '🔥' : diffWeight > 0 ? '💪' : '⚖️'}\n`;

    if (initial.waist && latest.waist) {
      const waistSign = diffWaist > 0 ? `+${diffWaist}` : `${diffWaist}`;
      msg += `▫️ *Bel o'lchami o'zgarishi:* ${initial.waist} sm ➔ ${latest.waist} sm (*${waistSign} sm*)\n`;
    }

    msg += `▫️ *Kiritilgan o'lchovlar soni:* ${totalEntries} marta\n\n`;
    msg += `_Haftalik intizom — eng buyuk natijalarning kalitidir!_ 🏆`;
    return msg;
  },
};
