import { userRepository } from '../../database/repositories/userRepository.js';
import { progressRepository } from '../../database/repositories/progressRepository.js';
import { workoutRepository } from '../../database/repositories/workoutRepository.js';
import { geminiService } from '../../services/geminiService.js';
import { validator } from '../../utils/validator.js';
import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { inlineKeyboards } from '../keyboards/inlineKeyboards.js';
import { sessionManager } from '../session.js';
import { logger } from '../../utils/logger.js';

export const checkinHandler = {
  /**
   * 📅 Haftalik check-in boshlash
   */
  async startCheckin(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) {
      return ctx.reply("Avval profilingizni to'ldiring.", mainKeyboards.getMainMenu());
    }

    sessionManager.setState(telegramId, 'CHECKIN_WEIGHT', {
      userId: user.id,
      previousWeight: user.weight,
    });

    const msg =
      `📅 *HAFTALIK PROGRESS CHECK-IN* 💪\n\n` +
      `Keling, o'tgan hafta davomidagi natijalaringizni tahlil qilamiz!\n\n` +
      `1-savol: *Hozirgi yangi vazningiz necha kg?* (Masalan: 79.2):`;

    await ctx.replyWithMarkdown(msg, mainKeyboards.getBackAndHome());
  },

  /**
   * Check-in matnli savollariga javoblarni qayta ishlash
   */
  async handleCheckinText(ctx, state) {
    const telegramId = ctx.from.id;
    const text = ctx.message.text.trim();
    const { step, data } = state;

    // 1. Yangi vazn
    if (step === 'CHECKIN_WEIGHT') {
      if (!validator.isValidWeight(text)) {
        return ctx.reply("Iltimos, vazningizni to'g'ri kiriting (30 dan 300 gacha son):");
      }
      data.currentWeight = Number(text);
      sessionManager.setState(telegramId, 'CHECKIN_WAIST', data);
      return ctx.reply("2-savol: *Bel o'lchamingiz necha sm?* (O'tkazib yuborish uchun '0' deb yozing):", { parse_mode: 'Markdown' });
    }

    // 2. Bel o'lchami
    if (step === 'CHECKIN_WAIST') {
      let waist = null;
      if (text !== '0' && text.toLowerCase() !== "yo'q") {
        if (!validator.isValidWaist(text)) {
          return ctx.reply("Iltimos, to'g'ri bel o'lchamini kiriting (40 dan 200 sm gacha) yoki '0' deb yozing:");
        }
        waist = Number(text);
      }
      data.waist = waist;
      sessionManager.setState(telegramId, 'CHECKIN_WORKOUT_COUNT', data);
      return ctx.reply("3-savol: *O'tgan hafta davomida jami nechta workout (mashg'ulot) bajardingiz?* (Masalan: 3):", { parse_mode: 'Markdown' });
    }

    // 3. Haftalik mashqlar soni
    if (step === 'CHECKIN_WORKOUT_COUNT') {
      const num = Number(text);
      if (isNaN(num) || num < 0 || num > 14) {
        return ctx.reply("Iltimos, mashg'ulotlar sonini to'g'ri kiriting (masalan: 3 yoki 4):");
      }
      data.workoutCount = num;
      sessionManager.setState(telegramId, 'CHECKIN_DIET', data);
      return ctx.reply(
        "4-savol: *O'tgan hafta dietangizga va kaloriya me'yoringizga qanchalik rioya qildingiz?*",
        inlineKeyboards.getRatingKeyboard('checkin_diet')
      );
    }
  },

  /**
   * Check-in baholash inline tugmalari
   */
  async handleCheckinCallback(ctx, action) {
    const telegramId = ctx.from.id;
    const state = sessionManager.getState(telegramId);
    if (!state) return;

    await ctx.answerCbQuery();
    const data = state.data;

    // Dieta reytingi
    if (action.startsWith('checkin_diet_')) {
      const rating = Number(action.replace('checkin_diet_', ''));
      data.dietAdherence = rating;
      sessionManager.setState(telegramId, 'CHECKIN_ENERGY', data);
      return ctx.reply(
        "5-savol: *Hafta davomidagi umumiy energiya va kayfiyatingiz darajasi qanday bo'ldi?*",
        inlineKeyboards.getRatingKeyboard('checkin_energy')
      );
    }

    // Energiya reytingi
    if (action.startsWith('checkin_energy_')) {
      const rating = Number(action.replace('checkin_energy_', ''));
      data.energyLevel = rating;

      // Natijalarni hisoblash va bazaga kiritish
      const user = await userRepository.findByTelegramId(telegramId);
      const weightDiff = +(data.currentWeight - (data.previousWeight || data.currentWeight)).toFixed(2);
      data.weightDiff = weightDiff;

      // Progress bazasiga yozish
      await progressRepository.create(user.id, data.currentWeight, data.waist);

      const waitMsg = await ctx.reply("⏳ Natijalaringiz tahlil qilinmoqda va AI haftalik hisobot tayyorlanmoqda...");

      try {
        const historyData = await progressRepository.getInitialAndLatest(user.id);
        const report = await geminiService.generateWeeklyReport(
          {
            initialWeight: historyData?.initial?.weight || data.currentWeight,
            previousWeight: data.previousWeight,
            currentWeight: data.currentWeight,
            weightDiff,
            waist: data.waist,
            workoutCount: data.workoutCount,
            dietAdherence: data.dietAdherence,
            energyLevel: data.energyLevel,
          },
          user
        );

        sessionManager.clearState(telegramId);
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
        } catch (e) {}

        const finalMsg =
          `📊 *HAFTALIK PROGRESSINGIZ MUVAFFAQIYATLI QAYD ETILDI!*\n\n` +
          `▫️ Yangi vazn: *${data.currentWeight} kg* (${weightDiff > 0 ? '+' + weightDiff : weightDiff} kg)\n` +
          (data.waist ? `▫️ Bel o'lchami: *${data.waist} sm*\n` : '') +
          `▫️ Haftalik mashg'ulotlar: *${data.workoutCount} ta*\n\n` +
          `🤖 *AI MURABBIY XULOSASI:*\n\n` +
          report;

        await ctx.replyWithMarkdown(finalMsg, mainKeyboards.getMainMenu());
      } catch (err) {
        logger.error('Check-in hisobotda xatolik:', err);
        sessionManager.clearState(telegramId);
        await ctx.reply(
          `✅ Yangi vazningiz (${data.currentWeight} kg) muvaffaqiyatli saqlandi! Keyingi hafta yanada kuchliroq bo'lamiz! 💪`,
          mainKeyboards.getMainMenu()
        );
      }
    }
  },
};
