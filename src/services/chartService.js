import axios from 'axios';
import { logger } from '../utils/logger.js';

export const chartService = {
  /**
   * Vazn o'zgarishi grafigi URL manzilini yaratish (QuickChart orqali)
   */
  generateWeightChartUrl(progressEntries) {
    if (!progressEntries || progressEntries.length === 0) return null;

    // Sanalarni formatlash (DD.MM)
    const labels = progressEntries.map((p) => {
      const d = new Date(p.created_at || Date.now());
      return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const weights = progressEntries.map((p) => p.weight);
    const waists = progressEntries.map((p) => p.waist).filter((w) => w !== null && w !== undefined);
    const hasWaist = waists.length === weights.length;

    const datasets = [
      {
        label: "Vazn (kg)",
        data: weights,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ];

    if (hasWaist) {
      datasets.push({
        label: "Bel o'lchami (sm)",
        data: waists,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.3,
        pointRadius: 5,
      });
    }

    const chartConfig = {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        title: {
          display: true,
          text: 'Vazn va Tana O\'zgarishi Dinamikasi',
          fontSize: 16,
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: false,
              },
              scaleLabel: {
                display: true,
                labelString: 'Ko\'rsatkich (kg / sm)',
              },
            },
          ],
        },
      },
    };

    const encoded = encodeURIComponent(JSON.stringify(chartConfig));
    return `https://quickchart.io/chart?c=${encoded}&w=600&h=350&bkg=white`;
  },

  /**
   * Grafik rasmini Buffer sifatida yuklab olish
   */
  async getChartBuffer(chartUrl) {
    try {
      const response = await axios.get(chartUrl, { responseType: 'arraybuffer', timeout: 7000 });
      return Buffer.from(response.data);
    } catch (error) {
      logger.warn('Grafik rasmini yuklab olishda xatolik:', error.message);
      return null;
    }
  },

  /**
   * Matnli (ASCII / Emojili) progress dinamikasi (Internet yoki rasm muammosi bo'lsa zaxira)
   */
  generateAsciiProgress(progressEntries) {
    if (!progressEntries || progressEntries.length === 0) return '';

    let text = '📈 *Vazn o\'zgarish dinamikasi:*\n\n';
    const minW = Math.min(...progressEntries.map((p) => p.weight));
    const maxW = Math.max(...progressEntries.map((p) => p.weight));
    const range = maxW - minW || 1;

    for (const p of progressEntries.slice(-8)) {
      const d = new Date(p.created_at || Date.now());
      const dateStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      const barsCount = Math.max(1, Math.round(((p.weight - minW) / range) * 10));
      const bar = '🟩'.repeat(barsCount);
      text += `📅 ${dateStr}: ${p.weight} kg ${bar}\n`;
    }

    return text;
  },
};
