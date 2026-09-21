import { userRepository } from '../../database/repositories/userRepository.js';
import { workoutRepository } from '../../database/repositories/workoutRepository.js';
import { workoutService } from '../../services/workoutService.js';
import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { sessionManager } from '../session.js';

export const workoutHandler = {
  /**
   * 🏋️ Workout tugmasi bosilganda
   */
  async showWorkoutMenu(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user || !user.workout_location) {
      return ctx.reply("Mashg'ulot rejasini olish uchun avval profilingizni to'ldiring.", mainKeyboards.getMainMenu());
    }

    const locText = user.workout_location === 'home' ? '🏠 Uy sharoitida' : '🏋️ Fitnes zalida';
    const stats = await workoutRepository.getStatsByUserId(user.id);

    const msg =
      `🏋️ *MASHG'ULOTLAR BO'LIMI*\n\n` +
      `▫️ Mashg'ulot joyi: *${locText}*\n` +
      `▫️ Haftalik reja: *${user.workout_days || 3} kun*\n` +
      `▫️ Bajarilgan mashg'ulot kunlari: *${stats.workout_days_count} kun*\n\n` +
      `Quyidagi tugmalardan birini tanlang:`;

    await ctx.replyWithMarkdown(msg, mainKeyboards.getWorkoutMenu());
  },

  /**
   * 📋 Haftalik mashg'ulot dasturi
   */
  async showWeeklyPlan(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) {
      return ctx.reply("Avval profilingizni to'ldiring.");
    }

    const plan = workoutService.generatePlan(user);

    let text = `🏋️ *${plan.title}*\n\n_${plan.description}_\n\n`;

    for (const d of plan.days) {
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📌 *${d.dayName}*\n`;
      if (d.exercises.length === 0) {
        text += `_Faol dam olish: yengil piyoda yurish yoki cho'zilish mashqlari._\n\n`;
        continue;
      }

      for (const ex of d.exercises) {
        text += `▫️ *${ex.name}*\n`;
        text += `   Sets: ${ex.sets} | Reps: ${ex.reps} | Dam olish: ${ex.rest}\n`;
        text += `   💡 _${ex.tip}_\n`;
      }
      text += `\n`;
    }

    text += `⚠️ *Xavfsizlik eslatmasi:*\n`;
    text += `_Mashqdan oldin albatta 5-10 daqiqa qizining (razminka). Agar biron joyingizda o'tkir og'riq sezsangiz, mashqni darhol to'xtating._`;

    await ctx.replyWithMarkdown(text, mainKeyboards.getWorkoutMenu());
  },

  /**
   * ✍️ Mashq natijasini kiritishni boshlash
   */
  async promptLogExercise(ctx) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    if (!user) {
      return ctx.reply("Avval profilingizni to'ldiring.");
    }

    sessionManager.setState(telegramId, 'AWAITING_WORKOUT_LOG', { userId: user.id });

    const msg =
      `✍️ *MASHQ NATIJASINI YOZIB BORISH*\n\n` +
      `Bugungi mashqingizni quyidagi formatda yuboring:\n` +
      `*[Mashq nomi] [Vazn] [Podxod] [Takrorlash]*\n\n` +
      `Misollar:\n` +
      `• _Bench press 60kg 4 sets 10 reps_\n` +
      `• _Otjimaniya 0kg 3 sets 15 reps_\n` +
      `• _Prisidaniya 80kg 4 sets 8 reps_`;

    await ctx.replyWithMarkdown(msg, mainKeyboards.getBackAndHome());
  },

  /**
   * Mashq natijasi matnini tahlil qilish va bazaga yozish
   */
  async handleLogExerciseText(ctx, text) {
    const telegramId = ctx.from.id;
    const user = await userRepository.findByTelegramId(telegramId);

    // Oddiy regex / parsing orqali mashq, vazn, sets, reps ajratish
    // Misol: Bench press 60kg 4 10 yoki Otjimaniya 3 sets 15 reps
    const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/i);
    const setsMatch = text.match(/(\d+)\s*(?:sets|podxod|set)/i);
    const repsMatch = text.match(/(\d+)\s*(?:reps|marta|takror)/i);

    const weight = weightMatch ? Number(weightMatch[1]) : 0;
    const sets = setsMatch ? Number(setsMatch[1]) : 3;
    const reps = repsMatch ? Number(repsMatch[1]) : 10;

    // Mashq nomini tozalash
    let exerciseName = text
      .replace(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/gi, '')
      .replace(/(\d+)\s*(?:sets|podxod|set)/gi, '')
      .replace(/(\d+)\s*(?:reps|marta|takror)/gi, '')
      .trim();

    if (!exerciseName || exerciseName.length < 2) {
      exerciseName = 'Mashg\'ulot';
    }

    await workoutRepository.logExercise(user.id, exerciseName, sets, reps, weight);
    sessionManager.clearState(telegramId);

    const successMsg =
      `✅ *Mashq muvaffaqiyatli qayd etildi!*\n\n` +
      `🏋️ *Mashq:* ${exerciseName}\n` +
      `▫️ *Vazn:* ${weight > 0 ? weight + ' kg' : 'O\'z tana vazni'}\n` +
      `▫️ *Sets & Reps:* ${sets} × ${reps}\n\n` +
      `Ajoyib natija! Intizom bilan davom eting! 💪`;

    await ctx.replyWithMarkdown(successMsg, mainKeyboards.getWorkoutMenu());
  },
};
