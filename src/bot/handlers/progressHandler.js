import { userRepository } from '../../database/repositories/userRepository.js';
import { progressRepository } from '../../database/repositories/progressRepository.js';
import { chartService } from '../../services/chartService.js';
import { formatter } from '../../utils/formatter.js';
import { validator } from '../../utils/validator.js';
import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { sessionManager } from '../session.js';
import { logger } from '../../utils/logger.js';

export const progressHandler = {
  /**
   * 📊 Progress tugmasi bosilganda
   */
  async showProgressMenu(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) {
      return ctx.reply("Avval profilingizni to'ldiring.", mainKeyboards.getMainMenu());
    }

    const progressData = await progressRepository.getInitialAndLatest(user.id);
    const summaryText = formatter.formatProgressSummary(progressData);

    await ctx.replyWithMarkdown(summaryText, mainKeyboards.getProgressMenu());
  },

  /**
   * ➕ Yangi vazn/bel kiritishni boshlash
   */
  async promptNewProgress(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) {
      return ctx.reply("Avval profilingizni to'ldiring.");
    }

    sessionManager.setState(telegramId, 'AWAITING_PROGRESS_WEIGHT', { userId: user.id });

    const msg =
      `➕ *YANGI VAZN VA O'LCHOVLARNI KIRITISH*\n\n` +
      `Bugungi vazningizni kiriting (kg, masalan: 78.4):`;

    await ctx.replyWithMarkdown(msg, mainKeyboards.getBackAndHome());
  },

  /**
   * Progress kiritish matnli bosqichlarini qayta ishlash
   */
  async handleProgressText(ctx, state) {
    const telegramId = ctx.from.id;
    const text = ctx.message.text.trim();
    const { step, data } = state;

    // 1-qadam: Vazn
    if (step === 'AWAITING_PROGRESS_WEIGHT') {
      if (!validator.isValidWeight(text)) {
        return ctx.reply("Iltimos, vazningizni to'g'ri kiriting (30 dan 300 gacha son, masalan: 78.5):");
      }
      data.weight = Number(text);
      sessionManager.setState(telegramId, 'AWAITING_PROGRESS_WAIST', data);
      return ctx.reply(
        "Bel o'lchamingizni kiriting (sm, masalan: 82)\nyoki o'tkazib yuborish uchun '0' deb yozing:"
      );
    }

    // 2-qadam: Bel o'lchami
    if (step === 'AWAITING_PROGRESS_WAIST') {
      let waist = null;
      if (text !== '0' && text.toLowerCase() !== "o'tkazish" && text.toLowerCase() !== "yo'q") {
        if (!validator.isValidWaist(text)) {
          return ctx.reply("Iltimos, bel o'lchamini to'g'ri kiriting (40 dan 200 sm gacha) yoki o'tkazib yuborish uchun '0' deb yozing:");
        }
        waist = Number(text);
      }
      data.waist = waist;

      // Saqlash
      await progressRepository.create(data.userId, data.weight, data.waist);
      sessionManager.clearState(telegramId);

      const progressData = await progressRepository.getInitialAndLatest(data.userId);
      const summaryText =
        `✅ *Bugungi ko'rsatkichlaringiz saqlandi!*\n\n` +
        formatter.formatProgressSummary(progressData);

      return ctx.replyWithMarkdown(summaryText, mainKeyboards.getProgressMenu());
    }
  },

  /**
   * 📈 O'zgarishlar grafigi tugmasi
   */
  async showProgressChart(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) {
      return ctx.reply("Avval profilingizni to'ldiring.");
    }

    const history = await progressRepository.getHistoryByUserId(user.id);

    if (!history || history.length === 0) {
      return ctx.reply(
        "Grafik chizish uchun kamida 1-2 ta vazn o'lchov yozuvlari kerak. '➕ Yangi vazn/bel kiritish' tugmasi orqali ma'lumot kiriting!",
        mainKeyboards.getProgressMenu()
      );
    }

    const waitMsg = await ctx.reply("📊 Grafik tayyorlanmoqda...");

    try {
      const chartUrl = chartService.generateWeightChartUrl(history);
      const buffer = await chartService.getChartBuffer(chartUrl);

      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
      } catch (e) {}

      if (buffer) {
        await ctx.replyWithPhoto(
          { source: buffer },
          {
            caption: `📈 *Vazn o'zgarish dinamikasi grafigi*\nBoshlang'ich: ${history[0].weight} kg ➔ Hozirgi: ${history[history.length - 1].weight} kg`,
            parse_mode: 'Markdown',
            ...mainKeyboards.getProgressMenu(),
          }
        );
      } else {
        // Zaxira matnli vizualizatsiya
        const ascii = chartService.generateAsciiProgress(history);
        await ctx.replyWithMarkdown(ascii, mainKeyboards.getProgressMenu());
      }
    } catch (error) {
      logger.error('Grafik yuborishda xatolik:', error);
      const ascii = chartService.generateAsciiProgress(history);
      await ctx.replyWithMarkdown(ascii, mainKeyboards.getProgressMenu());
    }
  },
};
