import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getMint } from '@solana/spl-token';
import { PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

export async function ensureTokenAccountExists(connection, wallet, tokenMint) {
  const tokenAccountAddress = await getAssociatedTokenAddress(
    new PublicKey(tokenMint),
    wallet.publicKey
  );

  const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);
  if (!tokenAccountInfo) {
    console.log(`연관된 토큰 계정이 존재하지 않습니다. 새로 생성합니다: ${tokenAccountAddress.toString()}`);
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        tokenAccountAddress,
        wallet.publicKey,
        tokenMint
      )
    );

    await sendAndConfirmTransaction(connection, transaction, [wallet.payer]);
    console.log(`연관된 토큰 계정이 생성되었습니다: ${tokenMint}`);
  } else {
    console.log(`연관된 토큰 계정이 이미 존재합니다: ${tokenAccountAddress.toString()}`);
  }

  return tokenAccountAddress;
}

export async function getWalletBalance(connection, publicKey) {
  const balance = await connection.getBalance(new PublicKey(publicKey));
  return balance / 1e9;
}

export async function getTokenDecimals(connection, tokenMint) {
  const mintInfo = await getMint(connection, new PublicKey(tokenMint));
  return mintInfo.decimals;
}
