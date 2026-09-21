import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env faylini loyiha ildizidan yuklash
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  adminId: process.env.ADMIN_ID || '',
  databaseUrl: process.env.DATABASE_URL || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  dataDir: path.resolve(__dirname, '../../data'),
  sqlitePath: path.resolve(__dirname, '../../data/fitness_bot.db'),
};

/**
 * Muhit o'zgaruvchilarini tekshirish
 */
export function validateEnv() {
  const missing = [];
  if (!config.botToken) missing.push('BOT_TOKEN');
  if (!config.geminiApiKey) missing.push('GEMINI_API_KEY');

  if (missing.length > 0) {
    console.warn(`[OGOHLANTIRISH] Quyidagi muhit o'zgaruvchilari .env faylida topilmadi: ${missing.join(', ')}`);
    console.warn(`[ESLATMA] Botni to'liq ishlatish uchun .env fayliga BOT_TOKEN va GEMINI_API_KEY qiymatlarini kiriting.`);
  }

  return missing.length === 0;
}
