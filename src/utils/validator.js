/**
 * Kiritilgan ma'lumotlarni tekshirish (Validation)
 */

export const validator = {
  isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 50;
  },

  isValidAge(age) {
    const num = Number(age);
    return Number.isInteger(num) && num >= 14 && num <= 100;
  },

  isValidGender(gender) {
    return ['male', 'female'].includes(gender);
  },

  isValidHeight(height) {
    const num = Number(height);
    return !isNaN(num) && num >= 100 && num <= 250;
  },

  isValidWeight(weight) {
    const num = Number(weight);
    return !isNaN(num) && num >= 30 && num <= 300;
  },

  isValidWaist(waist) {
    const num = Number(waist);
    return !isNaN(num) && num >= 40 && num <= 200;
  },

  isValidActivityLevel(level) {
    return ['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(level);
  },

  isValidGoal(goal) {
    return ['weight_loss', 'build_muscle', 'recomposition', 'strength'].includes(goal);
  },

  isValidWorkoutLocation(loc) {
    return ['home', 'gym'].includes(loc);
  },

  isValidWorkoutDays(days) {
    const num = Number(days);
    return Number.isInteger(num) && num >= 1 && num <= 7;
  },
};
