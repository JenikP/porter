import Database from 'better-sqlite3';
import path from 'path';
import { loadConfig } from '@porter/config';

const cfg = loadConfig();
const dbPath = cfg.nodeEnv === 'test'
  ? ':memory:'
  : path.join(process.cwd(), 'porter.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function getDb() {
  return db;
}

export function closeDb() {
  db.close();
}
