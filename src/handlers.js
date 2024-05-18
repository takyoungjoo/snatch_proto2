import { generateNewAccount, getWallet } from './wallet.js';
import { performTrade } from './trade.js';
import { createDCA, withdrawDCA } from './dca.js';
import { snipeToken } from './snipe.js';

const tradeContext = {};
const dcaContext = {};

export async function handleCallbackQuery(bot, callbackQuery) {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;
  console.log(`채팅 ID ${chatId}로부터 ${data} 데이터가 포함된 콜백 쿼리를 받았습니다`);

  switch (data) {
    case 'wallet':
      let wallet;
      if (getWallet(chatId)) {
        wallet = getWallet(chatId);
        console.log(`채팅 ID ${chatId}에 대한 기존 지갑 정보를 반환합니다`);
      } else {
        wallet = generateNewAccount(chatId);
        console.log(`채팅 ID ${chatId}에 대한 새 지갑을 생성하고 저장합니다`);
      }
      await bot.sendMessage(chatId, `지갑 정보:\nPublic Key: ${wallet.publicKey}\nPrivate Key: ${wallet.secretKey}`)
        .then(() => console.log(`채팅 ID ${chatId}에 지갑 정보를 보냈습니다`))
        .catch(error => console.error(`채팅 ID ${chatId}에 지갑 정보 전송 실패: ${error}`));
      break;
    case 'buy':
    case 'sell':
      tradeContext[chatId] = { action: data };
      await bot.sendMessage(chatId, '거래할 토큰의 CA를 입력해 주세요:')
        .then(() => console.log(`채팅 ID ${chatId}의 ${data} 콜백 쿼리에 응답했습니다`))
        .catch(error => console.error(`채팅 ID ${chatId}의 ${data} 콜백 쿼리 응답 오류: ${error}`));
      break;
    case 'dca':
      dcaContext[chatId] = {};
      await bot.sendMessage(chatId, '거래할 토큰의 CA를 입력해 주세요:')
        .then(() => console.log(`채팅 ID ${chatId}의 ${data} 콜백 쿼리에 응답했습니다`))
        .catch(error => console.error(`채팅 ID ${chatId}의 ${data} 콜백 쿼리 응답 오류: ${error}`));
      break;
    case 'dca_withdraw':
      try {
        const wallet = getWallet(chatId);
        const result = await withdrawDCA(chatId, wallet);
        await bot.sendMessage(chatId, `DCA 인출 완료: ${result}`);
      } catch (error) {
        console.error(`채팅 ID ${chatId}의 DCA 인출 실패: ${error}`);
        await bot.sendMessage(chatId, `DCA 인출 중 오류가 발생했습니다: ${error.message}`);
      }
      break;
    case 'snipe':
      tradeContext[chatId] = { action: 'snipe' };
      await bot.sendMessage(chatId, '스나이프할 토큰의 CA를 입력해 주세요:')
        .then(() => console.log(`채팅 ID ${chatId}의 ${data} 콜백 쿼리에 응답했습니다`))
        .catch(error => console.error(`채팅 ID ${chatId}의 ${data} 콜백 쿼리 응답 오류: ${error}`));
      break;
    case 'settings':
      await bot.sendMessage(chatId, '설정을 여기에 추가하세요.')
        .then(() => console.log(`채팅 ID ${chatId}의 settings 콜백 쿼리에 응답했습니다`))
        .catch(error => console.error(`채팅 ID ${chatId}의 settings 콜백 쿼리 응답 오류: ${error}`));
      break;
    default:
      await bot.sendMessage(chatId, '선택한 명령을 처리하는 중입니다...')
        .then(() => console.log(`채팅 ID ${chatId}의 기본 케이스를 처리했습니다`))
        .catch(error => console.error(`채팅 ID ${chatId}의 기본 케이스 처리 실패: ${error}`));
      break;
  }
}

