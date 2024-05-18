import dotenv from 'dotenv';
dotenv.config();

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com/";
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const PUBLIC_ADDRESS = process.env.PUBLIC_ADDRESS;
