import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { dbPromise } from './database.js';
import { SOLANA_RPC_URL } from './config.js';

const connection = new Connection(SOLANA_RPC_URL);

export async function generateNewAccount(chatId) {
  const existingWallet = await getWallet(chatId);
  if (existingWallet) {
    console.log(`채팅 ID ${chatId}에 대한 기존 지갑이 존재합니다. 새로운 지갑을 생성하지 않습니다.`);
    return existingWallet;
  }

  const newAccount = Keypair.generate();
  const publicKey = newAccount.publicKey.toString();
  const secretKey = bs58.encode(newAccount.secretKey);

  console.log("새로운 계정이 생성되었습니다");
  console.log("공개 키:", publicKey);
  console.log("개인 키:", secretKey);

  const db = await dbPromise;
  await db.run('INSERT INTO wallets (chatId, publicKey, secretKey) VALUES (?, ?, ?)', chatId.toString(), publicKey, secretKey);

  // 데이터베이스에 저장된 결과를 로그로 확인
  const storedWallet = await getWallet(chatId);
  console.log(`저장된 지갑 정보:`, storedWallet);

  return { publicKey, secretKey };
}

export async function getWallet(chatId) {
  const db = await dbPromise;
  const row = await db.get('SELECT publicKey, secretKey FROM wallets WHERE chatId = ?', chatId.toString());
  // 데이터베이스에서 가져온 결과를 로그로 확인
  console.log(`검색된 지갑 정보 (채팅 ID: ${chatId}):`, row);
  return row ? { publicKey: row.publicKey, secretKey: row.secretKey } : null;
}

export async function getWalletBalance(publicKey) {
  const balance = await connection.getBalance(new PublicKey(publicKey));
  return balance / 1e9;
}
