import axios from 'axios';
import { userRepository } from '../../database/repositories/userRepository.js';
import { mealRepository } from '../../database/repositories/mealRepository.js';
import { fitnessCalculator } from '../../services/fitnessCalculator.js';
import { nutritionService } from '../../services/nutritionService.js';
import { geminiService } from '../../services/geminiService.js';
import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { sessionManager } from '../session.js';
import { logger } from '../../utils/logger.js';

export const nutritionHandler = {
  /**
   * 🍎 Ovqatlanish tugmasi bosilganda
   */
  async showNutritionMenu(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user || !user.weight) {
      return ctx.reply("Ovqatlanish rejasini olish uchun avval profilingizni to'ldiring.", mainKeyboards.getMainMenu());
    }

    const plan = fitnessCalculator.calculatePlan({
      weight: user.weight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activity_level,
      goal: user.goal,
    });

    const totals = await mealRepository.getTodayTotals(user.id);
    const remainingCals = Math.max(0, plan.targetCalories - totals.totalCalories);

    const msg =
      `🍎 *OVQATLANISH VA TAOMNOMA BO'LIMI*\n\n` +
      `🎯 Kunlik me'yoringiz: *${plan.targetCalories} kcal*\n` +
      `🍽 Bugun iste'mol qilindi: *${totals.totalCalories} kcal* (${totals.mealCount} ta taom)\n` +
      `🔥 Kun oxirigacha qoldi: *${remainingCals} kcal*\n\n` +
      `_Taom rasmini yuborish orqali kaloriyani bir zumda aniqlashingiz mumkin!_ 👇`;

    await ctx.replyWithMarkdown(msg, mainKeyboards.getNutritionMenu());
  },

  /**
   * 📸 Ovqat rasmini yuborish taklifi
   */
  async promptFoodPhoto(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) {
      return ctx.reply("Avval profilingizni to'ldiring.");
    }

    sessionManager.setState(telegramId, 'AWAITING_FOOD_PHOTO', { userId: user.id });

    const msg =
      `📸 *TAOM RASMINI YUBORING*\n\n` +
      `Yeyayotgan ovqatingiz, tamaddi yoki ichimligingiz rasmini yuboring.\n\n` +
      `🤖 *Gemini 3.6 Vision* taomni aniqlab:\n` +
      `• Porsiya og'irligini\n` +
      `• Kaloriyasi (kcal)\n` +
      `• Oqsil, yog' va uglevodlarni\n` +
      `bir zumda hisoblab, kunlik balansingizga qo'shib boradi! 🍽`;

    await ctx.replyWithMarkdown(msg, mainKeyboards.getBackAndHome());
  },

  /**
   * Foydalanuvchi taom rasmini yuborganda
   */
  async handleFoodPhoto(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) {
      sessionManager.clearState(telegramId);
      return ctx.reply("Foydalanuvchi topilmadi.");
    }

    const waitMsg = await ctx.reply("⏳ Taomingiz Gemini 3.6 Vision orqali tahlil qilinmoqda, iltimos kuting...");

    try {
      const photos = ctx.message.photo;
      const largestPhoto = photos[photos.length - 1];
      const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id);

      const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);

      const analysis = await geminiService.analyzeFoodImage(imageBuffer, 'image/jpeg');

      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
      } catch (e) {}

      if (!analysis.is_food) {
        sessionManager.clearState(telegramId);
        return ctx.reply(
          "⚠️ Ushbu rasmda ovqat yoki yegulik aniqlanmadi. Iltimos, taom tushirilgan aniqroq rasm yuboring.",
          mainKeyboards.getNutritionMenu()
        );
      }

      // Taomni bazaga saqlash
      await mealRepository.logMeal({
        userId: user.id,
        photoReference: largestPhoto.file_id,
        dishName: analysis.dish_name || 'Noma\'lum taom',
        portionGrams: analysis.portion_estimate_grams || null,
        calories: Number(analysis.calories) || 0,
        protein: Number(analysis.protein) || 0,
        carbs: Number(analysis.carbs) || 0,
        fat: Number(analysis.fat) || 0,
      });

      sessionManager.clearState(telegramId);

      // Kunlik hisob-kitoblar
      const plan = fitnessCalculator.calculatePlan({
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activity_level,
        goal: user.goal,
      });

      const totals = await mealRepository.getTodayTotals(user.id);
      const remainingCals = Math.max(0, plan.targetCalories - totals.totalCalories);

      let msg = `🍽 *TAOM TAHLILI NATIJASI (Food Vision AI)*\n\n`;
      msg += `🍲 *Taom:* ${analysis.dish_name} (~${analysis.portion_estimate_grams || 300}g)\n`;
      msg += `🔥 *Kaloriya:* *${analysis.calories} kcal*\n`;
      msg += `🥩 *Protein:* ${analysis.protein}g | 🥑 *Yog':* ${analysis.fat}g | 🍚 *Uglevod:* ${analysis.carbs}g\n\n`;

      if (analysis.ingredients_detected && analysis.ingredients_detected.length > 0) {
        msg += `🥗 *Aniqlangan masalliqlar:* ${analysis.ingredients_detected.join(', ')}\n\n`;
      }

      if (analysis.health_note) {
        msg += `💡 *Maslahat:* _${analysis.health_note}_\n\n`;
      }

      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `📊 *BUGUNGI KUNLIK BALANS:*\n`;
      msg += `▫️ Kunlik me'yor: *${plan.targetCalories} kcal*\n`;
      msg += `▫️ Bugun yeyildi: *${totals.totalCalories} kcal* (🥩 ${totals.totalProtein}g | 🥑 ${totals.totalFat}g | 🍚 ${totals.totalCarbs}g)\n`;
      msg += `▫️ Qoldi: *${remainingCals} kcal* ${remainingCals > 0 ? '🔥' : '⚠️ Me\'yordan oshdi'}\n`;

      await ctx.replyWithMarkdown(msg, mainKeyboards.getNutritionMenu());
    } catch (error) {
      logger.error('Taom tahlilida xatolik:', error);
      sessionManager.clearState(telegramId);
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
      } catch (e) {}

      let errorMsg = "⚠️ Taom rasmini tahlil qilishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";
      if (error.status === 429 || (error.message && (error.message.includes('429') || error.message.includes('Quota exceeded')))) {
        errorMsg = "⚠️ Gemini API bepul kvotasi so'rovlar limiti to'ldi (429 Rate Limit). Iltimos, 1 daqiqadan so'ng qayta urinib ko'ring.";
      }
      await ctx.reply(errorMsg, mainKeyboards.getNutritionMenu());
    }
  },

  /**
   * 📊 Bugungi kunlik balansni ko'rish
   */
  async showDailyBalance(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user || !user.weight) {
      return ctx.reply("Avval profilingizni to'ldiring.");
    }

    const plan = fitnessCalculator.calculatePlan({
      weight: user.weight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activity_level,
      goal: user.goal,
    });

    const totals = await mealRepository.getTodayTotals(user.id);
    const meals = await mealRepository.getTodayMeals(user.id);
    const remainingCals = Math.max(0, plan.targetCalories - totals.totalCalories);

    let msg = `📊 *BUGUNGI OVQATLANISH VA KALORIYA BALANSI*\n\n`;
    msg += `🎯 *Kunlik kaloriya targeti:* ${plan.targetCalories} kcal\n`;
    msg += `🔥 *Iste'mol qilindi:* ${totals.totalCalories} kcal\n`;
    msg += `⏳ *Qoldi:* *${remainingCals} kcal*\n\n`;

    msg += `*Makronutrientlar:* \n`;
    msg += `▫️ Oqsil: ${totals.totalProtein}g / ${plan.macros.protein}g\n`;
    msg += `▫️ Yog': ${totals.totalFat}g / ${plan.macros.fat}g\n`;
    msg += `▫️ Uglevod: ${totals.totalCarbs}g / ${plan.macros.carbs}g\n\n`;

    if (meals.length > 0) {
      msg += `📝 *Bugun qayd etilgan taomlar:*\n`;
      for (let i = 0; i < meals.length; i++) {
        const m = meals[i];
        msg += `${i + 1}. ${m.dish_name} — *${m.calories} kcal* (🥩 ${m.protein}g)\n`;
      }
    } else {
      msg += `_Bugun hali birorta ham taom qayd etilmadi._\nTaom rasmini yuborib birinchi yozuvni kiriting! 📸`;
    }

    await ctx.replyWithMarkdown(msg, mainKeyboards.getNutritionMenu());
  },

  /**
   * 📋 Bugungi to'liq taomnoma tugmasi
   */
  async showDailyPlan(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user || !user.weight) {
      return ctx.reply("Avval profilingizni to'ldiring.");
    }

    const plan = fitnessCalculator.calculatePlan({
      weight: user.weight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activity_level,
      goal: user.goal,
    });

    const mealPlan = nutritionService.generateDailyMealPlan(plan.targetCalories, plan.macros, user.goal);

    let text = `📋 *KUNLIK BALANSLANGAN TAOMNOMA*\n`;
    text += `🔥 Jami: *${mealPlan.dailyTarget.calories} kcal* (🥩 ${mealPlan.dailyTarget.protein}g | 🥑 ${mealPlan.dailyTarget.fat}g | 🍚 ${mealPlan.dailyTarget.carbs}g)\n\n`;

    for (const meal of mealPlan.meals) {
      text += `*${meal.name}* (~${meal.calories} kcal | 🥩 ${meal.protein}g P)\n`;
      for (const opt of meal.options) {
        text += `• ${opt}\n`;
      }
      text += `\n`;
    }

    text += `💧 *Suv me'yori:* ${mealPlan.waterRecommendation}\n`;
    text += `\n_Eslatma: Mahsulotlarni o'zingizga qulay vaqtda, ortiqcha zo'riqishsiz iste'mol qiling._`;

    await ctx.replyWithMarkdown(text, mainKeyboards.getNutritionMenu());
  },

  /**
   * 🍳 Muzlatgichdagi mahsulotlardan ovqat so'rash
   */
  async promptIngredients(ctx) {
    const telegramId = ctx.from.id;
    sessionManager.setState(telegramId, 'AWAITING_INGREDIENTS', {});

    const msg =
      `🍳 *SHAXSIY TAOM RETSEPTI*\n\n` +
      `Hozir muzlatgichingizda yoki oshxonangizda qanday mahsulotlar bor?\n` +
      `Masalan: _"3 ta tuxum, tovuq filesi, guruch va pomidor bor"_\n\n` +
      `AI sizning kaloriya me'yoringizga mos ajoyib retsept tuzib beradi:`;

    await ctx.replyWithMarkdown(msg, mainKeyboards.getBackAndHome());
  },

  /**
   * Masalliqlar matni kelganda retsept tuzish
   */
  async handleIngredientsText(ctx, ingredientsText) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    const waitMsg = await ctx.reply("⏳ Mavjud mahsulotlaringiz asosida mazali retsept tuzilmoqda...");

    try {
      let targetCalories = 2000;
      if (user && user.weight) {
        const plan = fitnessCalculator.calculatePlan({
          weight: user.weight,
          height: user.height,
          age: user.age,
          gender: user.gender,
          activityLevel: user.activity_level,
          goal: user.goal,
        });
        targetCalories = plan.targetCalories;
      }

      const recipe = await geminiService.generateCustomMeal(ingredientsText, user || {}, targetCalories);

      sessionManager.clearState(telegramId);
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
      } catch (e) {}

      await ctx.replyWithMarkdown(recipe, mainKeyboards.getNutritionMenu());
    } catch (error) {
      logger.error('Retsept tuzishda xatolik:', error);
      sessionManager.clearState(telegramId);
      await ctx.reply(
        "⚠️ Retsept yaratishda xatolik yuz berdi. Iltimos, boshqa masalliqlar bilan qayta urinib ko'ring.",
        mainKeyboards.getNutritionMenu()
      );
    }
  },
};
