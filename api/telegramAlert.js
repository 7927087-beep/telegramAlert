// api/telegramAlert.js
// Pure Node (no axios/fetch) + CORS + OPTIONS preflight

const https = require('https');
const { URL } = require('url');

// Helper: POST JSON with Node https
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
        try { json = body ? JSON.parse(body) : {}; } catch {} // ignore parse errors
        resolve({ status: res.statusCode, json });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  // --- CORS headers (allow browser calls) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-secret-key');

  // --- Respond to preflight quickly ---
  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- Auth (must match Vercel env: SECRET_KEY) ---
  const secretKey = req.headers['x-secret-key'];
  if (secretKey !== process.env.SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // --- Only allow POST beyond here ---
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Parse JSON body (works even if body wasn't auto-parsed) ---
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
  if (!chatId!message) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // --- Telegram send ---
  const telegramUrl = 'https://api.telegram.org/bot' + botToken + '/sendMessage';

  try {
    const tg = await postJSON(telegramUrl, {
      chat_id: chatId,
      text: message
      // If you want formatting later: parse_mode: 'HTML'
    });

    if (tg.status < 200tg.json?.ok === false) {
      return res.status(500).json({ error: tg.json?.description || 'Telegram error' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
};
