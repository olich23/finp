const express = require('express');
const axios = require('axios');
const app = express();

// Глобальный логгер
const logger = {
  log: (...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]`, ...args);
  }
};

// Middleware для логирования входящих запросов
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
    logger.log('Получен chunk данных:', chunk.toString('utf8').slice(0, 100));
  });
  
  req.on('end', () => {
    try {
      req.rawBody = data;
      logger.log('Полное тело запроса:', data.slice(0, 200));
      
      // Пытаемся распарсить JSON, если нет - оставляем как текст
      req.body = data.trim().startsWith('{') ? JSON.parse(data) : data;
      logger.log('Парсинг тела:', typeof req.body);
    } catch (e) {
      req.body = data;
      logger.log('Ошибка парсинга:', e.message);
    }
    next();
  });
});

const BOT_TOKEN = '7581556039:AAHLKcFBAa4sEf_7IzMbJkmgwCzTSR4bYmI';
const CHAT_ID = '7098678847';

// Для хранения последних сообщений
const messageHistory = [];
const MAX_HISTORY = 10;

app.post('/webhook', async (req, res) => {
  const requestId = Math.random().toString(36).slice(2, 8);
  logger.log(`\n=== Начало обработки запроса ${requestId} ===`);
  
  try {
    logger.log('Raw headers:', JSON.stringify(req.headers, null, 2));
    logger.log('Raw body type:', typeof req.body);
    
    // Получаем текст из любого формата
    const rawText = typeof req.body === 'object' 
      ? JSON.stringify(req.body, null, 2) 
      : String(req.body);
    
    logger.log('Исходный текст:', rawText.slice(0, 200));

    // 1. Удаляем временные метки (1:28)
    let cleanText = rawText.replace(/\d{1,2}:\d{2}/g, '');
    logger.log('После удаления времени:', cleanText.slice(0, 200));

    // 2. Удаляем лишние переносы строк
    cleanText = cleanText.split('\n')[0].trim();
    logger.log('После обработки переносов:', cleanText);

    // 3. Проверка на пустоту
    if (!cleanText || cleanText.length < 3) {
      logger.log('Пустое сообщение - пропускаем');
      return res.status(200).send('OK (empty)');
    }

    // 4. Проверка дублей
    const isDuplicate = messageHistory.some(msg => msg.text === cleanText);
    logger.log('Проверка дублей:', isDuplicate ? 'НАЙДЕН ДУБЛЬ' : 'Новый текст');
    
    if (isDuplicate) {
      logger.log('Текст уже был отправлен ранее');
      return res.status(200).send('OK (duplicate)');
    }

    // 5. Сохраняем в историю
    messageHistory.unshift({
      text: cleanText,
      time: new Date().toISOString()
    });
    
    // Ограничиваем размер истории
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.pop();
    }
    
    logger.log('Текущая история:', JSON.stringify(messageHistory, null, 2));

    // 6. Отправка в Telegram
    logger.log('Отправляем в Telegram:', cleanText.slice(0, 100));
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: `📢 ${cleanText.slice(0, 300)}`,
      parse_mode: 'Markdown'
    });
    
    logger.log('Уведомление успешно отправлено');
    res.status(200).send('OK');
  } catch (error) {
    logger.log('ОШИБКА:', error.message);
    logger.log('Stack:', error.stack);
    res.status(200).send('OK');
  } finally {
    logger.log(`=== Завершение обработки запроса ${requestId} ===\n`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.log(`Сервер запущен на порту ${PORT}`);
  logger.log('Пример лога:');
  logger.log({
    level: 'info',
    message: 'Система логирования активирована',
    timestamp: new Date().toISOString()
  });
});
