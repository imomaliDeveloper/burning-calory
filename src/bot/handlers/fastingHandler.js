import { userRepository } from '../../database/repositories/userRepository.js';
import { fitnessCalculator } from '../../services/fitnessCalculator.js';
import { fastingService } from '../../services/fastingService.js';
import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { logger } from '../../utils/logger.js';

export const fastingHandler = {
  /**
   * 🌙 Ro'za / Ramazon menyusini ko'rsatish
   */
  async showFastingMenu(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user || !user.weight) {
      return ctx.reply("Ro'za rejasini ko'rish uchun avval profilingizni to'ldiring.", mainKeyboards.getMainMenu());
    }

    const isFasting = user.fasting_mode === 1;

    let msg = `🌙 *RAMAZON VA RO'ZA OYI MAXSUS REJIMI*\n\n`;
    msg += `Holat: *${isFasting ? "Faol (Yoqilgan) ✅" : "O'chirilgan (Standart rejim) ⏸"}*\n\n`;
    msg += `Ushbu maxsus rejim sizga ro'za paytida:\n`;
    msg += `• Mushaklarni yo'qotmaslik va quvvatsizlanmaslik\n`;
    msg += `• Saharlikda uzoq vaqt to'q tutuvchi taomlar tanlash\n`;
    msg += `• Iftorlikda oshqozonni to'g'ri tiklash\n`;
    msg += `• Mashg'ulotlarni xavfsiz vaqtda o'tkazishda yordam beradi.\n\n`;
    msg += `_Kerakli bo'limni tanlang:_`;

    await ctx.replyWithMarkdown(msg, mainKeyboards.getFastingMenu(isFasting));
  },

  /**
   * Ro'za rejimini yoqish yoki o'chirish
   */
  async toggleFastingMode(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) return;

    const newMode = user.fasting_mode === 1 ? 0 : 1;
    await userRepository.update(telegramId, { fastingMode: newMode });

    if (newMode === 1) {
      const successMsg =
        `🌙 *Ramazon va Ro'za rejimi YOQILDI!* ✅\n\n` +
        `Endi kunlik taomnomangiz Saharlik va Iftorlikka moslashtiriladi, AI murabbiyingiz ham ro'za qoidalarini hisobga oladi.\n\n` +
        `Qabul bo'lsin! 🤲`;
      await ctx.replyWithMarkdown(successMsg, mainKeyboards.getFastingMenu(true));
    } else {
      const offMsg =
        `☀️ *Ro'za rejimi O'CHIRILDI.* Standart 4 mahal ovqatlanish va odatiy mashg'ulotlar rejimiga qaytildi.`;
      await ctx.replyWithMarkdown(offMsg, mainKeyboards.getMainMenu());
    }
  },

  /**
   * Saharlik va Iftorlik taomnomasini ko'rsatish
   */
  async showFastingMeals(ctx) {
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

    const fastingMeal = fastingService.generateFastingMealPlan(plan.targetCalories, plan.macros, user.goal);
    const { suhoor, iftar, nightSnack } = fastingMeal.meals;

    let text = `🌙 *RO'ZADAGI SHAXSIY TAOMNOMA (Jami: ${fastingMeal.totalCalories} kcal)*\n`;
    text += `🥩 Oqsil: ${fastingMeal.macros.protein}g | 🥑 Yog': ${fastingMeal.macros.fat}g | 🍚 Uglevod: ${fastingMeal.macros.carbs}g\n\n`;

    // Saharlik
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*${suhoor.name}*\n`;
    text += `⏰ *Vaqti:* ${suhoor.time}\n`;
    text += `🔥 *Target:* ~${suhoor.calories} kcal (🥩 ${suhoor.protein}g P | 🍚 ${suhoor.carbs}g C | 🥑 ${suhoor.fat}g F)\n`;
    text += `💡 _${suhoor.guideline}_\n\n`;
    text += `*Tavsiya etilgan variantlar:*\n`;
    for (const opt of suhoor.options) {
      text += `• ${opt}\n`;
    }
    text += `💧 _${suhoor.waterNote}_\n\n`;

    // Iftorlik
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*${iftar.name}*\n`;
    text += `⏰ *Vaqti:* ${iftar.time}\n`;
    text += `🔥 *Target:* ~${iftar.calories} kcal (🥩 ${iftar.protein}g P | 🍚 ${iftar.carbs}g C | 🥑 ${iftar.fat}g F)\n\n`;
    for (const phase of iftar.phases) {
      text += `📌 *${phase.step}:*\n${phase.details}\n\n`;
    }
    text += `⚠️ _${iftar.warning}_\n\n`;

    // Kechki tamaddi
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*${nightSnack.name}*\n`;
    text += `⏰ *Vaqti:* ${nightSnack.time} (~${nightSnack.calories} kcal)\n`;
    for (const opt of nightSnack.options) {
      text += `• ${opt}\n`;
    }

    const isFasting = user.fasting_mode === 1;
    await ctx.replyWithMarkdown(text, mainKeyboards.getFastingMenu(isFasting));
  },

  /**
   * Ro'zadagi xavfsiz mashg'ulotlar dasturi
   */
  async showFastingWorkouts(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) return ctx.reply("Avval profilingizni to'ldiring.");

    const workoutPlan = fastingService.getFastingWorkoutPlan(user);

    let text = `🏋️ *${workoutPlan.title}*\n\n`;

    text += `⏰ *ENG YAXSHI MASHG'ULOT VAQTLARI:*\n`;
    for (const bt of workoutPlan.bestTimes) {
      text += `• *${bt.time}*\n  _${bt.desc}_\n`;
    }
    text += `\n`;

    text += `⚠️ *RO'ZA PAYTIDAGI XAVFSIZLIK QOIDALARI:*\n`;
    for (const r of workoutPlan.safetyRules) {
      text += `▫️ ${r}\n`;
    }
    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;

    for (const day of workoutPlan.days) {
      text += `📌 *${day.day}*\n`;
      for (const ex of day.exercises) {
        text += `• ${ex.name} — ${ex.sets} sets × ${ex.reps} (Dam: ${ex.rest})\n`;
      }
      text += `\n`;
    }

    const isFasting = user.fasting_mode === 1;
    await ctx.replyWithMarkdown(text, mainKeyboards.getFastingMenu(isFasting));
  },

  /**
   * Iftordan Saharlikkacha Suv Ichish Tartibi
   */
  async showWaterSchedule(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

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

    const water = fastingService.getWaterHydrationSchedule(targetCalories);

    let text = `💧 *RO'ZADA SUVDAN QURIB QOLMASLIK (GIDRATATSIYA) TARTIBI*\n\n`;
    text += `Sizning kunlik me'yoringiz: *~${water.targetLiters} litr*\n\n`;
    text += `*Iftordan Saharlikkacha soatma-soat reja:*\n\n`;

    for (const item of water.schedule) {
      text += `▫️ *${item.time}:*\n   👉 *${item.amount}* — _${item.tip}_\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💡 *Oltin qoidalar:*\n`;
    for (const rule of water.goldenRules) {
      text += `• ${rule}\n`;
    }

    const isFasting = user?.fasting_mode === 1;
    await ctx.replyWithMarkdown(text, mainKeyboards.getFastingMenu(isFasting));
  },
};
