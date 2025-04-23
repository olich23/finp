const express = require('express');
const axios = require('axios');
const app = express();

// Улучшенный парсер входящих данных
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

app.post('/webhook', async (req, res) => {
  try {
    let text = '';
    
    // Получаем текст из разных форматов
    if (typeof req.body === 'object') {
      text = req.body.text || req.body.toString();
    } else {
      text = req.body.toString();
    }

    // Фильтр рекурсии (должен быть ПЕРЕД отправкой!)
    if (text.includes('▲') || text.includes('Уведомление:')) {
      console.log('Игнорируем рекурсивное сообщение:', text.slice(0, 50));
      return res.status(200).send('OK (ignored)');
    }

    // Отправляем только ОДИН раз
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: `📢 ${text.slice(0, 300)}` // Используем другой префикс
    });
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(200).send('OK');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
