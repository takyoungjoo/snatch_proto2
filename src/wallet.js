import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const wallets = {};

export function generateNewAccount(chatId) {
  const newAccount = Keypair.generate();
  const publicKey = newAccount.publicKey.toString();
  const secretKey = bs58.encode(newAccount.secretKey);

  console.log("새로운 계정이 생성되었습니다");
  console.log("공개 키:", publicKey);
  console.log("개인 키:", secretKey);

  // 지갑 정보를 메모리에 저장
  wallets[chatId] = { publicKey, secretKey };

  return { publicKey, secretKey };
}

export function getWallet(chatId) {
  return wallets[chatId];
}
