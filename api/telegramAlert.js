// telegramAlert.js - using built-in fetch (no axios needed)

module.exports = async (req, res) => {
  // --- Security: secret header check ---
  const secretKey = req.headers['x-secret-key'];
  if (secretKey !== process.env.SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // --- Only allow POST ---
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Parse body safely ---
  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8') || '{}';
      body = JSON.parse(raw);
    } catch {
      body = {};
    }
  }

  const { chatId, botToken, message } = body;
  if (!chatId || !botToken || !message) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const telegramUrl = https://api.telegram.org/bot${botToken}/sendMessage;

  try {
    const tgRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
        // parse_mode: 'HTML' // enable if you want rich formatting
      })
    });

    const data = await tgRes.json();

    if (!tgRes.ok || data?.ok === false) {
      return res.status(500).json({ error: data?.description || 'Telegram error' });
    }

    return res.status(200).json({ success: true, result: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
