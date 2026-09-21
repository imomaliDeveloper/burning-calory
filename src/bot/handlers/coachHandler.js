import { userRepository } from '../../database/repositories/userRepository.js';
import { geminiService } from '../../services/geminiService.js';
import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { sessionManager } from '../session.js';
import { logger } from '../../utils/logger.js';

export const coachHandler = {
  /**
   * 🤖 AI Coach tugmasi bosilganda
   */
  async showCoachMenu(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    sessionManager.setState(telegramId, 'AI_COACH_CHAT', { userId: user?.id, history: [] });

    const msg =
      `🤖 *AI FITNESS COACH XIZMATI*\n\n` +
      `Salom! Men sizning 24/7 shaxsiy AI murabbiyingizman. 💪\n\n` +
      `Siz menga har qanday savol berishingiz, bugungi dietangiz yoki mashqlaringiz haqida yozishingiz mumkin.\n\n` +
      `_Quyidagi tayyor savollardan birini tanlang yoki o'z savolingizni erkin yozing:_`;

    await ctx.replyWithMarkdown(msg, mainKeyboards.getCoachMenu());
  },

  /**
   * Coach chatida foydalanuvchi xabari kelganda
   */
  async handleCoachMessage(ctx, userMessage) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);
    const state = sessionManager.getState(telegramId) || { step: 'AI_COACH_CHAT', data: { history: [] } };
    const history = state.data.history || [];

    const waitMsg = await ctx.reply("🤖 AI Coach javob tayyorlamoqda...");

    try {
      const reply = await geminiService.askCoach(userMessage, user || {}, history);

      // Suhbat tarixini saqlab borish
      history.push({ sender: 'user', text: userMessage });
      history.push({ sender: 'coach', text: reply });
      sessionManager.updateData(telegramId, { history });

      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
      } catch (e) {}

      await ctx.replyWithMarkdown(reply, mainKeyboards.getCoachMenu());
    } catch (error) {
      logger.error('AI Coach xatolik:', error);
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
      } catch (e) {}

      await ctx.reply(
        "⚠️ Kechirasiz, ayni paytda AI xizmatida vaqtinchalik uzilish kuzatildi. Iltimos, bir ozdan so'ng qayta urinib ko'ring.",
        mainKeyboards.getCoachMenu()
      );
    }
  },
};
