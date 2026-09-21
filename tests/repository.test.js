import test from 'node:test';
import assert from 'node:assert';
import { initDatabase, closeDatabase } from '../src/database/index.js';
import { userRepository } from '../src/database/repositories/userRepository.js';
import { progressRepository } from '../src/database/repositories/progressRepository.js';
import { workoutRepository } from '../src/database/repositories/workoutRepository.js';
import { analysisRepository } from '../src/database/repositories/analysisRepository.js';
import { nutritionRepository } from '../src/database/repositories/nutritionRepository.js';

test('Database repositories full lifecycle test', async () => {
  await initDatabase();

  const testTelegramId = 999999991;
  await userRepository.deleteByTelegramId(testTelegramId);

  // 1. Create user
  const user = await userRepository.create({
    telegramId: testTelegramId,
    name: 'Test Foydalanuvchi',
    age: 26,
    gender: 'male',
    height: 180,
    weight: 82.5,
    activityLevel: 'moderate',
    goal: 'weight_loss',
    workoutLocation: 'gym',
    workoutDays: 4,
  });

  assert.ok(user);
  assert.strictEqual(user.name, 'Test Foydalanuvchi');
  assert.strictEqual(Number(user.weight), 82.5);

  // 2. Progress logging
  await progressRepository.create(user.id, 82.5, 88);
  await progressRepository.create(user.id, 80.2, 85);

  const progressData = await progressRepository.getInitialAndLatest(user.id);
  assert.strictEqual(progressData.totalEntries, 2);
  assert.strictEqual(progressData.diffWeight, -2.3);
  assert.strictEqual(progressData.diffWaist, -3);

  // 3. Workout logging
  const wId = await workoutRepository.logExercise(user.id, 'Bench press', 4, 10, 60);
  assert.ok(wId);
  const wHistory = await workoutRepository.getHistoryByUserId(user.id);
  assert.strictEqual(wHistory.length, 1);
  assert.strictEqual(wHistory[0].exercise, 'Bench press');

  // 4. Analysis logging
  const mockAnalysis = {
    is_valid_body_photo: true,
    summary: 'Sinov xulosasi',
    body_composition: 'O\'rtacha tana yog\'i',
  };
  const aId = await analysisRepository.create(user.id, 'file_test_123', mockAnalysis);
  assert.ok(aId);
  const latestAnalysis = await analysisRepository.getLatestByUserId(user.id);
  assert.strictEqual(latestAnalysis.analysis.summary, 'Sinov xulosasi');

  // 5. Nutrition logging
  const nId = await nutritionRepository.log(user.id, 2200, 160, 240, 60);
  assert.ok(nId);
  const todayNutrition = await nutritionRepository.getByDate(user.id);
  assert.strictEqual(todayNutrition.calories, 2200);

  // 6. Privacy: Delete user (Cascade check)
  const deleted = await userRepository.deleteByTelegramId(testTelegramId);
  assert.strictEqual(deleted, true);

  const deletedUser = await userRepository.findByTelegramId(testTelegramId);
  assert.strictEqual(deletedUser, null);

  const remainingProgress = await progressRepository.getHistoryByUserId(user.id);
  assert.strictEqual(remainingProgress.length, 0);

  await closeDatabase();
});
