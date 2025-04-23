const express = require('express');
const axios = require('axios');
const app = express();

// Полностью отключаем все парсеры
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
});

const BOT_TOKEN = '7581556039:AAHLKcFBAa4sEf_7IzMbJkmgwCzTSR4bYmI';
const CHAT_ID = '7098678847';

// Простейший кэш последних сообщений
const lastMessage = { text: '', time: 0 };

app.post('/webhook', async (req, res) => {
  try {
    // Берем только первые 300 символов
    const rawText = req.rawBody.toString().slice(0, 300);
    
    // 1. Удаляем всё после последнего перевода строки
    let cleanText = rawText.split('\n')[0];
    
    // 2. Если есть маркеры списка (-, •, *) - берем текст после первого маркера
    const bulletPoints = ['- ', '• ', '* '];
    bulletPoints.forEach(marker => {
      if (cleanText.includes(marker)) {
        cleanText = cleanText.split(marker).pop();
      }
    });
    
    // 3. Удаляем временные метки (1:25)
    cleanText = cleanText.replace(/\d{1,2}:\d{2}/g, '').trim();
    
    // 4. Защита от дублей (если текст не изменился и прошло < 5 сек)
    const now = Date.now();
    if (cleanText === lastMessage.text && now - lastMessage.time < 5000) {
      return res.status(200).send('OK (duplicate)');
    }
    
    // 5. Обновляем кэш
    lastMessage.text = cleanText;
    lastMessage.time = now;
    
    // 6. Отправляем только если текст не пустой
    if (cleanText.length > 3) {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        text: `📢 ${cleanText}`,
        parse_mode: 'Markdown'
      });
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(200).send('OK');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
