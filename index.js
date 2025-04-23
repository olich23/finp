const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const BOT_TOKEN = '7581556039:AAHLKcFBAa4sEf_7IzMbJkmgwCzTSR4bYmI'; // Например: '123456:ABC-DEF1234ghIkl'
const CHAT_ID = '7098678847';      // Число, например 7098678847

// Вебхук для приёма данных от MacroDroid
app.post('/webhook', async (req, res) => {
  const { text } = req.body;
  
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: `🔔 Уведомление: ${text || 'Нет текста'}`,
    });
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
