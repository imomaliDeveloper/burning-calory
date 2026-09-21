import { userRepository } from '../../database/repositories/userRepository.js';
import { fitnessCalculator } from '../../services/fitnessCalculator.js';
import { formatter } from '../../utils/formatter.js';
import { validator } from '../../utils/validator.js';
import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { inlineKeyboards } from '../keyboards/inlineKeyboards.js';
import { sessionManager } from '../session.js';
import { progressRepository } from '../../database/repositories/progressRepository.js';
import { pdfService } from '../../services/pdfService.js';
import { logger } from '../../utils/logger.js';

export const profileHandler = {
  /**
   * 👤 Profilim tugmasi bosilganda
   */
  async showProfile(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user || !user.height || !user.weight) {
      await ctx.reply(
        "Sizning profilingiz hali to'liq emas. Keling, profilingizni to'ldiramiz!",
        mainKeyboards.getHomeOnly()
      );
      sessionManager.setState(telegramId, 'ONBOARDING_NAME', { telegramId });
      return ctx.reply("Iltimos, ismingizni kiriting:");
    }

    const plan = fitnessCalculator.calculatePlan({
      weight: user.weight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activity_level,
      goal: user.goal,
    });

    const text = formatter.formatProfile(user, plan);
    await ctx.replyWithMarkdown(text, inlineKeyboards.getProfileSettingsKeyboard());
  },

  /**
   * Onboarding davomida matnli xabarlarni qayta ishlash
   */
  async handleOnboardingText(ctx, state) {
    const telegramId = ctx.from.id;
    const text = ctx.message.text.trim();
    const step = state.step;
    const data = state.data;

    // 1-qadam: Ism
    if (step === 'ONBOARDING_NAME') {
      if (!validator.isValidName(text)) {
        return ctx.reply("Iltimos, haqiqiy ismingizni kiriting (kamida 2 ta harf):");
      }
      data.name = text;
      sessionManager.setState(telegramId, 'ONBOARDING_AGE', data);
      return ctx.reply("Yoshingiz nechida? (Masalan: 24)");
    }

    // 2-qadam: Yosh
    if (step === 'ONBOARDING_AGE') {
      if (!validator.isValidAge(text)) {
        return ctx.reply("Iltimos, to'g'ri yoshingizni kiriting (14 dan 100 gacha son):");
      }
      data.age = Number(text);
      sessionManager.setState(telegramId, 'ONBOARDING_GENDER', data);
      return ctx.reply("Jinsingizni tanlang:", inlineKeyboards.getGenderKeyboard());
    }

    // 3-qadam: Bo'y
    if (step === 'ONBOARDING_HEIGHT') {
      if (!validator.isValidHeight(text)) {
        return ctx.reply("Iltimos, bo'yingizni santimetrda to'g'ri kiriting (masalan: 175):");
      }
      data.height = Number(text);
      sessionManager.setState(telegramId, 'ONBOARDING_WEIGHT', data);
      return ctx.reply("Vazningizni kiriting (kg, masalan: 72.5):");
    }

    // 4-qadam: Vazn
    if (step === 'ONBOARDING_WEIGHT') {
      if (!validator.isValidWeight(text)) {
        return ctx.reply("Iltimos, vazningizni to'g'ri kiriting (masalan: 70 yoki 82.5):");
      }
      data.weight = Number(text);
      sessionManager.setState(telegramId, 'ONBOARDING_ACTIVITY', data);
      return ctx.reply(
        "Kunlik jismoniy faollik darajangizni tanlang:",
        inlineKeyboards.getActivityKeyboard()
      );
    }

    // Alohida vazn tahrirlash holati
    if (step === 'EDIT_WEIGHT_ONLY') {
      if (!validator.isValidWeight(text)) {
        return ctx.reply("Iltimos, to'g'ri vazn kiriting (masalan: 79.5):");
      }
      const newWeight = Number(text);
      const user = await userRepository.findByTelegramId(telegramId);
      if (user) {
        await userRepository.update(telegramId, { weight: newWeight });
        await progressRepository.create(user.id, newWeight);
      }
      sessionManager.clearState(telegramId);
      await ctx.reply(`✅ Vazningiz yangilandi: *${newWeight} kg*`, { parse_mode: 'Markdown' });
      return this.showProfile(ctx);
    }
  },

  /**
   * Onboarding va sozlamalar bo'yicha Callback query larni qayta ishlash
   */
  async handleCallback(ctx) {
    const telegramId = ctx.from.id;
    const action = ctx.callbackQuery.data;
    const state = sessionManager.getState(telegramId) || { step: null, data: {} };
    const data = state.data;

    await ctx.answerCbQuery();

    // Jins tanlandi
    if (action.startsWith('gender_')) {
      data.gender = action.replace('gender_', '');
      sessionManager.setState(telegramId, 'ONBOARDING_HEIGHT', data);
      return ctx.reply("Bo'yingiz necha sm? (Masalan: 178)");
    }

    // Faollik darajasi tanlandi
    if (action.startsWith('act_')) {
      data.activityLevel = action.replace('act_', '');
      sessionManager.setState(telegramId, 'ONBOARDING_DAYS', data);
      return ctx.reply(
        "Haftasiga necha kun mashg'ulot qila olasiz?",
        inlineKeyboards.getWorkoutDaysKeyboard()
      );
    }

    // Haftalik kunlar tanlandi
    if (action.startsWith('days_')) {
      data.workoutDays = Number(action.replace('days_', ''));
      sessionManager.setState(telegramId, 'ONBOARDING_LOCATION', data);
      return ctx.reply(
        "Mashg'ulotlarni qayerda o'tkazasiz?",
        inlineKeyboards.getLocationKeyboard()
      );
    }

    // Mashg'ulot joyi tanlandi
    if (action.startsWith('loc_')) {
      data.workoutLocation = action.replace('loc_', '');
      sessionManager.setState(telegramId, 'ONBOARDING_GOAL', data);
      return ctx.reply(
        "Asosiy maqsadingizni tanlang:",
        inlineKeyboards.getGoalKeyboard()
      );
    }

    // Maqsad tanlandi (Onboarding tugallandi!)
    if (action.startsWith('goal_')) {
      data.goal = action.replace('goal_', '');

      // Foydalanuvchini bazaga yozish yoki yangilash
      let existing = await userRepository.findByTelegramId(telegramId);
      let user;
      if (existing) {
        user = await userRepository.update(telegramId, data);
      } else {
        user = await userRepository.create(data);
      }

      // Boshlang'ich progress jadvaliga ham vaznni yozib qo'yamiz
      if (user && user.weight) {
        await progressRepository.create(user.id, user.weight);
      }

      sessionManager.clearState(telegramId);

      const plan = fitnessCalculator.calculatePlan({
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activity_level,
        goal: user.goal,
      });

      const finishMsg =
        `🎉 *Tabriklaymiz, profilingiz muvaffaqiyatli yaratildi!*\n\n` +
        formatter.formatProfile(user, plan);

      return ctx.replyWithMarkdown(finishMsg, mainKeyboards.getMainMenu());
    }

    // Profil sozlamalari amallari
    if (action === 'edit_weight') {
      sessionManager.setState(telegramId, 'EDIT_WEIGHT_ONLY', {});
      return ctx.reply("Yangi vazningizni kiriting (kg, masalan: 78.2):", mainKeyboards.getBackAndHome());
    }

    if (action === 'edit_goal') {
      sessionManager.setState(telegramId, 'ONBOARDING_GOAL', { telegramId });
      return ctx.reply("Yangi maqsadingizni tanlang:", inlineKeyboards.getGoalKeyboard());
    }

    if (action === 'edit_all') {
      sessionManager.setState(telegramId, 'ONBOARDING_NAME', { telegramId });
      return ctx.reply("Profilingizni qayta to'ldiramiz. Ismingizni kiriting:", mainKeyboards.getHomeOnly());
    }

    if (action === 'download_plan_pdf') {
      return this.downloadPlanPdf(ctx);
    }
  },

  /**
   * Shaxsiy reja PDF hujjatini yaratish va yuborish
   */
  async downloadPlanPdf(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user || !user.weight) {
      return ctx.reply("PDF reja yaratish uchun avval profilingizni to'ldiring.", mainKeyboards.getMainMenu());
    }

    const waitMsg = await ctx.reply("⏳ Sizning shaxsiy fitness dasturingiz (PDF) tayyorlanmoqda...");

    try {
      const pdfBuffer = await pdfService.generatePersonalPlanPdf(user);

      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
      } catch (e) {}

      const cleanName = (user.name || 'User').replace(/[^a-zA-Z0-9_]/g, '_');
      await ctx.replyWithDocument(
        {
          source: pdfBuffer,
          filename: `Fitness_Dastur_${cleanName}.pdf`,
        },
        {
          caption: `📄 *Sizning Shaxsiy Fitness Rejangiz (PDF)*\n\nUshbu faylni saqlab olishingiz yoki chop etib mashg'ulotlaringizda foydalanishingiz mumkin. Maqsad sari olg'a! 💪`,
          parse_mode: 'Markdown',
        }
      );
    } catch (err) {
      logger.error('PDF yuborishda xatolik:', err);
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
      } catch (e) {}
      await ctx.reply("⚠️ PDF dasturni tayyorlashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    }
  },
};
