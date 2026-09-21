import { config } from '../../config/env.js';
import { userRepository } from '../../database/repositories/userRepository.js';
import { Markup } from 'telegraf';
import { sessionManager } from '../session.js';
import { logger } from '../../utils/logger.js';

export const adminHandler = {
  /**
   * Foydalanuvchi admin ekanligini tekshirish
   */
  isAdmin(telegramId) {
    if (!config.adminId) return false;
    return String(telegramId) === String(config.adminId);
  },

  /**
   * /admin buyrug'i
   */
  async showAdminPanel(ctx) {
    const telegramId = ctx.from.id;

    if (!this.isAdmin(telegramId)) {
      return ctx.reply("⛔️ Bu buyruq faqat bot administratori uchun mo'ljallangan.");
    }

    sessionManager.clearState(telegramId);
    const stats = await userRepository.getAdminStats();

    let msg = `👑 *ADMINISTRATOR BOSHQARUV PANELI*\n\n`;
    msg += `👥 *Jami foydalanuvchilar:* ${stats.totalUsers} nafar\n`;
    msg += `🍽 *Qayd etilgan taomlar:* ${stats.totalMeals} ta\n`;
    msg += `🏋️ *Bajarilgan mashg'ulotlar:* ${stats.totalWorkouts} ta\n\n`;

    if (stats.goals && stats.goals.length > 0) {
      msg += `🎯 *Maqsadlar bo'yicha taqsimot:*\n`;
      for (const g of stats.goals) {
        msg += `• ${g.goal}: ${g.count} kishi\n`;
      }
      msg += `\n`;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📢 Barchaga xabar yuborish (Broadcast)', 'admin_broadcast_start')],
      [Markup.button.callback('🔄 Statistikani yangilash', 'admin_refresh_stats')],
    ]);

    await ctx.replyWithMarkdown(msg, keyboard);
  },

  /**
   * Broadcast boshlash taklifi
   */
  async promptBroadcast(ctx) {
    const telegramId = ctx.from.id;
    if (!this.isAdmin(telegramId)) return;

    await ctx.answerCbQuery();
    sessionManager.setState(telegramId, 'AWAITING_BROADCAST_MESSAGE', {});

    const msg =
      `📢 *OMMAVIY XABAR TARQATISH (BROADCAST)*\n\n` +
      `Barcha foydalanuvchilarga yubormoqchi bo'lgan matnli xabaringizni yozib yuboring.\n\n` +
      `_Xabarni bekor qilish uchun '❌ Bekor qilish' deb yozing._`;

    await ctx.replyWithMarkdown(msg);
  },

  /**
   * Admin yuborgan xabarni qabul qilish va tasdiqlash so'rash
   */
  async handleBroadcastText(ctx, state) {
    const telegramId = ctx.from.id;
    if (!this.isAdmin(telegramId)) return;

    const text = ctx.message.text.trim();

    if (text === '❌ Bekor qilish') {
      sessionManager.clearState(telegramId);
      return ctx.reply("Broadcast bekor qilindi.", Markup.removeKeyboard());
    }

    const userIds = await userRepository.getAllTelegramIds();
    sessionManager.setState(telegramId, 'CONFIRM_BROADCAST', {
      broadcastText: text,
      targetCount: userIds.length,
    });

    const previewMsg =
      `📋 *XABARNI TASDIQLASH:*\n\n` +
      `Quyidagi xabar jami *${userIds.length} nafar* foydalanuvchiga yuboriladi:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${text}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Rostdan ham barchaga yuborilsinmi?`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🚀 Ha, barchaga yuborilsin', 'admin_confirm_broadcast'),
        Markup.button.callback('❌ Bekor qilish', 'admin_cancel_broadcast'),
      ],
    ]);

    await ctx.replyWithMarkdown(previewMsg, keyboard);
  },

  /**
   * Broadcastni haqiqatdan amalga oshirish
   */
  async executeBroadcast(ctx) {
    const telegramId = ctx.from.id;
    if (!this.isAdmin(telegramId)) return;

    await ctx.answerCbQuery();
    const state = sessionManager.getState(telegramId);

    if (!state || !state.data?.broadcastText) {
      return ctx.reply("Yuboriladigan xabar topilmadi.");
    }

    const messageText = state.data.broadcastText;
    sessionManager.clearState(telegramId);

    const userIds = await userRepository.getAllTelegramIds();
    const waitMsg = await ctx.reply(`⏳ Xabar ${userIds.length} ta foydalanuvchiga tarqatilmoqda...`);

    let successCount = 0;
    let failCount = 0;

    for (const id of userIds) {
      try {
        await ctx.telegram.sendMessage(id, messageText, { parse_mode: 'Markdown' });
        successCount++;
      } catch (err) {
        failCount++;
        logger.debug(`Broadcast xatosi (${id}):`, err.message);
      }
    }

    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id);
    } catch (e) {}

    const reportMsg =
      `✅ *BROADCAST MUVAFFAQIYATLI YAKUNLANDI!*\n\n` +
      `▫️ Yuborildi: *${successCount} ta*\n` +
      `▫️ Yetib bormadi (bloklagan): *${failCount} ta*\n` +
      `▫️ Jami: *${userIds.length} ta*`;

    await ctx.replyWithMarkdown(reportMsg);
  },
};
