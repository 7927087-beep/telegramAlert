const axios = require('axios');

module.exports = async (req, res) => {
  // 1. Check for the secret key for security
  const secretKey = req.headers['x-secret-key'];
  if (secretKey !== 'Apexmine1xx') { // You will set this next
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chatId, botToken, message } = req.body;

  if (!chatId || !botToken || !message) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await axios.post(telegramUrl, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Telegram error:', error.response?.data);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
