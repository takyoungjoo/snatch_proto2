import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPromise = open({
  filename: './src/database.sqlite', // 권한 체크
  driver: sqlite3.Database
});

export async function initializeDatabase() {
    const db = await dbPromise;

    await db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        chatId TEXT PRIMARY KEY,
        publicKey TEXT,
        secretKey TEXT
      );
      CREATE TABLE IF NOT EXISTS dca_contracts (
        chatId TEXT,
        dcaPubKey TEXT,
        period INTEGER,
        withdrawInAmount TEXT,
        publicKey TEXT,
        token TEXT,
        PRIMARY KEY (chatId, dcaPubKey)
      );
      CREATE TABLE IF NOT EXISTS settings (
        chatId TEXT PRIMARY KEY,
        slippageBps INTEGER DEFAULT 100
      );
    `);
  }
  

export { dbPromise };
