const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { generateClaudeResponse } = require('./claude');
const { isRateLimited } = require('./middleware/rateLimiter');
require('dotenv').config();

const puppeteerConfig = {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
    ],
};

// Use system Chromium when running inside Docker
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
}

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session'
    }),
    puppeteer: puppeteerConfig,
});

const BOT_NAME = process.env.BOT_NAME || 'Bot';
const WHITELISTED_GROUPS = process.env.WHITELISTED_GROUPS ? process.env.WHITELISTED_GROUPS.split(',') : [];

client.on('qr', (qr) => {
    console.log('Scan this QR code to log in:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Bot is ready!');
});

client.on('message', async (msg) => {
    // 1. Basic Filters
    if (msg.fromMe) return; // Don't respond to own messages
    if (msg.type !== 'chat') return; // Only respond to text messages
    
    const chat = await msg.getChat();
    const isGroup = chat.isGroup;
    
    // 2. Group Whitelist Check
    if (isGroup && WHITELISTED_GROUPS.length > 0 && !WHITELISTED_GROUPS.includes(chat.id._serialized)) {
        return;
    }

    // 3. Mention/Trigger Detection
    // Check if the bot is mentioned or its name is used
    const mentions = await msg.getMentions();
    const botUser = await client.getContactById(client.info.wid._serialized);
    const isMentioned = mentions.some(m => m.id._serialized === client.info.wid._serialized);
    const containsName = msg.body.toLowerCase().includes(BOT_NAME.toLowerCase());

    if (isMentioned || (isGroup && containsName) || (!isGroup)) {
        // 4. Anti-Abuse: Rate Limiting
        const senderId = msg.author || msg.from;
        if (isRateLimited(senderId)) {
            // Optional: Reply with a cool-down message once
            console.log(`User ${senderId} is rate limited.`);
            return;
        }

        console.log(`Responding to message from ${senderId}: ${msg.body}`);

        // 5. Generate Personality-driven response
        const personality = process.env.BOT_PERSONALITY || "a sarcastic but loyal friend who loves puns and 80s movie references";
        const cleanPrompt = msg.body.replace(`@${client.info.wid.user}`, '').replace(BOT_NAME, '').trim();
        
        const response = await generateClaudeResponse(cleanPrompt, personality);

        // 6. Send Response
        msg.reply(response);
    }
});

client.initialize();
