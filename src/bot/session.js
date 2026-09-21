/**
 * In-memory / State Session menejeri
 * Foydalanuvchilarning bosqichma-bosqich jarayonlarini (Wizards / FSM) boshqaradi.
 */

const userStates = new Map();

export const sessionManager = {
  /**
   * Foydalanuvchi holatini olish
   */
  getState(userId) {
    return userStates.get(String(userId)) || null;
  },

  /**
   * Foydalanuvchi holatini o'rnatish
   */
  setState(userId, step, data = {}) {
    userStates.set(String(userId), {
      step,
      data,
      updatedAt: Date.now(),
    });
  },

  /**
   * Foydalanuvchi holatidagi ma'lumotlarni qisman yangilash
   */
  updateData(userId, partialData = {}) {
    const current = this.getState(userId) || { step: null, data: {} };
    userStates.set(String(userId), {
      ...current,
      data: { ...current.data, ...partialData },
      updatedAt: Date.now(),
    });
  },

  /**
   * Foydalanuvchi holatini tozalash (bekor qilish)
   */
  clearState(userId) {
    userStates.delete(String(userId));
  },
};
