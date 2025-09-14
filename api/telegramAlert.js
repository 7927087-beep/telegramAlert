module.exports = async (req, res) => {
  const secretKey = req.headers['x-secret-key'];
  if (secretKey !== process.env.SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body if needed
  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch { body = {}; }
  }

  const { chatId, botToken, message } = body;
  if (!chatId || !botToken || !message) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const url = https://api.telegram.org/bot${botToken}/sendMessage;
  try {
    const tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
    const data = await tgRes.json();
    if (!tgRes.ok || data?.ok === false) {
      return res.status(500).json({ error: data?.description || 'Telegram error' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
