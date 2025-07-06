require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const TelegramBot = require('node-telegram-bot-api');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const { IgApiClient } = require('instagram-private-api');

const app = express();
app.use(bodyParser.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const telegramBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const waClient = new Client({ authStrategy: new LocalAuth() });

const ig = new IgApiClient();
ig.state.generateDevice(process.env.IG_USERNAME);
let loggedInIG = false;

async function loginInstagram() {
    if (!loggedInIG) {
        try {
            await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
            loggedInIG = true;
            console.log('✅ Instagram аккаунтқа сәтті кірілді');
        } catch (err) {
            console.error('❌ Instagram кіру қатесі:', err.message);
        }
    }
}

const triggerWords = ['телефон', 'заказ'];

async function triggerSignal() {
    try {
        console.log('🛠️ Сигнал жіберуге әрекет...');
        await axios.post('http://localhost:5000/trigger');
        console.log('📢 Сигнал жіберілді (Node → Python)');
    } catch (err) {
        console.error('⚠️ Сигнал қатесі:', err.message);
    }
}

telegramBot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.toLowerCase() || '';

    if (triggerWords.some(word => text.includes(word))) {
        await triggerSignal();
        telegramBot.sendMessage(chatId, '📞 Telegram: Қабылданды! Сигнал берілді.');
    } else if (text.includes('бот туралы') || text.includes('сәлеметсіз')) {
        telegramBot.sendMessage(chatId, `Сәлеметсіз бе! 👋

🧠 Мен AI интеллектпен жұмыс істейтін чат-бот жасаймын.

✅ Екі түрлі нұсқа ұсынам:

1️⃣ Кодпен жазылған бот  
• Ай сайынғы төлем жоқ  
• “Телефон” немесе “заказ” деген сөзге сигнал  
• Бағасы – 100.000 ₸ бастап  
• Цек тексерумен – 200.000 ₸  

2️⃣ Нейро жүйелі бот (ИИ)  
• AI автоматты жауап береді  
• Ай сайынғы тариф: 100.000 – 150.000 ₸  

📲 Бот платформалары:
Telegram ✅  
WhatsApp ✅  
Instagram ✅  

🎞️ Видео жарнама да жасаймыз

Жазып, сұраңыз!`);
    }
});

waClient.on('qr', (qr) => {
    console.log('📱 WhatsApp QR сканерлеңіз:');
    qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
    console.log('✅ WhatsApp іске қосылды');
});

waClient.on('message', async msg => {
    const text = msg.body.toLowerCase();

    if (triggerWords.some(word => text.includes(word))) {
        await triggerSignal();
        msg.reply('📞 WhatsApp: Қабылданды! Сигнал берілді.');
    } else if (text.includes('бот туралы') || text.includes('сәлеметсіз')) {
        msg.reply(`Сәлеметсіз бе! 👋

🧠 Мен AI интеллектпен жұмыс істейтін чат-бот жасаймын.

✅ Екі түрлі нұсқа ұсынам:

1️⃣ Кодпен жазылған бот  
• Ай сайынғы төлем жоқ  
• “Телефон” немесе “заказ” деген сөзге сигнал  
• Бағасы – 100.000 ₸ бастап  
• Цек тексерумен – 200.000 ₸  

2️⃣ Нейро жүйелі бот (ИИ)  
• AI автоматты жауап береді  
• Ай сайынғы тариф: 100.000 – 150.000 ₸  

📲 Telegram / WhatsApp / Instagram бот орнатам

🎞️ Видео жарнама да бар керек болса айтныз

Сұрақ болса, жазыңыз!`);
    }
});

waClient.initialize();

app.post('/instagram', async (req, res) => {
    const message = req.body.message || '';
    const userId = req.body.user_id;

    if (triggerWords.some(word => message.toLowerCase().includes(word))) {
        await triggerSignal();
        try {
            await loginInstagram();
            await ig.entity.directThread([userId]).broadcastText('📞 Instagram: Қабылданды! Сигнал берілді.');
        } catch (err) {
            console.error('Instagram хабарлама қатесі:', err.message);
        }
    }

    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send('🤖 Бот жұмыс істеп тұр (Telegram + WhatsApp + Instagram)');
});

app.listen(3000, () => {
    console.log('🌐 Сервер іске қосылды: http://localhost:3000');
});
