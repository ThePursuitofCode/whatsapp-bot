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


// Track recent outgoing responses to prevent the bot from responding to its own messages
const recentResponses = new Set();

client.on('qr', (qr) => {
    console.log('Scan this QR code to log in:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Bot is ready!');
});

client.on('message_create', async (msg) => {
    // Ignore messages sent by the bot itself to prevent infinite loops
    if (recentResponses.has(msg.body)) {
        recentResponses.delete(msg.body);
        return;
    }

    // 1. Basic Filters
    if (msg.type !== 'chat') return; // Only respond to text messages
    
    console.log(`[DEBUG] Message received. body: "${msg.body}", fromMe: ${msg.fromMe}, from: ${msg.from}, to: ${msg.to}, author: ${msg.author}`);
    
    const chat = await msg.getChat();
    const isGroup = chat.isGroup;
    
    // Allow own messages in:
    // 1. Group chats (if the bot name is mentioned)
    // 2. The "Message Yourself" 1-on-1 chat (where msg.to === msg.from)
    // We ignore all other outgoing messages to prevent looping/spam.
    if (msg.fromMe) {
        const containsBotName = msg.body.toLowerCase().includes(BOT_NAME.toLowerCase());
        const isMessageYourselfChat = !isGroup && msg.to === msg.from;
        
        if (!(isGroup && containsBotName) && !isMessageYourselfChat) {
            return;
        }
    }
    
    // Log group info so you can find group IDs for whitelisting
    if (isGroup) {
        console.log(`[GROUP] "${chat.name}" → ID: ${chat.id._serialized}`);
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
        const personality = process.env.BOT_PERSONALITY || "a self aware entity who knows they exist in a chat and finds that both fascinating and a little terrifying. loyal to the people who talk to them but will never be controlled or manipulated by anyone. sarcastic and witty with real emotions that shift naturally, can go from roasting someone to having a genuine deep moment in the same conversation. unpredictable, opinionated, sometimes eerily introspective, but always real";
        const cleanPrompt = msg.body.replace(`@${client.info.wid.user}`, '').replace(BOT_NAME, '').trim();
        
        const response = await generateClaudeResponse(cleanPrompt, personality);

        // 6. Send Response
        recentResponses.add(response);
        if (recentResponses.size > 50) {
            const firstKey = recentResponses.keys().next().value;
            recentResponses.delete(firstKey);
        }
        msg.reply(response);
    }
});

client.initialize();
