/**
 * Fitness va Kaloriya hisoblagich xizmati
 * Mifflin-St Jeor formulasi asosida BMR, TDEE va makronutrientlarni hisoblaydi.
 */

export const fitnessCalculator = {
  // Faollik koeffitsientlari
  ACTIVITY_MULTIPLIERS: {
    sedentary: 1.2,       // Kamharakat (ofis ishi, deyarli mashqsiz)
    light: 1.375,         // Yengil faol (haftada 1-3 kun yengil mashq)
    moderate: 1.55,       // O'rtacha faol (haftada 3-5 kun mashq)
    active: 1.725,        // Yuqori faol (haftada 6-7 kun mashq)
    very_active: 1.9,     // Juda faol (kuniga 2 mahal mashq yoki og'ir jismoniy mehnat)
  },

  /**
   * BMR (Basal Metabolic Rate) - Asosiy moddalar almashinuvi
   * Mifflin-St Jeor formulasi
   */
  calculateBMR(weight, height, age, gender) {
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);

    if (gender === 'female') {
      return Math.round((10 * w) + (6.25 * h) - (5 * a) - 161);
    }
    // Erkaklar uchun default
    return Math.round((10 * w) + (6.25 * h) - (5 * a) + 5);
  },

  /**
   * TDEE (Total Daily Energy Expenditure) - Kunlik umumiy energiya sarfi
   */
  calculateTDEE(bmr, activityLevel) {
    const multiplier = this.ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
    return Math.round(bmr * multiplier);
  },

  /**
   * Tana massasi indeksi (BMI)
   */
  calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    const bmi = +(weight / (heightInMeters * heightInMeters)).toFixed(1);

    let category = 'Normal';
    let uzCategory = 'Normal vazn';
    let isWarning = false;

    if (bmi < 18.5) {
      category = 'Underweight';
      uzCategory = 'Vazn yetishmasligi';
      if (bmi < 16) isWarning = true;
    } else if (bmi >= 18.5 && bmi <= 24.9) {
      category = 'Normal';
      uzCategory = 'Normal vazn';
    } else if (bmi >= 25 && bmi <= 29.9) {
      category = 'Overweight';
      uzCategory = 'Ortiqcha vazn';
    } else {
      category = 'Obese';
      uzCategory = 'Semizlik';
      if (bmi >= 35) isWarning = true;
    }

    return { bmi, category, uzCategory, isWarning };
  },

  /**
   * Maqsadga qarab kunlik kaloriya va makronutrientlar targetini hisoblash
   */
  calculatePlan({ weight, height, age, gender, activityLevel, goal }) {
    const bmr = this.calculateBMR(weight, height, age, gender);
    const tdee = this.calculateTDEE(bmr, activityLevel);
    const bmiData = this.calculateBMI(weight, height);

    let targetCalories = tdee;
    let goalDescription = '';
    let proteinPerKg = 1.8;

    switch (goal) {
      case 'weight_loss':
        // 20% defitsit, lekin BMR dan past bo'lmasligi va minimal chegaradan tushmasligi kerak
        targetCalories = Math.round(tdee * 0.8);
        goalDescription = "Vazn tashlash (yog' yo'qotish)";
        proteinPerKg = 2.2; // Mushaklarni saqlash uchun yuqori oqsil
        break;

      case 'build_muscle':
        // 10-12% profitsit
        targetCalories = Math.round(tdee * 1.12);
        goalDescription = 'Mushak massasi qurish';
        proteinPerKg = 2.0;
        break;

      case 'recomposition':
        // TDEE darajasida yoki -5% yengil defitsit
        targetCalories = Math.round(tdee * 0.95);
        goalDescription = "Tana rekompozitsiyasi (yog' kamaytirish + mushak saqlash/o'stirish)";
        proteinPerKg = 2.2;
        break;

      case 'strength':
      default:
        // TDEE + 5%
        targetCalories = Math.round(tdee * 1.05);
        goalDescription = 'Kuch va umumiy fitness';
        proteinPerKg = 1.8;
        break;
    }

    // Xavfsizlik chegaralari (Safety Floor): erkaklar uchun min 1500, ayollar uchun min 1200
    const minSafeCalories = gender === 'female' ? 1200 : 1500;
    let isExtreme = false;
    if (targetCalories < minSafeCalories) {
      targetCalories = minSafeCalories;
      isExtreme = true;
    }

    // Makronutrientlarni hisoblash
    // 1. Protein (1g = 4 kcal)
    const proteinGrams = Math.round(weight * proteinPerKg);
    const proteinCalories = proteinGrams * 4;

    // 2. Fat (yog' umumiy kaloriyaning 25% qismi, 1g = 9 kcal)
    const fatCalories = Math.round(targetCalories * 0.25);
    const fatGrams = Math.round(fatCalories / 9);

    // 3. Carbs (qolgan kaloriyalar, 1g = 4 kcal)
    const remainingCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
    const carbsGrams = Math.round(remainingCalories / 4);

    const safetyDisclaimer = (isExtreme || bmiData.isWarning)
      ? "⚠️ Eslatma: Ushbu ko'rsatkichlar xavfsiz chegaralarni inobatga olgan holda hisoblandi. Sog'lig'ingizda surunkali muammolar bo'lsa, shifokor yoki malakali dietolog bilan maslahatlashishni tavsiya qilamiz."
      : null;

    return {
      bmr,
      tdee,
      bmi: bmiData.bmi,
      bmiCategory: bmiData.uzCategory,
      targetCalories,
      goalDescription,
      macros: {
        protein: proteinGrams,
        fat: fatGrams,
        carbs: carbsGrams,
      },
      safetyDisclaimer,
    };
  },
};
