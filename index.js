const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

// Универсальный парсер входящих данных
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    try {
      req.rawBody = data;
      // Пытаемся распарсить JSON, если нет - оставляем как текст
      req.body = data.trim().startsWith('{') ? JSON.parse(data) : data;
    } catch (e) {
      req.body = data;
    }
    next();
  });
});

const BOT_TOKEN = '7581556039:AAHLKcFBAa4sEf_7IzMbJkmgwCzTSR4bYmI';
const CHAT_ID = '7098678847';

// Для хранения уникальных сообщений
const messageStore = new Map();
const MAX_STORE_SIZE = 100;

// Функция очистки сообщения
const cleanNotification = (text) => {
  return text
    .replace(/<[^>]+>/g, '') // Удаляем HTML-теги
    .replace(/[-\•\*\[\]]/g, '') // Удаляем спецсимволы
    .replace(/\s+/g, ' ') // Заменяем множественные пробелы
    .replace(/(\d{1,2}:\d{2})\s+/g, '') // Удаляем время типа "1:21"
    .trim();
};

app.post('/webhook', async (req, res) => {
  try {
    // Получаем текст из любого формата
    const rawText = typeof req.body === 'object' 
      ? JSON.stringify(req.body) 
      : String(req.body);
    
    // Очищаем текст
    const cleanText = cleanNotification(rawText);
    
    // Пропускаем пустые сообщения
    if (!cleanText || cleanText.length < 3) {
      return res.status(200).send('OK (empty)');
    }

    // Создаем уникальный ключ
    const messageKey = crypto.createHash('md5')
      .update(cleanText)
      .digest('hex');

    // Проверяем дубликаты
    if (messageStore.has(messageKey)) {
      return res.status(200).send('OK (duplicate)');
    }

    // Сохраняем сообщение
    messageStore.set(messageKey, Date.now());
    
    // Очищаем старые записи
    if (messageStore.size > MAX_STORE_SIZE) {
      const oldest = [...messageStore.entries()]
        .sort((a, b) => a[1] - b[1])
        .slice(0, 10);
      oldest.forEach(([key]) => messageStore.delete(key));
    }

    // Отправляем в Telegram
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: `📌 ${cleanText.slice(0, 250)}`, // Обрезаем длинные сообщения
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
