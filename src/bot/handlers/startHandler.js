import { userRepository } from '../../database/repositories/userRepository.js';
import { fitnessCalculator } from '../../services/fitnessCalculator.js';
import { mainKeyboards } from '../keyboards/mainKeyboards.js';
import { formatter } from '../../utils/formatter.js';
import { sessionManager } from '../session.js';

export async function handleStart(ctx) {
  const telegramId = ctx.from.id;
  const user = await userRepository.findByTelegramId(telegramId);

  sessionManager.clearState(telegramId);

  if (user && user.weight && user.height && user.goal) {
    // Foydalanuvchi allaqachon to'liq ro'yxatdan o'tgan
    const plan = fitnessCalculator.calculatePlan({
      weight: user.weight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activity_level,
      goal: user.goal,
    });

    const welcomeMsg =
      `Assalomu alaykum, *${user.name || ctx.from.first_name}*! 💪\n\n` +
      `Sizning AI Fitness profilingiz faol.\n` +
      `Kunlik kaloriya maqsadingiz: *${plan.targetCalories} kcal*.\n\n` +
      `Kerakli bo'limni tanlang:`;

    await ctx.replyWithMarkdown(welcomeMsg, mainKeyboards.getMainMenu());
  } else {
    // Yangi foydalanuvchi yoki profil to'liq emas
    const greeting =
      `Assalomu alaykum! 💪\n` +
      `Men sizga vazn tashlash, mushak qurish va tana kompozitsiyasini yaxshilashda yordam beradigan *AI Fitness Assistant*man.\n\n` +
      `Boshlash uchun profilingizni yaratamiz.\n\n` +
      `1-qadam: Iltimos, *ismingizni* kiriting:`;

    sessionManager.setState(telegramId, 'ONBOARDING_NAME', {
      telegramId,
      name: ctx.from.first_name || '',
    });

    await ctx.replyWithMarkdown(greeting, mainKeyboards.getHomeOnly());
  }
}
