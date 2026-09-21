import { config, validateEnv } from './config/env.js';
import { initDatabase, closeDatabase } from './database/index.js';
import { createBot } from './bot/index.js';
import { cronService } from './services/cronService.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  logger.info("=== Telegram AI Fitness Bot ishga tushmoqda ===");

  // Muhit o'zgaruvchilarini tekshirish
  const envOk = validateEnv();

  // Dry run tekshiruvi (testlar va CI uchun)
  if (process.argv.includes('--dry-run')) {
    logger.info("Dry-run rejimi faol. Database initsializatsiyasi tekshirilmoqda...");
    await initDatabase();
    logger.info("Dry-run muvaffaqiyatli yakunlandi!");
    await closeDatabase();
    process.exit(0);
  }

  // 1. Ma'lumotlar bazasini initsializatsiya qilish
  try {
    await initDatabase();
  } catch (dbError) {
    logger.error("Ma'lumotlar bazasiga ulanishda jiddiy xatolik:", dbError);
    process.exit(1);
  }

  if (!config.botToken) {
    logger.error("BOT_TOKEN mavjud emas! Iltimos .env faylida BOT_TOKEN ni belgilang.");
    logger.info("Misol uchun .env.example faylidan nusxa oling (.env yaratish uchun).");
    process.exit(1);
  }

  // 2. Telegraf botini ishga tushirish
  const bot = createBot();

  try {
    await bot.launch();
    logger.info("🚀 Bot muvaffaqiyatli ishga tushdi va xabarlarni qabul qilmoqda!");

    // 3. Cron eslatmalar xizmatini faollashtirish
    cronService.init(bot);
  } catch (launchError) {
    logger.error("Telegram botini launch qilishda xatolik:", launchError);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`\n[SHUTDOWN] ${signal} signali qabul qilindi. Resurslar tozalanmoqda...`);
    try {
      cronService.stopAll();
      bot.stop(signal);
      await closeDatabase();
    } catch (e) {
      logger.error('Shutdown jarayonida xatolik:', e);
    }
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error("Dasturni ishga tushirishda kutilmagan xatolik:", err);
  process.exit(1);
});
