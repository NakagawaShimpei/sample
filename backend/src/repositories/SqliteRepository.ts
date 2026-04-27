import { getDb } from '../database';

function generateId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${random}`;
}

export class SqliteRepository<T extends { id: string }> {
  constructor(
    private readonly tableName: string,
    private readonly prefix: string,
  ) {
    getDb().exec(
      `CREATE TABLE IF NOT EXISTS "${tableName}" (id TEXT PRIMARY KEY, data TEXT NOT NULL)`,
    );
  }

  findAll(): T[] {
    const rows = getDb()
      .prepare(`SELECT data FROM "${this.tableName}"`)
      .all() as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as T);
  }

  findById(id: string): T | undefined {
    const row = getDb()
      .prepare(`SELECT data FROM "${this.tableName}" WHERE id = ?`)
      .get(id) as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as T) : undefined;
  }

  findWhere(predicate: (item: T) => boolean): T[] {
    return this.findAll().filter(predicate);
  }

  create(data: Omit<T, 'id'>): Promise<T> {
    const item = { ...data, id: generateId(this.prefix) } as T;
    getDb()
      .prepare(`INSERT INTO "${this.tableName}" (id, data) VALUES (?, ?)`)
      .run(item.id, JSON.stringify(item));
    return Promise.resolve(item);
  }

  update(id: string, partial: Partial<T>): Promise<T | null> {
    const row = getDb()
      .prepare(`SELECT data FROM "${this.tableName}" WHERE id = ?`)
      .get(id) as { data: string } | undefined;
    if (!row) return Promise.resolve(null);

    const existing = JSON.parse(row.data) as T;
    const merged = { ...existing, ...partial };
    for (const key of Object.keys(partial) as Array<keyof T>) {
      if (partial[key] === undefined) delete merged[key];
    }
    getDb()
      .prepare(`UPDATE "${this.tableName}" SET data = ? WHERE id = ?`)
      .run(JSON.stringify(merged), id);
    return Promise.resolve(merged);
  }

  delete(id: string): Promise<void> {
    getDb().prepare(`DELETE FROM "${this.tableName}" WHERE id = ?`).run(id);
    return Promise.resolve();
  }

  deleteWhere(predicate: (item: T) => boolean): Promise<void> {
    const items = this.findWhere(predicate);
    const stmt = getDb().prepare(
      `DELETE FROM "${this.tableName}" WHERE id = ?`,
    );
    const deleteMany = getDb().transaction(() => {
      for (const item of items) {
        stmt.run(item.id);
      }
    });
    deleteMany();
    return Promise.resolve();
  }
}
