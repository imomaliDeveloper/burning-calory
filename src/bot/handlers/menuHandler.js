import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { sessionManager } from '../session.js';
import { profileHandler } from './profileHandler.js';
import { analysisHandler } from './analysisHandler.js';
import { nutritionHandler } from './nutritionHandler.js';
import { workoutHandler } from './workoutHandler.js';
import { progressHandler } from './progressHandler.js';
import { coachHandler } from './coachHandler.js';
import { settingsHandler } from './settingsHandler.js';
import { checkinHandler } from './checkinHandler.js';
import { adminHandler } from './adminHandler.js';
import { fastingHandler } from './fastingHandler.js';
import { userRepository } from '../../database/repositories/userRepository.js';
import { fitnessCalculator } from '../../services/fitnessCalculator.js';

export const menuHandler = {
  /**
   * Barcha matnli xabarlarni markaziy yo'naltirish (Router)
   */
  async handleTextMessage(ctx) {
    const telegramId = ctx.from.id;
    const text = ctx.message.text.trim();
    const state = sessionManager.getState(telegramId);

    // 1. Asosiy Navigatsiya tugmalari (Har qanday holatni bekor qiladi)
    if (text === '🏠 Bosh menyu' || text === '⬅️ Orqaga') {
      sessionManager.clearState(telegramId);
      return ctx.reply("Bosh menyu:", mainKeyboards.getMainMenu());
    }

    // 2. Asosiy Menyu tugmalari
    if (text === '👤 Profilim') {
      sessionManager.clearState(telegramId);
      return profileHandler.showProfile(ctx);
    }

    if (text === '📸 Tana rasmini tahlil qilish') {
      return analysisHandler.promptPhoto(ctx);
    }

    if (text === '🎯 Maqsadim') {
      sessionManager.clearState(telegramId);
      const user = await userRepository.findByTelegramId(telegramId);
      if (user && user.weight) {
        const plan = fitnessCalculator.calculatePlan({
          weight: user.weight,
          height: user.height,
          age: user.age,
          gender: user.gender,
          activityLevel: user.activity_level,
          goal: user.goal,
        });
        return ctx.replyWithMarkdown(
          `🎯 *SIZNING MAQSADINGIZ:* ${plan.goalDescription}\n\n` +
          `🔥 Kunlik kaloriya: *${plan.targetCalories} kcal*\n` +
          `🥩 Oqsil: *${plan.macros.protein} g*\n` +
          `🥑 Yog': *${plan.macros.fat} g*\n` +
          `🍚 Uglevod: *${plan.macros.carbs} g*\n\n` +
          `Maqsadni o'zgartirish uchun "👤 Profilim" bo'limiga o'ting.`,
          mainKeyboards.getMainMenu()
        );
      } else {
        return ctx.reply("Avval profilingizni to'ldiring.", mainKeyboards.getMainMenu());
      }
    }

    if (text === '🍎 Ovqatlanish') {
      sessionManager.clearState(telegramId);
      return nutritionHandler.showNutritionMenu(ctx);
    }

    if (text === '🏋️ Workout') {
      sessionManager.clearState(telegramId);
      return workoutHandler.showWorkoutMenu(ctx);
    }

    if (text === '📊 Progress') {
      sessionManager.clearState(telegramId);
      return progressHandler.showProgressMenu(ctx);
    }

    if (text === '🌙 Ro\'za rejimi') {
      sessionManager.clearState(telegramId);
      return fastingHandler.showFastingMenu(ctx);
    }

    if (text === '🤖 AI Coach') {
      return coachHandler.showCoachMenu(ctx);
    }

    if (text === '⚙️ Sozlamalar') {
      sessionManager.clearState(telegramId);
      return settingsHandler.showSettings(ctx);
    }

    // 3. Ichki bo'lim tugmalari
    if (text === "🌙 Saharlik & Iftorlik taomnoma") {
      return fastingHandler.showFastingMeals(ctx);
    }

    if (text === "🏋️ Ro'zadagi mashg'ulotlar") {
      return fastingHandler.showFastingWorkouts(ctx);
    }

    if (text === "💧 Suv ichish tartibi") {
      return fastingHandler.showWaterSchedule(ctx);
    }

    if (text === "🌙 Ro'za rejimini yoqish" || text === "☀️ Ro'za rejimini o'chirish") {
      return fastingHandler.toggleFastingMode(ctx);
    }
    if (text === "📸 Ovqat rasmini yuborish") {
      return nutritionHandler.promptFoodPhoto(ctx);
    }

    if (text === "📋 Bugungi taomnoma" || text === "📋 Bugungi to'liq taomnoma") {
      return nutritionHandler.showDailyPlan(ctx);
    }

    if (text === "🍳 Muzlatgichdagi masalliqlar" || text === "🍳 Muzlatgichdagi mahsulotlardan ovqat") {
      return nutritionHandler.promptIngredients(ctx);
    }

    if (text === "📊 Bugungi balans") {
      return nutritionHandler.showDailyBalance(ctx);
    }

    if (text === "📋 Haftalik mashg'ulot dasturi") {
      return workoutHandler.showWeeklyPlan(ctx);
    }

    if (text === "✍️ Mashq natijasini kiritish") {
      return workoutHandler.promptLogExercise(ctx);
    }

    if (text === "📄 Shaxsiy reja (PDF)") {
      return profileHandler.downloadPlanPdf(ctx);
    }

    if (text === "➕ Yangi vazn/bel kiritish") {
      return progressHandler.promptNewProgress(ctx);
    }

    if (text === "📈 O'zgarishlar grafigi") {
      return progressHandler.showProgressChart(ctx);
    }

    if (text === "📅 Haftalik check-in topshirish") {
      return checkinHandler.startCheckin(ctx);
    }

    // 4. Foydalanuvchi holatiga (FSM State) qarab ishlov berish
    if (state) {
      if (state.step === 'AWAITING_BROADCAST_MESSAGE') {
        return adminHandler.handleBroadcastText(ctx, state);
      }

      if (state.step && state.step.startsWith('ONBOARDING_') || state.step === 'EDIT_WEIGHT_ONLY') {
        return profileHandler.handleOnboardingText(ctx, state);
      }

      if (state.step === 'AWAITING_BODY_PHOTO') {
        return ctx.reply("Iltimos, tana rasmingizni rasm ko'rinishida yuboring yoki '🏠 Bosh menyu' tugmasini bosing.");
      }

      if (state.step === 'AWAITING_FOOD_PHOTO') {
        return ctx.reply("Iltimos, taom rasmini rasm ko'rinishida yuboring yoki '🏠 Bosh menyu' tugmasini bosing.");
      }

      if (state.step === 'AWAITING_INGREDIENTS') {
        return nutritionHandler.handleIngredientsText(ctx, text);
      }

      if (state.step === 'AWAITING_WORKOUT_LOG') {
        return workoutHandler.handleLogExerciseText(ctx, text);
      }

      if (state.step && state.step.startsWith('AWAITING_PROGRESS_')) {
        return progressHandler.handleProgressText(ctx, state);
      }

      if (state.step && state.step.startsWith('CHECKIN_')) {
        return checkinHandler.handleCheckinText(ctx, state);
      }

      if (state.step === 'AI_COACH_CHAT') {
        return coachHandler.handleCoachMessage(ctx, text);
      }
    }

    // 5. Aqlli aniqlash (State bo'lmaganda ham avtomatik tushunish)
    // Masalan: "Menda tuxum, guruch va tovuq bor"
    if (/menda\s+.+\s+bor/i.test(text) || /(tuxum|go'sht|tovuq|guruch|grechka|kartoshka|sut)/i.test(text) && text.length > 10) {
      return nutritionHandler.handleIngredientsText(ctx, text);
    }

    // Default holat: Agar foydalanuvchi ro'yxatdan o'tgan bo'lsa, xabarni AI Coachga uzatish!
    const user = await userRepository.findByTelegramId(telegramId);
    if (user && user.weight) {
      return coachHandler.handleCoachMessage(ctx, text);
    }

    // Noma'lum kiritma
    return ctx.reply("Kerakli bo'limni tanlash uchun quyidagi tugmalardan foydalaning:", mainKeyboards.getMainMenu());
  },
};
