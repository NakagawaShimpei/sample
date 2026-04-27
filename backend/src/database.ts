import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(__dirname, '../data/sample.db');
const JSON_FILE = path.join(__dirname, '../data/db.json');
const HISTORY_FILE = path.join(__dirname, '../data/db-history.json');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_FILE);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    ensureInitialized(_db);
  }
  return _db;
}

function ensureInitialized(db: Database.Database): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)`,
  );
  const row = db
    .prepare(`SELECT value FROM _meta WHERE key = 'initialized'`)
    .get() as { value: string } | undefined;
  if (!row) {
    migrateFromJson(db);
    db.prepare(
      `INSERT INTO _meta (key, value) VALUES ('initialized', 'true')`,
    ).run();
  }
}

function migrateFromJson(db: Database.Database): void {
  if (fs.existsSync(JSON_FILE)) {
    const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8')) as Record<
      string,
      Array<{ id: string }>
    >;
    for (const [table, rows] of Object.entries(data)) {
      db.exec(
        `CREATE TABLE IF NOT EXISTS "${table}" (id TEXT PRIMARY KEY, data TEXT NOT NULL)`,
      );
      const insert = db.prepare(
        `INSERT OR IGNORE INTO "${table}" (id, data) VALUES (?, ?)`,
      );
      const insertMany = db.transaction(() => {
        for (const item of rows) {
          insert.run(item.id, JSON.stringify(item));
        }
      });
      insertMany();
    }
  }

  if (fs.existsSync(HISTORY_FILE)) {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')) as Record<
      string,
      Array<{ id: string }>
    >;
    for (const [table, rows] of Object.entries(data)) {
      db.exec(
        `CREATE TABLE IF NOT EXISTS "${table}" (id TEXT PRIMARY KEY, data TEXT NOT NULL)`,
      );
      const insert = db.prepare(
        `INSERT OR IGNORE INTO "${table}" (id, data) VALUES (?, ?)`,
      );
      const insertMany = db.transaction(() => {
        for (const item of rows) {
          insert.run(item.id, JSON.stringify(item));
        }
      });
      insertMany();
    }
  }
}
