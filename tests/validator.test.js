import test from 'node:test';
import assert from 'node:assert';
import { validator } from '../src/utils/validator.js';

test('validator checks age ranges correctly', () => {
  assert.strictEqual(validator.isValidAge(25), true);
  assert.strictEqual(validator.isValidAge('30'), true);
  assert.strictEqual(validator.isValidAge(10), false);
  assert.strictEqual(validator.isValidAge(105), false);
  assert.strictEqual(validator.isValidAge('abc'), false);
});

test('validator checks height and weight bounds', () => {
  assert.strictEqual(validator.isValidHeight(175), true);
  assert.strictEqual(validator.isValidHeight(50), false);
  assert.strictEqual(validator.isValidWeight(75.5), true);
  assert.strictEqual(validator.isValidWeight(20), false);
});

test('validator checks goal and activity level enums', () => {
  assert.strictEqual(validator.isValidGoal('weight_loss'), true);
  assert.strictEqual(validator.isValidGoal('invalid_goal'), false);
  assert.strictEqual(validator.isValidActivityLevel('moderate'), true);
  assert.strictEqual(validator.isValidActivityLevel('super_fast'), false);
});
