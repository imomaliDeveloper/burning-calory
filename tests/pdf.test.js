import test from 'node:test';
import assert from 'node:assert';
import { pdfService } from '../src/services/pdfService.js';

test('pdfService generates valid PDF buffer with %PDF- header', async () => {
  const mockUser = {
    name: 'Sardor',
    age: 25,
    gender: 'male',
    height: 180,
    weight: 80,
    activity_level: 'moderate',
    workout_location: 'gym',
    workout_days: 3,
    goal: 'build_muscle',
  };

  const buffer = await pdfService.generatePersonalPlanPdf(mockUser);
  assert.ok(buffer);
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 500);

  // PDF header must start with %PDF-
  const header = buffer.subarray(0, 5).toString('ascii');
  assert.strictEqual(header, '%PDF-');
});
