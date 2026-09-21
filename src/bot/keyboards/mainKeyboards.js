import { Markup } from 'telegraf';

export const mainKeyboards = {
  /**
   * Asosiy menyu tugmalari
   */
  getMainMenu() {
    return Markup.keyboard([
      ['👤 Profilim', '📸 Tana rasmini tahlil qilish'],
      ['🎯 Maqsadim', '🍎 Ovqatlanish'],
      ['🏋️ Workout', '📊 Progress'],
      ['🌙 Ro\'za rejimi', '🤖 AI Coach'],
      ['⚙️ Sozlamalar'],
    ]).resize();
  },

  /**
   * Orqaga va Bosh menyu navigatsiyasi
   */
  getBackAndHome() {
    return Markup.keyboard([
      ['⬅️ Orqaga', '🏠 Bosh menyu'],
    ]).resize();
  },

  /**
   * Faqat Bosh menyu tugmasi
   */
  getHomeOnly() {
    return Markup.keyboard([
      ['🏠 Bosh menyu'],
    ]).resize();
  },

  /**
   * Ovqatlanish menyusi qo'shimcha tugmalari
   */
  getNutritionMenu() {
    return Markup.keyboard([
      ['📸 Ovqat rasmini yuborish', '📋 Bugungi taomnoma'],
      ['🍳 Muzlatgichdagi masalliqlar', '📊 Bugungi balans'],
      ['⬅️ Orqaga', '🏠 Bosh menyu'],
    ]).resize();
  },

  /**
   * Workout menyusi qo'shimcha tugmalari
   */
  getWorkoutMenu() {
    return Markup.keyboard([
      ['📋 Haftalik mashg\'ulot dasturi', '✍️ Mashq natijasini kiritish'],
      ['📄 Shaxsiy reja (PDF)'],
      ['⬅️ Orqaga', '🏠 Bosh menyu'],
    ]).resize();
  },

  /**
   * Progress menyusi qo'shimcha tugmalari
   */
  getProgressMenu() {
    return Markup.keyboard([
      ['➕ Yangi vazn/bel kiritish', '📈 O\'zgarishlar grafigi'],
      ['📅 Haftalik check-in topshirish'],
      ['⬅️ Orqaga', '🏠 Bosh menyu'],
    ]).resize();
  },

  /**
   * AI Coach menyusi
   */
  getCoachMenu() {
    return Markup.keyboard([
      ['💡 Bugun nima yey?', '⚡ Mashq qilishga vaqtim yo\'q'],
      ['🥩 Proteinim yetmayapti', '🍩 Bugun dietani buzdim'],
      ['⬅️ Orqaga', '🏠 Bosh menyu'],
    ]).resize();
  },

  /**
   * Ro'za va Ramazon menyusi
   */
  getFastingMenu(isFasting = false) {
    const toggleText = isFasting ? '☀️ Ro\'za rejimini o\'chirish' : '🌙 Ro\'za rejimini yoqish';
    return Markup.keyboard([
      ['🌙 Saharlik & Iftorlik taomnoma', '🏋️ Ro\'zadagi mashg\'ulotlar'],
      ['💧 Suv ichish tartibi', toggleText],
      ['⬅️ Orqaga', '🏠 Bosh menyu'],
    ]).resize();
  },
};
