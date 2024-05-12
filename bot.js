import TelegramBot from 'node-telegram-bot-api';
import express from 'express';

const app = express();
const port = 3000;
const token = '6800771837:AAFL04ZxtxCKmnWMa3A9u647DfM-ywRG0Ls'; // 여기에 텔레그램 봇 토큰을 직접 입력하세요.

const bot = new TelegramBot(token, { polling: true });
console.log('Telegram bot has been initialized and started polling...');

// Express.js 서버 설정 및 로깅
app.get('/', (req, res) => {
  console.log('Received HTTP GET request at root.');
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Express server is running on http://localhost:${port}`);
});

// 시작 커맨드 핸들러
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`Received /start command from chat id ${chatId}`);

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Buy/Sell', callback_data: 'buy_sell' }, { text: 'Snipe', callback_data: 'snipe' }],
        [{ text: 'Wallet', callback_data: 'wallet' }, { text: 'Refer', callback_data: 'refer' }, { text: 'Docs', callback_data: 'docs' }],
        [{ text: 'DCA', callback_data: 'dca' }, { text: 'Setting', callback_data: 'setting' }],
        [{ text: 'Dashboard', callback_data: 'dashboard' }, { text: 'News/Channel', callback_data: 'news' }]
      ]
    }
  };

  bot.sendMessage(chatId, '스내치봇 프로토타입 테스트 입니다\nsolana 가격 \nMarket Volume\nWallet address', opts)
    .then(() => {
      console.log(`Message sent to chat id ${chatId}`);
    })
    .catch(error => {
      console.error(`Failed to send message to chat id ${chatId}: ${error}`);
    });
});

// Callback 쿼리 핸들러 및 로그 추가
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;
  console.log(`Received callback query with data ${data} from chat id ${chatId}`);

  switch (data) {
    case 'buy_sell':
      bot.sendMessage(chatId, '구매 또는 판매를 원하는 토큰의 CA를 입력해 주세요:')
        .then(() => console.log(`Responded to callback query from chat id ${chatId}`))
        .catch(error => console.error(`Error responding to callback query from chat id ${chatId}: ${error}`));
      break;
    default:
      bot.sendMessage(chatId, '선택한 명령을 처리하는 중입니다...')
        .then(() => console.log(`Handled default case for chat id ${chatId}`))
        .catch(error => console.error(`Failed to handle default case for chat id ${chatId}: ${error}`));
      break;
  }
});

// 일반 메시지 핸들러 추가
bot.on('message', (msg) => {
  if (msg.text && msg.text.toLowerCase().includes('/start')) {
    console.log('Handling /start internally, skipping duplicate handling.');
    return;  // start 명령은 이미 처리됨
  }
  const chatId = msg.chat.id;
  console.log(`Received a message: "${msg.text}" from chat id ${chatId}`);
  bot.sendMessage(chatId, `메시지를 받았습니다: ${msg.text}`)
    .then(() => console.log(`Replied to message from chat id ${chatId}`))
    .catch(error => console.error(`Failed to send reply to chat id ${chatId}: ${error}`));
});
