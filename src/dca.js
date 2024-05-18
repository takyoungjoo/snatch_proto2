import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import { DCA, Network } from '@jup-ag/dca-sdk';
import bs58 from 'bs58';
import { SOLANA_RPC_URL } from './config.js';
import { getTokenDecimals } from './utils.js';

const dcaContracts = {};

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

  await connection.sendTransaction(dcaTx, [wallet.payer], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  console.log("DCA created with public key:", dcaPubKey.toBase58());

  dcaContracts[chatId] = {
    dcaPubKey,
    period,
    withdrawInAmount: inAmountPerCycle,
    publicKey: wallet.publicKey.toString(),
  };

  return dcaPubKey.toBase58();
}

export async function withdrawDCA(chatId, walletInfo) {
  const dcaContract = dcaContracts[chatId];

  if (!dcaContract) {
    throw new Error('인출할 DCA 계약이 없습니다.');
  }

  const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(walletInfo.secretKey)));

  const dca = new DCA(connection, Network.MAINNET);

  const withdrawParams = {
    user: wallet.publicKey,
    dca: dcaContract.dcaPubKey,
    inputMint: new PublicKey(dcaContract.publicKey),
    withdrawInAmount: dcaContract.withdrawInAmount,
  };

  const { tx: withdrawTx } = await dca.withdraw(withdrawParams);
  const withdrawTxid = await sendAndConfirmTransaction(connection, withdrawTx, [wallet.payer]);

  console.log("Withdraw successful, transaction ID:", withdrawTxid);
  return withdrawTxid;
}
