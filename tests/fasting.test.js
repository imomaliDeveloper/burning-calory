import test from 'node:test';
import assert from 'node:assert';
import { fastingService } from '../src/services/fastingService.js';

test('fastingService calculates Suhoor and Iftar splits properly', () => {
  const targetCalories = 2000;
  const macros = { protein: 150, fat: 55, carbs: 225 };

  const fastingPlan = fastingService.generateFastingMealPlan(targetCalories, macros, 'weight_loss');

  assert.strictEqual(fastingPlan.totalCalories, 2000);
  assert.ok(fastingPlan.meals.suhoor);
  assert.ok(fastingPlan.meals.iftar);
  assert.ok(fastingPlan.meals.nightSnack);

  // Suhoor + Iftar + Snack should equal total target calories
  const sumCals =
    fastingPlan.meals.suhoor.calories +
    fastingPlan.meals.iftar.calories +
    fastingPlan.meals.nightSnack.calories;

  assert.strictEqual(sumCals, 2000);
});

test('fastingService provides safe workout splits for Home and Gym', () => {
  const homeUser = { workout_location: 'home' };
  const gymUser = { workout_location: 'gym' };

  const homePlan = fastingService.getFastingWorkoutPlan(homeUser);
  const gymPlan = fastingService.getFastingWorkoutPlan(gymUser);

  assert.ok(homePlan.title.includes('Uy'));
  assert.ok(gymPlan.title.includes('Zal'));
  assert.strictEqual(homePlan.days.length, 3);
  assert.strictEqual(gymPlan.days.length, 3);
  assert.ok(homePlan.safetyRules.length >= 3);
});

test('fastingService returns hydration schedule', () => {
  const water = fastingService.getWaterHydrationSchedule(2200);
  assert.ok(water.targetLiters >= 2.0);
  assert.ok(water.schedule.length >= 4);
  assert.ok(water.goldenRules.length >= 2);
});
