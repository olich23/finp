const express = require('express');
const axios = require('axios');
const app = express();

// Конфигурация
const BOT_TOKEN = '7581556039:AAHLKcFBAa4sEf_7IzMbJkmgwCzTSR4bYmI';
const CHAT_ID = '7098678847';
const IGNORE_PREFIX = '📢'; // Префикс, который добавляет бот

// Логгер
const log = (...args) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
};

// Middleware для обработки входящих данных
app.use(express.text({ type: '*/*' }));

// Хранилище последних сообщений
const messageStore = new Set();
const MAX_STORE_SIZE = 100;

app.post('/webhook', async (req, res) => {
  const rawText = req.body;
  log('Получено сообщение:', rawText.slice(0, 100));

  try {
    // 1. Игнорируем сообщения от самого бота
    if (rawText.startsWith(IGNORE_PREFIX)) {
      log('Игнорируем сообщение от бота');
      return res.status(200).send('OK (ignored)');
    }

    // 2. Очистка текста
    const cleanText = rawText
      .replace(/\d{1,2}:\d{2}/g, '') // Удаляем время
      .replace(/[-\•\*\[\]]/g, '')   // Удаляем спецсимволы
      .replace(/\s+/g, ' ')          // Нормализуем пробелы
      .trim();

    // 3. Проверка на пустоту
    if (cleanText.length < 3) {
      log('Пустое сообщение после очистки');
      return res.status(200).send('OK (empty)');
    }

    // 4. Проверка дублей
    const textHash = require('crypto')
      .createHash('md5')
      .update(cleanText)
      .digest('hex');

    if (messageStore.has(textHash)) {
      log('Обнаружен дубль:', cleanText.slice(0, 50));
      return res.status(200).send('OK (duplicate)');
    }

    // 5. Сохраняем сообщение
    messageStore.add(textHash);
    if (messageStore.size > MAX_STORE_SIZE) {
      const first = messageStore.values().next().value;
      messageStore.delete(first);
    }

    // 6. Отправка в Telegram
    log('Отправляем в Telegram:', cleanText.slice(0, 50));
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: cleanText.slice(0, 300), // Без префикса!
      parse_mode: 'Markdown',
      disable_notification: false
    });

    res.status(200).send('OK');
  } catch (error) {
    log('Ошибка:', error.message);
    res.status(200).send('OK');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => log(`Сервер запущен на порту ${PORT}`));
