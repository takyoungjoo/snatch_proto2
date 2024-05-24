// import TelegramBot from 'node-telegram-bot-api';
// import express from 'express';
// import dotenv from 'dotenv';
// import { Keypair, Connection, VersionedTransaction, PublicKey } from '@solana/web3.js';
// import fetch from 'cross-fetch';
// import { Wallet } from '@project-serum/anchor';
// import bs58 from 'bs58';
// import { getMint } from '@solana/spl-token';

// dotenv.config();

// const app = express();
// const port = 3000;
// const token = process.env.TELEGRAM_BOT_TOKEN;

// const bot = new TelegramBot(token, { polling: true });
// console.log('텔레그램 봇이 초기화되고 폴링을 시작했습니다...');

// // 지갑 정보를 저장할 메모리 내 객체
// const wallets = {};
// const tradeContext = {};

// // 새로운 지갑을 생성하고 메모리에 저장하는 함수
// function generateNewAccount(chatId) {
//   const newAccount = Keypair.generate();
//   const publicKey = newAccount.publicKey.toString();
//   const secretKey = bs58.encode(newAccount.secretKey);

//   console.log("새로운 계정이 생성되었습니다");
//   console.log("공개 키:", publicKey);
//   console.log("개인 키:", secretKey);

//   // 지갑 정보를 메모리에 저장
//   wallets[chatId] = { publicKey, secretKey };

//   return { publicKey, secretKey };
// }

// // Express.js 서버 설정 및 로깅
// app.get('/', (req, res) => {
//   console.log('루트에서 HTTP GET 요청을 받았습니다.');
//   res.send('Hello World!');
// });

// app.listen(port, () => {
//   console.log(`Express 서버가 http://localhost:${port}에서 실행 중입니다`);
// });

// // 시작 커맨드 핸들러
// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   console.log(`채팅 ID ${chatId}로부터 /start 명령을 받았습니다`);

//   const opts = {
//     reply_markup: {
//       inline_keyboard: [
//         [{ text: 'Buy', callback_data: 'buy' }, { text: 'Sell', callback_data: 'sell' }],
//         [{ text: 'Wallet', callback_data: 'wallet' }, { text: 'Refer', callback_data: 'refer' }, { text: 'Settings', callback_data: 'settings' }],
//         [{ text: 'DCA', callback_data: 'dca' }, { text: 'Snipe', callback_data: 'snipe' }],
//         [{ text: 'Dashboard', callback_data: 'dashboard' }, { text: 'News/Channel', callback_data: 'news' }]
//       ]
//     }
//   };

//   bot.sendMessage(chatId, '스내치봇 프로토타입 테스트 입니다\nsolana 가격 \nMarket Volume\nWallet address', opts)
//     .then(() => {
//       console.log(`채팅 ID ${chatId}에 메시지를 보냈습니다`);
//     })
//     .catch(error => {
//       console.error(`채팅 ID ${chatId}에 메시지 전송 실패: ${error}`);
//     });
// });

// // Callback 쿼리 핸들러 및 로그 추가
// bot.on('callback_query', (callbackQuery) => {
//   const message = callbackQuery.message;
//   const chatId = message.chat.id;
//   const data = callbackQuery.data;
//   console.log(`채팅 ID ${chatId}로부터 ${data} 데이터가 포함된 콜백 쿼리를 받았습니다`);

//   switch (data) {
//     case 'wallet':
//       let wallet;
//       if (wallets[chatId]) {
//         wallet = wallets[chatId];
//         console.log(`채팅 ID ${chatId}에 대한 기존 지갑 정보를 반환합니다`);
//       } else {
//         wallet = generateNewAccount(chatId);
//         console.log(`채팅 ID ${chatId}에 대한 새 지갑을 생성하고 저장합니다`);
//       }
//       bot.sendMessage(chatId, `지갑 정보:\nPublic Key: ${wallet.publicKey}\nPrivate Key: ${wallet.secretKey}`)
//         .then(() => console.log(`채팅 ID ${chatId}에 지갑 정보를 보냈습니다`))
//         .catch(error => console.error(`채팅 ID ${chatId}에 지갑 정보 전송 실패: ${error}`));
//       break;
//     case 'buy':
//     case 'sell':
//       tradeContext[chatId] = { action: data };
//       bot.sendMessage(chatId, '거래할 토큰의 CA를 입력해 주세요:')
//         .then(() => console.log(`채팅 ID ${chatId}의 ${data} 콜백 쿼리에 응답했습니다`))
//         .catch(error => console.error(`채팅 ID ${chatId}의 ${data} 콜백 쿼리 응답 오류: ${error}`));
//       break;
//     case 'settings':
//       bot.sendMessage(chatId, '설정을 여기에 추가하세요.')
//         .then(() => console.log(`채팅 ID ${chatId}의 settings 콜백 쿼리에 응답했습니다`))
//         .catch(error => console.error(`채팅 ID ${chatId}의 settings 콜백 쿼리 응답 오류: ${error}`));
//       break;
//     case 'snipe':
//       bot.sendMessage(chatId, '스나이프 기능을 여기에 추가하세요.')
//         .then(() => console.log(`채팅 ID ${chatId}의 snipe 콜백 쿼리에 응답했습니다`))
//         .catch(error => console.error(`채팅 ID ${chatId}의 snipe 콜백 쿼리 응답 오류: ${error}`));
//       break;
//     default:
//       bot.sendMessage(chatId, '선택한 명령을 처리하는 중입니다...')
//         .then(() => console.log(`채팅 ID ${chatId}의 기본 케이스를 처리했습니다`))
//         .catch(error => console.error(`채팅 ID ${chatId}의 기본 케이스 처리 실패: ${error}`));
//       break;
//   }
// });

