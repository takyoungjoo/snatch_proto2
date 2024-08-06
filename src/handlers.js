import { generateNewAccount, getWallet, getWalletBalance } from './wallet.js';
import { performTrade } from './trade.js';
import { createDCA, withdrawDCA } from './dca.js';
import { snipeToken } from './snipe.js';
import { getSlippage, setSlippage, getCurrentSlippage } from './settings.js';
import {getReferralCodeForUser, getTopReferrals, processReferral} from "./referral.js";

const tradeContext = {};
const dcaContext = {};
const referralContext = {};
const settingsContext = {};

export async function handleCallbackQuery(bot, callbackQuery) {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;
  console.log(`채팅 ID ${chatId}로부터 ${data} 데이터가 포함된 콜백 쿼리를 받았습니다`);

  switch (data) {
    case 'wallet':
      let wallet = await getWallet(chatId);
      if (!wallet) {
        wallet = await generateNewAccount(chatId);
        console.log(`채팅 ID ${chatId}에 대한 새 지갑을 생성하고 저장합니다`);
      } else {
        console.log(`채팅 ID ${chatId}에 대한 기존 지갑 정보를 반환합니다`);
      }

      const balance = await getWalletBalance(wallet.publicKey);
      await bot.sendMessage(chatId, `지갑 정보:\nPublic Key: ${wallet.publicKey}\nPrivate Key: ${wallet.secretKey}\nSolana 잔액: ${balance} SOL`)
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
        const wallet = await getWallet(chatId);
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
    case 'enter_referral_code':
      referralContext[chatId] = {};
      await bot.sendMessage(chatId, '리퍼럴 코드를 입력해 주세요 (1인 1회로 제한됩니다):')
        .then(() => console.log(`채팅 ID ${chatId}의 ${data} 콜백 쿼리에 응답했습니다`))
        .catch(error => console.error(`채팅 ID ${chatId}의 ${data} 콜백 쿼리 응답 오류: ${error}`));
      break;
    case 'my_referral_code':
      console.log(chatId);
      // const myReferralCode = "";
      const myReferralCode = await getReferralCodeForUser(chatId);
      await bot.sendMessage(chatId, '나의 리퍼럴 코드를 다른사람들과 공유하세요: ' + myReferralCode);
      break;
    // case 'display_top_referrals':
    //   const TOP_REFERRALS = 10;
    //   const topReferrals = await getTopReferrals(TOP_REFERRALS);
    //   break;
    case 'dashboard':
    case 'news':
      await bot.sendMessage(chatId, '곧 업데이트 될 기능입니다.')
        .then(() => console.log(`채팅 ID ${chatId}의 ${data} 콜백 쿼리에 응답했습니다`))
        .catch(error => console.error(`채팅 ID ${chatId}의 ${data} 콜백 쿼리 응답 오류: ${error}`));
      break;
    case 'settings':
      settingsContext[chatId] = {};
      const currentSlippage = await getCurrentSlippage(chatId);
      await bot.sendMessage(chatId, `설정할 슬리피지 값을 입력해 주세요 (현재값: ${currentSlippage}):`)
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

  let referralCodeToProcess = "";
  if (msg.text && msg.text.toLowerCase().includes('/process_referral_code')) {
    let texts = msg.text.split(' ');
    if (texts.length !== 2) {
      await bot.sendMessage(chatId, '유효한 명령이 아닙니다. 예시: /process_referral_code a1b2c3d4e5f6')
      console.log('유효한 명령이 아닙니다. 예시: /process_referral_code a1b2c3d4e5f6');
      return;
    }

    referralCodeToProcess = texts[1];
  }

  if (referralContext[chatId]) {
    referralCodeToProcess = msg.text.trim();
  }

  if (referralCodeToProcess !== "") {
    const result = await processReferral(chatId, referralCodeToProcess);
    if (result > 0) {
      await bot.sendMessage(chatId, '리퍼럴 코드가 정상 처리되었습니다.')
    }
    else {
      await bot.sendMessage(chatId, '리퍼럴 코드를 처리하는동안 오류가 발생했습니다.')
    }
    return;
  }


  if (referralContext[chatId]) {
    const referralCodeToProcess = msg.text.trim();

  }



  if (settingsContext[chatId]) {
    const slippageBps = parseInt(msg.text.trim(), 10);
    if (isNaN(slippageBps)) {
      await bot.sendMessage(chatId, '유효한 슬리피지 값을 입력해 주세요 (숫자).')
        .then(() => console.log(`채팅 ID ${chatId}에 유효한 슬리피지 값을 입력하도록 요청했습니다`))
        .catch(error => console.error(`채팅 ID ${chatId}에 유효한 슬리피지 값 요청 실패: ${error}`));
    } else {
      await setSlippage(chatId, slippageBps);
      await bot.sendMessage(chatId, `슬리피지 값이 ${slippageBps}로 설정되었습니다.`)
        .then(() => console.log(`채팅 ID ${chatId}에 슬리피지 값을 설정했습니다`))
        .catch(error => console.error(`채팅 ID ${chatId}에 슬리피지 값 설정 실패: ${error}`));
      delete settingsContext[chatId];
    }
    return;
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
      const wallet = await getWallet(chatId);
      const slippageBps = await getSlippage(chatId);
      if (action === 'snipe') {
        const result = await snipeToken(token, amount, chatId, wallet, slippageBps);
        await bot.sendMessage(chatId, `스나이프 완료: ${result}`);
      } else {
        const result = await performTrade(action, token, amount, chatId, wallet, slippageBps);
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
      const wallet = await getWallet(chatId);
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
