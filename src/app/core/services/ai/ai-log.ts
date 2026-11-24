import { v4 as uuidv4 } from 'uuid';
import type { Database } from '../database/database';

export async function writeAiLog(
  db: Database,
  feature: string,
  prompt: string,
  response: string,
  model: string,
  tokens?: number,
): Promise<void> {
  try {
    await db.execute(
      `INSERT INTO ai_chat_log (id, feature, prompt, response, model, tokens_used)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), feature, prompt, response, model, tokens ?? null],
    );
  } catch (error) {
    console.warn('[AiLog] ai_chat_log write failed:', error);
  }
}

export async function cleanupOldAiLogs(db: Database, retentionDays = 30): Promise<void> {
  if (!Number.isInteger(retentionDays) || retentionDays <= 0) return;
  await db.execute(
    `DELETE FROM ai_chat_log WHERE created_at < datetime('now', '-' || ? || ' days')`,
    [retentionDays],
  );
}
