// Pure Node.js, no axios, no fetch
const https = require('https');
const { URL } = require('url');

@@ -22,7 +21,7 @@ function postJSON(urlString, payload) {
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = {};
        try { json = body ? JSON.parse(body) : {}; } catch { /* leave empty */ }
        try { json = body ? JSON.parse(body) : {}; } catch { /* ignore */ }
        resolve({ status: res.statusCode, json });
      });
    });
@@ -34,36 +33,32 @@ function postJSON(urlString, payload) {
}

module.exports = async (req, res) => {
  // 1) Security header
  const secretKey = req.headers['x-secret-key'];
  if (secretKey !== process.env.SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2) Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 3) Parse JSON body safely (fallback for raw body)
  // parse body safely (works with raw body too)
  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch {
      body = {};
    }
    } catch { body = {}; }
  }

  const { chatId, botToken, message } = body || {};
  if (!chatId || !botToken || !message) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // 4) Call Telegram
  const telegramUrl = https://api.telegram.org/bot${botToken}/sendMessage;
  // IMPORTANT: quotes used here (no backticks)
  const telegramUrl = 'https://api.telegram.org/bot' + botToken + '/sendMessage';

  try {
    const tg = await postJSON(telegramUrl, { chat_id: chatId, text: message });
