import { PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

export async function getTokenDecimals(connection, tokenAddress) {
  const tokenPublicKey = new PublicKey(tokenAddress);
  const mintInfo = await getMint(connection, tokenPublicKey);
  return mintInfo.decimals;
}

export async function getWalletBalance(connection, walletAddress) {
  const balance = await connection.getBalance(new PublicKey(walletAddress));
  return balance / 1e9; 
}
