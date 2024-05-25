import { Connection, VersionedTransaction, PublicKey, Keypair } from '@solana/web3.js';
import fetch from 'cross-fetch';
import bs58 from 'bs58';
import { Wallet } from '@project-serum/anchor';
import { getTokenDecimals, getWalletBalance } from './utils.js';
import { SOLANA_RPC_URL } from './config.js';

const connection = new Connection(SOLANA_RPC_URL);

export async function snipeToken(token, amount, chatId, walletInfo, slippageBps = 100) {
  if (!walletInfo) {
    throw new Error('지갑 정보가 없습니다. 먼저 지갑을 생성하세요.');
  }

  const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(walletInfo.secretKey)));

  const balance = await getWalletBalance(connection, wallet.publicKey.toString());
  if (balance < 0.001) {
    throw new Error('지갑에 충분한 솔라나가 없습니다. 충전 후 다시 시도하세요.');
  }

  const SOL_MINT = "So11111111111111111111111111111111111111112";
  const inputMint = SOL_MINT;
  const outputMint = token;

  if (!inputMint || !outputMint) {
    throw new Error('토큰 민트 주소가 올바르지 않습니다.');
  }

  const decimals = await getTokenDecimals(connection, token);
  const amountInLowestDenomination = Math.round(parseFloat(amount) * (10 ** decimals));

  const maxAttempts = 10; // 최대 시도 횟수
  let attempts = 0;
  let txid = null;

  while (!txid && attempts < maxAttempts) {
    attempts += 1;
    try {
      const quoteResponse = await (
        await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLowestDenomination}&slippageBps=${slippageBps}`
        )
      ).json();

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
          }),
        })
      ).json();

      const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // 최신 블록해시 가져오기
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.message.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      transaction.sign([wallet.payer]);

      const rawTransaction = transaction.serialize();

      console.log(`트랜잭션 서명 완료`);

      // 트랜잭션 시뮬레이션
      const simulationResult = await connection.simulateTransaction(transaction);
      if (simulationResult.value.err) {
        console.error('트랜잭션 시뮬레이션 오류:', simulationResult.value.err);
        throw new Error(`트랜잭션 시뮬레이션 오류: ${simulationResult.value.err}`);
      }

      txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      console.log(`Transaction successful: https://solscan.io/tx/${txid}`);
    } catch (error) {
      console.error(`Transaction failed, retrying... (${attempts}/${maxAttempts}) Error: ${error.message}`);
      if (attempts >= maxAttempts) {
        throw new Error('Maximum retry attempts reached. Transaction failed.');
      }
    }
  }

  return `https://solscan.io/tx/${txid}`;
}
