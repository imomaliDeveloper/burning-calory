import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { keepAliveService } from '../src/services/keepAliveService.js';

function makeRequest(path, port) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET',
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

test('keepAliveService starts HTTP server and responds to / and /ping', async () => {
  const testPort = 3456;
  await keepAliveService.start(testPort);

  try {
    // 1. Root route
    const rootRes = await makeRequest('/', testPort);
    assert.strictEqual(rootRes.statusCode, 200);
    const rootBody = JSON.parse(rootRes.body);
    assert.strictEqual(rootBody.status, 'ok');
    assert.strictEqual(rootBody.service, 'ai-fitness-assistant-bot');

    // 2. /ping route
    const pingRes = await makeRequest('/ping', testPort);
    assert.strictEqual(pingRes.statusCode, 200);
    const pingBody = JSON.parse(pingRes.body);
    assert.strictEqual(pingBody.status, 'ok');

    // 3. /health route
    const healthRes = await makeRequest('/health', testPort);
    assert.strictEqual(healthRes.statusCode, 200);

    // 4. 404 route
    const notFoundRes = await makeRequest('/unknown', testPort);
    assert.strictEqual(notFoundRes.statusCode, 404);
  } finally {
    keepAliveService.stop();
  }
});
