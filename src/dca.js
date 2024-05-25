import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import { DCA, Network } from '@jup-ag/dca-sdk';
import bs58 from 'bs58';
import { SOLANA_RPC_URL } from './config.js';
import { getTokenDecimals } from './utils.js';
import { dbPromise } from './database.js';

const connection = new Connection(SOLANA_RPC_URL);

export async function createDCA(token, totalAmount, period, chatId, walletInfo) {
  if (!walletInfo) {
    throw new Error('지갑 정보가 없습니다. 먼저 지갑을 생성하세요.');
  }

  const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(walletInfo.secretKey)));

  const SOL_MINT = "So11111111111111111111111111111111111111112";

  const dca = new DCA(connection, Network.MAINNET);

  const decimals = await getTokenDecimals(connection, token);
  const inAmount = BigInt(Math.round(parseFloat(totalAmount) * (10 ** decimals)));
  const inAmountPerCycle = inAmount / BigInt(period);
  const cycleSecondsApart = BigInt(86400); // 하루

  const { tx: dcaTx, dcaPubKey } = await dca.createDcaV2({
    payer: wallet.publicKey,
    user: wallet.publicKey,
    inAmount,
    inAmountPerCycle,
    cycleSecondsApart,
    inputMint: new PublicKey(token),
    outputMint: new PublicKey(SOL_MINT),
    minOutAmountPerCycle: null,
    maxOutAmountPerCycle: null,
    startAt: null,
  });

  // 최신 블록해시 가져오기
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
  dcaTx.recentBlockhash = blockhash;
  dcaTx.lastValidBlockHeight = lastValidBlockHeight;

  await sendAndConfirmTransaction(connection, dcaTx, [wallet.payer]);

  console.log("DCA created with public key:", dcaPubKey.toBase58());

  const db = await dbPromise;
  await db.run('INSERT INTO dca_contracts (chatId, dcaPubKey, period, withdrawInAmount, publicKey, token) VALUES (?, ?, ?, ?, ?, ?)', chatId, dcaPubKey.toBase58(), period, inAmountPerCycle.toString(), wallet.publicKey.toString(), token);

  return dcaPubKey.toBase58();
}

export async function withdrawDCA(chatId, walletInfo) {
  const db = await dbPromise;
  const dcaContract = await db.get('SELECT dcaPubKey, period, withdrawInAmount, publicKey, token FROM dca_contracts WHERE chatId = ?', chatId);

  if (!dcaContract) {
    throw new Error('인출할 DCA 계약이 없습니다.');
  }

  const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(walletInfo.secretKey)));

  const dca = new DCA(connection, Network.MAINNET);

  // DCA 계약의 상태를 가져와서 필요한 값을 계산합니다.
  const dcaAccount = await dca.fetchDCA(new PublicKey(dcaContract.dcaPubKey));

  const withdrawParams = {
    user: wallet.publicKey,
    dca: new PublicKey(dcaContract.dcaPubKey),
    inputMint: new PublicKey(dcaContract.token),
    outputMint: new PublicKey("So11111111111111111111111111111111111111112"),
    withdrawInAmount: BigInt(dcaContract.withdrawInAmount),
    withdrawOutAmount: dcaAccount.outReceived || BigInt(0),
  };

  const { tx: withdrawTx } = await dca.withdraw(withdrawParams);

  // 최신 블록해시 가져오기
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
  withdrawTx.recentBlockhash = blockhash;
  withdrawTx.lastValidBlockHeight = lastValidBlockHeight;

  const withdrawTxid = await sendAndConfirmTransaction(connection, withdrawTx, [wallet.payer]);

  console.log("Withdraw successful, transaction ID:", withdrawTxid);
  return withdrawTxid;
}
