import http from 'node:http';
import axios from 'axios';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const keepAliveService = {
  server: null,
  pingTimer: null,

  /**
   * HTTP serverni ishga tushirish (Render Web Service port talabi va health check uchun)
   */
  start(port = config.port) {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const url = req.url || '/';

        if (url === '/' || url === '/ping' || url === '/health') {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          });
          res.end(
            JSON.stringify({
              status: 'ok',
              service: 'ai-fitness-assistant-bot',
              uptime: `${Math.floor(process.uptime())}s`,
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      });

      this.server.on('error', (err) => {
        logger.error('[KEEP-ALIVE] HTTP server xatosi:', err.message);
        reject(err);
      });

      this.server.listen(port, () => {
        logger.info(`[KEEP-ALIVE] HTTP server ${port}-portda ishga tushdi (Health check: /ping).`);
        this.initAutoPing();
        resolve(this.server);
      });
    });
  },

  /**
   * Auto-ping mexanizmini ishga tushirish (Render uxlab qolmasligi uchun)
   */
  initAutoPing() {
    const rawUrl = config.pingUrl;

    if (!rawUrl) {
      logger.info(
        '[KEEP-ALIVE] RENDER_EXTERNAL_URL yoki PING_URL belgilanmagan. ' +
        'Render-da uxlab qolmaslik uchun atrof-muhit o\'zgaruvchilariga PING_URL (masalan: https://your-app.onrender.com) qo\'shing.'
      );
      return;
    }

    // URL formatlash
    let targetBase = rawUrl.trim();
    if (!targetBase.startsWith('http://') && !targetBase.startsWith('https://')) {
      targetBase = `https://${targetBase}`;
    }
    const pingTarget = `${targetBase.replace(/\/$/, '')}/ping`;
    const intervalMinutes = Math.max(1, config.pingIntervalMinutes || 10);
    const intervalMs = intervalMinutes * 60 * 1000;

    logger.info(`[KEEP-ALIVE] Auto-ping faollashtirildi: Har ${intervalMinutes} daqiqada ${pingTarget} ga so'rov yuboriladi.`);

    // Dastlabki tekshiruv 30 soniyadan so'ng amalga oshiriladi
    setTimeout(() => {
      this.sendPing(pingTarget);
    }, 30000);

    // Muntazam ping
    this.pingTimer = setInterval(() => {
      this.sendPing(pingTarget);
    }, intervalMs);
  },

  /**
   * Ping so'rovini yuborish
   */
  async sendPing(targetUrl) {
    try {
      const response = await axios.get(targetUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'Render-Auto-Ping-KeepAlive/1.0' },
      });
      logger.info(`[KEEP-ALIVE] Auto-ping muvaffaqiyatli: ${targetUrl} (Status: ${response.status})`);
    } catch (err) {
      logger.warn(`[KEEP-ALIVE] Auto-ping xatosi: ${err.message}`);
    }
  },

  /**
   * Server va taymerni to'xtatish (Graceful shutdown)
   */
  stop() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.server) {
      this.server.close();
      this.server = null;
      logger.info('[KEEP-ALIVE] HTTP server to\'xtatildi.');
    }
  },
};
