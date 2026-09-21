/**
 * Ramazon va Ro'za Oyi Maxsus Fitness Xizmati (Fasting Service)
 * Ro'za paytida mushak massasini saqlash, to'g'ri kaloriya taqsimoti,
 * chanqamaslik va suvsizlanishning oldini olishga mo'ljallangan.
 */

export const fastingService = {
  /**
   * Saharlik, Iftorlik va Kechki tamaddi taomnomasini yaratish
   */
  generateFastingMealPlan(targetCalories, macros, goal = 'weight_loss') {
    const totalCals = Math.round(targetCalories);
    const p = Math.round(macros.protein);
    const c = Math.round(macros.carbs);
    const f = Math.round(macros.fat);

    // Kaloriya taqsimoti:
    // Saharlik: ~45% (uzoq vaqt quvvat va to'qlik berish uchun)
    // Iftorlik: ~45% (ochlikdan keyin tanani to'ldirish va tiklash)
    // Kechki tiklanish tamaddisi: ~10% (mushaklarni oziqlantirish)
    const suhoorCals = Math.round(totalCals * 0.45);
    const iftarCals = Math.round(totalCals * 0.45);
    const nightSnackCals = Math.round(totalCals * 0.10);

    return {
      totalCalories: totalCals,
      macros: { protein: p, carbs: c, fat: f },
      meals: {
        suhoor: {
          name: "🌙 SAHARLIK (Uzoq vaqt to'q tutuvchi va chanqatmaydigan taomnoma)",
          time: "Bomdod namozi va azonidan 40-50 daqiqa oldin",
          calories: suhoorCals,
          protein: Math.round(p * 0.40),
          carbs: Math.round(c * 0.50),
          fat: Math.round(f * 0.45),
          guideline: "Kun bo'yi chanqamaslik uchun o'ta sho'r, qovurilgan va shirin taomlardan saqlaning.",
          options: [
            "🍳 3 ta tuxum (2 ta butun, 1 ta oqi) + 70g suli yormasi (ovsyanka) suvda yoki kam yog'li sutda + 1 choy qoshiq zig'ir urug'i yoki yong'oq (20g) + 1 dona bodring.",
            "Muqobil: 180g kam yog'li tvorog (kazein oqsili 6-8 soat sekin hazm bo'ladi) + 1 osh qoshiq asal + 1 dona banan + butun donli qora non (50g).",
            "Muqobil: 150g pishirilgan tovuq ko'kragi + 150g qaynatilgan grechka + zaytun moyi qo'shilgan yashil salat.",
          ],
          waterNote: "Saharlik davomida shoshilmasdan 3-4 stakan (0.8 - 1 litr) toza suv iching.",
        },
        iftar: {
          name: "🌅 IFTORLIK (Oshqozonni zo'riqtirmasdan ochish va tiklash)",
          time: "Shom azoni vaqtida",
          calories: iftarCals,
          protein: Math.round(p * 0.45),
          carbs: Math.round(c * 0.40),
          fat: Math.round(f * 0.45),
          phases: [
            {
              step: "1-qadam: Og'iz ochish (Dastlabki 10-15 daqiqa)",
              details: "1-2 dona xurmo (fruktoza va kaliy o'rnini to'ldiradi) + 1-2 stakan iliq suv. 10-15 daqiqa tanaffus (namoz yoki yengil dam).",
            },
            {
              step: "2-qadam: Asosiy Iftorlik taomi",
              details: "Oshqozonga yengil bo'lgan suyuq tovuq sho'rva yoki 200g dimlangan mol/tovuq/baliq go'shti + 150g qaynatilgan guruch/kartoshka pyuresi + barra sabzavotlar (ismaloq, bodring, pomidor).",
            },
          ],
          warning: "Iftorlikda bir zumda juda ko'p yog'li ovqat yoki gazli ichimlik ichishdan saqlaning (jigar va oshqozon zo'riqmasligi uchun).",
        },
        nightSnack: {
          name: "🥛 MASHG'ULOTDAN KEYINGI / KECHKI TAMADDI",
          time: "Xufton/Taroveh yoki mashg'ulotdan 30-40 daqiqa o'tgach",
          calories: nightSnackCals,
          protein: Math.round(p * 0.15),
          carbs: Math.round(c * 0.10),
          fat: Math.round(f * 0.10),
          options: [
            "1 stakan kam yog'li kefir yoki ayron + 1 dona olma yoki 20g yong'oq.",
            "1 porsiya oqsil kokteyli (Whey/Casein protein) yoki 100g tvorog.",
          ],
        },
      },
    };
  },

  /**
   * Ro'za davridagi eng xavfsiz va samarali mashg'ulotlar tartibi
   */
  getFastingWorkoutPlan(user) {
    const isHome = user.workout_location === 'home';
    const locationName = isHome ? "🏠 Uy Sharoitida" : "🏋️ Fitnes Zalida";

    return {
      title: `🌙 Ro'za Rejimi: ${locationName} — Xavfsiz Kuch va Mushak Saqlash Dasturi`,
      bestTimes: [
        {
          time: "⭐ Eng ideal vaqt: Iftorlikdan 1.5 – 2 soat o'tgach",
          desc: "Tana suv va ozuqa bilan to'yingan, qondagi glyukoza me'yorida bo'ladi. Quvvatingiz to'liq yetadi.",
        },
        {
          time: "Muqobil vaqt: Saharlikdan 30 daqiqa oldin (Faqat yengil mashq)",
          desc: "Faqat yengil kardiomashq yoki cho'zilish. Og'ir vazn ko'tarish mutlaqo taqiqlanadi (chunki mashqdan so'ng darhol saharlikda suv ichiladi).",
        },
      ],
      safetyRules: [
        "Mashg'ulot davomiyligi 40-50 daqiqadan oshmasin.",
        "Og'ir bir martalik rekordlar (1RM) qo'yishga urinmang. Ishchi vaznni 70-75% me'yorda ushlang.",
        "Podxodlar (sets) oralig'ida dam olishni 90-120 soniyagacha uzaytiring.",
        "Mashq davomida qultumlab 0.5 - 0.7 litr suv ichib turing.",
      ],
      days: [
        {
          day: "1-KUN: Ko'krak, Yelka va Triseps (Push)",
          exercises: isHome
            ? [
                { name: "Klassik otjimaniya", sets: "3", reps: "10-12", rest: "90 sek" },
                { name: "Pike Push-ups (Yelka)", sets: "3", reps: "8-10", rest: "90 sek" },
                { name: "Stulda orqa otjimaniya (Dips)", sets: "3", reps: "10-12", rest: "90 sek" },
                { name: "Planka", sets: "3", reps: "40 soniya", rest: "60 sek" },
              ]
            : [
                { name: "Bench Press (Shtanga yotib)", sets: "3-4", reps: "8-10", rest: "90-120 sek" },
                { name: "Incline Dumbbell Press", sets: "3", reps: "10", rest: "90 sek" },
                { name: "Dumbbell Shoulder Press", sets: "3", reps: "10", rest: "90 sek" },
                { name: "Cable Tricep Pushdown", sets: "3", reps: "12", rest: "60 sek" },
              ],
        },
        {
          day: "2-KUN: Orqa va Biseps (Pull)",
          exercises: isHome
            ? [
                { name: "Eshik orqali tortilish / Turnik", sets: "3-4", reps: "8-10", rest: "90 sek" },
                { name: "Polda orqa tortish (Floor Rows)", sets: "3", reps: "12", rest: "90 sek" },
                { name: "Superman mashqi (Bel)", sets: "3", reps: "12-15", rest: "60 sek" },
                { name: "Biceps sochiq yoki rezina bilan", sets: "3", reps: "12", rest: "60 sek" },
              ]
            : [
                { name: "Lat Pulldown (Keng orqa)", sets: "3-4", reps: "10", rest: "90 sek" },
                { name: "Seated Cable Row", sets: "3", reps: "10-12", rest: "90 sek" },
                { name: "Face Pulls (Posture va yelka)", sets: "3", reps: "12", rest: "60 sek" },
                { name: "Dumbbell Bicep Curls", sets: "3", reps: "10-12", rest: "60 sek" },
              ],
        },
        {
          day: "3-KUN: Quyi Tana va Qorin (Legs & Core)",
          exercises: isHome
            ? [
                { name: "Air Squats (Prisidaniya)", sets: "3-4", reps: "15", rest: "90 sek" },
                { name: "Reverse Lunges (Qadam tashlash)", sets: "3", reps: "10 har oyoqqa", rest: "90 sek" },
                { name: "Glute Bridge (Dumba ko'tarish)", sets: "3", reps: "15", rest: "60 sek" },
                { name: "Velosiped press (Qorin)", sets: "3", reps: "15", rest: "60 sek" },
              ]
            : [
                { name: "Leg Press trenajyorda", sets: "3-4", reps: "10-12", rest: "90 sek" },
                { name: "Romanian Deadlift gantellar bilan", sets: "3", reps: "10", rest: "90 sek" },
                { name: "Leg Curls (Orqa son)", sets: "3", reps: "12", rest: "60 sek" },
                { name: "Osilib oyoq ko'tarish (Turnikda)", sets: "3", reps: "10-12", rest: "60 sek" },
              ],
        },
      ],
    };
  },

  /**
   * Iftordan Saharlikkacha bo'lgan Suv Iste'mol Qilish Rejasi
   */
  getWaterHydrationSchedule(targetCalories) {
    const recommendedWater = +(targetCalories * 0.0012).toFixed(1); // Ro'za paytida optimal suv me'yori (2.0 - 2.5L)

    return {
      targetLiters: Math.max(2.0, recommendedWater),
      schedule: [
        { time: "🌅 Iftorlik ochilganda", amount: "1-2 stakan (400 ml)", tip: "Iliq suv, shoshilmasdan mayda qultumlar bilan." },
        { time: "🍲 Iftorlik ovqatidan 30 daqiqa o'tgach", amount: "1 stakan (250 ml)", tip: "Hazm jarayonini yaxshilaydi." },
        { time: "🏋️ Mashg'ulot davomida / Tarovehda", amount: "2 stakan (500 ml)", tip: "Mashq oralig'ida qultumlab ichiladi." },
        { time: "🌙 Kechasi soat 22:30 - 23:30", amount: "2 stakan (500 ml)", tip: "Xona haroratidagi suv yoki ko'k choy." },
        { time: "🌙 Saharlikda", amount: "2-3 stakan (600 ml)", tip: "Saharlik tugaguncha bo'lib-bo'lib ichiladi." },
      ],
      goldenRules: [
        "Bitta vaqtning o'zida 1 litr suv ichib yubormang (organizm o'zlashtira olmay buyraklarga zo'riqish beradi).",
        "Muzdek suvdan saqlaning — tomoq va qizilo'ngach spazmini keltirib chiqarishi mumkin.",
        "Qahva va o'tkir qora choyni kamaytiring (ular tanadan suvni haydovchi xususiyatga ega).",
      ],
    };
  },
};
