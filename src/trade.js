import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import bs58 from 'bs58';
import { Wallet } from '@project-serum/anchor';
import { SOLANA_RPC_URL } from './config.js';
import { getWalletBalance, getTokenDecimals } from './utils.js';

const connection = new Connection(SOLANA_RPC_URL);

export async function performTrade(action, token, amount, chatId, walletInfo, slippageBps = 100) {
  if (!walletInfo) {
    throw new Error('지갑 정보가 없습니다. 먼저 지갑을 생성하세요.');
  }

  // 프라이빗 키로 지갑 생성
  const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(walletInfo.secretKey)));

  // 지갑 잔액 확인
  const balance = await getWalletBalance(connection, wallet.publicKey.toString());
  if (balance < 0.001) {
    throw new Error('지갑에 충분한 솔라나가 없습니다. 충전 후 다시 시도하세요.');
  }

  console.log(`지갑 잔액: ${balance} SOL`);

  const SOL_MINT = "So11111111111111111111111111111111111111112";
  const inputMint = action === 'buy' ? SOL_MINT : token;
  const outputMint = action === 'buy' ? token : SOL_MINT;

  if (!inputMint || !outputMint) {
    throw new Error('토큰 민트 주소가 올바르지 않습니다.');
  }

  // 토큰의 decimal 값을 가져오기
  const decimals = await getTokenDecimals(connection, token);
  const amountInLowestDenomination = Math.round(parseFloat(amount) * (10 ** decimals));

  console.log(`거래할 토큰의 CA: ${token}`);
  console.log(`거래할 수량 (소수점 단위 변환): ${amountInLowestDenomination}`);

  const quoteResponse = await (
    await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLowestDenomination}&slippageBps=${slippageBps}`
    )
  ).json();

  console.log(`쿼트 응답:`, quoteResponse);

  if (!wallet.publicKey || !outputMint) {
    throw new Error('유효하지 않은 공용키 또는 출력 민트 주소입니다.');
  }

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

  console.log(`스왑 트랜잭션:`, swapTransaction);

  const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  // 최신 블록해시 가져오기
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
  // 트랜잭션에 블록해시 설정
  transaction.message.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

  transaction.sign([wallet.payer]);

  const rawTransaction = transaction.serialize();

  console.log(`트랜잭션 서명 완료`);

  try {
    const simulationResult = await connection.simulateTransaction(transaction);
    if (simulationResult.value.err) {
      console.error('트랜잭션 시뮬레이션 오류:', simulationResult.value.err);
      throw new Error(`트랜잭션 시뮬레이션 오류: ${simulationResult.value.err}`);
    }

    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    console.log("done:", `https://solscan.io/tx/${txid}`);
    return `https://solscan.io/tx/${txid}`;
  } catch (error) {
    console.error(`트랜잭션 전송 오류: ${error}`);
    throw new Error(`거래 처리 중 오류가 발생했습니다: ${error.message}`);
  }
}
