/**
 * Workout generator xizmati
 * Foydalanuvchi maqsadi, joylashuvi (Uy yoki Zal) va haftalik kunlariga qarab
 * moslashtirilgan professional mashg'ulot dasturini taqdim etadi.
 */

export const workoutService = {
  /**
   * Foydalanuvchi parametrlariga mos mashg'ulot dasturi yaratish
   */
  generatePlan(user) {
    const isHome = user.workout_location === 'home';
    const days = Math.min(Math.max(Number(user.workout_days) || 3, 2), 6);
    const goal = user.goal || 'build_muscle';

    if (isHome) {
      return this.getHomePlan(days, goal);
    } else {
      return this.getGymPlan(days, goal);
    }
  },

  /**
   * UY SHAROITIDAGI DASTURLAR (Gym jihozlarisiz)
   */
  getHomePlan(days, goal) {
    const repsTarget = goal === 'weight_loss' ? '12–15' : goal === 'strength' ? '8–12' : '10–15';
    const restSec = goal === 'weight_loss' ? '45-60 soniya' : '60-90 soniya';

    if (days <= 3) {
      return {
        title: `🏠 Uy Sharoiti: Butun Tana (Full Body) — ${days} kunlik dastur`,
        description: "Ushbu dastur o'z tana vazningiz yordamida barcha asosiy mushaklarni rivojlantirish va kaloriya yoqishga qaratilgan.",
        days: [
          {
            dayName: '1-KUN: Full Body A (Asosiy tana)',
            exercises: [
              { name: "Otjimaniya (Push-ups)", sets: '3–4', reps: repsTarget, rest: restSec, tip: "Gavdani to'g'ri tuting, tirsaklarni 45 gradus burchakda buking." },
              { name: "Prisidaniya (Air Squats)", sets: '4', reps: '15–20', rest: restSec, tip: "Tizzalar oyoq uchi yo'nalishida, orqani to'g'ri tuting." },
              { name: "Polda orqa tortish (Floor Pull / Doorframe Row)", sets: '3', reps: '12–15', rest: restSec, tip: "Kuraklarni bir-biriga yaqinlashtirib orqa mushaklarini siqing." },
              { name: "Yelka otjimaniyasi (Pike Push-ups)", sets: '3', reps: '8–12', rest: restSec, tip: "To'ntarilgan V shaklini hosil qiling, yelkalarni ishlatish uchun." },
              { name: "Planka (Plank)", sets: '3', reps: '40–60 soniya', rest: '45 soniya', tip: "Qorinni ichga tortib, tanani bir tekis chiziqda ushlang." },
            ],
          },
          {
            dayName: '2-KUN: Full Body B (Kuch va chidamlilik)',
            exercises: [
              { name: "Oyoqlarni orqaga tashlash (Reverse Lunges)", sets: '3', reps: '12 har bir oyoqqa', rest: restSec, tip: "Oldingi tizza 90 gradus burchak ostida bo'lsin." },
              { name: "Keng qo'l bilan otjimaniya (Wide Push-ups)", sets: '3', reps: repsTarget, rest: restSec, tip: "Ko'krak mushaklarining tashqi qismini chuqurroq cho'zing." },
              { name: "Yondosh ko'prik (Glute Bridge)", sets: '4', reps: '15–20', rest: restSec, tip: "Tepada dumba mushaklarini 2 soniya qisib ushlang." },
              { name: "Stulda orqa otjimaniya (Chair Tricep Dips)", sets: '3', reps: '10–12', rest: restSec, tip: "Tirsaklar to'g'ri orqaga qaragan bo'lsin." },
              { name: "Velosiped press (Bicycle Crunches)", sets: '3', reps: '20 jami', rest: '45 soniya', tip: "Tirsakni qarama-qarshi tizzaga yetkazishda qorinni buking." },
            ],
          },
          ...(days >= 3 ? [{
            dayName: '3-KUN: Full Body C (Dinamik va Kardiomashq)',
            exercises: [
              { name: "Alpinist mashqi (Mountain Climbers)", sets: '3', reps: '30–40 soniya', rest: '45 soniya', tip: "Tez va ritmik ravishda tizzalarni ko'krakka torting." },
              { name: "Brilliant otjimaniya (Diamond Push-ups)", sets: '3', reps: '8–10', rest: restSec, tip: "Triseps va ko'krak o'rtasiga yuqori yuklama beradi." },
              { name: "Sakrab prisidaniya qilish (Jump Squats)", sets: '3', reps: '12–15', rest: restSec, tip: "Yumshoq qo'ning, oyoq portlovchi kuchini oshiradi." },
              { name: "Superman mashqi (Orqa uchun)", sets: '3', reps: '15', rest: '45 soniya', tip: "Qorin bilan yotib qo'l va oyoqlarni bir vaqtda yuqoriga ko'taring." },
              { name: "Yonbosh planka (Side Plank)", sets: '3', reps: '30 soniya har tomonga', rest: '45 soniya', tip: "Yon qorin (obliques) mushaklarini mustahkamlaydi." },
            ],
          }] : []),
        ],
      };
    } else {
      // 4-5 kunlik uy dasturi (Yuqori tana / Quyi tana split)
      return {
        title: `🏠 Uy Sharoiti: Upper / Lower Split — ${days} kunlik dastur`,
        description: "Haftada 4-5 kunlik chuqurlashtirilgan mashg'ulotlar: yuqori va pastki tana alohida ishlanadi.",
        days: [
          {
            dayName: '1-KUN: Yuqori Tana (Ko\'krak, Yelka, Qo\'l)',
            exercises: [
              { name: "Klassik otjimaniya", sets: '4', reps: repsTarget, rest: restSec, tip: "Ko'krak mushaklarini to'liq qisqartiring." },
              { name: "Pike Push-ups (Yelka uchun)", sets: '3', reps: '10–12', rest: restSec, tip: "Boshingizni qo'llar o'rtasiga ohista tushiring." },
              { name: "Triseps uchun stulda dips", sets: '3', reps: '12–15', rest: restSec, tip: "Gavdani stulga yaqin tuting." },
              { name: "Eshik orqali tortilish (Doorway Rows)", sets: '3', reps: '12–15', rest: restSec, tip: "Kuraklarni qisib orqani ishga soling." },
              { name: "Planka", sets: '3', reps: '45 soniya', rest: '45 soniya', tip: "Gavda to'g'ri chiziqda." },
            ],
          },
          {
            dayName: '2-KUN: Quyi Tana va Qorin (Oyoq va Kor)',
            exercises: [
              { name: "Prisidaniya (Air Squats)", sets: '4', reps: '20', rest: restSec, tip: "Tovonga tayaning." },
              { name: "Lunges (Qadam tashlash)", sets: '3', reps: '12 har bir oyoqqa', rest: restSec, tip: "Gavdani tik tuting." },
              { name: "Glute Bridges (Dumba ko'tarish)", sets: '4', reps: '15', rest: restSec, tip: "Tepada qisib ushlang." },
              { name: "Buzoq mushaklari (Calf Raises)", sets: '4', reps: '25', rest: '45 soniya', tip: "Barmoq uchlariga maksimal ko'tariling." },
              { name: "Velosiped press (Abdominal)", sets: '3', reps: '20', rest: '45 soniya', tip: "Sekin va nazorat ostida." },
            ],
          },
          {
            dayName: '3-KUN: Dam olish yoki yengil cho\'zilish',
            exercises: [],
          },
          {
            dayName: '4-KUN: Yuqori Tana (Orqa, Ko\'krak, Triseps)',
            exercises: [
              { name: "Keng qo'l bilan otjimaniya", sets: '4', reps: repsTarget, rest: restSec, tip: "Ko'krak qafasini kengaytirish." },
              { name: "Polda suzish (Swimmer back pulls)", sets: '3', reps: '15', rest: restSec, tip: "Orqa va bel mushaklari." },
              { name: "Olmos otjimaniya (Diamond)", sets: '3', reps: '8–10', rest: restSec, tip: "Triseps kuchi." },
              { name: "Ko'krakka tizzani tortish (Mountain climbers)", sets: '3', reps: '30 soniya', rest: '45 soniya', tip: "Yurak urishini tezlashtirish." },
            ],
          },
          {
            dayName: '5-KUN: Quyi Tana va Dinamik Kardio',
            exercises: [
              { name: "Bolgarcha bir oyoqda prisidaniya (Bulgarian Split Squat)", sets: '3', reps: '10 har bir oyoqqa', rest: restSec, tip: "Bir oyoq stulda orqada." },
              { name: "Keng oyoqli Sumo prisidaniya", sets: '4', reps: '15–20', rest: restSec, tip: "Sonning ichki qismini ishlatadi." },
              { name: "Burpee (Kardiomashq)", sets: '3', reps: '10–12', rest: '60 soniya', tip: "Maksimal kaloriya sarfi." },
              { name: "Planka dinamik (qo'l-oyoq ko'tarish)", sets: '3', reps: '40 soniya', rest: '45 soniya', tip: "Muvozanat va kor kuchi." },
            ],
          },
        ],
      };
    }
  },

  /**
   * ZAL SHAROITIDAGI DASTURLAR (Gym jihozlari bilan)
   */
  getGymPlan(days, goal) {
    const isStrength = goal === 'strength';
    const repsCompound = isStrength ? '5–8' : '8–12';
    const repsIsolation = isStrength ? '8–10' : '10–15';
    const restCompound = isStrength ? '2–3 daqiqa' : '90 soniya';
    const restIso = '60 soniya';

    if (days <= 3) {
      // 3 kunlik Push / Pull / Legs yoki Full Body
      return {
        title: `🏋️ Zal Sharoiti: 3 Kunlik Push / Pull / Legs klassik dastur`,
        description: "Mushak massasini oshirish va kuchni rivojlantirish uchun eng samarali fitnes dasturi.",
        days: [
          {
            dayName: '1-KUN: PUSH (Ko\'krak, Old Yelka, Triseps)',
            exercises: [
              { name: "Bench Press (Gorizontal shtanga yotib)", sets: '4', reps: repsCompound, rest: restCompound, tip: "Tirsaklar tanaga 75 gradus, shtanga ko'krak o'rtasiga tushsin." },
              { name: "Incline Dumbbell Press (Qiya gantel ko'tarish)", sets: '3', reps: '8–12', rest: '90 soniya', tip: "Skameyka burchagi 30 gradus, yuqori ko'krakka fokus." },
              { name: "Overhead Dumbbell/Barbell Press (Yelka press)", sets: '3', reps: '8–10', rest: '90 soniya', tip: "Yelkani to'liq cho'zib, yuqoriga chiqaring." },
              { name: "Cable Flyes (Krosshoverda ko'krak siqish)", sets: '3', reps: repsIsolation, rest: restIso, tip: "Har bir harakat oxirida ko'krakni 1 soniya siqib turing." },
              { name: "Triceps Rope Pushdown (Blokda arqon bilan triseps)", sets: '3', reps: '10–12', rest: restIso, tip: "Tirsaklar qimirlamasin, faqat bilak harakatlansin." },
            ],
          },
          {
            dayName: '2-KUN: PULL (Orqa, Orqa Yelka, Biseps)',
            exercises: [
              { name: "Lat Pulldown yoki Turnikda tortilish", sets: '4', reps: repsCompound, rest: restCompound, tip: "Ko'krakni oldinga chiqarib, shtangani ko'krak tepasiga torting." },
              { name: "Barbell/Dumbbell Row (Egilgan holda tortish)", sets: '4', reps: '8–10', rest: '90 soniya', tip: "Orqani to'g'ri tuting, kuraklarni bir-biriga yaqinlashtiring." },
              { name: "Seated Cable Row (Gorizontal blokda orqa)", sets: '3', reps: '10–12', rest: restIso, tip: "Tirsaklarni tanaga yaqin torting." },
              { name: "Face Pulls (Krosshoverda yuzga tortish)", sets: '3', reps: '12–15', rest: restIso, tip: "Orqa yelka va qad-qomat (posture) uchun ideal." },
              { name: "Barbell/Dumbbell Bicep Curls (Biseps egish)", sets: '3', reps: '10–12', rest: restIso, tip: "Tebranishsiz, toza kuch bilan bajaring." },
            ],
          },
          {
            dayName: '3-KUN: LEGS & ABS (Oyoqlar va Qorin)',
            exercises: [
              { name: "Barbell Back Squat (Shtanga bilan prisidaniya)", sets: '4', reps: repsCompound, rest: restCompound, tip: "Tovonga tayaning, tizzalar tashqariga yo'naltirilgan bo'lsin." },
              { name: "Romanian Deadlift (Shtanga/Gantel bilan orqa son)", sets: '3', reps: '8–10', rest: '90 soniya', tip: "Tizzalarni biroz buking, tos suyagini orqaga suring." },
              { name: "Leg Press (Trenajyorda oyoq bilan itarish)", sets: '3', reps: '10–12', rest: '90 soniya', tip: "Tizzalarni oxirigacha qulflamang (xavfsizlik)." },
              { name: "Leg Extension yoki Leg Curl (Son ajratish)", sets: '3', reps: repsIsolation, rest: restIso, tip: "To'xtovsiz nazorat bilan bajaring." },
              { name: "Turnikda osilib oyoq ko'tarish (Hanging Leg Raises)", sets: '3', reps: '12–15', rest: restIso, tip: "Pastki qorin mushaklarini tortish." },
            ],
          },
        ],
      };
    } else {
      // 4-5 kunlik Upper / Lower yoki Bro-split
      return {
        title: `🏋️ Zal Sharoiti: Upper / Lower Power & Hypertrophy — ${days} kunlik dastur`,
        description: "Haftada 4-5 kunlik professional sportchilar darajasidagi kuch va mushak o'sishi dasturi.",
        days: [
          {
            dayName: '1-KUN: Upper Body A (Kuch: Ko\'krak va Orqa)',
            exercises: [
              { name: "Barbell Bench Press", sets: '4', reps: repsCompound, rest: restCompound, tip: "Og'ir va nazoratli harakat." },
              { name: "Bent-Over Barbell Row", sets: '4', reps: repsCompound, rest: restCompound, tip: "Keng orqa mushaklari uchun." },
              { name: "Overhead Military Press", sets: '3', reps: '6–8', rest: restCompound, tip: "Yelka kuchi." },
              { name: "Incline Dumbbell Curls (Biseps)", sets: '3', reps: '10', rest: restIso, tip: "Biseps uzun kallasini cho'zish." },
              { name: "Skull Crushers (Triseps yotib)", sets: '3', reps: '10', rest: restIso, tip: "Tirsaklarni mahkam ushlang." },
            ],
          },
          {
            dayName: '2-KUN: Lower Body A (Kuch: Kvadriseps va Son)',
            exercises: [
              { name: "Barbell Back Squat", sets: '4', reps: repsCompound, rest: restCompound, tip: "Maksimal barqarorlik." },
              { name: "Romanian Deadlift", sets: '4', reps: '8–10', rest: restCompound, tip: "Orqa son va dumba." },
              { name: "Bulgarian Split Squat gantel bilan", sets: '3', reps: '8 har oyoqqa', rest: '90 soniya', tip: "Bir tomonlama muvozanat." },
              { name: "Standing Calf Raises (Buzoqlarga)", sets: '4', reps: '15', rest: restIso, tip: "Tepada 2 soniya to'xtang." },
            ],
          },
          {
            dayName: '3-KUN: Dam olish',
            exercises: [],
          },
          {
            dayName: '4-KUN: Upper Body B (Gipertrofiya va Detallar)',
            exercises: [
              { name: "Incline Dumbbell Press", sets: '4', reps: '10–12', rest: '90 soniya', tip: "Ko'krak tepasi." },
              { name: "Lat Pulldown neytral ushlash", sets: '4', reps: '10–12', rest: '90 soniya', tip: "Orqani maksimal qisish." },
              { name: "Dumbbell Lateral Raises (Yonbosh yelka)", sets: '4', reps: '12–15', rest: restIso, tip: "Keng yelkalar shakllantirish." },
              { name: "Cable Tricep Pushdown", sets: '3', reps: '12', rest: restIso, tip: "Triseps qisqarishi." },
              { name: "Hammer Curls (Gantelli biseps)", sets: '3', reps: '12', rest: restIso, tip: "Qo'l qalinligini oshirish." },
            ],
          },
          {
            dayName: '5-KUN: Lower Body B & Core (Oyoqlar va Qorin)',
            exercises: [
              { name: "Leg Press trenajyorda", sets: '4', reps: '12–15', rest: '90 soniya', tip: "Oyoqlarni qon bilan to'ldirish." },
              { name: "Lying Leg Curls (Yotib oyoq bukish)", sets: '3', reps: '12', rest: restIso, tip: "Biceps femoris izolatsiyasi." },
              { name: "Walking Lunges gantellar bilan", sets: '3', reps: '12 har oyoqqa', rest: '90 soniya', tip: "Funktsional oyoq kuchi." },
              { name: "Ab Wheel yoki Osilib oyoq ko'tarish", sets: '3', reps: '12–15', rest: restIso, tip: "Chelikdek qorin pressi." },
            ],
          },
        ],
      };
    }
  },
};
