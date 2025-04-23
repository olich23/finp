const express = require('express');
const axios = require('axios');
const app = express();

// Принимаем ЛЮБОЙ формат данных
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    try {
      req.rawBody = data;
      req.body = data.includes('{') ? JSON.parse(data) : data;
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
    
    // Обрабатываем все возможные форматы
    if (typeof req.body === 'object') {
      text = req.body.text || JSON.stringify(req.body);
    } else {
      text = req.body.toString();
    }

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: `🔔 Уведомление: ${text.slice(0, 300)}` // Обрезаем длинный текст
    });
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(200).send('OK'); // Все равно отвечаем 200, чтобы MacroDroid не повторял запрос
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
