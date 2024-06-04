import dotenv from 'dotenv';
dotenv.config();

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com/";

export const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY;
export const ENCRYPTION_METHOD = process.env.ENCRYPTION_METHOD;