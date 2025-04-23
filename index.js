const express = require('express');
const axios = require('axios');
const app = express();

// Настройка парсеров с приоритетом для HTML
app.use(express.text({ type: 'text/html' })); // Сначала пробуем как HTML
app.use(express.json()); // Затем как JSON
app.use(express.urlencoded({ extended: true })); // И form-data

const BOT_TOKEN = '7581556039:AAHLKcFBAa4sEf_7IzMbJkmgwCzTSR4bYmI';
const CHAT_ID = '7098678847';

// Для хранения уникальных сообщений (защита от дублей)
const messageCache = new Map();
const MAX_CACHE_SIZE = 100;

app.post('/webhook', async (req, res) => {
  try {
    // Извлекаем текст из HTML
    let rawContent = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    
    // Удаляем HTML-теги если они есть
    const cleanText = rawContent.replace(/<[^>]*>?/gm, '').trim();
    
    // Пропускаем пустые сообщения
    if (!cleanText || cleanText.length < 2) {
      return res.status(200).send('OK (empty)');
    }

    // Создаем цифровой отпечаток сообщения
    const messageHash = require('crypto')
      .createHash('md5')
      .update(cleanText)
      .digest('hex');

    // Защита от дубликатов
    if (messageCache.has(messageHash)) {
      return res.status(200).send('OK (duplicate)');
    }
    messageCache.set(messageHash, Date.now());
    
    // Очистка кэша
    if (messageCache.size > MAX_CACHE_SIZE) {
      const oldest = [...messageCache.entries()]
        .sort((a, b) => a[1] - b[1])
        .slice(0, 20);
      oldest.forEach(([key]) => messageCache.delete(key));
    }

    // Отправка в Telegram
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: `✉️ ${cleanText.slice(0, 300)}`,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(200).send('OK');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на ${PORT}`));
