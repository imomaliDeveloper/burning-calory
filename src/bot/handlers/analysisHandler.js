import axios from 'axios';
import { userRepository } from '../../database/repositories/userRepository.js';
import { analysisRepository } from '../../database/repositories/analysisRepository.js';
import { geminiService } from '../../services/geminiService.js';
import { formatter } from '../../utils/formatter.js';
import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { sessionManager } from '../session.js';
import { logger } from '../../utils/logger.js';

export const analysisHandler = {
  /**
   * 📸 Tana rasmini tahlil qilish tugmasi bosilganda
   */
  async promptPhoto(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user || !user.weight) {
      return ctx.reply(
        "Tana rasmini aniqroq tahlil qilish uchun avval profilingizni to'ldiring.",
        mainKeyboards.getMainMenu()
      );
    }

    sessionManager.setState(telegramId, 'AWAITING_BODY_PHOTO', { userId: user.id });

    const msg =
      `📸 *TANA RASMINI TAHLIL QILISH*\n\n` +
      `Old va imkon bo'lsa yon tomondan tushirilgan, yaxshi yorug'likdagi rasm yuboring.\n\n` +
      `⚠️ *Maxfiylik kafolati:*\n` +
      `Siz yuborgan rasm faqat tahlil vaqtida qayta ishlanadi va xavfsiz saqlanadi.\n` +
      `Hech qachon begona shaxslarga ko'rsatilmaydi.\n\n` +
      `_Iltimos, rasmni oddiy rasm formatida yuboring._`;

    await ctx.replyWithMarkdown(msg, mainKeyboards.getBackAndHome());
  },

  /**
   * Foydalanuvchi rasm yuborganda
   */
  async handlePhoto(ctx) {
    const telegramId = ctx.from.id;
    const state = sessionManager.getState(telegramId);

    if (!state || state.step !== 'AWAITING_BODY_PHOTO') {
      // Boshqa holatda rasm kelsa (masalan haftalik checkinda yoki shunchaki)
      return;
    }

    const user = await userRepository.findByTelegramId(telegramId);
    if (!user) {
      sessionManager.clearState(telegramId);
      return ctx.reply("Foydalanuvchi topilmadi. Qaytadan /start buyrug'ini bosing.");
    }

    const waitMsg = await ctx.reply("⏳ Rasmingiz Gemini AI orqali tahlil qilinmoqda, iltimos kuting...");

    try {
      // Telegramdan eng katta o'lchamdagi rasmni olish
      const photos = ctx.message.photo;
      const largestPhoto = photos[photos.length - 1];
      const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id);

      // Rasmni xotiraga yuklab olish
      const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);

      // Gemini Vision orqali tahlil qilish
      const analysis = await geminiService.analyzeBodyImage(imageBuffer, 'image/jpeg', user);

      // Natijani bazaga saqlash
      await analysisRepository.create(user.id, largestPhoto.file_id, analysis);

      sessionManager.clearState(telegramId);

      // Yuklash xabarini o'chirish
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
      } catch (err) {
        // xabarni o'chirish muammo tug'dirmaydi
      }

      // Natijani ko'rsatish
      const resultText = formatter.formatBodyAnalysis(analysis);
      await ctx.replyWithMarkdown(resultText, mainKeyboards.getMainMenu());
    } catch (error) {
      logger.error('Rasm tahlilida xatolik:', error);
      sessionManager.clearState(telegramId);

      let errorMessage = "⚠️ Kechirasiz, rasmni tahlil qilishda xatolik yuz berdi.";
      if (error.status === 429 || (error.message && (error.message.includes('429') || error.message.includes('Quota exceeded')))) {
        errorMessage = "⚠️ Google Gemini API bepul kvotasi so'rovlar limiti to'ldi (429 Rate Limit). Iltimos, 1 daqiqadan so'ng qayta urinib ko'ring.";
      } else if (error.message && error.message.includes('API_KEY')) {
        errorMessage += " (Gemini API kaliti sozlanmagan yoki noto'g'ri)";
      } else {
        errorMessage += " Iltimos, boshqa yorug'roq rasm yuborib qayta urinib ko'ring.";
      }

      await ctx.reply(errorMessage, mainKeyboards.getMainMenu());
    }
  },
};
