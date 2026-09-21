# 🏋️ AI Fitness Assistant — Telegram Bot

Node.js, Telegraf, Google Gemini AI (Vision & Flash) va SQLite/PostgreSQL yordamida yaratilgan professional **AI Fitness Assistant** Telegram boti.

Mazkur bot foydalanuvchining tana rasmini xolis tahlil qiladi (tibbiy tashxissiz), BMR/TDEE va makronutrientlarni hisoblaydi, uy va zal sharoitiga mos mashg'ulot dasturlarini yaratadi, muzlatgichdagi mavjud masalliqlar asosida shaxsiy retseptlar tuzadi, 24/7 AI murabbiy sifatida muloqot qiladi hamda haftalik progress monitoringini (grafiklar bilan) olib boradi.

Barcha bot interfeysi va javoblar **O'zbek tilida** ishlab chiqilgan.

---

## 🌟 Asosiy Imkoniyatlar

1. **👤 Profil va Shaxsiy Hisob-kitoblar:**
   - Yosh, jins, bo'y, vazn, faollik darajasi, mashg'ulot joyi (Uy/Zal) va maqsadni hisobga olish.
   - **Mifflin-St Jeor** formulasi asosida BMR va TDEE hisoblash.
   - Maqsadga mos kunlik kaloriya me'yori (Defitsit / Profitsit) va aniq makrolar (Oqsil, Yog', Uglevod).
   - Xavfsizlik chegaralari (ekstremal kam kaloriya berilmaydi).

2. **📸 Tana Rasmini Tahlil Qilish (Gemini Vision):**
   - Rasm orqali vizual tana kompozitsiyasi, mushaklar rivojlanishi, yog' taqsimoti, qad-qomat (posture) kuzatuvi.
   - Mashg'ulotlarda ko'proq e'tibor berish kerak bo'lgan mushak guruhlari bo'yicha tavsiyalar.
   - Qat'iy xavfsizlik va tibbiy tashxis qo'ymaslik eslatmalari.

3. **🥗 Food Vision AI (Rasm orqali ovqat kaloriyasini hisoblash):**
   - Taom rasmini botga yuborish kifoya: Gemini 3.6 Flash taom nomini, porsiya og'irligini, kaloriya (kcal) hamda makrolarni (oqsil, yog', uglevod) aniqlaydi.
   - Barcha taomlar `meals` bazasiga yozilib, kunlik me'yordan real vaqtda ayirib boriladi.
   - *"📊 Bugungi balans"* orqali bugun jami qancha kaloriya yeyilgani va qancha qolgani ko'rinadi.

4. **⏰ Smart Cron Notifications (Avtomatik Eslatmalar):**
   - 💧 **Suv ichish eslatmasi:** Har kuni soat 10:00, 13:00, 16:00, 19:00 da.
   - 🏋️ **Mashg'ulot motivatsiyasi:** Har kuni ertalab soat 08:30 da.
   - 📅 **Yakshanbalik Check-in:** Har yakshanba soat 20:00 da.
   - *Foydalanuvchi "⚙️ Sozlamalar" orqali eslatmalarni istalgan vaqtda yoqishi yoki o'chirishi mumkin.*

5. **🍎 Ovqatlanish va Retseptlar:**
   - Kunlik to'liq balanslangan taomnoma (Nonushta, Tushlik, Kechki ovqat, Snack).
   - *"Menda tuxum, guruch va tovuq bor"* kabi xabar yuborilganda aynan mavjud masalliqlardan retsept tuzish.

