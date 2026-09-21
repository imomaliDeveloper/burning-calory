import { userRepository } from '../../database/repositories/userRepository.js';
import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { inlineKeyboards } from '../keyboards/inlineKeyboards.js';
import { sessionManager } from '../session.js';

export const settingsHandler = {
  /**
   * ⚙️ Sozlamalar menyusi
   */
  async showSettings(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    const isEnabled = user?.notifications_enabled ?? 1;

    const msg =
      `⚙️ *SOZLAMALAR VA XAVFSIZLIK*\n\n` +
      `Siz o'z ma'lumotlaringizni to'liq nazorat qilasiz.\n\n` +
      `🔔 *Bildirishnomalar:* ${isEnabled === 1 ? 'Yoqilgan ✅ (Suv, Mashq, Check-in)' : 'O\'chirilgan 🔕'}\n` +
      `🔒 *Maxfiylik:* Barcha ma'lumotlaringiz faqat sizga tegishli va xavfsiz saqlanadi.\n\n` +
      `Kerakli amalni tanlang:`;

    await ctx.replyWithMarkdown(msg, inlineKeyboards.getProfileSettingsKeyboard(isEnabled));
  },

  /**
   * Bildirishnomalarni yoqish yoki o'chirish
   */
  async toggleNotifications(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);
    await ctx.answerCbQuery();

    if (!user) return;

    const current = user.notifications_enabled ?? 1;
    const newStatus = current === 1 ? 0 : 1;

    await userRepository.update(telegramId, { notificationsEnabled: newStatus });

    const statusText = newStatus === 1
      ? "🔔 Avtomatik eslatmalar (suv, mashg'ulot va check-in) *YOQILDI*."
      : "🔕 Avtomatik eslatmalar *O'CHIRILDI*.";

    await ctx.replyWithMarkdown(statusText);
    return this.showSettings(ctx);
  },

  /**
   * 🗑 Profilni o'chirish tasdiqlashini so'rash
   */
  async promptDeleteProfile(ctx) {
    await ctx.answerCbQuery();
    const confirmText =
      `⚠️ *DIQQAT! PROFILNI O'CHIRISH*\n\n` +
      `Profilingizni o'chirib yuborsangiz:\n` +
      `• Barcha shaxsiy ma'lumotlaringiz\n` +
      `• Tana rasmlari va tahlillari tarixi\n` +
      `• Vazn va o'lchovlar dinamikasi\n` +
      `• Barcha mashg'ulot yozuvlaringiz\n\n` +
      `*Qayta tiklab bo'lmaydigan qilib butunlay o'chiriladi.* Rostdan ham o'chirmoqchimisiz?`;

    await ctx.replyWithMarkdown(confirmText, inlineKeyboards.getDeleteConfirmKeyboard());
  },

  /**
   * Profilni haqiqatdan o'chirish
   */
  async confirmDeleteProfile(ctx) {
    const telegramId = ctx.from.id;
    await ctx.answerCbQuery();

    sessionManager.clearState(telegramId);
    const deleted = await userRepository.deleteByTelegramId(telegramId);

    if (deleted) {
      await ctx.reply(
        "🗑 Sizning barcha ma'lumotlaringiz va profilingiz tizimdan butunlay o'chirildi.\n\nQayta boshlash uchun /start buyrug'ini bosing.",
        mainKeyboards.getHomeOnly()
      );
    } else {
      await ctx.reply("Profil topilmadi.", mainKeyboards.getHomeOnly());
    }
  },

  /**
   * O'chirishni bekor qilish
   */
  async cancelDeleteProfile(ctx) {
    await ctx.answerCbQuery();
    await ctx.reply("Profilni o'chirish bekor qilindi. Barcha ma'lumotlaringiz xavfsiz holatda. ✅", mainKeyboards.getMainMenu());
  },
};