// // 일반 메시지 핸들러 추가
// bot.on('message', async (msg) => {
//   const chatId = msg.chat.id;

//   if (msg.text && msg.text.toLowerCase().includes('/start')) {
//     console.log('/start 명령을 내부적으로 처리 중, 중복 처리를 건너뜁니다.');
//     return;  // start 명령은 이미 처리됨
//   }

//   if (tradeContext[chatId] && !tradeContext[chatId].token) {
//     tradeContext[chatId].token = msg.text.trim();
//     bot.sendMessage(chatId, `거래할 수량을 입력해 주세요:`)
//       .then(() => console.log(`채팅 ID ${chatId}의 토큰 주소를 저장했습니다: ${tradeContext[chatId].token}`))
//       .catch(error => console.error(`채팅 ID ${chatId}의 토큰 주소 저장 실패: ${error}`));
//     return;
//   }

//   if (tradeContext[chatId] && tradeContext[chatId].token && !tradeContext[chatId].amount) {
//     tradeContext[chatId].amount = msg.text.trim();
//     const { action, token, amount } = tradeContext[chatId];
//     try {
//       await performTrade(action, token, amount, chatId);
//       delete tradeContext[chatId];
//     } catch (error) {
//       console.error(`채팅 ID ${chatId}의 거래 처리 실패: ${error}`);
//       bot.sendMessage(chatId, `거래 처리 중 오류가 발생했습니다: ${error.message}`);
//       delete tradeContext[chatId];
//     }
//     return;
//   }

//   console.log(`채팅 ID ${chatId}로부터 "${msg.text}" 메시지를 받았습니다`);
//   bot.sendMessage(chatId, `메시지를 받았습니다: ${msg.text}`)
//     .then(() => console.log(`채팅 ID ${chatId}의 메시지에 응답했습니다`))
//     .catch(error => console.error(`채팅 ID ${chatId}에 대한 응답 전송 실패: ${error}`));
// });

// async function getTokenDecimals(connection, tokenAddress) {
//   const tokenPublicKey = new PublicKey(tokenAddress);
//   const mintInfo = await getMint(connection, tokenPublicKey);
//   return mintInfo.decimals;
// }

// async function getWalletBalance(connection, walletAddress) {
//   const balance = await connection.getBalance(new PublicKey(walletAddress));
//   return balance / 1e9; // Lamports to SOL
// }

// async function performTrade(action, token, amount, chatId) {
//   // 지갑 정보 가져오기
//   const walletInfo = wallets[chatId];
//   if (!walletInfo) {
//     throw new Error('지갑 정보가 없습니다. 먼저 지갑을 생성하세요.');
//   }

//   // 프라이빗 키로 지갑 생성
//   const wallet = new Wallet(
//     Keypair.fromSecretKey(bs58.decode(walletInfo.secretKey))
//   );

//   // RPC 설정
//   const connection = new Connection("https://api.mainnet-beta.solana.com/");

//   // 지갑 잔액 확인
//   const balance = await getWalletBalance(connection, wallet.publicKey.toString());
//   if (balance < 0.001) { // 최소 필요 솔라나 잔액 (예: 0.001 SOL)
//     throw new Error('지갑에 충분한 솔라나가 없습니다. 충전 후 다시 시도하세요.');
//   }

//   // 민트 주소 상수
//   const SOL_MINT = "So11111111111111111111111111111111111111112";

//   const inputMint = action === 'buy' ? SOL_MINT : token;
//   const outputMint = action === 'buy' ? token : SOL_MINT;

//   // 토큰의 decimal 값을 가져오기
//   const decimals = await getTokenDecimals(connection, token);
//   const amountInLowestDenomination = Math.round(parseFloat(amount) * (10 ** decimals));

//   // 레퍼럴 퍼블릭 주소
//   const PUBLIC_ADDRESS = "3xzm13sJ45fHG63TLZRUcXMemuKDymMZyKD3FNTGKaZA";

//   const quoteResponse = await (
//     await fetch(
//       `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLowestDenomination}&slippageBps=100&platformFeeBps=20`
//     )
//   ).json();

//   const [feeAccount] = await PublicKey.findProgramAddressSync(
//     [
//       Buffer.from("referral_ata"),
//       new PublicKey(PUBLIC_ADDRESS).toBuffer(),
//       new PublicKey(outputMint).toBuffer(),
//     ],
//     new PublicKey("REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3") // 레퍼럴 프로그램
//   );

//   // get serialized transactions for the swap
//   const { swapTransaction } = await (
//     await fetch("https://quote-api.jup.ag/v6/swap", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         quoteResponse,
//         userPublicKey: wallet.publicKey.toString(),
//         wrapAndUnwrapSol: true,
//         feeAccount,
//       }),
//     })
//   ).json();

//   const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
//   var transaction = VersionedTransaction.deserialize(swapTransactionBuf);

//   // 트랜잭션 사인
//   transaction.sign([wallet.payer]);

//   // Raw 트랜잭션 생성
//   const rawTransaction = transaction.serialize();

//   // 트랜잭션 실행
//   const txid = await connection.sendRawTransaction(rawTransaction, {
//     skipPreflight: false,
//     preflightCommitment: "confirmed",
//   });

//   console.log("done:", `https://solscan.io/tx/${txid}`);
//   bot.sendMessage(chatId, `거래 완료: https://solscan.io/tx/${txid}`)
//     .then(() => console.log(`채팅 ID ${chatId}에 거래 완료 메시지를 보냈습니다`))
//     .catch(error => console.error(`채팅 ID ${chatId}에 거래 완료 메시지 전송 실패: ${error}`));
// }
