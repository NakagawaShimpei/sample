import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/db.json');

function generateId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${random}`;
}

type Db = Record<string, unknown[]>;

// 書き込みをシリアル化して競合を防ぐ
let writeQueue: Promise<void> = Promise.resolve();

function readDb(): Db {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Db;
}

function writeDb(db: Db): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export class JsonRepository<T extends { id: string }> {
  constructor(
    private readonly key: string,
    private readonly prefix: string,
  ) {}

  findAll(): T[] {
    const db = readDb();
    return (db[this.key] as T[]) ?? [];
  }

  findById(id: string): T | undefined {
    return this.findAll().find((item) => item.id === id);
  }

  findWhere(predicate: (item: T) => boolean): T[] {
    return this.findAll().filter(predicate);
  }

  create(data: Omit<T, 'id'>): Promise<T> {
    const item = { ...data, id: generateId(this.prefix) } as T;
    writeQueue = writeQueue.then(() => {
      const db = readDb();
      (db[this.key] as T[]) = [...((db[this.key] as T[]) ?? []), item];
      writeDb(db);
    });
    return writeQueue.then(() => item);
  }

  update(id: string, partial: Partial<T>): Promise<T | null> {
    let result: T | null = null;
    writeQueue = writeQueue.then(() => {
      const db = readDb();
      const list = (db[this.key] as T[]) ?? [];
      const idx = list.findIndex((item) => item.id === id);
      if (idx === -1) return;
      const merged = { ...list[idx], ...partial };
      // Explicitly delete keys set to undefined (e.g. removing optional fields)
      for (const key of Object.keys(partial) as Array<keyof T>) {
        if (partial[key] === undefined) delete merged[key];
      }
      list[idx] = merged;
      result = list[idx];
      db[this.key] = list;
      writeDb(db);
    });
    return writeQueue.then(() => result);
  }

  delete(id: string): Promise<void> {
    writeQueue = writeQueue.then(() => {
      const db = readDb();
      db[this.key] = ((db[this.key] as T[]) ?? []).filter(
        (item) => item.id !== id,
      );
      writeDb(db);
    });
    return writeQueue;
  }

  deleteWhere(predicate: (item: T) => boolean): Promise<void> {
    writeQueue = writeQueue.then(() => {
      const db = readDb();
      db[this.key] = ((db[this.key] as T[]) ?? []).filter(
        (item) => !predicate(item),
      );
      writeDb(db);
    });
    return writeQueue;
  }
}
