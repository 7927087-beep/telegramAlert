// api/telegramAlert.js - Pure Node.js version (no external dependencies)
const https = require('https');

function postJSON(urlString, payload) {
    const url = new URL(urlString);
    const data = JSON.stringify(payload);
    
    const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                let json = {};
                try { 
                    json = body ? JSON.parse(body) : {}; 
                } catch (e) { 
                    // Ignore parse errors for now
                }
                resolve({ status: res.statusCode, json });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

module.exports = async (req, res) => {
    // 1. SECURITY CHECK - ABSOLUTELY CRITICAL
    const secretKey = req.headers['x-secret-key'];
    if (secretKey !== 'Apexmine1xx') { // REPLACE THIS!
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 3. Parse the incoming JSON data
    let body = req.body;
    if (!body || typeof body !== 'object') {
        try {
            // Handle raw body if needed
            let data = '';
            req.on('data', chunk => data += chunk);
            req.on('end', () => {
                body = JSON.parse(data || '{}');
                processRequest(body, res);
            });
            return;
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON' });
        }
    } else {
        await processRequest(body, res);
    }
};

async function processRequest(body, res) {
    const { chatId, botToken, message } = body;

    // 4. Validate required parameters
    if (!chatId || !botToken || !message) {
        return res.status(400).json({ error: 'Missing required parameters: chatId, botToken, or message' });
    }

    // 5. Construct the Telegram API URL
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        // 6. Send the message to Telegram
        const result = await postJSON(telegramUrl, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });

        // 7. Check if Telegram responded with success
        if (result.status === 200 && result.json.ok) {
            res.status(200).json({ success: true });
        } else {
            console.error('Telegram API error:', result.json);
            res.status(500).json({ 
                error: 'Telegram API error', 
                description: result.json.description 
            });
        }
    } catch (error) {
        console.error('Request failed:', error);
        res.status(500).json({ error: 'Failed to send message to Telegram' });
    }
}
