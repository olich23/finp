const express = require('express');
const axios = require('axios');
const app = express();
const crypto = require('crypto');

// Отключаем стандартные парсеры - будем обрабатывать вручную
app.use((req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    try {
      req.rawBody = data;
      // Пытаемся распарсить как JSON, если нет - оставляем как есть
      req.body = data.trim().startsWith('{') ? JSON.parse(data) : data;
    } catch (e) {
      req.body = data;
    }
    next();
  });
});

const BOT_TOKEN = '7581556039:AAHLKcFBAa4sEf_7IzMbJkmgwCzTSR4bYmI';
const CHAT_ID = '7098678847';

// Хранилище последних сообщений с таймстемпами
const messageStore = new Map();
const STORE_SIZE = 50; // Храним 50 последних сообщений

app.post('/webhook', async (req, res) => {
  try {
    // Получаем чистый текст (удаляем HTML-теги если есть)
    const rawText = typeof req.body === 'object' 
      ? JSON.stringify(req.body) 
      : req.body;
    
    const cleanText = rawText.replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Пропускаем пустые сообщения
    if (!cleanText || cleanText.length < 2) {
      return res.status(200).send('OK (empty)');
    }

    // Создаем уникальный ключ для сообщения
    const messageKey = crypto.createHash('md5')
      .update(cleanText)
      .digest('hex');

    // Проверяем дубликаты (сообщение уже было в последние 5 минут)
    const now = Date.now();
    if (messageStore.has(messageKey)) {
      const lastSeen = messageStore.get(messageKey);
      if (now - lastSeen < 300000) { // 5 минут
        return res.status(200).send('OK (duplicate)');
      }
    }

    // Обновляем хранилище
    messageStore.set(messageKey, now);
    
    // Очищаем старые записи
    if (messageStore.size > STORE_SIZE) {
      const oldest = [...messageStore.entries()]
        .sort((a, b) => a[1] - b[1])
        .slice(0, 5);
      oldest.forEach(([key]) => messageStore.delete(key));
    }

    // Отправляем в Telegram (только если не дубликат)
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: `💳 ${cleanText.slice(0, 300)}`,
      parse_mode: 'Markdown'
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(200).send('OK');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
