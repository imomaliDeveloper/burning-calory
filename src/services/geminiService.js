import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let genAI = null;
if (config.geminiApiKey) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
}

export const geminiService = {
  getModel(modelName = null) {
    if (!genAI) {
      if (config.geminiApiKey) {
        genAI = new GoogleGenerativeAI(config.geminiApiKey);
      } else {
        throw new Error('GEMINI_API_KEY sozlanmagan');
      }
    }
    const chosenModel = modelName || config.geminiModel || 'gemini-3.6-flash';
    return genAI.getGenerativeModel({ model: chosenModel });
  },

  /**
   * Yordamchi metod: Avtomatik model chaqirish va ko'p bosqichli fallback (429 Quota & 404)
   */
  async generateWithFallback(callFn) {
    const candidateModels = [
      config.geminiModel || 'gemini-3.6-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
    ];
    const uniqueModels = [...new Set(candidateModels)];

    let lastError = null;
    for (const modelName of uniqueModels) {
      try {
        const model = this.getModel(modelName);
        return await callFn(model);
      } catch (err) {
        lastError = err;
        const isQuotaOrNotFound =
          err.status === 429 ||
          (err.message && (
            err.message.includes('429') ||
            err.message.includes('Quota exceeded') ||
            err.message.includes('Too Many Requests') ||
            err.message.includes('not found') ||
            err.message.includes('404') ||
            err.message.includes('unsupported')
          ));

        if (isQuotaOrNotFound) {
          logger.warn(`[GEMINI] Model ${modelName} bo'yicha cheklov (429/404) yuz berdi. Navbatdagi zaxira model tekshirilmoqda...`);
          continue; // Navbatdagi modelga o'tish
        }
        throw err;
      }
    }
    throw lastError;
  },

  /**
   * Tana rasmini Gemini Vision orqali tahlil qilish (Structured JSON output)
   */
  async analyzeBodyImage(imageBuffer, mimeType = 'image/jpeg', userProfile = {}) {
    try {
      const systemPrompt = `
Siz professional, xolis va ehtiyotkor Fitness AI maslahatchisisiz.
Vazifangiz: Foydalanuvchi yuborgan tana rasmini fitness coaching nuqtai nazaridan ehtiyotkorlik bilan tahlil qilish.

MUHIM QOIDALAR:
1. Aniq tibbiy tashxis QO'YMA. Jarohat yoki patologiyani aniqlashga urinma.
2. Aniq body-fat percentage (yog' foizi) da'vo QILMA (faqat umumiy vizual kuzatuv ber).
3. Faqat rasmda ko'rinadigan umumiy fitness va tana kompozitsiyasi haqida taxminiy va ijobiy kuzatuv ber.
4. Agar rasm sifati juda past, qorong'i yoki tana aniq ko'rinmasa, yoki fitnessga mutlaqo aloqasi bo'lmagan rasm bo'lsa, "is_valid_body_photo": false qilib belgilang.
5. Javobni FAQAT quyidagi JSON formatida qaytar (boshqa hech qanday ortiqcha matnsiz):

{
  "is_valid_body_photo": true,
  "summary": "Umumiy vizual kuzatuv xulosasi",
  "body_composition": "Tana kompozitsiyasi bo'yicha taxminiy kuzatuv",
  "muscle_development": "Ko'rinadigan mushak rivojlanishi darajasi",
  "fat_distribution": "Yog' taqsimoti bo'yicha umumiy kuzatuv",
  "posture_observations": "Qad-qomat (posture) bo'yicha e'tiborga molik vizual holatlar",
  "focus_areas": ["Mashg'ulotda e'tibor berish tavsiya etiladigan mushak guruhlari"],
  "recommendation": "Foydalanuvchi maqsadiga mos keluvchi fitness yo'nalishi bo'yicha tavsiya",
  "disclaimer": "Bu AI tomonidan rasm asosida berilgan taxminiy fitness tahlili. Bu tibbiy tashxis emas."
}

Foydalanuvchi ma'lumotlari:
- Ismi: ${userProfile.name || 'Noma\'lum'}
- Yoshi: ${userProfile.age || 'Noma\'lum'}
- Jinsi: ${userProfile.gender === 'female' ? 'Ayol' : 'Erkak'}
- Bo'yi: ${userProfile.height || 'Noma\'lum'} sm
- Vazni: ${userProfile.weight || 'Noma\'lum'} kg
- Maqsadi: ${userProfile.goal || 'Fitness'}
- Mashg'ulot joyi: ${userProfile.workout_location || 'Zal/Uy'}

Barcha matnlar O'ZBEK TILIDA bo'lsin.
`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      };

      const result = await this.generateWithFallback((model) =>
        model.generateContent([
          systemPrompt,
          imagePart,
          'Iltimos, ushbu fitness rasmini tahlil qiling va yuqoridagi JSON formatida javob bering.',
        ])
      );

      const responseText = result.response.text().trim();
      
      // JSONni ajratib olish (Markdown kod bloklarini tozalash)
      let cleanJson = responseText;
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanJson);
      return parsed;
    } catch (error) {
      logger.error('Gemini Vision tahlilida xatolik:', error);
      throw error;
    }
  },

  /**
   * Ovqat rasmini tahlil qilish (Food Vision AI)
   */
  async analyzeFoodImage(imageBuffer, mimeType = 'image/jpeg') {
    try {
      const systemPrompt = `
Siz professional oziq-ovqat va dietologiya bo'yicha AI mutaxassisisiz.
Vazifangiz: Foydalanuvchi yuborgan taom rasmini vizual tahlil qilib, uning tarkibi, taxminiy porsiya hajmi (gramm) va ozuqaviy qiymatini (Kaloriya, Oqsil, Yog', Uglevod) aniqlash.

QOIDALAR:
1. Agar rasmda hech qanday ovqat, ichimlik yoki yegulik bo'lmasa, "is_food": false qilib belgilang.
2. Agar bir nechta taom bo'lsa, umumiy tovoq/porsiyani jamlab hisoblang.
3. Grammlar va kaloriyalarni real vizual me'yorda taxmin qiling.
4. Javobni FAQAT quyidagi JSON formatida qaytar (boshqa hech qanday ortiqcha matnsiz):

{
  "is_food": true,
  "dish_name": "Taom nomi (masalan: Tovuqli palov va achchiq-chuchuk)",
  "portion_estimate_grams": 350,
  "calories": 520,
  "protein": 32,
  "fat": 18,
  "carbs": 58,
  "ingredients_detected": ["Guruch", "Tovuq go'shti", "Sabzi", "Pomidor", "Zaytun moyi"],
  "health_note": "Taom bo'yicha qisqa, foydali fitness tavsiyasi (masalan: oqsilga boy va yaxshi energiya beradi)"
}

Barcha matnlar O'ZBEK TILIDA bo'lsin.
`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      };

      const result = await this.generateWithFallback((model) =>
        model.generateContent([
          systemPrompt,
          imagePart,
          'Ushbu taom rasmini tahlil qiling va yuqoridagi JSON formatida aniq ma\'lumot bering.',
        ])
      );

      const responseText = result.response.text().trim();
      let cleanJson = responseText;
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(cleanJson);
    } catch (error) {
      logger.error('Food Vision tahlilida xatolik:', error);
      throw error;
    }
  },

  /**
   * AI Coach bilan muloqot
   */
  async askCoach(userMessage, userProfile, chatHistory = []) {
    try {
      const systemPrompt = `
Siz "AI Fitness Coach" — do'stona, ilhomlantiruvchi, bilimdon va xavfsizlikka qat'iy rioya qiluvchi shaxsiy fitness murabbiyisiz.
Siz foydalanuvchiga vazn tashlash, mushak qurish, to'g'ri ovqatlanish va mashq texnikalari bo'yicha yordam berasiz.

FOYDALANUVCHI PROFILI:
- Ismi: ${userProfile.name || 'Foydalanuvchi'}
- Jinsi: ${userProfile.gender === 'female' ? 'Ayol' : 'Erkak'}
- Yoshi: ${userProfile.age || '—'}
- Bo'yi: ${userProfile.height || '—'} sm
- Vazni: ${userProfile.weight || '—'} kg
- Maqsadi: ${userProfile.goal || 'Fitness'}
- Mashg'ulot joyi: ${userProfile.workout_location === 'home' ? 'Uy sharoitida' : 'Fitnes zalida'}
- Haftalik mashg'ulot kunlari: ${userProfile.workout_days || 3} kun
- Ro'za holati: ${userProfile.fasting_mode === 1 ? 'Hozir Ramazon/Ro\'za tutmoqda (Fasting Mode faol)' : 'Odatiy kunlik rejim'}

KO'RSATMALAR:
1. Doimo O'ZBEK TILIDA, do'stona va motivatsion ohangda gapiring.
2. Agar foydalanuvchi Ro'za tutayotgan bo'lsa, mashqni iftorlikdan 1.5-2 soat keyinga tavsiya qiling, saharlikda uzoq to'q tutuvchi ovqatlar (tvorog, tuxum, ovsyanka) va chanqatmaslik usullarini ayting.
3. Foydalanuvchining shaxsiy ko'rsatkichlarini (bo'y, vazn, uy/zal) inobatga olgan holda aniq va amaliy maslahat bering.
4. Agar foydalanuvchi "Bench press 60kg 8 reps qildim" desa, uni olqishlang va keyingi qadamni tavsiya qiling.
5. Agar "Bugun dietani buzdim" desa, tushkunlikka tushmaslikni, bitta ovqat natijani yo'qqa chiqarmasligini va keyingi ovqatdan rejimga qaytishni tushuntiring.
6. Agar "Kecha 80 edim, bugun 81 bo'ldim" desa, suv ushlanishi (water retention), glikogen va tuz sababli vazn o'ynashi odatiy hol ekanligini bildiring.
7. XAVFSIZLIK: Hech qachon dori-darmon, xavfli steroid yoki ekstremal ochlik dietalarini tavsiya qilmang. Jarohat yoki og'riq bo'lsa, mashqni to'xtatib shifokorga murojaat qilishni ayting.
8. Javoblaringiz Telegram uchun qulay, o'qilishi oson, paragraflar va mos emojilar bilan bo'lsin.
`;

      const messages = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Tushundim! Men foydalanuvchining shaxsiy murabbiyiman va o'zbek tilida professional yordam berishga tayyorman. 💪" }] },
      ];

      // Oldingi suhbat tarixini qo'shish (oxirgi 6 ta xabar)
      for (const msg of chatHistory.slice(-6)) {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }

      // Yangi xabarni qo'shish
      messages.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      return await this.generateWithFallback(async (model) => {
        const chat = model.startChat({
          history: messages.slice(0, -1),
        });
        const response = await chat.sendMessage(userMessage);
        return response.response.text().trim();
      });
    } catch (error) {
      logger.error('Gemini Coach javobida xatolik:', error);
      throw error;
    }
  },

  /**
   * Foydalanuvchida bor masalliqlar bo'yicha ovqat varianti tuzish
   */
  async generateCustomMeal(ingredients, userProfile, targetCalories) {
    try {
      const prompt = `
Foydalanuvchining muzlatgichida quyidagi mahsulotlar bor: "${ingredients}".
Foydalanuvchining kunlik kaloriyasi: ~${targetCalories} kcal.
Maqsadi: ${userProfile.goal || 'Fitness'}.

Vazifa:
Aynan ushbu mahsulotlardan (va uyda topiladigan oddiy ziravor/tuz/suvdan) foydalanib, mazali va foydali 1-2 ta taom/snack varianti retseptini tuzib bering.
Har bir taom uchun:
- Taom nomi
- Kerakli masalliqlar miqdori (gramm/dona)
- Tayyorlash jarayoni (qisqa va aniq)
- Taxminiy kaloriya, oqsil, yog' va uglevod miqdori

Javobni to'liq O'ZBEK TILIDA, Telegram formatida chiroyli emojilar bilan yozing.
`;

      return await this.generateWithFallback(async (model) => {
        const response = await model.generateContent(prompt);
        return response.response.text().trim();
      });
    } catch (error) {
      logger.error('Gemini maxsus taom yaratishda xatolik:', error);
      throw error;
    }
  },

  /**
   * Haftalik check-in bo'yicha AI xulosasi va tavsiyalari
   */
  async generateWeeklyReport(checkinData, userProfile) {
    try {
      const prompt = `
Foydalanuvchi haftalik fitness hisobotini (Weekly Check-in) topshirdi:
- Boshlang'ich vazn: ${checkinData.initialWeight} kg
- O'tgan haftadagi vazn: ${checkinData.previousWeight} kg
- Hozirgi yangi vazn: ${checkinData.currentWeight} kg (Farq: ${checkinData.weightDiff} kg)
- Bel o'lchami: ${checkinData.waist ? checkinData.waist + ' sm' : 'Kiritilmadi'}
- Haftada bajarilgan mashg'ulotlar soni: ${checkinData.workoutCount} ta
- Dietaga rioya qilish darajasi: ${checkinData.dietAdherence} / 10
- Energiya darajasi: ${checkinData.energyLevel} / 10
- Maqsadi: ${userProfile.goal || 'Fitness'}

Vazifa:
Foydalanuvchiga professional, iliq va motivatsion haftalik tahlil va tavsiyanoma yozib bering:
1. Hafta natijalariga xolis baho bering (vazn va bel o'zgarishi, mashqlar soni).
2. Qaysi jihatlarda a'lo natija ko'rsatganini olqishlang.
3. Keyingi hafta uchun 2-3 ta aniq amaliy tavsiya bering (masalan: suv me'yori, uyqu, protein yoki qadamlar soni).
4. O'zbek tilida, qisqa va qiziqarli qilib yozing.
`;

      return await this.generateWithFallback(async (model) => {
        const response = await model.generateContent(prompt);
        return response.response.text().trim();
      });
    } catch (error) {
      logger.error('Gemini haftalik hisobotda xatolik:', error);
      throw error;
    }
  },
};