export async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;

  if (msg.text && msg.text.toLowerCase().includes('/start')) {
    console.log('/start 명령을 내부적으로 처리 중, 중복 처리를 건너뜁니다.');
    return;  // start 명령은 이미 처리됨
  }

  if (tradeContext[chatId] && !tradeContext[chatId].token) {
    tradeContext[chatId].token = msg.text.trim();
    await bot.sendMessage(chatId, `거래할 수량을 입력해 주세요:`)
      .then(() => console.log(`채팅 ID ${chatId}의 토큰 주소를 저장했습니다: ${tradeContext[chatId].token}`))
      .catch(error => console.error(`채팅 ID ${chatId}의 토큰 주소 저장 실패: ${error}`));
    return;
  }

  if (tradeContext[chatId] && tradeContext[chatId].token && !tradeContext[chatId].amount) {
    tradeContext[chatId].amount = msg.text.trim();
    const { action, token, amount } = tradeContext[chatId];
    try {
      const wallet = getWallet(chatId);
      if (action === 'snipe') {
        const result = await snipeToken(token, amount, chatId, wallet);
        await bot.sendMessage(chatId, `스나이프 완료: ${result}`);
      } else {
        const result = await performTrade(action, token, amount, chatId, wallet);
        await bot.sendMessage(chatId, `거래 완료: ${result}`);
      }
      delete tradeContext[chatId];
    } catch (error) {
      console.error(`채팅 ID ${chatId}의 거래 처리 실패: ${error}`);
      await bot.sendMessage(chatId, `거래 처리 중 오류가 발생했습니다: ${error.message}`);
      delete tradeContext[chatId];
    }
    return;
  }

  if (dcaContext[chatId] && !dcaContext[chatId].token) {
    dcaContext[chatId].token = msg.text.trim();
    await bot.sendMessage(chatId, `총 금액을 입력해 주세요:`)
      .then(() => console.log(`채팅 ID ${chatId}의 DCA 토큰 주소를 저장했습니다: ${dcaContext[chatId].token}`))
      .catch(error => console.error(`채팅 ID ${chatId}의 DCA 토큰 주소 저장 실패: ${error}`));
    return;
  }

  if (dcaContext[chatId] && dcaContext[chatId].token && !dcaContext[chatId].totalAmount) {
    dcaContext[chatId].totalAmount = msg.text.trim();
    await bot.sendMessage(chatId, `주기를 입력해 주세요 (일 단위):`)
      .then(() => console.log(`채팅 ID ${chatId}의 DCA 총 금액을 저장했습니다: ${dcaContext[chatId].totalAmount}`))
      .catch(error => console.error(`채팅 ID ${chatId}의 DCA 총 금액 저장 실패: ${error}`));
    return;
  }

  if (dcaContext[chatId] && dcaContext[chatId].token && dcaContext[chatId].totalAmount && !dcaContext[chatId].period) {
    dcaContext[chatId].period = parseInt(msg.text.trim(), 10);
    const { token, totalAmount, period } = dcaContext[chatId];
    try {
      const wallet = getWallet(chatId);
      const result = await createDCA(token, totalAmount, period, chatId, wallet);
      await bot.sendMessage(chatId, `DCA 계약 생성 완료: ${result}`);
      delete dcaContext[chatId];
    } catch (error) {
      console.error(`채팅 ID ${chatId}의 DCA 계약 생성 실패: ${error}`);
      await bot.sendMessage(chatId, `DCA 계약 생성 중 오류가 발생했습니다: ${error.message}`);
      delete dcaContext[chatId];
    }
    return;
  }

  console.log(`채팅 ID ${chatId}로부터 "${msg.text}" 메시지를 받았습니다`);
  await bot.sendMessage(chatId, `메시지를 받았습니다: ${msg.text}`)
    .then(() => console.log(`채팅 ID ${chatId}의 메시지에 응답했습니다`))
    .catch(error => console.error(`채팅 ID ${chatId}에 대한 응답 전송 실패: ${error}`));
}
