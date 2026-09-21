import PDFDocument from 'pdfkit';
import { fitnessCalculator } from './fitnessCalculator.js';
import { workoutService } from './workoutService.js';
import { nutritionService } from './nutritionService.js';
import { formatter } from '../utils/formatter.js';

export const pdfService = {
  /**
   * Foydalanuvchi uchun shaxsiy fitness reja PDF faylini Buffer sifatida yaratish
   */
  async generatePersonalPlanPdf(user) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 45,
          info: {
            Title: `Fitness Dastur - ${user.name || 'Foydalanuvchi'}`,
            Author: 'AI Fitness Assistant',
          },
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Reja va hisob-kitoblarni olish
        const plan = fitnessCalculator.calculatePlan({
          weight: user.weight,
          height: user.height,
          age: user.age,
          gender: user.gender,
          activityLevel: user.activity_level,
          goal: user.goal,
        });

        const workoutPlan = workoutService.generatePlan(user);
        const mealPlan = nutritionService.generateDailyMealPlan(plan.targetCalories, plan.macros, user.goal);

        // SARLAVHA
        doc
          .fillColor('#1E3A8A')
          .fontSize(22)
          .text('AI FITNESS ASSISTANT', { align: 'center' })
          .fontSize(14)
          .fillColor('#3B82F6')
          .text('SHAXSIY MASHG\'ULOT VA OVQATLANISH DASTURI', { align: 'center' })
          .moveDown(1);

        // CHIZIQ
        doc
          .strokeColor('#CBD5E1')
          .lineWidth(1)
          .moveTo(45, doc.y)
          .lineTo(550, doc.y)
          .stroke()
          .moveDown(0.8);

        // 1. FOYDALANUVCHI KO'RSATKICHLARI
        doc
          .fillColor('#1E293B')
          .fontSize(14)
          .text('1. FOYDALANUVCHI MA\'LUMOTLARI VA MAQSAD:', { underline: true })
          .moveDown(0.4);

        doc.fontSize(10).fillColor('#334155');
        doc.text(`* Ism: ${user.name || 'Foydalanuvchi'}`);
        doc.text(`* Yosh: ${user.age || '—'} yosh | Jins: ${formatter.getGenderText(user.gender)}`);
        doc.text(`* Bo'y: ${user.height || '—'} sm | Hozirgi vazn: ${user.weight || '—'} kg`);
        doc.text(`* Tana massasi indeksi (BMI): ${plan.bmi} (${plan.bmiCategory})`);
        doc.text(`* Mashg'ulot joyi: ${formatter.getLocationText(user.workout_location)}`);
        doc.text(`* Faollik darajasi: ${formatter.getActivityText(user.activity_level)}`);
        doc.text(`* Asosiy maqsad: ${formatter.getGoalText(user.goal)}`);
        doc.moveDown(1);

        // 2. KALORIYA VA MAKRONUTRIENTLAR
        doc
          .fillColor('#1E293B')
          .fontSize(14)
          .text('2. SHAXSIY KALORIYA VA MAKRONUTRIENTLAR TARGETI:', { underline: true })
          .moveDown(0.4);

        doc.fontSize(11).fillColor('#DC2626');
        doc.text(`KUNLIK KALORIYA ME'YORI: ${plan.targetCalories} kcal (BMR: ${plan.bmr} kcal, TDEE: ${plan.tdee} kcal)`);
        
        doc.fontSize(10).fillColor('#334155');
        doc.text(`- Oqsil (Protein): ${plan.macros.protein} gramm (mushaklar tiklanishi va saqlanishi uchun)`);
        doc.text(`- Yog' (Fat): ${plan.macros.fat} gramm (gormonal muvozanat uchun)`);
        doc.text(`- Uglevod (Carbs): ${plan.macros.carbs} gramm (mashg'ulot va kunlik energiya uchun)`);
        doc.text(`- Tavsiya etilgan suv miqdori: ${mealPlan.waterRecommendation}`);
        doc.moveDown(1);

        // 3. OVQATLANISH REJASI
        doc
          .fillColor('#1E293B')
          .fontSize(14)
          .text('3. KUNLIK BALANSLANGAN TAOMNOMA VARIANTI:', { underline: true })
          .moveDown(0.4);

        for (const m of mealPlan.meals) {
          doc.fontSize(10).fillColor('#059669').text(`${m.name} (~${m.calories} kcal | ${m.protein}g Protein):`);
          doc.fontSize(9).fillColor('#475569');
          for (const opt of m.options) {
            doc.text(`   - ${opt}`);
          }
          doc.moveDown(0.3);
        }

        doc.addPage();

        // 4. MASHG'ULOTLAR DASTURI
        doc
          .fillColor('#1E3A8A')
          .fontSize(16)
          .text('4. HAFTALIK MASHG\'ULOTLAR REJASI', { align: 'center' })
          .fontSize(11)
          .fillColor('#64748B')
          .text(workoutPlan.title, { align: 'center' })
          .moveDown(1);

        for (const day of workoutPlan.days) {
          doc
            .fillColor('#1E293B')
            .fontSize(12)
            .text(day.dayName, { underline: true })
            .moveDown(0.2);

          if (day.exercises.length === 0) {
            doc.fontSize(9).fillColor('#64748B').text('   Faol dam olish (sayr, cho\'zilish).').moveDown(0.5);
            continue;
          }

          for (const ex of day.exercises) {
            doc
              .fontSize(10)
              .fillColor('#0F172A')
              .text(`* ${ex.name} — ${ex.sets} sets x ${ex.reps} (Dam olish: ${ex.rest})`);
            doc
              .fontSize(8)
              .fillColor('#64748B')
              .text(`   Izoh: ${ex.tip}`);
          }
          doc.moveDown(0.6);
        }

        // FOOTER & DISCLAIMER
        doc.moveDown(1);
        doc
          .strokeColor('#E2E8F0')
          .lineWidth(1)
          .moveTo(45, doc.y)
          .lineTo(550, doc.y)
          .stroke()
          .moveDown(0.5);

        doc
          .fontSize(8)
          .fillColor('#94A3B8')
          .text(
            'ESLATMA: Ushbu shaxsiy fitness dasturi sun\'iy intellekt tomonidan ko\'rsatkichlaringiz asosida tuzilgan. ' +
            'Bu tibbiy tashxis yoki davolash rejasi emas. Jismoniy zo\'riqishlardan oldin shifokor bilan maslahatlashing.',
            { align: 'center' }
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  },
};
