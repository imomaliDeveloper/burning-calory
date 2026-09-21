import test from 'node:test';
import assert from 'node:assert';
import { fitnessCalculator } from '../src/services/fitnessCalculator.js';

test('BMR calculation for male', () => {
  // 80kg, 180cm, 25 years old, male:
  // 10*80 + 6.25*180 - 5*25 + 5 = 800 + 1125 - 125 + 5 = 1805
  const bmr = fitnessCalculator.calculateBMR(80, 180, 25, 'male');
  assert.strictEqual(bmr, 1805);
});

test('BMR calculation for female', () => {
  // 60kg, 165cm, 28 years old, female:
  // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
  const bmr = fitnessCalculator.calculateBMR(60, 165, 28, 'female');
  assert.strictEqual(bmr, 1330);
});

test('TDEE calculation with moderate activity', () => {
  // BMR = 1805, moderate = 1.55 -> 2797.75 -> 2798
  const tdee = fitnessCalculator.calculateTDEE(1805, 'moderate');
  assert.strictEqual(tdee, 2798);
});

test('Plan calculation for weight loss ensures safe floor and macros', () => {
  const plan = fitnessCalculator.calculatePlan({
    weight: 80,
    height: 180,
    age: 25,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'weight_loss',
  });

  assert.ok(plan.targetCalories < plan.tdee);
  assert.ok(plan.targetCalories >= 1500);
  assert.ok(plan.macros.protein > 0);
  assert.ok(plan.macros.fat > 0);
  assert.ok(plan.macros.carbs > 0);
  // Protein for 80kg weight loss = 80 * 2.2 = 176g
  assert.strictEqual(plan.macros.protein, 176);
});
