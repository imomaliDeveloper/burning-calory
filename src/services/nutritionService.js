/**
 * Ovqatlanish va Taomnoma xizmati
 * Kunlik kaloriya va makrolarga mos muvozanatli ovqatlanish variantlarini taqdim etadi.
 */

export const nutritionService = {
  /**
   * Kunlik kaloriya va makrolarga mos to'liq kunlik taomnoma taklifi
   */
  generateDailyMealPlan(targetCalories, macros, goal = 'weight_loss') {
    // Kaloriyalarni taqsimlash:
    // Nonushta: ~25%, Tushlik: ~35%, Kechki ovqat: ~25%, Snack: ~15%
    const cals = Math.round(targetCalories);
    const p = Math.round(macros.protein);
    const c = Math.round(macros.carbs);
    const f = Math.round(macros.fat);

    const breakfastCals = Math.round(cals * 0.25);
    const lunchCals = Math.round(cals * 0.35);
    const dinnerCals = Math.round(cals * 0.25);
    const snackCals = Math.round(cals * 0.15);

    return {
      dailyTarget: {
        calories: cals,
        protein: p,
        carbs: c,
        fat: f,
      },
      meals: [
        {
          name: '🍳 NONUSHTA (Energiya va Oqsil)',
          calories: breakfastCals,
          protein: Math.round(p * 0.25),
          carbs: Math.round(c * 0.25),
          fat: Math.round(f * 0.3),
          options: [
            "3 ta tuxum (2 ta butun, 1 ta oqi) bilan qovurilgan omlet + 50g suli yormasi (ovsyanka) suvda/yog'siz sutda + 1 choy qoshiq asal va rezavor mevalar.",
            "Muqobil: 150g kam yog'li tvorog + 1 dona banan + 20g bodom yoki yong'oq + qora kofe/ko'k choy.",
          ],
        },
        {
          name: '🍗 TUSHLIK (Asosiy Qayta Tiklanish)',
          calories: lunchCals,
          protein: Math.round(p * 0.35),
          carbs: Math.round(c * 0.4),
          fat: Math.round(f * 0.3),
          options: [
            "180g pishirilgan tovuq filesi (yoki mol go'shti) + 150g qaynatilgan guruch/grechka + zaytun moyi quyilgan barra sabzavotli salat (bodring, pomidor, ko'katlar).",
            "Muqobil: 200g baliq (sudak yoki losos) + qaynatilgan kartoshka (200g) + brokkoli yoki dimlangan sabzavotlar.",
          ],
        },
        {
          name: '🥗 KECHKI OVQAT (Yengil va Oqsilga Boy)',
          calories: dinnerCals,
          protein: Math.round(p * 0.25),
          carbs: Math.round(c * 0.2),
          fat: Math.round(f * 0.25),
          options: [
            "150g grilda yoki bug'da pishirilgan kurka/tovuq filesi + katta portsiyada yashil salat (ismaloq, rukola, bodring) + 1 osh qoshiq zaytun moyi.",
            "Muqobil: 150g yog'siz tvorog + bodring va ko'katlar bilan aralashtirilgan yengil sous yoki 3 ta qaynatilgan tuxum oqi va sabzavotlar.",
          ],
        },
        {
          name: '🍎 SNACK (Oraliq tamaddi)',
          calories: snackCals,
          protein: Math.round(p * 0.15),
          carbs: Math.round(c * 0.15),
          fat: Math.round(f * 0.15),
          options: [
            "1 dona olma yoki nok + 25g yong'oq (bodom/yong'oq) yoki 1 stakan kam yog'li kefir.",
            "Muqobil: 1 porsiya proteinli kokteyl (whey protein) yoki 1 ta qaynatilgan tuxum + pomidor.",
          ],
        },
      ],
      waterRecommendation: `${+(targetCalories * 0.0015).toFixed(1)} – ${+(targetCalories * 0.002).toFixed(1)} litr toza suv`,
    };
  },
};
