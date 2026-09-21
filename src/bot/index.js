import { Telegraf } from 'telegraf';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { handleStart } from './handlers/startHandler.js';
import { profileHandler } from './handlers/profileHandler.js';
import { analysisHandler } from './handlers/analysisHandler.js';
import { nutritionHandler } from './handlers/nutritionHandler.js';
import { menuHandler } from './handlers/menuHandler.js';
import { settingsHandler } from './handlers/settingsHandler.js';
import { checkinHandler } from './handlers/checkinHandler.js';
import { adminHandler } from './handlers/adminHandler.js';
import { sessionManager } from './session.js';

export function createBot() {
  if (!config.botToken) {
    throw new Error("BOT_TOKEN aniqlanmadi. Iltimos, .env faylida BOT_TOKEN ni sozlang.");
  }

  const bot = new Telegraf(config.botToken);

  // Global xatoliklarni ushlab qolish (Error Handling)
  bot.catch((err, ctx) => {
    logger.error(`Bot xatoligi (${ctx.updateType}):`, err);
    try {
      ctx.reply(
        "⚠️ Texnik xatolik yuz berdi. Iltimos, bir ozdan so'ng qayta urinib ko'ring yoki /start buyrug'ini bosing."
      );
    } catch (sendErr) {
      logger.error('Xatolik xabarini yuborishda muammo:', sendErr);
    }
  });

  // Komandalar
  bot.command('start', handleStart);
  bot.command('profile', (ctx) => profileHandler.showProfile(ctx));
  bot.command('admin', (ctx) => adminHandler.showAdminPanel(ctx));
  bot.command('help', (ctx) => {
    ctx.reply(
      "💪 *AI Fitness Assistant Yordam:*\n\n" +
      "/start — Botni ishga tushirish va bosh menyu\n" +
      "/profile — Shaxsiy profilingiz va hisoblangan kaloriyalar\n" +
      "/admin — Administrator boshqaruv paneli\n\n" +
      "Savollaringiz bo'lsa, '🤖 AI Coach' bo'limi orqali murabbiyingizga murojaat qiling!",
      { parse_mode: 'Markdown' }
    );
  });

  // Callback query larni qayta ishlash
  bot.on('callback_query', async (ctx) => {
    const action = ctx.callbackQuery.data;

    // PDF Dasturni yuklab olish
    if (action === 'download_plan_pdf') {
      await ctx.answerCbQuery();
      return profileHandler.downloadPlanPdf(ctx);
    }

    // Admin amallari
    if (action === 'admin_broadcast_start') {
      return adminHandler.promptBroadcast(ctx);
    }
    if (action === 'admin_refresh_stats') {
      await ctx.answerCbQuery();
      return adminHandler.showAdminPanel(ctx);
    }
    if (action === 'admin_confirm_broadcast') {
      return adminHandler.executeBroadcast(ctx);
    }
    if (action === 'admin_cancel_broadcast') {
      sessionManager.clearState(ctx.from.id);
      await ctx.answerCbQuery();
      return ctx.reply("Broadcast bekor qilindi.");
    }

    // Profilni o'chirish amallari
    if (action === 'prompt_delete_profile') {
      return settingsHandler.promptDeleteProfile(ctx);
    }
    if (action === 'confirm_delete_profile') {
      return settingsHandler.confirmDeleteProfile(ctx);
    }
    if (action === 'cancel_delete_profile') {
      return settingsHandler.cancelDeleteProfile(ctx);
    }

    // Bildirishnomalarni yoqish/o'chirish
    if (action === 'toggle_notifications') {
      return settingsHandler.toggleNotifications(ctx);
    }

    // Haftalik check-in
    if (action.startsWith('checkin_')) {
      return checkinHandler.handleCheckinCallback(ctx, action);
    }

    // Onboarding va profil sozlamalari
    return profileHandler.handleCallback(ctx);
  });

  // Rasmlar kelganda (Tana tahlili yoki Taom tahlili)
  bot.on('photo', async (ctx) => {
    const state = sessionManager.getState(ctx.from.id);
    if (state && state.step === 'AWAITING_FOOD_PHOTO') {
      return nutritionHandler.handleFoodPhoto(ctx);
    }
    return analysisHandler.handlePhoto(ctx);
  });

  // Barcha matnli xabarlar
  bot.on('text', async (ctx) => {
    return menuHandler.handleTextMessage(ctx);
  });

  return bot;
}
