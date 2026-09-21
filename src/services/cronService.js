import cron from 'node-cron';
import { userRepository } from '../database/repositories/userRepository.js';
import { logger } from '../utils/logger.js';

export const cronService = {
  tasks: [],

  /**
   * Cron bildirishnomalar xizmatini ishga tushirish
   */
  init(bot) {
    logger.info('[CRON] Smart bildirishnomalar va eslatmalar xizmati ishga tushirilmoqda...');

    // 1. Suv ichish eslatmasi (Har kuni soat 10:00, 13:00, 16:00, 19:00 da)
    const waterTask = cron.schedule('0 10,13,16,19 * * *', async () => {
      logger.info('[CRON] Suv ichish eslatmasi yuborilmoqda...');
      await this.broadcastWaterReminder(bot);
    });
    this.tasks.push(waterTask);

    // 2. Ertalabki Mashg'ulot Motivatsiyasi (Har kuni ertalab soat 08:30 da)
    const workoutTask = cron.schedule('30 8 * * *', async () => {
      logger.info('[CRON] Ertalabki motivatsiya yuborilmoqda...');
      await this.broadcastWorkoutReminder(bot);
    });
    this.tasks.push(workoutTask);

    // 3. Yakshanba haftalik check-in eslatmasi (Har yakshanba soat 20:00 da)
    const checkinTask = cron.schedule('0 20 * * 0', async () => {
      logger.info('[CRON] Yakshanbalik check-in eslatmasi yuborilmoqda...');
      await this.broadcastCheckinReminder(bot);
    });
    this.tasks.push(checkinTask);

    logger.info('[CRON] 3 ta avtomatik rejalashtirilgan vazifa (Suv, Mashg\'ulot, Check-in) faol.');
  },

  /**
   * Barcha obunachilarga suv ichish eslatmasini yuborish
   */
  async broadcastWaterReminder(bot) {
    try {
      const users = await userRepository.findSubscribersForReminders();
      const msg =
        `💧 *Suv ichish vaqti bo'ldi!*\n\n` +
        `Moddalar almashinuvini (metabolizm) tezlashtirish va mushaklar to'laqonli ishlashi uchun hozir 1 stakan toza suv ichishni unutmang. 💪`;

      for (const user of users) {
        try {
          await bot.telegram.sendMessage(user.telegram_id, msg, { parse_mode: 'Markdown' });
        } catch (err) {
          // Foydalanuvchi botni bloklagan bo'lsa
          logger.debug(`Foydalanuvchiga (${user.telegram_id}) xabar yetkazilmadi:`, err.message);
        }
      }
    } catch (error) {
      logger.error('Suv eslatmasi yuborishda xatolik:', error);
    }
  },

  /**
   * Ertalabki mashg'ulot motivatsiyasini yuborish
   */
  async broadcastWorkoutReminder(bot) {
    try {
      const users = await userRepository.findSubscribersForReminders();
      const msg =
        `🌅 *Xayrli tong, chempion!*\n\n` +
        `Bugun tanangizni yanada baquvvat qilish kuni! Kunlik mashg'ulot rejangizga amal qiling va o'zingizga bo'lgan ishonchni oshiring. 🏋️🔥\n\n` +
        `_Rejangizni ko'rish uchun "🏋️ Workout" bo'limini bosing._`;

      for (const user of users) {
        try {
          await bot.telegram.sendMessage(user.telegram_id, msg, { parse_mode: 'Markdown' });
        } catch (err) {
          logger.debug(`Foydalanuvchiga (${user.telegram_id}) xabar yetkazilmadi:`, err.message);
        }
      }
    } catch (error) {
      logger.error('Mashg\'ulot eslatmasida xatolik:', error);
    }
  },

  /**
   * Yakshanba haftalik check-in eslatmasini yuborish
   */
  async broadcastCheckinReminder(bot) {
    try {
      const users = await userRepository.findSubscribersForReminders();
      const msg =
        `📅 *Hafta yakunlandi — Check-in vaqti!* 💪\n\n` +
        `O'tgan haftadagi natijalaringizni ko'rish vaqti keldi. Keling, yangi vazningizni o'lchaymiz va AI murabbiyingizdan yangi hafta uchun shaxsiy tahlil olamiz!\n\n` +
        `👉 *"📊 Progress" ➔ "📅 Haftalik check-in topshirish"* tugmasini bosing.`;

      for (const user of users) {
        try {
          await bot.telegram.sendMessage(user.telegram_id, msg, { parse_mode: 'Markdown' });
        } catch (err) {
          logger.debug(`Foydalanuvchiga (${user.telegram_id}) xabar yetkazilmadi:`, err.message);
        }
      }
    } catch (error) {
      logger.error('Check-in eslatmasida xatolik:', error);
    }
  },

  /**
   * Barcha cron vazifalarini xavfsiz to'xtatish
   */
  stopAll() {
    for (const task of this.tasks) {
      task.stop();
    }
    this.tasks = [];
    logger.info('[CRON] Barcha vazifalar to\'xtatildi.');
  },
};