6. **🏋️ Mashg'ulot Dasturi (Home & Gym):**
   - Uy sharoitida: zal uskunalari talab qilinmaydigan samarali tana vazni (calisthenics) mashqlari.
   - Fitnes zalida: shtanga, gantel va trenajyorlar bilan gipertrofiya va kuch dasturlari.
   - Mashq natijalarini yozib borish (Sets, Reps, Og'irlik).

7. **🤖 24/7 AI Fitness Coach:**
   - Foydalanuvchi profilini inobatga olgan holda savollarga javob berish.
   - Tezkor savollar ("Bugun nima yey?", "Mashqqa vaqtim yo'q", "Bugun dietani buzdim" va h.k.).

8. **📊 Progress va Grafiklar:**
   - Vazn va bel o'lchamlarini kiritib borish.
   - Boshlang'ich va hozirgi vazn o'rtasidagi farq hisoboti.
   - Vizual chiziqli grafik (QuickChart / Trend dinamikasi).

9. **📅 Haftalik Check-in:**
   - Haftalik progress monitoringi (vazn, bel, bajargan mashqlar, dieta va energiya darajasi).
   - AI murabbiy tomonidan shaxsiy haftalik xulosa va tavsiyanoma.

10. **🔒 Maxfiylik va Xavfsizlik:**
    - Har bir foydalanuvchi ma'lumotlari alohida himoyalangan.
    - `🗑 Profilni o'chirish` orqali foydalanuvchi barcha ma'lumotlarini bazadan to'liq tozalash imkoniyati.

---

## 🛠 Texnologiyalar (Tech Stack)

- **Platforma:** Node.js (v20+ yoki v24+ tavsiya etiladi)
- **Modullik:** ES Modules (`type: "module"`)
- **Telegram Framework:** `telegraf` v4
- **Sun'iy Intellekt:** Google Gemini API (`@google/generative-ai`) — `gemini-3.6-flash`
- **Rejalashtirilgan vazifalar:** `node-cron`
- **Ma'lumotlar Bazasi:** O'rnatilgan `node:sqlite` (nol konfiguratsiya bilan darhol ishlaydi) yoki PostgreSQL (`pg`)
- **Konfiguratsiya:** `dotenv`
- **Sinovlar:** Node.js Native Test Runner (`node --test`)

---

## 🚀 O'rnatish va Ishga Tushirish (Step-by-step)

### 1. Loyihani yuklab olish va papkaga o'tish
```bash
cd "Kaloriya yondiramiz"
```

### 2. Bog'liqliklarni (dependencies) o'rnatish
```bash
npm install
```

### 3. Telegram Bot Token olish
1. Telegramda [@BotFather](https://t.me/BotFather) botini oching.
2. `/newbot` buyrug'ini yuboring va botingiz nomini kiriting.
3. Berilgan `HTTP API Token`ni nusxalab oling.

### 4. Google Gemini API Kalitini olish
1. [Google AI Studio](https://aistudio.google.com/) saytiga kiring.
2. Google hisobingiz orqali tizimga kiring.
3. **Get API Key** tugmasini bosing va yangi API kalit yarating (mutlaqo bepul).

### 5. Muhit o'zgaruvchilarini sozlash (`.env`)
Loyiha ildizida `.env` nomli fayl yarating (yoki `.env.example` dan nusxa oling):
```bash
cp .env.example .env
```

Fayl ichiga olingan kalitlarni kiriting:
```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ
GEMINI_API_KEY=AIzaSyD-YourActualGeminiApiKeyHere

# Standart holda bo'sh qoldiring (avtomatik SQLite data/fitness_bot.db ishlatiladi)
DATABASE_URL=
```

> **Eslatma (PostgreSQL):** Agar SQLite o'rniga PostgreSQL ishlatmoqchi bo'lsangiz, `DATABASE_URL` ga quyidagicha yozing:
> `DATABASE_URL=postgresql://user:password@localhost:5432/fitness_bot`

### 6. Testlarni ishga tushirish (Tekshirish)
Kalkulyator, validator va ma'lumotlar bazasi integratsiyasini tekshirish uchun:
```bash
npm test
```

### 7. Botni ishga tushirish

**Development rejimida (avtomatik qayta yuklash bilan):**
```bash
npm run dev
```

**Production rejimida:**
```bash
npm start
```

---

## 📂 Loyiha Tuzilmasi (Clean Architecture)

```
Kaloriya yondiramiz/
├── data/                    # SQLite ma'lumotlar bazasi fayli (.gitignored)
├── src/
│   ├── config/
│   │   └── env.js           # .env konfiguratsiyasi va validatsiya
│   ├── database/
│   │   ├── index.js         # SQLite va PostgreSQL universal drayveri
│   │   ├── schema.sql       # Jadvallar tuzilmasi
│   │   └── repositories/    # Ma'lumotlar bilan ishlash qatlami (CRUD)
│   │       ├── userRepository.js
│   │       ├── analysisRepository.js
│   │       ├── workoutRepository.js
│   │       ├── progressRepository.js
│   │       └── nutritionRepository.js
│   ├── services/
│   │   ├── fitnessCalculator.js # BMR, TDEE va makrolar formulasi
│   │   ├── geminiService.js     # Vision, AI Coach, retsept va weekly report
│   │   ├── workoutService.js    # Uy va zal mashg'ulotlari generatori
│   │   ├── nutritionService.js  # Balanslangan kunlik taomnoma
│   │   └── chartService.js      # Progress grafiklarini yaratish
│   ├── bot/
│   │   ├── index.js             # Telegraf bot, xatoliklar va router
│   │   ├── session.js           # Ko'p bosqichli holatlar (FSM)
│   │   ├── keyboards/
│   │   │   ├── mainKeyboards.js   # Bosh menyu va bo'lim tugmalari
│   │   │   └── inlineKeyboards.js # Inline tugmalar (tanlovlar va tasdiqlash)
│   │   └── handlers/            # Har bir bo'lim logikasi
│   │       ├── startHandler.js
│   │       ├── profileHandler.js
│   │       ├── analysisHandler.js
│   │       ├── nutritionHandler.js
│   │       ├── workoutHandler.js
│   │       ├── progressHandler.js
│   │       ├── coachHandler.js
│   │       ├── checkinHandler.js
│   │       ├── settingsHandler.js
│   │       └── menuHandler.js
│   ├── utils/
│   │   ├── formatter.js     # O'zbekcha chiroyli xabar shablonlari
│   │   ├── validator.js     # Kiritilgan ma'lumotlarni tekshirish
│   │   └── logger.js        # Konsol jurnali
│   └── index.js             # Dastur kirish nuqtasi
├── tests/                   # Avtomatlashtirilgan unit & integratsiya testlar
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## ⚠️ Muhim Xavfsizlik va Tibbiy Eslatma

Ushbu bot faqat fitness va sog'lom turmush tarzi bo'yicha maslahat beruvchi sun'iy intellekt hisoblanadi.
- Bot tibbiy tashxis qo'ymaydi.
- Jarohat va kasalliklarni davolamaydi.
- Rasmdan aniq tana yog' foizini da'vo qilmaydi.
- Sog'lig'ingizda jiddiy muammo yoki og'riqlar kuzatilsa, albatta malakali shifokor bilan maslahatlashing.
