// Pure Node.js, no axios, no fetch
const https = require('https');
const { URL } = require('url');

function postJSON(urlString, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const data = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = {};
        try { json = body ? JSON.parse(body) : {}; } catch { /* leave empty */ }
        resolve({ status: res.statusCode, json });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
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
  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch {
      body = {};
    }
  }

  const { chatId, botToken, message } = body || {};
  if (!chatId || !botToken || !message) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // 4) Call Telegram
  const telegramUrl = https://api.telegram.org/bot${botToken}/sendMessage;

  try {
    const tg = await postJSON(telegramUrl, { chat_id: chatId, text: message });
    if (tg.status < 200 || tg.status >= 300 || tg.json?.ok === false) {
      return res.status(500).json({ error: tg.json?.description || 'Telegram error' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
};
