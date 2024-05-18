import { Connection, VersionedTransaction, PublicKey, Keypair } from '@solana/web3.js';
import fetch from 'cross-fetch';
import bs58 from 'bs58';
import { Wallet } from '@project-serum/anchor';
import { getMint } from '@solana/spl-token';
import { SOLANA_RPC_URL, PUBLIC_ADDRESS } from './config.js';
import { getWalletBalance, getTokenDecimals } from './utils.js';

const connection = new Connection(SOLANA_RPC_URL);

export async function performTrade(action, token, amount, chatId, walletInfo) {
  if (!walletInfo) {
    throw new Error('지갑 정보가 없습니다. 먼저 지갑을 생성하세요.');
  }

  // 프라이빗 키로 지갑 생성
  const wallet = new Wallet(
    Keypair.fromSecretKey(bs58.decode(walletInfo.secretKey))
  );

  // 지갑 잔액 확인
  const balance = await getWalletBalance(connection, wallet.publicKey.toString());
  if (balance < 0.001) { // 최소 필요 솔라나 잔액 (예: 0.001 SOL)
    throw new Error('지갑에 충분한 솔라나가 없습니다. 충전 후 다시 시도하세요.');
  }

  // 민트 주소 상수
  const SOL_MINT = "So11111111111111111111111111111111111111112";

  const inputMint = action === 'buy' ? SOL_MINT : token;
  const outputMint = action === 'buy' ? token : SOL_MINT;

  // 토큰의 decimal 값을 가져오기
  const decimals = await getTokenDecimals(connection, token);
  const amountInLowestDenomination = Math.round(parseFloat(amount) * (10 ** decimals));

  const quoteResponse = await (
    await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLowestDenomination}&slippageBps=100&platformFeeBps=20`
    )
  ).json();

  const [feeAccount] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("referral_ata"),
      new PublicKey(PUBLIC_ADDRESS).toBuffer(),
      new PublicKey(outputMint).toBuffer(),
    ],
    new PublicKey("REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3") // 레퍼럴 프로그램
  );

  // get serialized transactions for the swap
  const { swapTransaction } = await (
    await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        feeAccount,
      }),
    })
  ).json();

  const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
  var transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  // 트랜잭션 사인
  transaction.sign([wallet.payer]);

  // Raw 트랜잭션 생성
  const rawTransaction = transaction.serialize();

  // 트랜잭션 실행
  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  console.log("done:", `https://solscan.io/tx/${txid}`);
  return `https://solscan.io/tx/${txid}`;
}
