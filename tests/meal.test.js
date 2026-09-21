import test from 'node:test';
import assert from 'node:assert';
import { initDatabase, closeDatabase } from '../src/database/index.js';
import { userRepository } from '../src/database/repositories/userRepository.js';
import { mealRepository } from '../src/database/repositories/mealRepository.js';

test('Meal repository logs food, calculates totals and syncs nutrition', async () => {
  await initDatabase();

  const testTelegramId = 999999992;
  await userRepository.deleteByTelegramId(testTelegramId);
  const user = await userRepository.create({
    telegramId: testTelegramId,
    name: 'Food Test User',
    age: 24,
    gender: 'male',
    height: 175,
    weight: 75,
    activityLevel: 'moderate',
    goal: 'weight_loss',
  });

  const today = new Date().toISOString().split('T')[0];

  // 1-taom: Tovuq va guruch (450 kcal)
  await mealRepository.logMeal({
    userId: user.id,
    date: today,
    dishName: 'Tovuq va guruch',
    portionGrams: 300,
    calories: 450,
    protein: 35,
    carbs: 50,
    fat: 10,
  });

  // 2-taom: Grek salati (200 kcal)
  await mealRepository.logMeal({
    userId: user.id,
    date: today,
    dishName: 'Grek salati',
    portionGrams: 200,
    calories: 200,
    protein: 5,
    carbs: 10,
    fat: 15,
  });

  // Totals tekshirish
  const totals = await mealRepository.getTodayTotals(user.id, today);
  assert.strictEqual(totals.mealCount, 2);
  assert.strictEqual(totals.totalCalories, 650);
  assert.strictEqual(totals.totalProtein, 40);
  assert.strictEqual(totals.totalCarbs, 60);
  assert.strictEqual(totals.totalFat, 25);

  const meals = await mealRepository.getTodayMeals(user.id, today);
  assert.strictEqual(meals.length, 2);
  assert.strictEqual(meals[0].dish_name, 'Tovuq va guruch');

  // Tozalash
  await userRepository.deleteByTelegramId(testTelegramId);
  await closeDatabase();
});
