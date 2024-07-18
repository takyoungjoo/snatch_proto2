import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import { TELEGRAM_BOT_TOKEN } from './src/config.js';
import { handleCallbackQuery, handleMessage } from './src/handlers.js';
import { initializeDatabase } from './src/database.js';

const app = express();
const port = 3000;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log('텔레그램 봇이 초기화되고 폴링을 시작했습니다...');

// 데이터베이스 초기화
initializeDatabase().then(() => {
  console.log('데이터베이스가 초기화되었습니다.');
}).catch(err => {
  console.error('데이터베이스 초기화 중 오류가 발생했습니다:', err);
});

// Express.js 서버 설정 및 로깅
app.get('/', (req, res) => {
  console.log('루트에서 HTTP GET 요청을 받았습니다.');
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Express 서버가 http://localhost:${port}에서 실행 중입니다`);
});

// 시작 커맨드 핸들러
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`채팅 ID ${chatId}로부터 /start 명령을 받았습니다`);

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Buy', callback_data: 'buy' }, { text: 'Sell', callback_data: 'sell' }],
        [{ text: 'Wallet', callback_data: 'wallet' }, { text: 'Refer', callback_data: 'refer' }, { text: 'Settings', callback_data: 'settings' }],
        [{ text: 'DCA', callback_data: 'dca' }, { text: 'Snipe', callback_data: 'snipe' }],
        [{ text: 'DCA Withdraw', callback_data: 'dca_withdraw' }, { text: 'Dashboard', callback_data: 'dashboard' }, { text: 'News/Channel', callback_data: 'news' }],
        [{ text: 'Enter Referral Code', callback_data: 'enter_referral_code' }, { text: 'My Referral Code', callback_data: 'my_referral_code' }, { text: 'Top Referrers', callback_data: 'display_top_referrals' }]
      ]
    }
  };

  bot.sendMessage(chatId, '스내치봇 프로토타입 테스트 입니다', opts)
    .then(() => {
      console.log(`채팅 ID ${chatId}에 메시지를 보냈습니다`);
    })
    .catch(error => {
      console.error(`채팅 ID ${chatId}에 메시지 전송 실패: ${error}`);
    });
});

// 콜백 쿼리 핸들러
bot.on('callback_query', (callbackQuery) => {
  handleCallbackQuery(bot, callbackQuery);
});

// 일반 메시지 핸들러
bot.on('message', (msg) => {
  handleMessage(bot, msg);
});
