import { dbPromise } from './database.js';

export async function getSlippage(chatId) {
  const db = await dbPromise;
  const result = await db.get('SELECT slippageBps FROM settings WHERE chatId = ?', chatId);
  if (result && result.slippageBps !== undefined) {
    return result.slippageBps;
  } else {
    return 100; // 기본값 100
  }
}

export async function setSlippage(chatId, slippageBps) {
  const db = await dbPromise;
  await db.run('INSERT OR REPLACE INTO settings (chatId, slippageBps) VALUES (?, ?)', chatId, slippageBps);
}

export async function getCurrentSlippage(chatId) {
  const db = await dbPromise;
  const result = await db.get('SELECT slippageBps FROM settings WHERE chatId = ?', chatId);
  if (result && result.slippageBps !== undefined) {
    return result.slippageBps;
  } else {
    return 100; // 기본값 100
  }
}
