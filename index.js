const express = require('express');
const axios = require('axios');
const app = express();

// Парсим JSON и form-data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BOT_TOKEN = '7581556039:AAHLKcFBAa4sEf_7IzMbJkmgwCzTSR4bYmI';
const CHAT_ID = '7098678847'; // Ваш Chat ID

app.post('/webhook', async (req, res) => {
  try {
    // Данные от MacroDroid (поддерживает JSON и form-data)
    const text = req.body.text || req.body; // Если text - строка
    const title = req.body.title || '';

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: `🔔 Уведомление: ${text}\nПриложение: ${title}`,
    });
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(500).send('Ошибка сервера');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
