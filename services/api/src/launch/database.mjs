import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import pg from 'pg';
import {migrations} from './migrations.mjs';

// The aggregate is locked for each mutation: quotes, matching and money move atomically.
// PostgreSQL is required in production; SQLite is a zero-setup local development adapter.
export async function openDatabase(seed) {
  const production = process.env.NODE_ENV === 'production';
  if (production && !process.env.DATABASE_URL) throw new Error('Production requires DATABASE_URL (PostgreSQL)');
  const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL }) : null;
  const file = process.env.SQLITE_PATH || '.data/porter-launch.sqlite';
  if (!pool && file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const sqlite = pool ? null : new DatabaseSync(file);
  sqlite?.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  const query = async (sql, args = [], connection = pool) => {
    if (pool) return (await connection.query(sql, args)).rows;
    const statement = sqlite.prepare(sql.replace(/\$\d+/g, '?'));
    return /^\s*(SELECT|INSERT.*RETURNING)/i.test(sql) ? statement.all(...args) : (statement.run(...args), []);
  };
  await query('CREATE TABLE IF NOT EXISTS porter_state (id INTEGER PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0)');
  await query('CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL, profile_id TEXT NOT NULL, name TEXT NOT NULL, onboarded INTEGER NOT NULL DEFAULT 0)');
  await query('CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), csrf TEXT NOT NULL, expires BIGINT NOT NULL)');
  await query('CREATE TABLE IF NOT EXISTS recovery (hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), expires BIGINT NOT NULL)');
  await query('CREATE TABLE IF NOT EXISTS commands (id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), fingerprint TEXT NOT NULL, result TEXT NOT NULL)');
  await query('CREATE TABLE IF NOT EXISTS uploads (id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), name TEXT NOT NULL, mime TEXT NOT NULL, data TEXT NOT NULL)');
  await query('CREATE TABLE IF NOT EXISTS webhook_events (id TEXT PRIMARY KEY, received BIGINT NOT NULL)');
  await query('CREATE TABLE IF NOT EXISTS devices (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), platform TEXT NOT NULL, token TEXT NOT NULL)');
  await query('CREATE TABLE IF NOT EXISTS notification_outbox (id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), payload TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, due BIGINT NOT NULL, status TEXT NOT NULL DEFAULT \'PENDING\')');
  await query('CREATE TABLE IF NOT EXISTS telemetry (event TEXT PRIMARY KEY, count BIGINT NOT NULL DEFAULT 0)');
  await query('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at BIGINT NOT NULL)');
  for(const migration of migrations){
    if((await query('SELECT version FROM schema_migrations WHERE version=$1',[migration.version])).length)continue;
    // DDL is additive and idempotent, including if a prior startup stopped halfway through.
    for(const sql of migration.sql)await query(sql);
    await query('INSERT INTO schema_migrations(version,name,applied_at) VALUES($1,$2,$3) ON CONFLICT(version) DO NOTHING',[migration.version,migration.name,Date.now()]);
  }
  await query('INSERT INTO porter_state(id,data) VALUES(1,$1) ON CONFLICT(id) DO NOTHING', [JSON.stringify(seed)]);
  let queue = Promise.resolve();
  const transaction = (work) => {
    const operation = queue.then(async () => {
      const connection = pool ? await pool.connect() : null;
      const q = (sql, args) => query(sql, args, connection || pool);
      try {
        if (pool) await connection.query('BEGIN'); else sqlite.exec('BEGIN IMMEDIATE');
        await q('SELECT id FROM porter_state WHERE id=1' + (pool ? ' FOR UPDATE' : ''));
        const result = await work(q);
        if (pool) await connection.query('COMMIT'); else sqlite.exec('COMMIT');
        return result;
      } catch (error) { if (pool) await connection.query('ROLLBACK'); else sqlite.exec('ROLLBACK'); throw error; }
      finally { connection?.release(); }
    });
    queue = operation.catch(() => {});
    return operation;
  };
  return { query, transaction, provider: pool ? 'postgresql' : 'sqlite-development', close: () => pool ? pool.end() : sqlite.close() };
}
